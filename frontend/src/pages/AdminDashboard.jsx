import { useEffect, useState } from "react";
import API from "../api/axios";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [highRiskUsers, setHighRiskUsers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, analyticsRes, keywordsRes, usersRes, topicsRes] = await Promise.all([
        API.get("/admin/dashboard/"),
        API.get("/admin/analytics/toxicity/?days=7"),
        API.get("/admin/analytics/keywords/"),
        API.get("/admin/users/high-risk/?limit=10"),
        API.get("/admin/analytics/topics/")
      ]);

      setDashboard(dashRes.data);
      setAnalytics(analyticsRes.data.analytics);
      setKeywords(keywordsRes.data.keywords);
      setHighRiskUsers(usersRes.data.users);
      setTopics(topicsRes.data.topics);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <div style={{
          display: "inline-block",
          width: "40px",
          height: "40px",
          border: "4px solid rgba(124, 58, 237, 0.3)",
          borderTop: "4px solid var(--primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ marginTop: "20px", color: "var(--text-muted)" }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>
        AI Moderation <span className="text-gradient">Dashboard</span>
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "40px" }}>
        Real-time analytics and content safety monitoring
      </p>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📊</div>
          <div style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "4px" }}>{dashboard?.total_posts || 0}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Total Posts</div>
        </div>

        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>⚠️</div>
          <div style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "4px", color: "#f87171" }}>
            {dashboard?.total_flagged || 0}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Flagged Posts</div>
        </div>

        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔒</div>
          <div style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "4px", color: "#fbbf24" }}>
            {dashboard?.total_redacted || 0}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Redacted Posts</div>
        </div>

        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📈</div>
          <div style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "4px", color: "#10b981" }}>
            {dashboard?.average_safety_score?.toFixed(1) || 100}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Avg Safety Score</div>
        </div>

        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔥</div>
          <div style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "4px", color: "#f87171" }}>
            {dashboard?.daily_toxicity_percentage?.toFixed(1) || 0}%
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Daily Toxicity</div>
        </div>
      </div>

      {/* Toxicity Trends */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>📉 Toxicity Trends (7 Days)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "var(--text-muted)", fontSize: "0.85rem" }}>Date</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Total</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Toxic</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Redacted</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Hate Speech</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((day, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "12px", fontSize: "0.9rem" }}>{day.date}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "0.9rem" }}>{day.total_posts}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "0.9rem", color: "#f87171" }}>{day.toxic_posts}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "0.9rem", color: "#fbbf24" }}>{day.redacted_posts}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "0.9rem", color: "#f87171" }}>{day.hate_speech_posts}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "0.9rem", fontWeight: "600" }}>
                    <span style={{ 
                      color: day.toxicity_rate > 20 ? "#f87171" : day.toxicity_rate > 10 ? "#fbbf24" : "#10b981" 
                    }}>
                      {day.toxicity_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        
        {/* Top Flagged Keywords */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>🔍 Top Flagged Keywords</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {keywords.slice(0, 10).map((kw, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ 
                  width: "30px", 
                  height: "30px", 
                  borderRadius: "50%", 
                  background: "rgba(124, 58, 237, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: "700"
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: "600" }}>{kw.word}</div>
                  <div style={{ 
                    height: "4px", 
                    background: "rgba(255, 255, 255, 0.1)", 
                    borderRadius: "2px",
                    marginTop: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      width: `${(kw.count / keywords[0]?.count) * 100}%`,
                      height: "100%",
                      background: "var(--grad-primary)"
                    }} />
                  </div>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{kw.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* User Risk Distribution */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>👥 User Risk Distribution</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.9rem" }}>🔴 High Risk</span>
                <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{dashboard?.user_risk_distribution?.high_risk || 0}</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "60%", height: "100%", background: "#f87171" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.9rem" }}>🟡 Medium Risk</span>
                <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{dashboard?.user_risk_distribution?.medium_risk || 0}</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "40%", height: "100%", background: "#fbbf24" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.9rem" }}>🟢 Low Risk</span>
                <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{dashboard?.user_risk_distribution?.low_risk || 0}</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "80%", height: "100%", background: "#10b981" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High Risk Users */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>⚠️ High Risk Users</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <th style={{ padding: "12px", textAlign: "left", color: "var(--text-muted)", fontSize: "0.85rem" }}>Username</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Risk Score</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Posts</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Flagged</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Redacted</th>
                <th style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Reports</th>
              </tr>
            </thead>
            <tbody>
              {highRiskUsers.map((user, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "12px", fontSize: "0.9rem", fontWeight: "600" }}>u/{user.username}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span style={{ 
                      padding: "4px 12px",
                      borderRadius: "8px",
                      background: user.risk_score > 50 ? "rgba(244, 63, 94, 0.2)" : "rgba(251, 191, 36, 0.2)",
                      color: user.risk_score > 50 ? "#f87171" : "#fbbf24",
                      fontSize: "0.85rem",
                      fontWeight: "600"
                    }}>
                      {user.risk_score}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "0.9rem" }}>{user.posts_count}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "0.9rem", color: "#f87171" }}>{user.flagged_posts_count}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "0.9rem", color: "#fbbf24" }}>{user.redacted_posts_count}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "0.9rem" }}>{user.reports_received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topic Distribution */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>📚 Topic Distribution</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
          {topics.map((topic, idx) => (
            <div key={idx} style={{
              padding: "16px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "4px" }}>{topic.count}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{topic.topic}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
