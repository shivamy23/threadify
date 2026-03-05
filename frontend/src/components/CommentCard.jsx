import { Link } from "react-router-dom";

function CommentCard({ comment }) {
  const formatUsername = (username) => {
    return username?.startsWith('@') ? username : `@${username}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <article
      className="glass-card"
      style={{
        padding: "20px",
        borderRadius: "16px",
        marginBottom: "16px",
        transition: "all 0.2s ease",
      }}
    >
      {/* Comment Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--grad-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.9rem",
            fontWeight: "700",
            color: "white",
          }}
        >
          {comment.username?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <Link
            to={`/u/${comment.username}`}
            style={{
              fontWeight: "600",
              fontSize: "0.9rem",
              textDecoration: "none",
              color: "var(--text-primary)",
            }}
          >
            {formatUsername(comment.username)}
          </Link>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {comment.post_title && (
              <>
                Commented on:{" "}
                <Link
                  to={`/posts/${comment.post_id}`}
                  style={{
                    color: "var(--primary)",
                    textDecoration: "none",
                    fontWeight: "600",
                  }}
                >
                  {comment.post_title}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Comment Content */}
      <p
        style={{
          color: "var(--text-primary)",
          lineHeight: "1.6",
          marginBottom: "12px",
          fontSize: "0.95rem",
          paddingLeft: "44px",
        }}
      >
        {comment.content}
      </p>

      {/* Timestamp */}
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", paddingLeft: "44px" }}>
        {formatDate(comment.created_at)}
      </p>
    </article>
  );
}

export default CommentCard;
