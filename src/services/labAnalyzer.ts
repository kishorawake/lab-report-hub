/**
 * Lab Report Analysis Pipeline
 * HIPAA-aligned: No PHI is stored or logged. Only de-identified structured data is retained.
 */

import { normalRanges, classifyTest, type TestStatus } from "./normalRanges";
import { deidentifyText } from "./deidentify";

export interface LabTest {
  name: string;
  value: number;
  rawValue: string;
  unit: string;
  normalRange: string;
  status: TestStatus;
  panel: string;
}

export interface PanelSummary {
  name: string;
  tests: LabTest[];
  normalCount: number;
  totalCount: number;
  abnormalCount: number;
}

export interface AnalysisResult {
  tests: LabTest[];
  panels: PanelSummary[];
  totalTests: number;
  normalTests: number;
  abnormalTests: number;
  healthScore: number;
  healthGrade: string;
  overallSummary: string;
  abnormalFindings: AbnormalFinding[];
  practicalAdvice: string[];
  recommendedActions: RecommendedAction[];
  whenToConsultDoctor: string;
  talkingPoints: string[];
}

export interface AbnormalFinding {
  testName: string;
  status: TestStatus;
  explanation: string;
}

export interface RecommendedAction {
  step: number;
  title: string;
  description: string;
}

// Parse text to extract test data
function extractTestsFromText(text: string): LabTest[] {
  const tests: LabTest[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    // Try to match patterns like "Test Name: 14.2 gms/dl (13-17)"
    // or "Test Name    14.2    gms/dl    13 - 17"
    for (const [testName, range] of Object.entries(normalRanges)) {
      const escapedName = testName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`${escapedName}[:\\s]+([\\d.]+)`, "i");
      const match = line.match(regex);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
          const { status } = classifyTest(testName, value);
          tests.push({
            name: testName,
            value,
            rawValue: `${value} ${range.unit}`,
            unit: range.unit,
            normalRange: `${range.min} - ${range.max} ${range.unit}`,
            status,
            panel: range.panel,
          });
        }
      }
    }
  }

  return tests;
}

// Generate panels from test list
function groupIntoPanels(tests: LabTest[]): PanelSummary[] {
  const panelMap = new Map<string, LabTest[]>();

  for (const test of tests) {
    const existing = panelMap.get(test.panel) || [];
    existing.push(test);
    panelMap.set(test.panel, existing);
  }

  return Array.from(panelMap.entries()).map(([name, panelTests]) => ({
    name,
    tests: panelTests,
    normalCount: panelTests.filter((t) => t.status === "normal").length,
    totalCount: panelTests.length,
    abnormalCount: panelTests.filter((t) => t.status !== "normal").length,
  }));
}

// Health score calculation
function calculateHealthScore(tests: LabTest[]): { score: number; grade: string } {
  if (tests.length === 0) return { score: 0, grade: "N/A" };

  let totalPenalty = 0;
  for (const test of tests) {
    switch (test.status) {
      case "slightly_low":
      case "slightly_high":
        totalPenalty += 2;
        break;
      case "critical_low":
      case "critical_high":
        totalPenalty += 5;
        break;
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - (totalPenalty / tests.length) * 100)));

  let grade: string;
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  return { score, grade };
}

