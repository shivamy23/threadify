import { createContext, useEffect, useRef } from "react";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = new WebSocket(`ws://localhost:8000/ws?token=${token}`);
    socketRef.current = socket;

    socket.onmessage = () => {
      console.log("New notification");
    };

    socket.onerror = () => {
      console.error("WebSocket error");
    };

    socket.onclose = (event) => {
      if (event.code === 1008) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    };

    return () => socket.close();
  }, []);

  return children;
};
