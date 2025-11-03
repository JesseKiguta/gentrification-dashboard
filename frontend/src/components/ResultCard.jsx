export default function ResultCard({ prediction }) {
    if (prediction === null) return null
    const pct = (prediction * 100).toFixed(2)
    return (
        <div className="bg-white p-4 rounded shadow mb-4">
            <h4 className="font-bold">Prediction Result</h4>
            <div className="text-3xl mt-2">{pct}%</div>
            <div className="mt-2 text-sm text-gray-600">Higher values indicate higher
                risk of gentrification.</div>
        </div>
    )
}