// Generate explanations for abnormal findings
const explanations: Record<string, Record<string, string>> = {
  "MCH": {
    slightly_low: "MCH measures the average amount of oxygen-carrying protein (hemoglobin) in your red blood cells. Your MCH is slightly lower than normal. This could suggest that your red blood cells are a bit smaller than ideal, or that they contain slightly less hemoglobin. It might be an early sign of something like iron deficiency, but it's often not critical on its own.",
    critical_low: "Your MCH is critically low, indicating a significant deficiency in hemoglobin within your red blood cells. This requires immediate medical attention.",
  },
  "MCHC": {
    slightly_low: "MCHC measures the average concentration of hemoglobin inside your red blood cells. Your MCHC is slightly lower than normal. This also points to red blood cells having a slightly lower concentration of oxygen-carrying protein. Similar to MCH, it could relate to iron levels or how your body makes red blood cells.",
    critical_low: "Your MCHC is critically low, indicating severe hemoglobin concentration issues. Please see a doctor immediately.",
  },
  "HbA1c": {
    slightly_high: "Your HbA1c is slightly elevated, indicating your average blood sugar over the past 2-3 months has been higher than ideal. This may suggest pre-diabetes. Diet and lifestyle changes can help.",
    critical_high: "Your HbA1c is critically high, indicating poorly controlled diabetes. This requires immediate medical intervention to prevent serious complications.",
  },
  "Random Blood Sugar": {
    slightly_high: "Your random blood sugar is slightly elevated. This could be due to a recent meal, stress, or an early sign of blood sugar regulation issues.",
    critical_high: "Your random blood sugar is critically high. This is a medical emergency. Please seek immediate medical attention.",
  },
  "LDL Cholesterol": {
    slightly_high: "Your LDL (bad) cholesterol is slightly elevated. This increases your risk of heart disease over time. Dietary changes, exercise, and sometimes medication can help bring it down.",
    critical_high: "Your LDL cholesterol is dangerously high and significantly increases cardiovascular risk. Immediate medical intervention is recommended.",
  },
  "Alkaline Phosphatase": {
    slightly_high: "Your Alkaline Phosphatase is slightly elevated. This enzyme is found in the liver and bones. A slight elevation could be due to various reasons including bone growth, liver conditions, or even certain medications.",
    critical_high: "Your Alkaline Phosphatase is critically high, potentially indicating liver disease, bone disorders, or other serious conditions.",
  },
  "Iron": {
    slightly_low: "Your iron levels are slightly low. Iron is crucial for making hemoglobin. Low iron can cause fatigue, weakness, and pale skin. Consider iron-rich foods like spinach, red meat, and legumes.",
    critical_low: "Your iron is critically low, indicating severe iron deficiency that may require iron supplementation or infusion therapy.",
  },
  "CRP": {
    slightly_high: "Your CRP (C-Reactive Protein) is slightly elevated, indicating some inflammation in your body. This could be due to infection, injury, or chronic conditions.",
    critical_high: "Your CRP is critically high, indicating severe inflammation. This requires immediate investigation to determine the cause.",
  },
  "Sodium": {
    critical_low: "Your sodium level is critically low (hyponatremia). This can cause confusion, seizures, and is a medical emergency.",
    critical_high: "Your sodium level is critically high (hypernatremia). This requires immediate medical attention.",
  },
  "Potassium": {
    critical_low: "Your potassium is critically low. This can cause dangerous heart rhythm problems and requires immediate treatment.",
    critical_high: "Your potassium is critically high. This is life-threatening and can cause cardiac arrest. Seek emergency care immediately.",
  },
  "Calcium": {
    critical_low: "Your calcium is critically low. This can cause muscle spasms, numbness, and heart problems. Immediate treatment is needed.",
    critical_high: "Your calcium is critically high. This can cause kidney stones, bone weakening, and heart issues.",
  },
  "Platelet Count": {
    slightly_low: "Your platelet count is slightly low. Platelets help your blood clot. A slight decrease is often not concerning but should be monitored.",
    critical_low: "Your platelet count is critically low, increasing your risk of uncontrolled bleeding. Seek immediate medical attention.",
    slightly_high: "Your platelet count is slightly elevated. This could be reactive to infection, inflammation, or iron deficiency.",
    critical_high: "Your platelet count is critically high. This increases your risk of blood clots and requires medical evaluation.",
  },
  "Chloride": {
    critical_low: "Your chloride is critically low, which can indicate dehydration, kidney problems, or metabolic issues.",
    critical_high: "Your chloride is critically high, potentially indicating dehydration or kidney dysfunction.",
  },
};

