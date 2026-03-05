import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await API.post("/auth/forgot-password", { email: email.toLowerCase() });
      setCanResend(false);
      setCountdown(60);
      navigate("/reset-password", { state: { email: email.toLowerCase() } });
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a0b2e 0%, #0a0a0c 100%)",
        padding: "20px",
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "48px 40px",
          borderRadius: "24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
            Forgot <span className="text-gradient">Password?</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Enter your email to receive a 6-digit OTP
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(244, 63, 94, 0.1)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                borderRadius: "12px",
                color: "#f87171",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: "600",
                marginBottom: "8px",
                color: "var(--text-muted)",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "white",
                fontSize: "1rem",
                marginBottom: 0,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !canResend}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "1rem",
              fontWeight: "700",
              opacity: (loading || !canResend) ? 0.7 : 1,
              cursor: (loading || !canResend) ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : !canResend ? `Resend in ${countdown}s` : "Send OTP"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link
            to="/login"
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
