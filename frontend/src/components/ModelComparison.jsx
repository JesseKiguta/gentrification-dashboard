import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from
    'recharts'

export default function ModelComparison({ compare }) {
    if (!compare) return null
    const data = Object.keys(compare).map(k => ({
        name: k, value: compare[k] ||
            0
    }))
    return (
        <div className="bg-white p-4 rounded shadow mb-4">
            <h4 className="font-bold mb-2">Model Comparison</h4>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip />
                    <Bar dataKey="value" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}