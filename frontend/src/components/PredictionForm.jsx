import { useState } from 'react'
import API from '../api/client'

export default function PredictionForm({ features, onPredict, onCompare }) {
    // initialize inputs to empty or zero
    const init = {}
    features.forEach(f => init[f] = 0)
    const [inputs, setInputs] = useState(init)
    const [model, setModel] = useState('Random Forest')
    const [loading, setLoading] = useState(false)
    const handleChange = (k, v) => setInputs(prev => ({ ...prev, [k]: v }))
    const submit = async () => {
        setLoading(true)
        try {
            const res = await API.post('/predict', { model, features: inputs })
            onPredict(res.data.prediction)
        } catch (err) {
            console.error(err)
            onPredict(null)
        }
        setLoading(false)
    }
    const compareAll = async () => {
        setLoading(true)

        try {
            const res = await API.post('/compare', { model, features: inputs })
            onCompare(res.data)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }
    return (
        <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-3">Predict Gentrification Risk</h3>
            <label className="block mb-2">Model</label>
            <select value={model} onChange={e => setModel(e.target.value)}
                className="border p-2 w-full mb-3">
                <option>Random Forest</option>
                <option>XGBoost</option>
                <option>MLP</option>
            </select>
            <div className="max-h-64 overflow-auto mb-3">
                {features.length === 0 && <div className="text-sm text-gray-500">No
                    feature list loaded yet.</div>}
                {features.map((f) => (
                    <div key={f} className="mb-2">
                        <label className="block text-sm">{f}</label>
                        <input className="border p-2 w-full" value={inputs[f]}
                            onChange={e => handleChange(f, e.target.value)} />
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <button onClick={submit} disabled={loading} className="bg-blue-600 text
white px-4 py-2 rounded">{loading ? 'Predicting...' : 'Predict'}</button>
                <button onClick={compareAll} disabled={loading} className="bg-gray-200 
px-4 py-2 rounded">Compare Models</button>
            </div>
        </div>
    )
}