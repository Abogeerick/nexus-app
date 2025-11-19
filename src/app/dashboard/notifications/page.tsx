"use client";

import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bell, Check, Info, AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export default function NotificationsPage() {
  const { data: session } = useSession();
  
  // Mock notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Welcome to Nexus Finance!",
      message: "Get started by connecting your M-PESA statements.",
      type: "info",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      title: "Market Update",
      message: "Safaricom (SCOM) is up 2.5% today.",
      type: "success",
      time: "5 hours ago",
      read: false,
    },
    {
      id: 3,
      title: "Setup Required",
      message: "Please complete your investment profile to unlock more features.",
      type: "warning",
      time: "1 day ago",
      read: true,
    },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <Check className="w-5 h-5 text-green-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <DashboardLayout user={session?.user}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Stay updated with your portfolio</p>
            </div>
            <button 
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    relative group p-4 rounded-xl border transition-all
                    ${notification.read 
                      ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800" 
                      : "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800"
                    }
                  `}
                >
                  <div className="flex gap-4">
                    <div className={`mt-1 p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-semibold ${notification.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500">{notification.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="absolute bottom-4 right-4 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

