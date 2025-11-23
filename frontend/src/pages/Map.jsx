import { useState } from "react";
import MapView from "../components/MapView";

export default function Map() {
  const [model, setModel] = useState("rf");
  const [year, setYear] = useState(2023);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Geospatial Insights</h1>

      {/* Controls */}
      <div className="flex items-start justify-between gap-6 mb-4">
        <div className="flex flex-col gap-4">
          {/* Model select */}
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="border rounded px-2 py-1 w-40"
            >
              <option value="rf">Random Forest</option>
              <option value="xgb">XGBoost</option>
              <option value="lr">Linear Regression</option>
            </select>
          </div>

          {/* Year input */}
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
            <p className="text-xs text-gray-500 mt-1">
              Valid years of prediction are from 2019 to 2023
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapView model={model} year={year} />
    </div>
  );
}
