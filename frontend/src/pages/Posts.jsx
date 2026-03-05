import { useEffect, useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import PostCard from "../components/PostCard";
import { AuthContext } from "../context/AuthContext";

function Posts() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("new");
  const [activeTab, setActiveTab] = useState("text");
  const [moderationWarning, setModerationWarning] = useState(null);
  const [safetyScore, setSafetyScore] = useState(100);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPosts = async (pageNum, search = "", sort = "new", topic = "") => {
    try {
      setLoading(true);
      const topicParam = topic ? `&topic=${topic}` : "";
      const res = await API.get(`/posts?page=${pageNum}&limit=10&search=${search}&sort=${sort}${topicParam}`);

      if (res.data.results.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => {
          if (pageNum === 1) return res.data.results;
          const newPosts = res.data.results.filter(
            (p) => !prev.some((existing) => existing.id === p.id)
          );
          return [...prev, ...newPosts];
        });
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      showToast("Failed to load posts", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await API.get("/posts/topics/list/");
      setTopics(res.data.topics || []);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await API.get("/communities/");
      setCommunities(res.data || []);
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const checkModeration = async (text) => {
    if (!text || text.length < 5) {
      setModerationWarning(null);
      setSafetyScore(100);
      return;
    }

    try {
      const res = await API.post("/posts/moderate-check/", { text });
      if (res.data.warning) {
        setModerationWarning(res.data.message);
        setSafetyScore(res.data.safety_score);
      } else {
        setModerationWarning(null);
        setSafetyScore(res.data.safety_score);
      }
    } catch (error) {
      console.error("Moderation check failed:", error);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchCommunities();
    fetchPosts(1, "", "new", "");
    
    // Auto-select community from query param
    const communitySlug = searchParams.get("community");
    if (communitySlug) {
      setSelectedCommunity(communitySlug);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts([]);
      setPage(1);
      setHasMore(true);
      fetchPosts(1, searchQuery, sortBy, selectedTopic);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, selectedTopic]);

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page, searchQuery, sortBy, selectedTopic);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkModeration(`${title} ${content}`);
    }, 800);
    return () => clearTimeout(timer);
  }, [title, content]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight &&
        hasMore &&
        !loading
      ) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      
      // Add community_id if selected
      if (selectedCommunity) {
        const community = communities.find(c => c.slug === selectedCommunity);
        if (community) {
          formData.append("community_id", community.id);
        }
      }
      
      if (activeTab === "text") {
        formData.append("content", content);
      } else if (activeTab === "image" && selectedImage) {
        formData.append("image", selectedImage);
      } else if (activeTab === "video" && selectedVideo) {
        formData.append("video", selectedVideo);
      } else {
        setUploadError("Please provide content for your post");
        return;
      }
      
      const res = await API.post("/posts/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      if (res.data.flagged) {
        showToast(`Post created but flagged for review (Safety: ${res.data.safety_score}/100)`, "error");
      } else {
        showToast("Post created successfully");
      }
      
      setTitle("");
      setContent("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setImagePreview(null);
      setVideoPreview(null);
      setModerationWarning(null);
      setSafetyScore(100);
      setPosts([]);
      setPage(1);
      setHasMore(true);
      fetchPosts(1, searchQuery, sortBy, selectedTopic);
    } catch (error) {
      console.error(error);
      setUploadError(error.response?.data?.detail || "Post creation failed");
      showToast(error.response?.data?.detail || "Post creation failed", "error");
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid image type. Allowed: JPG, JPEG, PNG, WEBP, GIF");
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size exceeds 5MB limit");
      return;
    }
    
    setUploadError("");
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== "video/mp4") {
      setUploadError("Invalid video type. Only MP4 allowed");
      return;
    }
    
    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("Video size exceeds 20MB limit");
      return;
    }
    
    setUploadError("");
    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
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
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                saved_by_me: response.data.saved
              }
            : post
        )
      );
      showToast(response.data.message);
    } catch (error) {
      console.error("Save failed:", error);
      showToast("Save failed", "error");
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
          Explore <span className="text-gradient">Posts</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Discover and share ideas with the community
        </p>
      </div>

      {/* Create Post Box */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          marginTop: "20px",
        }}
      >
        <h3 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Create Post</h3>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {["text", "image", "video"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setUploadError("");
                setSelectedImage(null);
                setSelectedVideo(null);
                setImagePreview(null);
                setVideoPreview(null);
              }}
              style={{
                padding: "8px 20px",
                borderRadius: "10px",
                border: "none",
                background:
                  activeTab === tab
                    ? "rgba(124, 58, 237, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                color: activeTab === tab ? "var(--primary)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}
            >
              {tab === "text" && "📝 Text"}
              {tab === "image" && "🖼️ Image"}
              {tab === "video" && "🎥 Video"}
            </button>
          ))}
        </div>

        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          
          {/* Community Selector */}
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            style={{
              padding: "12px 16px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--text-primary)",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            <option value="">🌐 General Feed (No Community)</option>
            {communities.map((comm) => (
              <option key={comm.id} value={comm.slug}>
                {comm.icon} {comm.name}
              </option>
            ))}
          </select>
          
          {/* Text Content */}
          {activeTab === "text" && (
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows="4"
              style={{
                resize: "vertical",
              }}
            />
          )}
          
          {/* Image Upload */}
          {activeTab === "image" && (
            <div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                style={{
                  cursor: "pointer",
                }}
              />
              {imagePreview && (
                <div style={{ marginTop: "12px", textAlign: "center" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Video Upload */}
          {activeTab === "video" && (
            <div>
              <input
                type="file"
                accept="video/mp4"
                onChange={handleVideoSelect}
                style={{
                  cursor: "pointer",
                }}
              />
              {videoPreview && (
                <div style={{ marginTop: "12px" }}>
                  <video
                    src={videoPreview}
                    controls
                    style={{
                      width: "100%",
                      maxHeight: "300px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Upload Error */}
          {uploadError && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "12px",
              color: "#f87171",
              fontSize: "0.9rem",
            }}>
              {uploadError}
            </div>
          )}
          
          {/* AI Moderation Warning */}
          {activeTab === "text" && moderationWarning && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(251, 191, 36, 0.1)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              borderRadius: "12px",
              color: "#fbbf24",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span>⚠️</span>
              <span>{moderationWarning}</span>
            </div>
          )}
          
          {/* Safety Score Indicator */}
          {activeTab === "text" && (title || content) && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.85rem",
              color: "var(--text-muted)"
            }}>
              <span>AI Safety Score:</span>
              <div style={{
                flex: 1,
                height: "6px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "3px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${safetyScore}%`,
                  height: "100%",
                  background: safetyScore > 80 ? "#10b981" : safetyScore > 50 ? "#fbbf24" : "#f43f5e",
                  transition: "all 0.3s ease"
                }} />
              </div>
              <span style={{
                color: safetyScore > 80 ? "#10b981" : safetyScore > 50 ? "#fbbf24" : "#f43f5e",
                fontWeight: "600"
              }}>{safetyScore}/100</span>
            </div>
          )}
          
          <button
            className="btn-primary"
            type="submit"
            style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
          >
            Post to Community
          </button>
        </form>
      </div>

      {/* Posts Feed */}
      {posts.length === 0 && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <span style={{ fontSize: "3rem", display: "block", marginBottom: "16px" }}>🔍</span>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>No posts found</h3>
          <p style={{ color: "var(--text-muted)" }}>
            {searchQuery ? "Try a different search term" : "Be the first to post!"}
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onSave={handleSave}
          onDelete={handleDelete}
          currentUserId={user?.user_id}
        />
      ))}

      {/* Loading Skeleton */}
      {loading && (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
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

      {!hasMore && posts.length > 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          You've reached the end 🎉
        </div>
      )}
    </div>
  );
}

export default Posts;
