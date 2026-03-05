import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import CreateCommunityModal from "../components/CreateCommunityModal";
import { getCommunityPath, formatCommunity } from "../utils/formatters";

function Communities() {
    const [communities, setCommunities] = useState([]);
    const [activeTab, setActiveTab] = useState("explore");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [matureWarning, setMatureWarning] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchCommunities = async () => {
        try {
            const res = await API.get("/communities");
            setCommunities(res.data);
        } catch (error) {
            console.error("Error fetching communities:", error);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    const handleJoin = async (id) => {
        try {
            await API.post(`/communities/${id}/join`);
            fetchCommunities();
        } catch (error) {
            if (error.response?.status === 400) {
                showToast(error.response.data.detail, "error");
            } else {
                console.error("Error joining community:", error);
            }
        }
    };

    const handleCommunityCreated = () => {
        fetchCommunities();
        showToast("Community created successfully");
    };

    const handleCommunityClick = (e, comm) => {
        if (comm.mature) {
            e.preventDefault();
            setMatureWarning(comm);
        }
    };

    const filteredList = activeTab === "explore"
        ? communities
        : communities.filter(c => c.is_member);

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
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

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'baseline' }}>
                    <h2 style={{ fontSize: '2rem' }}>Communities</h2>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <span
                            onClick={() => setActiveTab("explore")}
                            style={{ cursor: 'pointer', fontSize: '0.95rem', color: activeTab === 'explore' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'explore' ? '600' : '400', borderBottom: activeTab === 'explore' ? '2px solid var(--primary)' : 'none', paddingBottom: '4px' }}
                        >Explore</span>
                        <span
                            onClick={() => setActiveTab("my")}
                            style={{ cursor: 'pointer', fontSize: '0.95rem', color: activeTab === 'my' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'my' ? '600' : '400', borderBottom: activeTab === 'my' ? '2px solid var(--primary)' : 'none', paddingBottom: '4px' }}
                        >Joined</span>
                    </div>
                </div>

                <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Create Community</button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {filteredList.map((comm) => (
                    <Link
                        key={comm.id}
                        to={getCommunityPath(comm.slug)}
                        onClick={(e) => handleCommunityClick(e, comm)}
                        style={{ textDecoration: "none", color: "inherit" }}
                    >
                        <article className="glass-card animate-fade-in" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: "pointer", transition: "all 0.2s ease" }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-4px)";
                                e.currentTarget.style.boxShadow = "0 12px 40px rgba(124, 58, 237, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "";
                            }}
                        >
                            <div style={{ height: '80px', background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}></div>
                            <div style={{ padding: '24px', paddingTop: '0', marginTop: '-30px', position: 'relative' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '18px', background: 'var(--bg-dark)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
                                    border: '4px solid var(--bg-darker)', boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                                    marginBottom: '16px'
                                }}>
                                    {comm.icon}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                    <h3 style={{ fontSize: '1.1rem' }}>{formatCommunity(comm.slug)}</h3>
                                    {comm.mature && (
                                        <span style={{
                                            padding: "2px 8px",
                                            background: "rgba(244, 63, 94, 0.2)",
                                            color: "#f87171",
                                            borderRadius: "6px",
                                            fontSize: "0.7rem",
                                            fontWeight: "600"
                                        }}>18+</span>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px', minHeight: '3.2em' }}>{comm.description}</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', gap: "10px" }}>
                                    <div style={{ display: "flex", gap: "15px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        <span>👥 {comm.members_count}</span>
                                        <span>📝 {comm.posts_count}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleJoin(comm.id);
                                        }}
                                        className={comm.is_member ? "btn-outline" : "btn-primary"}
                                        style={{ padding: '6px 16px', fontSize: '0.75rem', borderRadius: '12px' }}
                                    >
                                        {comm.is_member ? "Joined" : "Join"}
                                    </button>
                                </div>
                            </div>
                        </article>
                    </Link>
                ))}
            </div>

            {/* Mature Content Warning Modal */}
            {matureWarning && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.85)",
                        backdropFilter: "blur(10px)",
                        zIndex: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                    onClick={() => setMatureWarning(null)}
                >
                    <div
                        className="glass-card"
                        style={{
                            maxWidth: "500px",
                            padding: "40px",
                            borderRadius: "24px",
                            textAlign: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🔞</div>
                        <h2 style={{ fontSize: "1.8rem", marginBottom: "10px" }}>Mature Content</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
                            This community contains mature content (18+). Enable mature content in settings to access.
                        </p>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={() => setMatureWarning(null)} className="btn-outline" style={{ flex: 1 }}>
                                Cancel
                            </button>
                            <Link to="/settings" className="btn-primary" style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                Go to Settings
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Community Modal */}
            <CreateCommunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCommunityCreated}
            />
        </div>
    );
}

export default Communities;
