import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/client'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const nav = useNavigate()
    const submit = async (e) => {
        e.preventDefault()
        try {
            const res = await API.post('/login', { username, password })
            localStorage.setItem('token', res.data.access_token)
            nav('/dashboard')
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Invalid credentials');
            } else if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.message === 'Network Error') {
                setError('Network error. Please check your connection.');
            } else {
                setError('An unexpected error occurred.');
            }
        }
    }
    return (
        <div className="min-h-screen flex items-center justify-center">
            <form onSubmit={submit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                {error && <div className="text-red-500 mb-2">{error}</div>}
                <label className="block">Username</label>
                <input className="border w-full p-2 mb-4" value={username}
                    onChange={e => setUsername(e.target.value)} />
                <label className="block">Password</label>
                <input type="password" className="border w-full p-2 mb-4"
                    value={password} onChange={e => setPassword(e.target.value)} />
                <button className="bg-blue-600 text-white py-2 px-4 rounded w-full"
                    type="submit">Login</button>
            </form>
        </div>

    )
}