import { Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Map, BarChart3, Layers, LogOut, BookOpenText } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Predictions", path: "/predict", icon: <BarChart3 size={20} /> },
    { name: "Compare Models", path: "/compare", icon: <Layers size={20} /> },
    { name: "Map View", path: "/map", icon: <Map size={20} /> },
    { name: "Generate Report", path: "/report", icon: <BookOpenText size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="w-64 min-h-screen bg-gray-900 text-gray-100 flex flex-col p-4">
      <h1 className="text-xl font-bold mb-8 text-center">Navigation</h1>

      <nav className="flex flex-col gap-2 flex-grow">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive ? "bg-gray-700 text-white" : "hover:bg-gray-800"
              }`}
            >
              {item.icon} <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 mt-auto bg-red-600 hover:bg-red-700 rounded-lg transition"
      >
        <LogOut size={20} /> <span>Logout</span>
      </button>
    </div>
  );
}

