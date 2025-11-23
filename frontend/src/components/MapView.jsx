import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import API from "../api/client";

// ------------------------------
// Map Embakasi subcounties to "embakasi"
// ------------------------------
const mapSubcountyName = (rawName) => {
  if (!rawName) return "";
  const name = rawName.toLowerCase().trim();
  const embakasiGroup = [
    "embakasi central",
    "embakasi south",
    "embakasi north",
    "embakasi west",
    "embakasi east",
  ];
  if (embakasiGroup.includes(name)) return "embakasi";
  return name;
};

// ------------------------------
// Convert risk string to color
// ------------------------------
const getColor = (risk) => {
  if (risk === "High") return "#ef4444";
  if (risk === "Medium") return "#facc15";
  if (risk === "Low") return "#22c55e";
  return "#9ca3af"; // Unknown / no data
};

// ------------------------------
// Style each GeoJSON feature
// ------------------------------
const styleFeature = (feature) => ({
  fillColor: getColor(feature.properties.risk_category),
  weight: 1,
  color: "white",
  fillOpacity: 0.7,
});

export default function MapView({ model = "rf", year }) {
  const [geoData, setGeoData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMap = async () => {
      setLoading(true);

      try {
        // --- Load static GeoJSON ---
        const res = await fetch("/nairobi_subcounties.geojson");
        const geo = await res.json();

        // --- Fetch predictions for each feature ---
        const enriched = await Promise.all(
          geo.features.map(async (feature) => {
            const rawName = feature.properties.Subcounty;
            const subcountyName = mapSubcountyName(rawName);

            try {
              const response = await API.get(
                `/api/map-predictions?subcounty=${encodeURIComponent(
                  subcountyName
                )}&model=${model}&year=${year}`
              );
              const data = response.data;

              return {
                ...feature,
                properties: {
                  ...feature.properties,
                  risk_category: data.risk_category, // "Low" | "Medium" | "High"
                  score: data.score,
                  sample_count: data.sample_count,
                  exists_in_dataset: true,
                },
              };
            } catch (err) {
              const is404 = err.response && err.response.status === 404;
              if (is404) {
                console.warn(`No data for '${subcountyName}'`);
              } else {
                console.error("Error fetching prediction:", err);
              }

              return {
                ...feature,
                properties: {
                  ...feature.properties,
                  risk_category: null,
                  score: null,
                  sample_count: 0,
                  exists_in_dataset: false,
                },
              };
            }
          })
        );

        setGeoData({ ...geo, features: enriched });
      } catch (error) {
        console.error("Failed to load map data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (year) loadMap(); // Only load if year is set
  }, [model, year]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => setSelectedFeature(feature),
      mouseover: (e) => e.target.setStyle({ weight: 3, color: "#333" }),
      mouseout: (e) => e.target.setStyle({ weight: 1, color: "white" }),
    });
  };

  if (loading) return <div className="p-4">Loading map...</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg border mt-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Nairobi Subcounty Risk Map</h2>
        <p className="text-sm text-gray-500">Click a subcounty for details</p>
      </div>

      {/* Map */}
      <MapContainer
        center={[-1.286389, 36.817223]}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoData && (
          <GeoJSON data={geoData} style={styleFeature} onEachFeature={onEachFeature} />
        )}

        {/* Popup */}
        {selectedFeature && (
          <Popup
            position={[
              selectedFeature.geometry.coordinates[0][0][1],
              selectedFeature.geometry.coordinates[0][0][0],
            ]}
            onClose={() => setSelectedFeature(null)}
          >
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {selectedFeature.properties.Subcounty}
              </h3>

              <p className="text-sm">
                <strong>Risk:</strong> {selectedFeature.properties.risk_category ?? "Unknown"}
              </p>

              <p className="text-sm">
                <strong>Score:</strong>{" "}
                {selectedFeature.properties.score?.toFixed(4) ?? "N/A"}
              </p>

              <p className="text-sm">
                <strong>Samples Used:</strong> {selectedFeature.properties.sample_count}
              </p>

              {!selectedFeature.properties.exists_in_dataset && (
                <p className="text-sm text-red-500 mt-1">
                  No training data for this subcounty.
                </p>
              )}
            </div>
          </Popup>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="p-4 text-sm text-gray-700 border-t bg-gray-50">
        <p className="font-semibold mb-2">Legend</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-500 rounded-sm"></span> Low
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-400 rounded-sm"></span> Medium
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-500 rounded-sm"></span> High
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-gray-400 rounded-sm"></span> Unknown / No data
          </div>
        </div>
      </div>
    </div>
  );
}








