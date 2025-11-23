import { useState } from "react";
import API from "../api/client";
import { useNotifications } from "./NotificationContext";

// Replace with actual backend VALID_SUBCOUNTIES
const SUBCOUNTIES = ["embakasi", "kasarani", "langata", "makadara", "westlands"];
const MODEL_OPTIONS = ["Random Forest", "XGBoost", "MLP"];

export default function GenerateReport() {
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    Rent: 0,
    Food: 0,
    Misc: 0,
    median_income: 0,
    employment_rate: 0,
    pop_density: 0,
    household_size: 0,
    dist_to_cbd_km: 0,
    neighbors: 0,
    Transport: 0,
    Utilities: 0,
    Subcounty_clean: "embakasi",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.floor((new Date().getMonth() + 3) / 3),
  });
  const [model, setModel] = useState("Random Forest");
  const [subcounty, setSubcounty] = useState("embakasi");
  const [year, setYear] = useState(new Date().getFullYear());
  const [topN, setTopN] = useState(5);
  const [loading, setLoading] = useState(false);

  const friendlyLabels = {
    Rent: "Rent (KES)",
    Food: "Food Expenditure (KES)",
    Misc: "Miscellaneous Expenditure (KES)",
    median_income: "Median Household Income (KES)",
    employment_rate: "Employment Rate (%)",
    pop_density: "Population Density",
    household_size: "Household Size",
    dist_to_cbd_km: "Distance to CBD (km)",
    neighbors: "Number of Neighboring Subcounties",
    Transport: "Transport Access Score",
    Utilities: "Utilities Access Score",
    Subcounty_clean: "Subcounty",
    year: "Current Year",
    month: "Current Month",
    quarter: "Current Quarter",
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/generate-report?model_name=${model}&subcounty=${subcounty}&year=${year}&top_n=${topN}`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          responseType: "blob", // <-- important for PDF
        }
      );

      // Download PDF
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "gentrification_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setLoading(false);
        addNotification("Report generated successfully.", "success");
    } catch (err) {
      console.error("Report generation error:", err);
      alert("Failed to generate report. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-2xl p-8 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Gentrification Report</h2>
        <p className="text-gray-600 text-sm">
          Select a model, subcounty, and year, then configure features to generate a PDF report.
        </p>
      </div>

      {/* Model, Subcounty, Year, Top N */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Subcounty</label>
          <select
            value={subcounty}
            onChange={(e) => setSubcounty(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {SUBCOUNTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Number of Top Predictions</label>
          <input
            type="number"
            value={topN}
            min={1}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Feature inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {Object.keys(friendlyLabels)
          .filter((k) => !["Subcounty_clean", "year", "month", "quarter"].includes(k))
          .map((key) => (
            <div key={key}>
              <label className="block text-gray-700 font-medium mb-1">
                {friendlyLabels[key]}
              </label>
              <input
                type="number"
                step="any"
                value={formData[key] || 0}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="Enter value"
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
      </div>

      <button
        disabled={loading}
        onClick={handleGenerate}
        className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 ${
          loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        }`}
      >
        {loading ? "Generating Report..." : "Generate Report"}
      </button>
    </div>
  );
}









