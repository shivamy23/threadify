import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Flatten results for keyboard navigation
  const flatResults = results ? [
    ...results.users.map(u => ({ ...u, category: "user" })),
    ...results.communities.map(c => ({ ...c, category: "community" })),
    ...results.posts.map(p => ({ ...p, category: "post" }))
  ] : [];

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await API.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0) {
        handleSelect(flatResults[selectedIndex]);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setShowDropdown(false);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item) => {
    if (item.category === "user") {
      navigate(`/u/${item.slug}`);
    } else if (item.category === "community") {
      navigate(`/t/${item.slug}`);
    } else if (item.category === "post") {
      navigate(`/posts?q=${encodeURIComponent(query)}`);
    }
    setShowDropdown(false);
    setQuery("");
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} style={{ background: "rgba(124, 58, 237, 0.3)", color: "var(--primary)" }}>{part}</mark> : 
        part
    );
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%", maxWidth: "500px" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="🔍 Search Threadify"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            color: "white",
            fontSize: "0.9rem",
          }}
        />
        {loading && (
          <div style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "16px",
            height: "16px",
            border: "2px solid rgba(124, 58, 237, 0.3)",
            borderTop: "2px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
        )}
      </div>

      {showDropdown && results && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          right: 0,
          background: "var(--bg-dark)",
          border: "1px solid var(--glass-border)",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          maxHeight: "400px",
          overflowY: "auto",
          zIndex: 1000
        }}>
          {results.total === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
              No results found
            </div>
          ) : (
            <>
              {results.users.length > 0 && (
                <div>
                  <div style={{ padding: "8px 16px", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Users
                  </div>
                  {results.users.map((user, idx) => {
                    const globalIdx = idx;
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleSelect({ ...user, category: "user" })}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          background: selectedIndex === globalIdx ? "rgba(124, 58, 237, 0.1)" : "transparent",
                          borderLeft: selectedIndex === globalIdx ? "3px solid var(--primary)" : "3px solid transparent"
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                          u/{highlightMatch(user.username, query)}
                        </div>
                        {user.bio && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            {user.bio.substring(0, 60)}...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {results.communities.length > 0 && (
                <div>
                  <div style={{ padding: "8px 16px", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Communities
                  </div>
                  {results.communities.map((community, idx) => {
                    const globalIdx = results.users.length + idx;
                    return (
                      <div
                        key={community.id}
                        onClick={() => handleSelect({ ...community, category: "community" })}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          background: selectedIndex === globalIdx ? "rgba(124, 58, 237, 0.1)" : "transparent",
                          borderLeft: selectedIndex === globalIdx ? "3px solid var(--primary)" : "3px solid transparent"
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                          t/{highlightMatch(community.name, query)}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          {community.members_count} members
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {results.posts.length > 0 && (
                <div>
                  <div style={{ padding: "8px 16px", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Posts
                  </div>
                  {results.posts.map((post, idx) => {
                    const globalIdx = results.users.length + results.communities.length + idx;
                    return (
                      <div
                        key={post.id}
                        onClick={() => handleSelect({ ...post, category: "post" })}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          background: selectedIndex === globalIdx ? "rgba(124, 58, 237, 0.1)" : "transparent",
                          borderLeft: selectedIndex === globalIdx ? "3px solid var(--primary)" : "3px solid transparent"
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                          {highlightMatch(post.title, query)}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          by u/{post.author_username} • {post.likes_count} likes • {post.comments_count} comments
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
