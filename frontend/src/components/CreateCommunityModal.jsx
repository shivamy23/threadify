import { useState } from "react";
import API from "../api/axios";

function CreateCommunityModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    topic: "",
    type: "public",
    mature: false,
    name: "",
    description: "",
    icon: "🏠",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topics = [
    "🎓 Education",
    "💻 Technology",
    "⚽ Sports",
    "🎮 Gaming",
    "🎨 Art & Design",
    "🎵 Music",
    "📚 Books",
    "🍔 Food & Cooking",
    "✈️ Travel",
    "💼 Business",
    "🔬 Science",
    "🎬 Entertainment",
  ];

  const handleNext = () => {
    if (step === 1 && !formData.topic) {
      setError("Please select a topic");
      return;
    }
    if (step === 3 && (!formData.name || !formData.description)) {
      setError("Please fill all fields");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/communities", formData);
      setStep(4);
      if (onSuccess) onSuccess(res.data);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      topic: "",
      type: "public",
      mature: false,
      name: "",
      description: "",
      icon: "🏠",
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={handleClose}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "600px",
          padding: "40px",
          borderRadius: "24px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: "4px",
                  background:
                    s <= step
                      ? "var(--grad-primary)"
                      : "rgba(255, 255, 255, 0.1)",
                  marginRight: s < 4 ? "8px" : 0,
                  borderRadius: "2px",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Step {step} of 4
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "12px",
              color: "#f87171",
              fontSize: "0.9rem",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* STEP 1: Select Topic */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "10px" }}>
              Choose a <span className="text-gradient">Topic</span>
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                marginBottom: "30px",
                fontSize: "0.95rem",
              }}
            >
              What is your community about?
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
              }}
            >
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setFormData({ ...formData, topic })}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border:
                      formData.topic === topic
                        ? "2px solid var(--primary)"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                    background:
                      formData.topic === topic
                        ? "rgba(124, 58, 237, 0.15)"
                        : "rgba(255, 255, 255, 0.03)",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                    textAlign: "left",
                  }}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Community Type */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "10px" }}>
              Community <span className="text-gradient">Type</span>
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                marginBottom: "30px",
                fontSize: "0.95rem",
              }}
            >
              Who can view and post?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                {
                  value: "public",
                  label: "🌐 Public",
                  desc: "Anyone can view and post",
                },
                {
                  value: "restricted",
                  label: "🔒 Restricted",
                  desc: "Anyone can view, approved users can post",
                },
                {
                  value: "private",
                  label: "🔐 Private",
                  desc: "Only approved users can view and post",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, type: option.value })}
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    border:
                      formData.type === option.value
                        ? "2px solid var(--primary)"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                    background:
                      formData.type === option.value
                        ? "rgba(124, 58, 237, 0.15)"
                        : "rgba(255, 255, 255, 0.03)",
                    color: "white",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "4px" }}>
                    {option.label}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>

            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontWeight: "600", marginBottom: "4px" }}>🔞 Mature Content</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  18+ community
                </p>
              </div>
              <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input
                  type="checkbox"
                  checked={formData.mature}
                  onChange={(e) =>
                    setFormData({ ...formData, mature: e.target.checked })
                  }
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: formData.mature ? "var(--primary)" : "rgba(255, 255, 255, 0.1)",
                    borderRadius: "26px",
                    transition: "0.3s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: "",
                      height: "20px",
                      width: "20px",
                      left: formData.mature ? "27px" : "3px",
                      bottom: "3px",
                      background: "white",
                      borderRadius: "50%",
                      transition: "0.3s",
                    }}
                  />
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: Community Details */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "10px" }}>
              Community <span className="text-gradient">Details</span>
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                marginBottom: "30px",
                fontSize: "0.95rem",
              }}
            >
              Give your community a name and description
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                  Community Name
                </label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. AI Enthusiasts"
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
                {formData.name && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      marginTop: "6px",
                    }}
                  >
                    URL: t/{formData.name.toLowerCase().replace(/\s+/g, "-")}
                  </p>
                )}
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
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What is this community about?"
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "1rem",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "4rem",
                marginBottom: "20px",
              }}
            >
              🎉
            </div>
            <h2 style={{ fontSize: "2rem", marginBottom: "10px" }}>
              Community <span className="text-gradient">Created!</span>
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                marginBottom: "30px",
                fontSize: "1rem",
              }}
            >
              Your community <strong>{formData.name}</strong> is now live!
            </p>

            <div
              style={{
                padding: "20px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "16px",
                marginBottom: "30px",
                textAlign: "left",
              }}
            >
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                ✅ Default rules added
              </p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                ✅ You're the first member
              </p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                ✅ Community is now discoverable
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleClose} className="btn-outline" style={{ flex: 1 }}>
                Close
              </button>
              <button
                onClick={() => {
                  handleClose();
                  window.location.href = "/communities";
                }}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                View Communities
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
            {step > 1 && (
              <button onClick={handleBack} className="btn-outline" style={{ flex: 1 }}>
                Back
              </button>
            )}
            {step < 3 && (
              <button onClick={handleNext} className="btn-primary" style={{ flex: 1 }}>
                Next
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Creating..." : "Create Community"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateCommunityModal;