function getExplanation(testName: string, status: TestStatus): string {
  const statusKey = status.includes("low") ? (status === "critical_low" ? "critical_low" : "slightly_low") : (status === "critical_high" ? "critical_high" : "slightly_high");
  return explanations[testName]?.[statusKey] || `Your ${testName} is ${status.replace("_", " ")}. Please consult your healthcare provider for a detailed assessment.`;
}

function generateAIReport(tests: LabTest[], panels: PanelSummary[]): {
  overallSummary: string;
  abnormalFindings: AbnormalFinding[];
  practicalAdvice: string[];
  recommendedActions: RecommendedAction[];
  whenToConsultDoctor: string;
  talkingPoints: string[];
} {
  const abnormalTests = tests.filter((t) => t.status !== "normal");
  const criticalTests = abnormalTests.filter((t) => t.status.includes("critical"));

  const abnormalFindings = abnormalTests.map((t) => ({
    testName: t.name,
    status: t.status,
    explanation: getExplanation(t.name, t.status),
  }));

  const hasCritical = criticalTests.length > 0;
  const criticalNames = criticalTests.map((t) => t.name).join(", ");

  const overallSummary = hasCritical
    ? `Your lab results show several critical and very concerning findings that require immediate medical attention. Your ${criticalNames} are all flagged as critical. Additionally, some values are slightly outside the normal range. While some test panels show normal results, the critical values override these and indicate urgent health concerns.`
    : abnormalTests.length > 0
    ? `Your lab results are mostly within normal ranges, but a few values need attention. Your ${abnormalTests.map((t) => t.name).join(", ")} are slightly outside the normal range. These findings are not immediately dangerous but should be discussed with your doctor.`
    : `Great news! All your lab results are within the normal ranges. Your overall health indicators look good. Continue maintaining a healthy lifestyle with regular exercise and balanced nutrition.`;

  const practicalAdvice = hasCritical
    ? [
        "Given the number of critical values, you must seek immediate medical attention. Do not delay in contacting your doctor or going to the nearest emergency room. Take these lab results with you.",
        "Follow all dietary and fluid recommendations provided by your medical team.",
        "Adhere strictly to any medication prescribed for your conditions.",
        "Once your critical conditions are stabilized, discuss a long-term plan with your doctor that includes balanced nutrition, regular physical activity, and stress management.",
      ]
    : abnormalTests.length > 0
    ? [
        "Schedule an appointment with your doctor to discuss these results.",
        "Maintain a balanced diet rich in fruits, vegetables, whole grains, and lean proteins.",
        "Stay well-hydrated and aim for at least 30 minutes of moderate exercise most days.",
        "Track any symptoms you experience and share them with your doctor.",
      ]
    : [
        "Continue your current healthy lifestyle habits.",
        "Maintain regular check-ups with your healthcare provider.",
        "Stay active with regular physical exercise.",
        "Focus on a balanced, nutrient-rich diet.",
      ];

  const recommendedActions: RecommendedAction[] = hasCritical
    ? [
        { step: 1, title: "See Your Doctor Immediately", description: `You should see a doctor immediately or go to the emergency room due to the critical results for ${criticalNames}.` },
        { step: 2, title: "Make Lifestyle Changes", description: "Follow all dietary and fluid recommendations provided by your medical team to help manage your conditions." },
        { step: 3, title: "Schedule Follow-up Tests", description: "Ask your doctor about retesting timeline based on your results." },
      ]
    : [
        { step: 1, title: "Schedule a Doctor Visit", description: "Discuss your abnormal findings with your healthcare provider at your earliest convenience." },
        { step: 2, title: "Improve Your Diet", description: "Focus on nutrient-rich foods that support your specific health needs." },
        { step: 3, title: "Follow Up in 3-6 Months", description: "Retest the flagged parameters to monitor improvement." },
      ];

  const whenToConsultDoctor = hasCritical
    ? `You should see a doctor immediately or go to the emergency room due to the critical and very high/low results for ${criticalNames}.`
    : abnormalTests.length > 0
    ? `Schedule an appointment with your doctor within the next 1-2 weeks to discuss your results, particularly the ${abnormalTests.map((t) => t.name).join(", ")} values.`
    : "Continue your regular check-up schedule. No immediate consultation is needed based on these results.";

  const talkingPoints = hasCritical
    ? [
        "What do these critical values mean for my immediate health?",
        "What are the next steps for emergency treatment and investigation?",
        `How do we address the critically abnormal values (${criticalNames})?`,
        "What lifestyle changes should I make to support my recovery?",
        "What is the recommended follow-up testing schedule?",
      ]
    : [
        "What could be causing my slightly abnormal values?",
        "Should I make any dietary or lifestyle changes?",
        "When should I retest these parameters?",
        "Are there any additional tests you recommend?",
      ];

  return { overallSummary, abnormalFindings, practicalAdvice, recommendedActions, whenToConsultDoctor, talkingPoints };
}

