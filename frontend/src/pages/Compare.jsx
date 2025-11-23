import { useState } from "react";
import CompareForm from "../components/CompareForm";
import ModelComparison from "../components/ModelComparison";
import { motion } from "framer-motion";

export default function Compare() {
  const [comparisonResult, setComparisonResult] = useState(null);

  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold mb-6">Model Comparison</h1>

      <CompareForm onCompare={(result) => setComparisonResult(result)} />

      {/* Show the chart once data is returned */}
      {comparisonResult && (
        <ModelComparison compare={comparisonResult} />
      )}
    </motion.div>
  );
}

