import { motion } from "framer-motion";
import { AlertTriangle, XCircle } from "lucide-react";
import type { AbnormalFinding } from "@/services/labAnalyzer";

interface AbnormalFindingsProps {
  findings: AbnormalFinding[];
}

const AbnormalFindings = ({ findings }: AbnormalFindingsProps) => {
  if (findings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="panel-card p-6 relative overflow-hidden"
    >
      {/* Subtle background pulse */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-status-attention/5 rounded-full blur-3xl" />

      <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-status-attention/10 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-status-attention" />
        </div>
        Abnormal Findings
        <span className="text-xs px-2 py-0.5 rounded-full bg-status-attention/10 text-status-attention font-medium">
          {findings.length}
        </span>
      </h3>
      <div className="space-y-3 relative z-10">
        {findings.map((finding, i) => {
          const isCritical = finding.status.includes("critical");
          return (
            <motion.div
              key={finding.testName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ x: 4, transition: { duration: 0.15 } }}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-default ${
                isCritical
                  ? "bg-status-critical/5 border-status-critical/20 hover:border-status-critical/40"
                  : "bg-status-attention/5 border-status-attention/20 hover:border-status-attention/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {isCritical ? (
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <XCircle className="w-4 h-4 text-status-critical" />
                  </motion.div>
                ) : (
                  <AlertTriangle className="w-4 h-4 text-status-attention" />
                )}
                <h4 className="font-display font-semibold text-sm text-foreground">{finding.testName}</h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isCritical
                      ? "bg-status-critical/10 text-status-critical"
                      : "bg-status-attention/10 text-status-attention"
                  }`}
                >
                  {finding.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-foreground/70 leading-relaxed">{finding.explanation}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AbnormalFindings;
