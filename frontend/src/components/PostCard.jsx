import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { formatUsername, getUserPath } from "../utils/formatters";
import CommentSection from "./CommentSection";
import DeleteConfirmModal from "./DeleteConfirmModal";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

function PostCard({ post, onLike, onSave, onDelete, currentUserId }) {
  const { user: currentUser } = useContext(AuthContext);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: post.title, content: post.content });
  const [showMenu, setShowMenu] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  // Safe ownership check with multiple fallbacks
  const isAuthor = currentUser && (
    localPost.author_id === currentUser.user_id ||
    localPost.author_id === currentUser.id ||
    localPost.author_id === currentUser._id ||
    localPost.author_id === String(currentUser._id) ||
    localPost.author_id === currentUserId
  );
  
  // Debug logging (remove after testing)
  console.log('PostCard Debug:', {
    postAuthorId: localPost.author_id,
    currentUserId: currentUserId,
    currentUserFromContext: currentUser?.user_id || currentUser?.id || currentUser?._id,
    isAuthor: isAuthor
  });
  const timeAgo = localPost.created_at ? new Date(localPost.created_at).toLocaleDateString() : "Just now";

  const handleEditClick = () => {
    setEditForm({ title: localPost.title, content: localPost.content });
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      await API.put(`/posts/${localPost.id}`, editForm);
      setLocalPost({ ...localPost, title: editForm.title, content: editForm.content });
      setShowEditModal(false);
    } catch (error) {
      console.error("Edit failed:", error);
      alert(error.response?.data?.detail || "Failed to edit post");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(post.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "16px",
        transition: "all 0.2s ease",
        cursor: "pointer",
        boxShadow: "var(--card-shadow)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--card-shadow)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "var(--grad-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            fontWeight: "700",
            color: "white",
          }}
        >
          {localPost.username?.[0]?.toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1 }}>
          <Link
            to={getUserPath(localPost.username)}
            style={{
              fontWeight: "600",
              fontSize: "0.9rem",
              textDecoration: "none",
              color: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "inherit";
            }}
          >
            {localPost.username ? formatUsername(localPost.username) : "Unknown"}
          </Link>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{timeAgo}</p>
        </div>
        {localPost.flagged && (
          <span
            style={{
              padding: "4px 10px",
              background: "rgba(244, 63, 94, 0.2)",
              color: "#f87171",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: "600",
            }}
          >
            ⚠ Flagged
          </span>
        )}
        {/* 3-dot menu for author */}
        {isAuthor && (
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: showMenu ? "var(--bg-hover)" : "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "1.2rem",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!showMenu) e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!showMenu) e.currentTarget.style.background = "transparent";
              }}
            >
              ⋮
            </button>
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "4px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow)",
                  padding: "8px",
                  minWidth: "150px",
                  zIndex: 10,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    handleDeleteClick();
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "transparent",
                    color: "#f87171",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(244, 63, 94, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <h3
        style={{
          fontSize: "1.3rem",
          fontWeight: "700",
          marginBottom: "12px",
          lineHeight: "1.4",
          color: "var(--text-main)",
        }}
      >
        {localPost.title}
      </h3>
      
      {/* Text Content */}
      {localPost.content_type === "text" && localPost.content && (
        <p
          style={{
            color: "var(--text-muted)",
            lineHeight: "1.6",
            marginBottom: "12px",
            fontSize: "0.95rem",
          }}
        >
          {localPost.content}
        </p>
      )}
      
      {/* Image Content */}
      {localPost.content_type === "image" && localPost.image_url && (
        <div style={{ marginBottom: "12px" }}>
          <img
            src={`http://localhost:8000${localPost.image_url}`}
            alt={localPost.title}
            style={{
              width: "100%",
              maxHeight: "500px",
              objectFit: "cover",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          />
        </div>
      )}
      
      {/* Video Content */}
      {localPost.content_type === "video" && localPost.video_url && (
        <div style={{ marginBottom: "12px" }}>
          <video
            src={`http://localhost:8000${localPost.video_url}`}
            controls
            style={{
              width: "100%",
              maxHeight: "500px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          />
        </div>
      )}
      
      {/* AI Metadata */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {localPost.topic && (
          <span style={{
            padding: "4px 10px",
            background: "rgba(124, 58, 237, 0.15)",
            color: "var(--primary)",
            borderRadius: "8px",
            fontSize: "0.75rem",
            fontWeight: "600"
          }}>
            {localPost.topic}
          </span>
        )}
        {localPost.redacted && (
          <span style={{
            padding: "4px 10px",
            background: "rgba(251, 191, 36, 0.15)",
            color: "#fbbf24",
            borderRadius: "8px",
            fontSize: "0.75rem",
            fontWeight: "600"
          }} title="Sensitive information removed by AI">
            🔒 Redacted
          </span>
        )}
        {localPost.safety_score !== undefined && localPost.safety_score < 80 && (
          <span style={{
            padding: "4px 10px",
            background: localPost.safety_score > 50 ? "rgba(251, 191, 36, 0.15)" : "rgba(244, 63, 94, 0.15)",
            color: localPost.safety_score > 50 ? "#fbbf24" : "#f87171",
            borderRadius: "8px",
            fontSize: "0.75rem",
            fontWeight: "600"
          }}>
            ⚠️ Safety: {localPost.safety_score}/100
          </span>
        )}
      </div>

      {/* Action Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike(post.id);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "10px",
            border: "none",
            background: post.liked_by_me
              ? "rgba(244, 63, 94, 0.15)"
              : "rgba(255, 255, 255, 0.05)",
            color: post.liked_by_me ? "#f87171" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "600",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = post.liked_by_me
              ? "rgba(244, 63, 94, 0.25)"
              : "rgba(255, 255, 255, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = post.liked_by_me
              ? "rgba(244, 63, 94, 0.15)"
              : "rgba(255, 255, 255, 0.05)";
          }}
        >
          <span>{post.liked_by_me ? "❤️" : "🤍"}</span>
          <span>{post.likes_count}</span>
        </button>

        {/* Comments Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(!showComments);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "10px",
            border: "none",
            background: showComments ? "rgba(124, 58, 237, 0.15)" : "rgba(255, 255, 255, 0.05)",
            color: showComments ? "var(--primary)" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "600",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!showComments) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            }
          }}
          onMouseLeave={(e) => {
            if (!showComments) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }
          }}
        >
          <span>💬</span>
          <span>{commentCount}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave(post.id);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "10px",
            border: "none",
            background: post.saved_by_me
              ? "rgba(45, 212, 191, 0.15)"
              : "rgba(255, 255, 255, 0.05)",
            color: post.saved_by_me ? "var(--secondary)" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "600",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = post.saved_by_me
              ? "rgba(45, 212, 191, 0.25)"
              : "rgba(255, 255, 255, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = post.saved_by_me
              ? "rgba(45, 212, 191, 0.15)"
              : "rgba(255, 255, 255, 0.05)";
          }}
        >
          <span>{post.saved_by_me ? "🔖" : "📌"}</span>
          <span>{post.saved_by_me ? "Unsave" : "Save"}</span>
        </button>
      </div>
      
      {/* Comment Section */}
      {showComments && (
        <CommentSection 
          postId={post.id} 
          onCommentAdded={() => setCommentCount(prev => prev + 1)}
        />
      )}
      
      {/* Edit Modal */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="glass-card"
            style={{ maxWidth: "600px", width: "100%", padding: "30px", borderRadius: "20px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Edit Post</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Title"
                style={{ marginBottom: "16px" }}
                required
              />
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Content"
                rows="6"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "var(--input-bg)",
                  color: "var(--input-text)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  marginBottom: "20px",
                }}
                required
              />
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-outline"
                  style={{ flex: 1 }}
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isEditing}>
                  {isEditing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </article>
  );
}

export default PostCard;
