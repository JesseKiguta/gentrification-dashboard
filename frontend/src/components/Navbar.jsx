import { Link } from 'react-router-dom'
export default function Navbar() {
    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between">
                <div className="font-bold">Gentrification Dashboard</div>
                <div className="flex gap-4">
                    <Link to="/dashboard" className="text-blue-600">Dashboard</Link>
                </div>
            </div>
        </nav>
    )
}