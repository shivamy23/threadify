import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [form, setForm] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiryTime, setExpiryTime] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (expiryTime > 0) {
      const timer = setTimeout(() => setExpiryTime(expiryTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [expiryTime]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendCooldown === 0) {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = async () => {
    try {
      await API.post("/auth/forgot-password", { email });
      setCanResend(false);
      setResendCooldown(60);
      setExpiryTime(600);
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to resend OTP");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (!/[a-zA-Z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      setError("Password must contain at least one letter and one number");
      setLoading(false);
      return;
    }

    try {
      await API.post("/auth/reset-password", {
        email,
        code: form.otp,
        new_password: form.newPassword,
      });
      navigate("/login", { state: { message: "Password reset successful! Please login." } });
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to reset password");
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
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔑</div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
            Reset <span className="text-gradient">Password</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Enter the OTP sent to your email
          </p>
          <div style={{ 
            marginTop: "12px", 
            padding: "8px 16px", 
            background: expiryTime < 60 ? "rgba(244, 63, 94, 0.1)" : "rgba(124, 58, 237, 0.1)",
            borderRadius: "8px",
            fontSize: "0.9rem",
            color: expiryTime < 60 ? "#f87171" : "var(--primary)"
          }}>
            ⏱️ Expires in: {formatTime(expiryTime)}
          </div>
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
              6-Digit OTP
            </label>
            <input
              type="text"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
              placeholder="Enter OTP"
              maxLength={6}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "white",
                fontSize: "1.2rem",
                textAlign: "center",
                letterSpacing: "0.5em",
                marginBottom: 0,
              }}
            />
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Resend OTP
                </button>
              ) : (
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Resend in {resendCooldown}s
                </span>
              )}
            </div>
          </div>

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
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Enter new password"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  paddingRight: "48px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "1rem",
                  marginBottom: 0,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  padding: "4px",
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

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
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
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
            disabled={loading || expiryTime === 0}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "1rem",
              fontWeight: "700",
              opacity: (loading || expiryTime === 0) ? 0.7 : 1,
              cursor: (loading || expiryTime === 0) ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Resetting..." : expiryTime === 0 ? "OTP Expired" : "Reset Password"}
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

export default ResetPassword;
