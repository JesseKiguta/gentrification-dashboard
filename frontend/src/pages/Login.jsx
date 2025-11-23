import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/client";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Send credentials to backend
      const res = await API.post("/login", { username, password });

      // Log response for debugging
      console.log("Login response:", res.data);

      // Handle both token key styles
      const token = res.data?.token || res.data?.access_token;

      if (token) {
        localStorage.setItem("token", token);
        navigate("/"); // or navigate("/dashboard") depending on your route
      } else {
        setError("Invalid credentials — no token returned from server.");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(
        err.response?.data?.detail ||
          "Login failed. Check credentials or server connection."
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <label className="block mb-2 text-gray-700">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring focus:border-blue-400"
          required
        />

        <label className="block mb-2 text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-6 border rounded-lg focus:outline-none focus:ring focus:border-blue-400"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
