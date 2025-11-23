import { createContext, useState, useContext, useEffect } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message) => {
    const id = Date.now(); // unique ID
    setNotifications((prev) => [{ id, message }, ...prev]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Optional: auto-remove oldest notification after 10s
  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => {
      removeNotification(notifications[notifications.length - 1].id);
    }, 10000);
    return () => clearTimeout(timer);
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
