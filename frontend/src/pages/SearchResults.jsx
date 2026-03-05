import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import API from "../api/axios";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const filteredResults = () => {
    if (!results) return { users: [], communities: [], posts: [] };
    
    if (activeTab === "users") return { users: results.users, communities: [], posts: [] };
    if (activeTab === "communities") return { users: [], communities: results.communities, posts: [] };
    if (activeTab === "posts") return { users: [], communities: [], posts: results.posts };
    return results;
  };

  const filtered = filteredResults();
  const totalResults = filtered.users.length + filtered.communities.length + filtered.posts.length;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>
          Search Results for <span className="text-gradient">"{query}"</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          {loading ? "Searching..." : `${totalResults} results found`}
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "24px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        paddingBottom: "8px"
      }}>
        {["all", "posts", "users", "communities"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === tab ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === tab ? "var(--primary)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
              textTransform: "capitalize",
              transition: "all 0.2s ease"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{
            display: "inline-block",
            width: "40px",
            height: "40px",
            border: "4px solid rgba(124, 58, 237, 0.3)",
            borderTop: "4px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
        </div>
      )}

      {/* No Results */}
      {!loading && totalResults === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <span style={{ fontSize: "3rem", display: "block", marginBottom: "16px" }}>🔍</span>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>No results found</h3>
          <p style={{ color: "var(--text-muted)" }}>Try different keywords</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Users */}
          {filtered.users.map(user => (
            <Link
              key={user.id}
              to={`/u/${user.slug}`}
              style={{
                display: "block",
                padding: "20px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--grad-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  fontWeight: "700"
                }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-main)" }}>
                    u/{user.username}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>User</div>
                </div>
              </div>
              {user.bio && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "8px" }}>
                  {user.bio}
                </p>
              )}
            </Link>
          ))}

          {/* Communities */}
          {filtered.communities.map(community => (
            <Link
              key={community.id}
              to={`/t/${community.slug}`}
              style={{
                display: "block",
                padding: "20px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ fontSize: "2rem" }}>👥</div>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-main)" }}>
                    t/{community.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {community.members_count} members
                  </div>
                </div>
              </div>
              {community.description && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "8px" }}>
                  {community.description}
                </p>
              )}
            </Link>
          ))}

          {/* Posts */}
          {filtered.posts.map(post => (
            <div
              key={post.id}
              style={{
                padding: "20px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px"
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "8px" }}>
                {post.title}
              </h3>
              {post.content && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "12px" }}>
                  {post.content}
                </p>
              )}
              <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <span>by u/{post.author_username}</span>
                <span>👍 {post.likes_count}</span>
                <span>💬 {post.comments_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResults;
