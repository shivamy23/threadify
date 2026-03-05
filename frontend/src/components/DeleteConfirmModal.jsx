import { useEffect } from "react";

function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-dark)",
          border: "1px solid var(--glass-border)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "450px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          animation: "fadeIn 0.2s ease"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "rgba(244, 63, 94, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: "2rem"
        }}>
          🗑️
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          textAlign: "center",
          marginBottom: "12px",
          color: "var(--text-main)"
        }}>
          Delete Post?
        </h2>

        {/* Message */}
        <p style={{
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: "32px",
          lineHeight: "1.6"
        }}>
          Are you sure you want to delete this post? This action cannot be undone and all comments will be permanently removed.
        </p>

        {/* Actions */}
        <div style={{
          display: "flex",
          gap: "12px"
        }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--text-main)",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.5 : 1,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: isDeleting ? "rgba(244, 63, 94, 0.5)" : "#f43f5e",
              color: "white",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: isDeleting ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = "#dc2626";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = "#f43f5e";
              }
            }}
          >
            {isDeleting ? (
              <>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                <span>Deleting...</span>
              </>
            ) : (
              "Delete Post"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
