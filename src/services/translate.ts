/**
 * Lightweight client-side translator for the AI Doctor narration.
 * Maps deterministic English message templates to Hindi/Telugu/Marathi.
 * Works offline, no API key required. Test names + numbers are preserved.
 */

export type LangCode = "en" | "hi" | "te" | "mr";

export const LANGUAGES: { code: LangCode; label: string; native: string; bcp47: string }[] = [
  { code: "en", label: "English", native: "English", bcp47: "en-US" },
  { code: "hi", label: "Hindi", native: "हिन्दी", bcp47: "hi-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", bcp47: "te-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", bcp47: "mr-IN" },
];

type Dict = Record<string, string>;

/* Phrase dictionary — keys are English fragments, values are translated */
const dict: Record<Exclude<LangCode, "en">, Dict> = {
  hi: {
    "Great news — no critical findings in your report! All values are within safe ranges.":
      "अच्छी खबर — आपकी रिपोर्ट में कोई गंभीर समस्या नहीं है! सभी मान सुरक्षित सीमा में हैं।",
    "Great news! Your overall health looks really good. Let me walk you through.":
      "अच्छी खबर! आपका समग्र स्वास्थ्य बहुत अच्छा है। आइए मैं आपको विस्तार से बताऊँ।",
    "Most things look fine, but there are a few areas that need attention.":
      "अधिकांश चीज़ें ठीक दिख रही हैं, पर कुछ क्षेत्रों पर ध्यान देने की ज़रूरत है।",
    "I need to flag some important findings. Please review carefully and consult your doctor soon.":
      "मुझे कुछ महत्वपूर्ण निष्कर्षों पर ध्यान दिलाना है। कृपया ध्यान से देखें और जल्द ही डॉक्टर से सलाह लें।",
    "Here are some lifestyle tips based on your results:":
      "आपके परिणामों के आधार पर कुछ जीवनशैली सुझाव:",
    "Your blood sugar needs attention. Reduce refined carbs, increase fiber, and walk after meals.":
      "आपके रक्त शर्करा पर ध्यान देने की आवश्यकता है। परिष्कृत कार्ब्स कम करें, फाइबर बढ़ाएँ, और भोजन के बाद टहलें।",
    "Focus on heart health: healthy fats, omega-3 foods, and 30 min exercise daily.":
      "हृदय स्वास्थ्य पर ध्यान दें: स्वस्थ वसा, ओमेगा-3 भोजन, और प्रतिदिन 30 मिनट व्यायाम।",
    "Boost iron with spinach, lentils, and vitamin C for better absorption.":
      "पालक, दाल और विटामिन सी से आयरन बढ़ाएँ ताकि अवशोषण बेहतर हो।",
    "Stay hydrated — bananas, coconut water, and leafy greens help electrolyte balance.":
      "हाइड्रेटेड रहें — केला, नारियल पानी और हरी पत्तेदार सब्ज़ियाँ इलेक्ट्रोलाइट संतुलन में मदद करती हैं।",
    "Results look good! Keep up balanced diet, exercise, and sleep.":
      "परिणाम अच्छे लग रहे हैं! संतुलित आहार, व्यायाम और नींद बनाए रखें।",
    "Scroll down for detailed panels, recommendations, and doctor advice. I'm AI — not a replacement for your doctor!":
      "विस्तृत पैनल, सिफारिशें और डॉक्टर की सलाह के लिए नीचे स्क्रॉल करें। मैं एआई हूँ — आपके डॉक्टर का विकल्प नहीं!",
    "I analyzed": "मैंने विश्लेषण किया",
    "tests across": "परीक्षण,",
    "panels.": "पैनल में।",
    "normal,": "सामान्य,",
    "need attention.": "ध्यान चाहिए।",
    "Critical:": "गंभीर:",
    "need immediate medical attention.": "तत्काल चिकित्सा ध्यान आवश्यक।",
    "are slightly outside normal — worth monitoring.":
      "सामान्य से थोड़ा बाहर हैं — निगरानी रखें।",
    "You have": "आपके पास",
    "critical findings that need immediate attention.": "गंभीर निष्कर्ष हैं जिन पर तुरंत ध्यान देने की आवश्यकता है।",
    "critically": "गंभीर रूप से",
    "high": "उच्च",
    "low": "निम्न",
    "normal:": "सामान्य:",
    "See a doctor right away.": "तुरंत डॉक्टर से मिलें।",
  },
  te: {
    "Great news — no critical findings in your report! All values are within safe ranges.":
      "శుభవార్త — మీ నివేదికలో తీవ్రమైన సమస్యలు లేవు! అన్ని విలువలు సురక్షిత పరిధిలో ఉన్నాయి.",
    "Great news! Your overall health looks really good. Let me walk you through.":
      "శుభవార్త! మీ మొత్తం ఆరోగ్యం చాలా బాగుంది. మీకు వివరంగా చెబుతాను.",
    "Most things look fine, but there are a few areas that need attention.":
      "చాలావరకు బాగున్నా, కొన్ని విషయాలపై దృష్టి అవసరం.",
    "I need to flag some important findings. Please review carefully and consult your doctor soon.":
      "కొన్ని ముఖ్యమైన ఫలితాలను చూపించాలి. దయచేసి జాగ్రత్తగా చూసి త్వరగా డాక్టర్‌ను సంప్రదించండి.",
    "Here are some lifestyle tips based on your results:":
      "మీ ఫలితాల ఆధారంగా కొన్ని జీవనశైలి సూచనలు:",
    "Your blood sugar needs attention. Reduce refined carbs, increase fiber, and walk after meals.":
      "మీ రక్తంలో చక్కెరపై దృష్టి అవసరం. శుద్ధి చేసిన పిండిపదార్థాలు తగ్గించండి, ఫైబర్ పెంచండి, భోజనం తర్వాత నడవండి.",
    "Focus on heart health: healthy fats, omega-3 foods, and 30 min exercise daily.":
      "హృదయ ఆరోగ్యంపై దృష్టి పెట్టండి: ఆరోగ్యకర కొవ్వులు, ఒమేగా-3 ఆహారం, రోజూ 30 నిమిషాల వ్యాయామం.",
    "Boost iron with spinach, lentils, and vitamin C for better absorption.":
      "పాలకూర, పప్పులు, విటమిన్ సి తో ఇనుము పెంచుకోండి — శోషణ మెరుగవుతుంది.",
    "Stay hydrated — bananas, coconut water, and leafy greens help electrolyte balance.":
      "హైడ్రేటెడ్‌గా ఉండండి — అరటిపండ్లు, కొబ్బరి నీరు, ఆకు కూరలు ఎలక్ట్రోలైట్ సమతుల్యతకు సహాయపడతాయి.",
    "Results look good! Keep up balanced diet, exercise, and sleep.":
      "ఫలితాలు బాగున్నాయి! సమతుల ఆహారం, వ్యాయామం, నిద్ర కొనసాగించండి.",
    "Scroll down for detailed panels, recommendations, and doctor advice. I'm AI — not a replacement for your doctor!":
      "వివరమైన ప్యానెల్స్, సూచనలు మరియు డాక్టర్ సలహా కోసం క్రిందికి స్క్రోల్ చేయండి. నేను ఏఐని — మీ డాక్టర్‌కు ప్రత్యామ్నాయం కాదు!",
    "I analyzed": "నేను విశ్లేషించాను",
    "tests across": "పరీక్షలు,",
    "panels.": "ప్యానెల్స్‌లో.",
    "normal,": "సాధారణం,",
    "need attention.": "దృష్టి అవసరం.",
    "Critical:": "క్లిష్టమైనవి:",
    "need immediate medical attention.": "తక్షణ వైద్య సహాయం అవసరం.",
    "are slightly outside normal — worth monitoring.":
      "సాధారణం కంటే కొంచెం వెలుపల ఉన్నాయి — పరిశీలించండి.",
    "You have": "మీకు ఉన్నాయి",
    "critical findings that need immediate attention.": "తక్షణం దృష్టి అవసరమైన క్లిష్ట ఫలితాలు.",
    "critically": "క్లిష్టంగా",
    "high": "ఎక్కువ",
    "low": "తక్కువ",
    "normal:": "సాధారణం:",
    "See a doctor right away.": "వెంటనే డాక్టర్‌ని కలవండి.",
  },
  mr: {
    "Great news — no critical findings in your report! All values are within safe ranges.":
      "चांगली बातमी — तुमच्या रिपोर्टमध्ये कोणतीही गंभीर समस्या नाही! सर्व मूल्ये सुरक्षित मर्यादेत आहेत.",
    "Great news! Your overall health looks really good. Let me walk you through.":
      "चांगली बातमी! तुमचे एकूण आरोग्य खूप चांगले आहे. मी तुम्हाला सविस्तर सांगतो.",
    "Most things look fine, but there are a few areas that need attention.":
      "बहुतेक गोष्टी ठीक दिसत आहेत, पण काही गोष्टींकडे लक्ष देणे आवश्यक आहे.",
    "I need to flag some important findings. Please review carefully and consult your doctor soon.":
      "काही महत्त्वाच्या निष्कर्षांकडे लक्ष वेधायचे आहे. कृपया काळजीपूर्वक तपासा आणि लवकरच डॉक्टरांचा सल्ला घ्या.",
    "Here are some lifestyle tips based on your results:":
      "तुमच्या निकालांवर आधारित काही जीवनशैली सूचना:",
    "Your blood sugar needs attention. Reduce refined carbs, increase fiber, and walk after meals.":
      "तुमच्या रक्तातील साखरेकडे लक्ष द्या. प्रक्रिया केलेले कार्ब कमी करा, फायबर वाढवा आणि जेवणानंतर चालणे करा.",
    "Focus on heart health: healthy fats, omega-3 foods, and 30 min exercise daily.":
      "हृदयाच्या आरोग्यावर लक्ष द्या: निरोगी स्निग्ध पदार्थ, ओमेगा-3 अन्न आणि दररोज 30 मिनिटांचा व्यायाम.",
    "Boost iron with spinach, lentils, and vitamin C for better absorption.":
      "पालक, डाळ आणि व्हिटॅमिन सी ने लोह वाढवा — चांगल्या शोषणासाठी.",
    "Stay hydrated — bananas, coconut water, and leafy greens help electrolyte balance.":
      "हायड्रेटेड रहा — केळी, नारळ पाणी आणि हिरव्या भाज्या इलेक्ट्रोलाइट संतुलनास मदत करतात.",
    "Results look good! Keep up balanced diet, exercise, and sleep.":
      "निकाल चांगले दिसत आहेत! संतुलित आहार, व्यायाम आणि झोप कायम ठेवा.",
    "Scroll down for detailed panels, recommendations, and doctor advice. I'm AI — not a replacement for your doctor!":
      "तपशीलवार पॅनेल, शिफारसी आणि डॉक्टरांच्या सल्ल्यासाठी खाली स्क्रोल करा. मी एआय आहे — तुमच्या डॉक्टरांचा पर्याय नाही!",
    "I analyzed": "मी विश्लेषण केले",
    "tests across": "चाचण्या,",
    "panels.": "पॅनेलमध्ये.",
    "normal,": "सामान्य,",
    "need attention.": "लक्ष आवश्यक.",
    "Critical:": "गंभीर:",
    "need immediate medical attention.": "त्वरित वैद्यकीय लक्ष आवश्यक.",
    "are slightly outside normal — worth monitoring.":
      "सामान्यपेक्षा थोडे बाहेर आहेत — निरीक्षण करा.",
    "You have": "तुमच्याकडे आहेत",
    "critical findings that need immediate attention.": "गंभीर निष्कर्ष ज्यांना त्वरित लक्ष आवश्यक आहे.",
    "critically": "गंभीरपणे",
    "high": "जास्त",
    "low": "कमी",
    "normal:": "सामान्य:",
    "See a doctor right away.": "लगेच डॉक्टरांना भेटा.",
  },
};

/**
 * Translate a message by replacing known English fragments with the target language.
 * Falls back to original text for any fragment not in the dictionary (test names, numbers, units).
 */
export function translate(text: string, lang: LangCode): string {
  if (lang === "en" || !text) return text;
  const d = dict[lang];
  // Try whole-string match first
  if (d[text]) return d[text];

  let out = text;
  // Replace longer keys first to avoid partial collisions
  const keys = Object.keys(d).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (out.includes(k)) {
      out = out.split(k).join(d[k]);
    }
  }
  return out;
}

export function getBcp47(lang: LangCode): string {
  return LANGUAGES.find((l) => l.code === lang)?.bcp47 ?? "en-US";
}
