import { useState, useEffect, useContext, useRef } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

function Messages() {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    connectWebSocket();
    
    return () => {
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    const token = localStorage.getItem("token");
    const websocket = new WebSocket(`ws://localhost:8000/messages/ws?token=${token}`);
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        if (activeConversation && data.conversation_id === activeConversation.id) {
          setMessages(prev => [...prev, data]);
        }
        fetchConversations();
      }
    };
    
    setWs(websocket);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const res = await API.get("/messages/conversations");
      setConversations(res.data.conversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const startChat = async (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    
    setLoading(true);
    try {
      const res = await API.post("/messages/start", { username: searchUsername });
      await fetchConversations();
      const conv = {
        id: res.data.conversation_id,
        username: res.data.username,
        user_id: res.data.user_id
      };
      setActiveConversation(conv);
      loadMessages(conv.id);
      setSearchUsername("");
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const res = await API.get(`/messages/${conversationId}`);
      setMessages(res.data.messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    loadMessages(conv.id);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    
    const content = newMessage.trim();
    setNewMessage("");
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "message",
        conversation_id: activeConversation.id,
        content: content
      }));
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 140px)", gap: "20px" }}>
      {/* Left Sidebar */}
      <div style={{
        width: "320px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Search */}
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>
            <span className="text-gradient">Messages</span>
          </h2>
          <form onSubmit={startChat}>
            <input
              type="text"
              placeholder="u/username"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                caretColor: "var(--text-primary)"
              }}
            />
          </form>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv)}
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                cursor: "pointer",
                background: activeConversation?.id === conv.id ? "rgba(124, 58, 237, 0.1)" : "transparent",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (activeConversation?.id !== conv.id) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeConversation?.id !== conv.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>u/{conv.username}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {formatTime(conv.updated_at)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1
                }}>
                  {conv.last_message || "Start a conversation"}
                </p>
                {conv.unread_count > 0 && (
                  <span style={{
                    background: "var(--primary)",
                    color: "white",
                    borderRadius: "10px",
                    padding: "2px 8px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    marginLeft: "8px"
                  }}>
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
              <p>No conversations yet</p>
              <p style={{ fontSize: "0.85rem", marginTop: "8px" }}>Search for a user to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Window */}
      <div style={{
        flex: 1,
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: "20px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "var(--grad-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                fontWeight: "700"
              }}>
                {activeConversation.username[0].toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>u/{activeConversation.username}</h3>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user?.user_id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isOwn ? "flex-end" : "flex-start"
                    }}
                  >
                    <div style={{
                      maxWidth: "70%",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      background: isOwn ? "var(--grad-primary)" : "rgba(255, 255, 255, 0.08)",
                      wordBreak: "break-word"
                    }}>
                      <p style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>{msg.content}</p>
                      <p style={{
                        fontSize: "0.7rem",
                        color: isOwn ? "rgba(255, 255, 255, 0.7)" : "var(--text-muted)",
                        marginTop: "4px"
                      }}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{
              padding: "20px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              gap: "12px"
            }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  caretColor: "var(--text-primary)"
                }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="btn-primary"
                style={{
                  padding: "12px 24px",
                  opacity: !newMessage.trim() ? 0.5 : 1,
                  cursor: !newMessage.trim() ? "not-allowed" : "pointer"
                }}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "16px",
            color: "var(--text-muted)"
          }}>
            <span style={{ fontSize: "4rem" }}>💬</span>
            <h3 style={{ fontSize: "1.3rem" }}>Select a conversation</h3>
            <p style={{ fontSize: "0.9rem" }}>Choose a chat from the left or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
