import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import GlobalSearch from "./GlobalSearch";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Explore", path: "/posts", icon: "🌐" },
    { name: "Communities", path: "/communities", icon: "👥" },
    { name: "Messages", path: "/messages", icon: "💬" },
    { name: "Notifications", path: "/notifications", icon: "🔔" },
    { name: "Saved", path: "/saved", icon: "🔖" },
  ];

  // Add admin link if user is admin
  if (user?.role === "admin") {
    navItems.push({ name: "Admin", path: "/admin", icon: "🛡️" });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      
      {/* Clean Sidebar */}
      <aside style={{
        width: "280px",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        zIndex: 10
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", marginBottom: "40px", paddingLeft: "10px", display: "block" }}>
          <h2 style={{ 
            fontSize: "1.5rem", 
            fontWeight: "600",
            letterSpacing: "-0.01em",
            cursor: "pointer",
            color: "var(--text-primary)"
          }}>
            Threadify
          </h2>
        </Link>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                color: isActive(item.path) ? "white" : "var(--text-secondary)",
                background: isActive(item.path) ? "var(--accent)" : "transparent",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Page Content */}
      <div style={{ marginLeft: "280px", flex: 1, minHeight: "100vh" }}>
        {/* Top Bar */}
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px"
        }}>
          {/* Global Search */}
          <GlobalSearch />
          {/* Avatar Dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--glass-border)",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }}
            >
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--grad-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                fontWeight: "700"
              }}>
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-main)" }}>
                {user?.username || "User"}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "220px",
                background: "var(--bg-dark)",
                border: "1px solid var(--glass-border)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                padding: "8px",
                animation: "fadeIn 0.2s ease",
                zIndex: 100
              }}>
                <Link
                  to={`/u/${user?.username}`}
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>👤</span>
                  <span>View Profile</span>
                </Link>

                <Link
                  to="/saved"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>🔖</span>
                  <span>Saved</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </Link>

                <div style={{ height: "1px", background: "var(--glass-border)", margin: "8px 0" }} />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "transparent",
                    color: "#f87171",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(244, 63, 94, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>🚪</span>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div style={{ padding: "40px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
