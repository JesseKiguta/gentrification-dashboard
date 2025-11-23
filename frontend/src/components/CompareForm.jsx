import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Sparkles, Layers } from "lucide-react";
import API from "../api/client";
import { useNotifications } from "./NotificationContext";

// MODEL OPTIONS FROM BACKEND
const MODEL_OPTIONS = ["Random Forest", "XGBoost", "MLP"];

export default function CompareForm({ onCompare = () => {} }) {
  const [formData, setFormData] = useState({});
  const [selectedModels, setSelectedModels] = useState([...MODEL_OPTIONS]);
  const [loading, setLoading] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const { addNotification } = useNotifications();

  // -------------------------
  // CLEAN BACKEND FIELDS
  // -------------------------
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
    quarter: "Current Quarter of the Year",
  };

  const SUBCOUNTIES = [
    "embakasi",
    "kasarani",
    "langata",
    "makadara",
    "westlands",
  ];

  const categories = {
    "Expenditure": ["Rent", "Food", "Misc"],
    "Socioeconomic": ["median_income", "employment_rate", "household_size"],
    "Population & Time": ["pop_density", "year", "month", "quarter"],
    "Spatial Features": ["dist_to_cbd_km", "neighbors"],
    "Infrastructure": ["Transport", "Utilities"],
    "Subcounty": ["Subcounty_clean"],
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: key === "Subcounty_clean" ? value : Number(value)
    }));
  };

  const handleModelSelection = (model) => {
    setSelectedModels((prev) =>
      prev.includes(model)
        ? prev.filter((m) => m !== model)
        : [...prev, model]
    );
  };

  const handleSelectAll = () => {
    if (selectedModels.length === MODEL_OPTIONS.length) {
      setSelectedModels([]);
    } else {
      setSelectedModels([...MODEL_OPTIONS]);
    }
  };

  const handleSubmit = async () => {
    if (selectedModels.length === 0) {
      alert("Please select at least one model to compare.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        models: selectedModels,
        features: Object.keys(friendlyLabels).reduce((acc, key) => {
          acc[key] =
            key === "Subcounty_clean"
              ? formData[key] || ""
              : formData[key] !== undefined
              ? Number(formData[key])
              : 0;
          return acc;
        }, {}),
      };

      const res = await API.post("/compare", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onCompare(res.data);
      addNotification("Model comparison completed successfully.", "success");
    } catch (err) {
      console.error("Comparison error:", err.response?.data || err);
      alert("Model comparison failed. Please check your inputs or try again.");
    } finally {
      setLoading(false);
    }
  };

  const filledFieldsCount = Object.keys(formData).filter(
    (key) => formData[key] !== undefined && formData[key] !== ""
  ).length;

  const totalFields = Object.keys(friendlyLabels).length;
  const progressPercentage = (filledFieldsCount / totalFields) * 100;

  const categoryColors = {
    "Expenditure": "from-purple-500 to-pink-500",
    "Socioeconomic": "from-blue-500 to-cyan-500",
    "Population & Time": "from-green-500 to-emerald-500",
    "Spatial Features": "from-orange-500 to-red-500",
    "Infrastructure": "from-indigo-500 to-purple-500",
    "Subcounty": "from-yellow-500 to-orange-500",
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-2xl p-8 border border-gray-200">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Compare Model Predictions</h2>
        </div>
        <p className="text-gray-600 text-sm">Select models and configure features to compare gentrification predictions</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-gray-100 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Feature Configuration Progress</span>
          <span className="text-sm font-bold text-indigo-600">
            {filledFieldsCount}/{totalFields}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Select Models
          </h3>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium transition-colors"
          >
            {selectedModels.length === MODEL_OPTIONS.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MODEL_OPTIONS.map((model) => {
            const isSelected = selectedModels.includes(model);
            return (
              <button
                key={model}
                type="button"
                onClick={() => handleModelSelection(model)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-500 shadow-md"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isSelected ? "text-indigo-700" : "text-gray-700"}`}>
                    {model}
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Categories */}
      <div className="space-y-3 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Features</h3>

        {Object.entries(categories).map(([category, keys]) => {
          const isOpen = openCategory === category;
          const categoryFieldsFilled = keys.filter(
            (key) => formData[key] !== undefined && formData[key] !== ""
          ).length;

          return (
            <div
              key={category}
              className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                isOpen ? "border-indigo-300 shadow-lg" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <button
                onClick={() => setOpenCategory(isOpen ? null : category)}
                className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                  isOpen ? "bg-gradient-to-r " + categoryColors[category] : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <span className={`font-semibold ${isOpen ? "text-white" : "text-gray-900"}`}>
                      {category}
                    </span>
                    <div className={`text-xs ${isOpen ? "text-white/90" : "text-gray-500"}`}>
                      {categoryFieldsFilled}/{keys.length} configured
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {categoryFieldsFilled > 0 && !isOpen && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                      {categoryFieldsFilled}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className={`w-5 h-5 ${isOpen ? "text-white" : "text-gray-600"}`} />
                  ) : (
                    <ChevronDown className={`w-5 h-5 ${isOpen ? "text-white" : "text-gray-600"}`} />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white"
                  >
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {keys.map((key) => (
                        <div key={key}>
                          <label className="text-gray-700 text-sm font-medium block mb-2">
                            {friendlyLabels[key]}
                          </label>

                          {key === "Subcounty_clean" ? (
                            <select
                              value={formData[key] || ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="w-full border-2 border-gray-200 p-3 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="">Select Subcounty</option>
                              {SUBCOUNTIES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              step="any"
                              value={formData[key] || ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                              placeholder="Enter value"
                              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <button
        disabled={loading}
        onClick={handleSubmit}
        className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 ${
          loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Comparing Models...
          </div>
        ) : (
          "Compare Models"
        )}
      </button>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Configure at least the key features for more accurate predictions.
        </p>
      </div>
    </div>
  );
}

