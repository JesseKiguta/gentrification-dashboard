import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import PredictionForm from '../components/PredictionForm'
import ResultCard from '../components/ResultCard'
import ModelComparison from '../components/ModelComparison'
import MapView from '../components/MapView'
import API from '../api/client'

export default function Dashboard() {
    const [features, setFeatures] = useState([])
    const [prediction, setPrediction] = useState(null)
    const [compare, setCompare] = useState(null)
    useEffect(() => {
        API.get('/features').then(res =>
            setFeatures(res.data.features)).catch(() => setFeatures([]))
    }, [])
    return (
        <div>
            <Navbar />
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 lg:col-span-1">
                    <PredictionForm features={features} onPredict={setPrediction}
                        onCompare={setCompare} />
                </div>
                <div className="col-span-1 lg:col-span-2">
                    <ResultCard prediction={prediction} />
                    <ModelComparison compare={compare} />
                    <MapView />
                </div>
            </div>
        </div>
    )
}