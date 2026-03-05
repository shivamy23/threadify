import { useEffect, useState, useContext } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { formatUsername, formatCommunity, getCommunityPath } from "../utils/formatters";
import { formatJoinDate, formatRelativeTime } from "../utils/dateUtils";
import PostCard from "../components/PostCard";

function RedditProfile() {
  const { username } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/users/u/${username}`);
      setProfile(res.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchTabData = async (tab) => {
    try {
      setLoading(true);
      let endpoint = `/users/u/${username}`;
      
      switch (tab) {
        case "posts":
          endpoint += "/posts";
          break;
        case "comments":
          endpoint += "/comments";
          break;
        case "saved":
          endpoint += "/saved";
          break;
        case "upvoted":
          endpoint += "/upvoted";
          break;
        default:
          endpoint += "/posts";
      }
      
      const res = await API.get(endpoint);
      setPosts(res.data.results);
    } catch (error) {
      console.error("Error fetching tab data:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    const tab = searchParams.get("tab") || "overview";
    setActiveTab(tab);
    if (tab !== "overview") {
      fetchTabData(tab);
    } else {
      fetchTabData("posts");
    }
  }, [searchParams, username]);

  const handleTabClick = (tab) => {
    setSearchParams({ tab });
  };

  const handleFollow = async () => {
    try {
      const res = await API.post(`/users/u/${username}/follow`);
      setProfile({ ...profile, is_following: res.data.is_following });
      fetchProfile();
      showToast(res.data.message);
    } catch (error) {
      showToast(error.response?.data?.detail || "Action failed", "error");
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
      showToast("Delete failed", "error");
    }
  };

  if (!profile) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;

  const isOwnProfile = profile.is_own_profile;
  const tabs = [
    { key: "overview", label: "Overview", visible: true },
    { key: "posts", label: "Posts", visible: true },
    { key: "comments", label: "Comments", visible: true },
    { key: "saved", label: "Saved", visible: isOwnProfile },
    { key: "upvoted", label: "Upvoted", visible: isOwnProfile },
  ].filter(tab => tab.visible);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "15px 20px",
            background: toast.type === "error" ? "var(--accent)" : "var(--primary)",
            color: "white",
            borderRadius: "12px",
            zIndex: 1000,
            boxShadow: "var(--card-shadow)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Banner */}
      <div
        style={{
          height: "200px",
          background: profile.banner || "var(--grad-primary)",
          borderRadius: "20px",
          marginBottom: "20px",
        }}
      />

      {/* Profile Header */}
      <div
        className="glass-card"
        style={{
          padding: "30px",
          borderRadius: "20px",
          marginBottom: "30px",
          position: "relative",
          marginTop: "-80px",
        }}
      >
        <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
          {/* Avatar */}
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: profile.avatar
                ? `url(${profile.avatar})`
                : "var(--grad-primary)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "6px solid var(--bg-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
              fontWeight: "700",
              flexShrink: 0,
              color: "white",
            }}
          >
            {!profile.avatar && profile.username[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "8px", color: "var(--text-main)" }}>
              {profile.display_name}
            </h1>
            <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              {formatUsername(profile.username)}
            </p>
            {profile.bio && (
              <p style={{ color: "var(--text-muted)", marginBottom: "20px", lineHeight: "1.6" }}>
                {profile.bio}
              </p>
            )}

            <div style={{ display: "flex", gap: "30px", fontSize: "0.95rem", marginBottom: "16px" }}>
              <div>
                <span style={{ fontWeight: "700", fontSize: "1.2rem", color: "var(--text-main)" }}>
                  {profile.followers_count}
                </span>
                <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>Followers</span>
              </div>
              <div>
                <span style={{ fontWeight: "700", fontSize: "1.2rem", color: "var(--text-main)" }}>
                  {profile.following_count}
                </span>
                <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>Following</span>
              </div>
              <div>
                <span style={{ fontWeight: "700", fontSize: "1.2rem", color: "var(--text-main)" }}>
                  {profile.posts_count}
                </span>
                <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>Posts</span>
              </div>
            </div>

            {/* Join Date */}
            {profile.created_at && (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <span>📅 Joined {formatJoinDate(profile.created_at)}</span>
                <span style={{ marginLeft: "12px" }}>• Member for {formatRelativeTime(profile.created_at)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px" }}>
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                className={profile.is_following ? "btn-outline" : "btn-primary"}
                style={{ padding: "10px 24px" }}
              >
                {profile.is_following ? "Unfollow" : "Follow"}
              </button>
            )}
            {isOwnProfile && (
              <Link to="/settings" className="btn-primary" style={{ padding: "10px 24px", textDecoration: "none" }}>
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          padding: "8px",
          background: "var(--glass-bg)",
          borderRadius: "12px",
          border: "1px solid var(--glass-border)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === tab.key ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === tab.key ? "var(--primary)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
              textTransform: "capitalize",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
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
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div
            className="glass-card"
            style={{
              textAlign: "center",
              padding: "60px 20px",
              borderRadius: "16px",
            }}
          >
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "16px" }}>
              {activeTab === "posts" ? "📝" : activeTab === "comments" ? "💬" : activeTab === "saved" ? "🔖" : "👍"}
            </span>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "8px", color: "var(--text-main)" }}>
              No {activeTab} yet
            </h3>
            <p style={{ color: "var(--text-muted)" }}>
              {isOwnProfile ? `You haven't ${activeTab === "posts" ? "posted" : activeTab} anything yet.` : `This user hasn't ${activeTab === "posts" ? "posted" : activeTab} anything yet.`}
            </p>
          </div>
        )}

        {posts.map((post) => (
          <div key={post.id} style={{ marginBottom: "16px" }}>
            {post.community_slug && (
              <Link
                to={getCommunityPath(post.community_slug)}
                style={{
                  display: "inline-block",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                  textDecoration: "none",
                }}
              >
                {formatCommunity(post.community_slug)}
              </Link>
            )}
            <PostCard
              post={post}
              onLike={handleLike}
              onDelete={handleDelete}
              currentUserId={currentUser?.user_id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RedditProfile;