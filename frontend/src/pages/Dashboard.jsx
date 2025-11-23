import { useState, useEffect } from 'react';
import { TrendingUp, Map, BarChart3, AlertCircle, Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import API from "../api/client"; // your axios instance

const AVAILABLE_SUBCOUNTIES = ["embakasi", "kasarani", "langata", "makadara", "westlands"];

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    highRiskAreas: 0,
    monitoredAreas: AVAILABLE_SUBCOUNTIES.length,
    avgRentIncrease: 0,
    avgRentValue: 0,
    highRiskSubcounties: [],
  });
  const [topRiskFactors, setTopRiskFactors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      let highRiskCount = 0;
      let totalRentChangePercent = 0;
      let totalRentValue = 0;
      let highRiskSubcounties = [];

      await Promise.all(AVAILABLE_SUBCOUNTIES.map(async (sub) => {
        try {
          // Current year
          const currentRes = await API.get(`/api/map-predictions?subcounty=${sub}&model=rf&year=2023`);
          const currentData = currentRes.data;

          // Previous year
          const prevRes = await API.get(`/api/map-predictions?subcounty=${sub}&model=rf&year=2022`);
          const prevData = prevRes.data;

          const currentRent = currentData.features_used?.Rent ?? 0;
          const prevRent = prevData.features_used?.Rent ?? currentRent;

          const rentChangePercent = prevRent > 0 ? ((currentRent - prevRent) / prevRent) * 100 : 0;

          totalRentChangePercent += rentChangePercent;
          totalRentValue += currentRent;

          if (currentData.risk_category === 'High') {
            highRiskCount++;
            highRiskSubcounties.push(sub.charAt(0).toUpperCase() + sub.slice(1));
          }

        } catch (err) {
          console.error(`Error fetching data for ${sub}:`, err);
        }
      }));

      setMetrics({
        highRiskAreas: highRiskCount,
        monitoredAreas: AVAILABLE_SUBCOUNTIES.length,
        avgRentIncrease: totalRentChangePercent / AVAILABLE_SUBCOUNTIES.length,
        avgRentValue: totalRentValue / AVAILABLE_SUBCOUNTIES.length,
        highRiskSubcounties,
      });

      setLoading(false);
    }

    fetchMetrics();
  }, []);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await API.get('/insights');
        const data = res.data;
        const combined = [];

        Object.entries(data.models).forEach(([modelName, modelData]) => {
          const { feature_names, values } = modelData.feature_importance;
          const features = feature_names.map((f, i) => ({ feature: f, importance: values[i] }));

          // Normalize importance to sum 100% for display
          const totalImportance = features.reduce((sum, f) => sum + f.importance, 0);
          features.forEach(f => f.importancePercent = totalImportance > 0 ? (f.importance / totalImportance) * 100 : 0);

          features.sort((a, b) => b.importancePercent - a.importancePercent);

          combined.push({
            model: modelName,
            topFeatures: features.slice(0, 3)
          });
        });

        setTopRiskFactors(combined);
      } catch (err) {
        console.error('Error fetching insights:', err);
      }
    }

    fetchInsights();
  }, []);

  if (loading) return <p className="p-8">Loading dashboard...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Nairobi Gentrification Monitor</h1>
          <p className="text-lg text-gray-600">Real-time insights and predictive analytics for neighborhood change</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span className="text-sm font-medium text-gray-600">{metrics.highRiskAreas} areas</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.highRiskAreas}</p>
              <p className="text-sm text-gray-600">
                High risk areas: {metrics.highRiskSubcounties.join(', ')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.avgRentIncrease.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">
                Avg Rent Increase: KSh {Math.round(metrics.avgRentValue).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.monitoredAreas}</p>
              <p className="text-sm text-gray-600">
                Monitored areas: {AVAILABLE_SUBCOUNTIES.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Top Risk Factors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {topRiskFactors.map((modelData, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-center">{modelData.model}</h3>
              {modelData.topFeatures.map((f, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">{f.feature}</span>
                    <span className="text-sm font-bold text-gray-900">{f.importancePercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${f.importancePercent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Explanatory paragraph */}
        <div className="mt-6 p-6 bg-white rounded-xl shadow-lg text-gray-700">
          This dashboard displays live insights from Nairobi subcounties.
          High-risk areas indicate neighborhoods predicted to be under significant gentrification pressure.
          The average rent increase shows the typical change in rental prices over the last year.
          Top risk factors show the features contributing most to the predictions of gentrification risk for each model.
        </div>
      </div>
    </div>
  );
}



