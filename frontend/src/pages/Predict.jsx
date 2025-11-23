import { useState } from "react";
import PredictionForm from "../components/PredictionForm";
import ResultCard from "../components/ResultCard";

export default function Predict() {
  const [predictionResult, setPredictionResult] = useState(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Gentrification Prediction
      </h1>
      <PredictionForm onPredict={(result) => setPredictionResult(result)} />

      {predictionResult && (
        <div className="mt-6">
          <ResultCard prediction={predictionResult} />
        </div>
      )}
    </div>
  );
}


