import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Flame, Info } from "lucide-react";

export default function ResultCard({ prediction }) {
  if (
    !prediction ||
    prediction.score === undefined ||
    !prediction.risk_category
  ) {
    return (
      <div className="bg-white shadow-md rounded-xl p-6 text-gray-500 text-center border">
        <p>No prediction yet. Submit data to see results.</p>
      </div>
    );
  }

  const { model, score, risk_category } = prediction;

  const riskMap = {
    Low: {
      color: "bg-green-500",
      text: "text-green-600",
      icon: <CheckCircle size={22} />,
      description:
        "The score is below -0.05, which indicates conditions are below the countywide average pressure.",
    },
    Medium: {
      color: "bg-yellow-500",
      text: "text-yellow-600",
      icon: <AlertTriangle size={22} />,
      description:
        "The score is between -0.05 and 0.05, meaning the subcounty sits close to the average risk conditions.",
    },
    High: {
      color: "bg-red-500",
      text: "text-red-600",
      icon: <Flame size={22} />,
      description:
        "The score is above 0.05, suggesting significantly elevated pressure and displacement risk.",
    },
  };

  const level = riskMap[risk_category] || {
    color: "bg-gray-400",
    text: "text-gray-600",
    icon: <Info size={22} />,
    description: "No interpretation available.",
  };

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl p-6 border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Prediction Result</h2>
        <span
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-white ${level.color}`}
        >
          {level.icon}
          {risk_category} Risk
        </span>
      </div>

      {/* Model + Score */}
      <div className="mb-4">
        <h3 className="font-medium text-gray-700 mb-1">Model Score</h3>
        <p className="text-lg font-semibold">{score.toFixed(4)}</p>

        <p className="text-xs text-gray-500 mt-1">
          Negative scores indicate below-average pressure; positive scores
          indicate above-average pressure.
        </p>
      </div>

      {/* Explanation */}
      <p className={`text-sm leading-6 ${level.text}`}>
        Based on your inputs, the <strong>{model}</strong> model predicts a{" "}
        <strong>{risk_category.toLowerCase()}</strong> gentrification risk level.
        {` ${level.description}`}
      </p>
    </motion.div>
  );
}




