import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import PostCard from "../components/PostCard";
import { AuthContext } from "../context/AuthContext";
import { formatCommunity } from "../utils/formatters";
import { formatJoinDate, formatRelativeTime } from "../utils/dateUtils";

function CommunityPage() {
  const { communityId, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("new");
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCommunity = async () => {
    try {
      let res;
      if (slug) {
        res = await API.get(`/communities/slug/${slug}`);
      } else {
        res = await API.get(`/communities/${communityId}`);
      }
      setCommunity(res.data);
      setError(null);
    } catch (error) {
      if (error.response?.status === 403) {
        setError("mature");
      } else {
        console.error("Error fetching community:", error);
      }
    }
  };

  const fetchPosts = async (sort = "new") => {
    if (!community) return;
    try {
      setLoading(true);
      const res = await API.get(`/communities/${community.id}/posts?sort=${sort}`);
      setPosts(res.data.results);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [communityId, slug]);

  useEffect(() => {
    if (community) {
      fetchPosts(sortBy);
    }
  }, [community, sortBy]);

  const handleJoin = async () => {
    try {
      await API.post(`/communities/${community.id}/join`);
      setCommunity(prev => ({
        ...prev,
        is_member: !prev.is_member,
        members_count: prev.is_member ? prev.members_count - 1 : prev.members_count + 1
      }));
      showToast(community.is_member ? "Left community" : "Joined community");
    } catch (error) {
      if (error.response?.status === 400) {
        showToast(error.response.data.detail, "error");
      } else {
        console.error("Error joining community:", error);
      }
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
                likes_count: post.liked_by_me ? post.likes_count - 1 : post.likes_count + 1,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Like failed:", error);
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

  if (error === "mature") {
    return (
      <div style={{ maxWidth: "600px", margin: "100px auto", textAlign: "center", padding: "40px" }}>
        <div className="glass-card" style={{ padding: "60px 40px", borderRadius: "24px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🔞</div>
          <h2 style={{ fontSize: "2rem", marginBottom: "10px" }}>Mature Content</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "30px", fontSize: "1.1rem" }}>
            This community contains mature content (18+). Enable mature content in settings to access.
          </p>
          <a href="/settings" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  if (!community) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
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

      {/* Community Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(45, 212, 191, 0.1))",
          borderRadius: "20px",
          padding: "40px",
          marginBottom: "30px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "var(--bg-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              border: "4px solid var(--bg-darker)",
            }}
          >
            {community.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "2.5rem" }}>{formatCommunity(community.slug)}</h1>
              {community.mature && (
                <span
                  style={{
                    padding: "4px 12px",
                    background: "rgba(244, 63, 94, 0.2)",
                    color: "#f87171",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                  }}
                >
                  18+
                </span>
              )}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>{community.description}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "30px", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: "1.5rem", fontWeight: "700" }}>{community.members_count}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Members</p>
          </div>
          <div>
            <p style={{ fontSize: "1.5rem", fontWeight: "700" }}>{community.posts_count}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Posts</p>
          </div>
          {community.created_at && (
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <div>📅 Created {formatJoinDate(community.created_at)}</div>
              <div style={{ marginTop: "4px" }}>Active for {formatRelativeTime(community.created_at)}</div>
            </div>
          )}
          <button
            onClick={handleJoin}
            className={community.is_member ? "btn-outline" : "btn-primary"}
            style={{ 
              marginLeft: "auto", 
              padding: "12px 30px",
              opacity: community.is_creator && community.is_member ? 0.6 : 1,
              cursor: community.is_creator && community.is_member ? "not-allowed" : "pointer"
            }}
            disabled={community.is_creator && community.is_member}
            title={community.is_creator && community.is_member ? "Creator cannot leave" : ""}
          >
            {community.is_member ? (community.is_creator ? "Creator" : "Leave") : "Join Community"}
          </button>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>
        {/* Posts Section */}
        <div>
          {/* Create Post Box */}
          {user && (
            <div
              onClick={() => navigate(`/posts?community=${community.slug}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                marginBottom: "20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-card)";
              }}
            >
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
                  flexShrink: 0,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                Create a post in {formatCommunity(community.slug)}
              </span>
            </div>
          )}

          {!user && (
            <div
              style={{
                padding: "20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                Sign in to join or post in this community
              </p>
            </div>
          )}

          {/* Sort Bar */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "24px",
              padding: "12px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {["new", "top", "comments"].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: sortBy === sort ? "rgba(124, 58, 237, 0.2)" : "transparent",
                  color: sortBy === sort ? "var(--primary)" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
              >
                {sort === "new" && "🆕 New"}
                {sort === "top" && "🔥 Top"}
                {sort === "comments" && "💬 Most Commented"}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <div
                style={{
                  display: "inline-block",
                  width: "20px",
                  height: "20px",
                  border: "3px solid rgba(124, 58, 237, 0.3)",
                  borderTop: "3px solid var(--primary)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ marginTop: "12px" }}>Loading posts...</p>
            </div>
          )}

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
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "16px" }}>📝</span>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>No posts yet</h3>
              <p style={{ color: "var(--text-muted)" }}>Be the first to post in this community!</p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onDelete={handleDelete}
              currentUserId={user?.user_id}
            />
          ))}
        </div>

        {/* Rules Sidebar */}
        <div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "24px",
              position: "sticky",
              top: "20px",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", fontWeight: "700" }}>
              📜 Community Rules
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {community.rules?.map((rule) => (
                <div key={rule.id}>
                  <p style={{ fontWeight: "600", fontSize: "0.95rem", marginBottom: "6px" }}>
                    {rule.id}. {rule.title}
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunityPage;
