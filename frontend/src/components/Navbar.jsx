import { useState, useEffect, useRef } from "react";
import { Bell, X, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "./NotificationContext";

export default function Navbar() {
  const [username, setUsername] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { notifications, removeNotification } = useNotifications();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("User"));
    if (user && user.username) setUsername(user.username);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-coral dark:bg-blue-800 border-b shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-end items-center">
        <div className="flex items-center gap-5 relative">
          <span className="text-gray-700 dark:text-gray-300 text-sm">
            Welcome, <span className="font-medium">{username || "planner"}</span>
          </span>

          <Link
            to="/help"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1 text-gray-700 dark:text-gray-300 text-sm"
            title="Help / Documentation"
          >
            <HelpCircle className="w-5 h-5" />
            Help
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition relative"
              title="Notifications"
            >
              <Bell className="text-gray-600 dark:text-gray-300 w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
                  {notifications.length}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-700">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    Notifications
                  </span>
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>
                {notifications.length > 0 ? (
                  <ul className="max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center cursor-pointer"
                      >
                        <span>{n.message}</span>
                        <button
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                          onClick={() => removeNotification(n.id)}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No new notifications
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


