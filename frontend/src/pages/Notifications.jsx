import { useEffect, useState } from "react";
import API from "../api/axios";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/read/${id}`);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: "25px" }}>Notifications</h2>

      {loading && <p>Loading...</p>}

      {notifications.length === 0 && !loading && (
        <p>No notifications yet.</p>
      )}

      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="glass"
          style={{
            padding: "20px",
            marginBottom: "15px",
            opacity: notif.read ? 0.6 : 1,
          }}
        >
          <p>
            {notif.type === "like" && (
              <>
                <strong>@{notif.source_username}</strong> liked your post
              </>
            )}

            {notif.type === "follow" && (
              <>
                <strong>@{notif.source_username}</strong> followed you
              </>
            )}
          </p>

          {!notif.read && (
            <button
              onClick={() => markAsRead(notif.id)}
              style={{
                marginTop: "10px",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Mark as read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default Notifications;