// Main analysis function - the full pipeline
export async function analyzeLabReport(fileContent: string): Promise<AnalysisResult> {
  // Step 1: De-identify (HIPAA-aligned)
  const cleanedText = deidentifyText(fileContent);

  // Step 2: Extract lab data
  const tests = extractTestsFromText(cleanedText);

  // Step 3: Group into panels
  const panels = groupIntoPanels(tests);

  // Step 4: Calculate health score
  const { score, grade } = calculateHealthScore(tests);

  // Step 5: Generate AI report
  const report = generateAIReport(tests, panels);

  // Original file is NOT stored (HIPAA-aligned)
  // Only de-identified structured data is returned

  return {
    tests,
    panels,
    totalTests: tests.length,
    normalTests: tests.filter((t) => t.status === "normal").length,
    abnormalTests: tests.filter((t) => t.status !== "normal").length,
    healthScore: score,
    healthGrade: grade,
    ...report,
  };
}

// Demo data for when parsing fails or for demonstration
export function getDemoAnalysis(): AnalysisResult {
  const demoTests: LabTest[] = [
    { name: "Hemoglobin", value: 14.2, rawValue: "14.2 gms/dl", unit: "gms/dl", normalRange: "13 - 17 gms/dl", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "WBC Count", value: 9500, rawValue: "9500 cells/µL", unit: "cells/µL", normalRange: "4000 - 11000 cells/µL", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "Neutrophils", value: 71, rawValue: "71 %", unit: "%", normalRange: "40 - 70 %", status: "slightly_high", panel: "Blood Health (Complete Blood Count)" },
    { name: "Lymphocytes", value: 20, rawValue: "20 %", unit: "%", normalRange: "20 - 40 %", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "Eosinophils", value: 6, rawValue: "6 %", unit: "%", normalRange: "1 - 6 %", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "Monocytes", value: 3, rawValue: "3 %", unit: "%", normalRange: "2 - 8 %", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "Basophils", value: 0, rawValue: "0 %", unit: "%", normalRange: "0 - 1 %", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "Hematocrit", value: 46.4, rawValue: "46.4 %", unit: "%", normalRange: "40 - 54 %", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "RBC Count", value: 5.1, rawValue: "5.1 million/µL", unit: "million/µL", normalRange: "4.5 - 5.5 million/µL", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "MCV", value: 85.29, rawValue: "85.29 fL", unit: "fL", normalRange: "80 - 100 fL", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "MCH", value: 26.1, rawValue: "26.1 pg", unit: "pg", normalRange: "27 - 33 pg", status: "slightly_low", panel: "Blood Health (Complete Blood Count)" },
    { name: "MCHC", value: 30.6, rawValue: "30.6 g/dL", unit: "g/dL", normalRange: "32 - 36 g/dL", status: "slightly_low", panel: "Blood Health (Complete Blood Count)" },
    { name: "RDW-CV", value: 13.6, rawValue: "13.6 %", unit: "%", normalRange: "11 - 16 %", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "Platelet Count", value: 312000, rawValue: "312000 /µL", unit: "/µL", normalRange: "150000 - 400000 /µL", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "MPV", value: 8.7, rawValue: "8.7 fL", unit: "fL", normalRange: "6.5 - 12 fL", status: "normal", panel: "Blood Health (Complete Blood Count)" },
    { name: "PDW", value: 9.9, rawValue: "9.9 fL", unit: "fL", normalRange: "9 - 17 fL", status: "normal", panel: "Blood Health (Complete Blood Count)" },

    { name: "Blood Urea", value: 15, rawValue: "15 mg/dL", unit: "mg/dL", normalRange: "7 - 20 mg/dL", status: "normal", panel: "Kidney Function" },
    { name: "Serum Creatinine", value: 0.9, rawValue: "0.9 mg/dL", unit: "mg/dL", normalRange: "0.7 - 1.3 mg/dL", status: "normal", panel: "Kidney Function" },
    { name: "Uric Acid", value: 5.2, rawValue: "5.2 mg/dL", unit: "mg/dL", normalRange: "3.5 - 7.2 mg/dL", status: "normal", panel: "Kidney Function" },

    { name: "Total Bilirubin", value: 0.8, rawValue: "0.8 mg/dL", unit: "mg/dL", normalRange: "0.1 - 1.2 mg/dL", status: "normal", panel: "Liver Health" },
    { name: "SGOT (AST)", value: 28, rawValue: "28 U/L", unit: "U/L", normalRange: "0 - 40 U/L", status: "normal", panel: "Liver Health" },
    { name: "SGPT (ALT)", value: 32, rawValue: "32 U/L", unit: "U/L", normalRange: "0 - 41 U/L", status: "normal", panel: "Liver Health" },
    { name: "Alkaline Phosphatase", value: 155, rawValue: "155 U/L", unit: "U/L", normalRange: "44 - 147 U/L", status: "slightly_high", panel: "Liver Health" },
    { name: "Total Protein", value: 7.2, rawValue: "7.2 g/dL", unit: "g/dL", normalRange: "6 - 8.3 g/dL", status: "normal", panel: "Liver Health" },
    { name: "Albumin", value: 4.2, rawValue: "4.2 g/dL", unit: "g/dL", normalRange: "3.5 - 5.5 g/dL", status: "normal", panel: "Liver Health" },
    { name: "Globulin", value: 3.0, rawValue: "3.0 g/dL", unit: "g/dL", normalRange: "2 - 3.5 g/dL", status: "normal", panel: "Liver Health" },
    { name: "A/G Ratio", value: 1.4, rawValue: "1.4", unit: "", normalRange: "1 - 2.5", status: "normal", panel: "Liver Health" },
    { name: "GGT", value: 35, rawValue: "35 U/L", unit: "U/L", normalRange: "0 - 55 U/L", status: "normal", panel: "Liver Health" },
    { name: "Direct Bilirubin", value: 0.2, rawValue: "0.2 mg/dL", unit: "mg/dL", normalRange: "0 - 0.3 mg/dL", status: "normal", panel: "Liver Health" },
    { name: "Indirect Bilirubin", value: 0.6, rawValue: "0.6 mg/dL", unit: "mg/dL", normalRange: "0.1 - 0.9 mg/dL", status: "normal", panel: "Liver Health" },

    { name: "Random Blood Sugar", value: 310, rawValue: "310 mg/dL", unit: "mg/dL", normalRange: "70 - 140 mg/dL", status: "critical_high", panel: "Blood Sugar" },
    { name: "HbA1c", value: 10.5, rawValue: "10.5 %", unit: "%", normalRange: "4 - 5.7 %", status: "critical_high", panel: "Blood Sugar" },

    { name: "Total Cholesterol", value: 195, rawValue: "195 mg/dL", unit: "mg/dL", normalRange: "0 - 200 mg/dL", status: "normal", panel: "Lipid Profile" },
    { name: "Triglycerides", value: 140, rawValue: "140 mg/dL", unit: "mg/dL", normalRange: "0 - 150 mg/dL", status: "normal", panel: "Lipid Profile" },
    { name: "HDL Cholesterol", value: 42, rawValue: "42 mg/dL", unit: "mg/dL", normalRange: "40 - 60 mg/dL", status: "normal", panel: "Lipid Profile" },
    { name: "LDL Cholesterol", value: 125, rawValue: "125 mg/dL", unit: "mg/dL", normalRange: "0 - 100 mg/dL", status: "slightly_high", panel: "Lipid Profile" },
    { name: "VLDL Cholesterol", value: 28, rawValue: "28 mg/dL", unit: "mg/dL", normalRange: "0 - 30 mg/dL", status: "normal", panel: "Lipid Profile" },
    { name: "Non-HDL Cholesterol", value: 153, rawValue: "153 mg/dL", unit: "mg/dL", normalRange: "0 - 130 mg/dL", status: "slightly_high", panel: "Lipid Profile" },

    { name: "Iron", value: 25, rawValue: "25 µg/dL", unit: "µg/dL", normalRange: "60 - 170 µg/dL", status: "critical_low", panel: "Anemia Profile" },
    { name: "Ferritin", value: 15, rawValue: "15 ng/mL", unit: "ng/mL", normalRange: "20 - 250 ng/mL", status: "slightly_low", panel: "Anemia Profile" },

    { name: "Sodium", value: 118, rawValue: "118 mEq/L", unit: "mEq/L", normalRange: "136 - 145 mEq/L", status: "critical_low", panel: "Electrolytes" },
    { name: "Potassium", value: 2.3, rawValue: "2.3 mEq/L", unit: "mEq/L", normalRange: "3.5 - 5 mEq/L", status: "critical_low", panel: "Electrolytes" },
    { name: "Chloride", value: 78, rawValue: "78 mEq/L", unit: "mEq/L", normalRange: "98 - 106 mEq/L", status: "critical_low", panel: "Electrolytes" },
    { name: "Calcium", value: 5.5, rawValue: "5.5 mg/dL", unit: "mg/dL", normalRange: "8.5 - 10.5 mg/dL", status: "critical_low", panel: "Electrolytes" },

    { name: "CRP", value: 65, rawValue: "65 mg/L", unit: "mg/L", normalRange: "0 - 5 mg/L", status: "critical_high", panel: "Inflammation" },
    { name: "ESR", value: 18, rawValue: "18 mm/hr", unit: "mm/hr", normalRange: "0 - 20 mm/hr", status: "normal", panel: "Inflammation" },

    { name: "TSH", value: 2.5, rawValue: "2.5 µIU/mL", unit: "µIU/mL", normalRange: "0.4 - 4 µIU/mL", status: "normal", panel: "Thyroid Function" },
    { name: "T3", value: 120, rawValue: "120 ng/dL", unit: "ng/dL", normalRange: "80 - 200 ng/dL", status: "normal", panel: "Thyroid Function" },
    { name: "T4", value: 8.5, rawValue: "8.5 µg/dL", unit: "µg/dL", normalRange: "4.5 - 12.5 µg/dL", status: "normal", panel: "Thyroid Function" },
  ];

  const panels = groupIntoPanels(demoTests);
  const { score, grade } = calculateHealthScore(demoTests);
  const report = generateAIReport(demoTests, panels);

  return {
    tests: demoTests,
    panels,
    totalTests: demoTests.length,
    normalTests: demoTests.filter((t) => t.status === "normal").length,
    abnormalTests: demoTests.filter((t) => t.status !== "normal").length,
    healthScore: score,
    healthGrade: grade,
    ...report,
  };
}
