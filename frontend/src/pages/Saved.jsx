import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import PostCard from "../components/PostCard";
import { AuthContext } from "../context/AuthContext";

function Saved() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/users/me/saved");
      setPosts(res.data.posts || []);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      showToast("Failed to load saved posts", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await API.post(`/posts/like/${postId}`);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked_by_me: !post.liked_by_me,
                likes_count: post.liked_by_me
                  ? post.likes_count - 1
                  : post.likes_count + 1,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  const handleSave = async (postId) => {
    try {
      const response = await API.post(`/posts/${postId}/save`);
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
      showToast("Post removed from saved");
    } catch (error) {
      console.error("Unsave failed:", error);
      showToast("Failed to unsave post", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/posts/${id}`);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      showToast("Post deleted");
    } catch (error) {
      console.error(error);
      showToast("Delete failed", "error");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "15px 20px",
            background: toast.type === "error" ? "#f43f5e" : "#7c3aed",
            color: "white",
            borderRadius: "12px",
            zIndex: 1000,
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>
          <span className="text-gradient">Saved</span> Posts
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Posts you've saved for later
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: "40px",
              height: "40px",
              border: "4px solid rgba(124, 58, 237, 0.3)",
              borderTop: "4px solid var(--primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <span style={{ fontSize: "3rem", display: "block", marginBottom: "16px" }}>🔖</span>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>No saved posts yet</h3>
          <p style={{ color: "var(--text-muted)" }}>
            Save posts to read them later
          </p>
        </div>
      )}

      {/* Posts */}
      {!loading && posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onSave={handleSave}
          onDelete={handleDelete}
          currentUserId={user?.user_id}
        />
      ))}
    </div>
  );
}

export default Saved;
