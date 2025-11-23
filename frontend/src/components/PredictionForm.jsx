import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import API from "../api/client";
import { useNotifications } from "./NotificationContext";

export default function PredictionForm({ onPredict }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Random Forest");
  const [openCategory, setOpenCategory] = useState(null);
  const { addNotification } = useNotifications();

  // -------------------------
  // NEW CLEAN BACKEND FIELDS
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

  // Replace with actual backend VALID_SUBCOUNTIES
  const SUBCOUNTIES = [
    "embakasi",
    "kasarani",
    "langata",
    "makadara",
    "westlands",
  ];

  // -------------------------
  // ORGANIZED CATEGORIES
  // -------------------------
  const categories = {
    "Expenditure": ["Rent", "Food", "Misc"],
    "Socioeconomic": ["median_income", "employment_rate", "household_size"],
    "Population & Time": ["pop_density", "year", "month", "quarter"],
    "Spatial Features": ["dist_to_cbd_km", "neighbors"],
    "Infrastructure": ["Transport", "Utilities"],
    "Subcounty": ["Subcounty_clean"],
  };

  const categoryColors = {
    "Expenditure": "from-blue-500 to-cyan-500",
    "Socioeconomic": "from-purple-500 to-pink-500",
    "Population & Time": "from-green-500 to-emerald-500",
    "Spatial Features": "from-indigo-500 to-purple-500",
    "Infrastructure": "from-orange-500 to-red-500",
    "Subcounty": "from-yellow-500 to-orange-500",
  };

  // update single field, accept numbers and strings (for subcounty)
  const handleChange = (key, value) => {
    setFormData((prev) => {
      // keep subcounty as string; other numeric values -> Number or empty
      if (key === "Subcounty_clean") {
        return { ...prev, [key]: value };
      }
      const parsed = value === "" ? undefined : Number(value);
      return { ...prev, [key]: parsed };
    });
  };

  // build complete payload matching backend ModelInput
  const buildPayload = () => {
    // keys must match ModelInput exactly
    const allKeys = Object.keys(friendlyLabels);
    const payload = {};
    allKeys.forEach((k) => {
      // Subcounty_clean should be string; if missing, send empty string or raise
      if (k === "Subcounty_clean") {
        payload[k] = formData[k] !== undefined && formData[k] !== "" ? formData[k] : "";
      } else {
        // numeric fields -> default to 0 if not provided
        payload[k] = formData[k] !== undefined && formData[k] !== "" ? Number(formData[k]) : 0;
      }
    });
    return payload;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = buildPayload();

      // send to predict endpoint (model_name as query param)
      const url = `/predict?model_name=${encodeURIComponent(selectedModel)}`;
      const res = await API.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // res.data is expected to be something like:
      // { model: "Random Forest", score: -0.095, risk_category: "Low" }
      onPredict(res.data);
      addNotification("A prediction has been made successfully.", "success");
    } catch (err) {
      console.error("Prediction error:", err.response?.data || err);
      const msg = err.response?.data || err.message || "Prediction failed";
      alert("Prediction failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Progress bar: count keys in friendlyLabels that are filled
  const filledFieldsCount = Object.keys(friendlyLabels).filter((k) => {
    if (k === "Subcounty_clean") {
      return formData[k] && formData[k] !== "";
    }
    return formData[k] !== undefined && formData[k] !== "";
  }).length;
  const totalFields = Object.keys(friendlyLabels).length;
  const progressPercentage = Math.round((filledFieldsCount / totalFields) * 100);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-2xl p-8 border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Gentrification Risk Prediction</h2>
        </div>
        <p className="text-gray-600 text-sm">Configure features and select a model to predict gentrification risk</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-gray-100 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Feature Configuration Progress</span>
          <span className="text-sm font-bold text-blue-600">{filledFieldsCount}/{totalFields}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Model</h3>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
        >
          <option value="Random Forest">Random Forest</option>
          <option value="XGBoost">XGBoost</option>
          <option value="MLP">Neural Network (MLP)</option>
        </select>
      </div>

      {/* Categories */}
      <div className="space-y-3 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Features</h3>

        {Object.entries(categories).map(([category, keys]) => {
          const isOpen = openCategory === category;
          const categoryFieldsFilled = keys.filter(key => {
            if (key === "Subcounty_clean") return formData[key] && formData[key] !== "";
            return formData[key] !== undefined && formData[key] !== "";
          }).length;

          return (
            <div key={category} className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? "border-blue-300 shadow-lg" : "border-gray-200 hover:border-gray-300"}`}>
              <button
                onClick={() => setOpenCategory(isOpen ? null : category)}
                className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${isOpen ? "bg-gradient-to-r " + categoryColors[category] : "bg-gray-50 hover:bg-gray-100"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <span className={`font-semibold ${isOpen ? "text-white" : "text-gray-900"}`}>{category}</span>
                    <div className={`text-xs ${isOpen ? "text-white/90" : "text-gray-500"}`}>
                      {categoryFieldsFilled}/{keys.length} configured
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {categoryFieldsFilled > 0 && !isOpen && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
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
                        <div key={key} className="relative">
                          <label className="text-gray-700 text-sm font-medium block mb-2">
                            {friendlyLabels[key] || key}
                          </label>

                          {key === "Subcounty_clean" ? (
                            <select
                              value={formData[key] || ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            >
                              <option value="">Select subcounty</option>
                              {SUBCOUNTIES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              step="any"
                              value={formData[key] ?? ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                              placeholder="Enter value"
                              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          disabled={loading}
          onClick={handleSubmit}
          className={`flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 ${loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"}`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Predicting...
            </div>
          ) : (
            "Predict Risk"
          )}
        </button>
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Configure at least the key features for more accurate predictions.
        </p>
      </div>
    </div>
  );
}



