import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

export default function ModelComparison({ compare }) {
  if (!compare) {
    return (
      <div className="bg-white shadow-md rounded-xl p-6 text-gray-500 text-center border mt-6">
        <p>No model comparison data available. Run a comparison to view results.</p>
      </div>
    );
  }

  // ------------------------- Transform backend data -------------------------
  const data = Object.entries(compare).map(([model, value]) => ({
    name: model,
    score: value.score, // use raw score
    risk_category: value.risk_category, // include risk_category for tooltip
  }));

  // ------------------------- Color mapping by risk category -------------------------
  const riskColors = {
    Low: "#16A34A", // green
    Medium: "#FBBF24", // yellow
    High: "#DC2626", // red
  };

  // Find the model with the highest score
  const bestModel = data.reduce((a, b) => (a.score > b.score ? a : b), data[0]);

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl p-6 border mt-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-xl font-semibold mb-4">Model Comparison</h2>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis
            domain={['dataMin - 0.1', 'dataMax + 0.1']} // dynamically show negative and positive scores
            tickFormatter={(tick) => tick.toFixed(2)}
          />
          <Tooltip
            formatter={(value, name, props) => {
              const { payload } = props;
              return [
                `${payload.score.toFixed(3)} (${payload.risk_category} Risk)`,
                "Score",
              ];
            }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={riskColors[entry.risk_category] || "#6B7280"} // gray fallback
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ------------------------- Summary section ------------------------- */}
      <div className="mt-4 text-center">
        <p className="text-gray-700">
          <strong>{bestModel.name}</strong> shows the highest risk at{" "}
          <span className="text-blue-600 font-semibold">
            {bestModel.score.toFixed(3)}
          </span>{" "}
          ({bestModel.risk_category} risk).
        </p>
      </div>
    </motion.div>
  );
}

