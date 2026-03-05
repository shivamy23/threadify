import { useState, useEffect } from "react";
import API from "../api/axios";
import { useTheme } from "../context/ThemeContext";

function Settings() {
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState({
        display_name: "",
        username: "",
        bio: ""
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await API.get("/users/me");
                setProfile({
                    display_name: response.data.display_name,
                    username: response.data.username,
                    bio: response.data.bio
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await API.patch("/users/profile", {
                display_name: profile.display_name,
                bio: profile.bio
            });
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile");
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '60vh',
                color: 'var(--text-main)'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            padding: '40px 20px',
            minHeight: '100vh'
        }}>
            <div style={{ maxWidth: '800px', width: '100%' }}>
                <h2 style={{ 
                    fontSize: '2.4rem', 
                    marginBottom: '10px', 
                    color: 'var(--text-main)',
                    textAlign: 'center'
                }}>
                    User <span className="text-gradient">Settings</span>
                </h2>
                <p style={{ 
                    color: 'var(--text-muted)', 
                    marginBottom: '40px',
                    textAlign: 'center'
                }}>
                    Manage your personal information.
                </p>

                <form onSubmit={handleUpdateProfile} className="glass-card" style={{ 
                    padding: '30px', 
                    borderRadius: '24px',
                    marginBottom: '24px'
                }}>
                    <h3 style={{ 
                        fontSize: '1.2rem', 
                        marginBottom: '30px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        color: 'var(--text-main)' 
                    }}>
                        <span>👤</span> Personal Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.8rem', 
                                    color: 'var(--text-muted)', 
                                    marginBottom: '8px' 
                                }}>
                                    FULL NAME
                                </label>
                                <input
                                    value={profile.display_name}
                                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: 'var(--input-bg)', 
                                        border: '1px solid var(--glass-border)', 
                                        color: 'var(--text-main)', 
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.8rem', 
                                    color: 'var(--text-muted)', 
                                    marginBottom: '8px' 
                                }}>
                                    USERNAME
                                </label>
                                <input
                                    value={`@${profile.username}`}
                                    disabled
                                    style={{ 
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: 'var(--glass-border)', 
                                        border: '1px solid var(--glass-border)', 
                                        color: 'var(--text-muted)', 
                                        outline: 'none',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                fontSize: '0.8rem', 
                                color: 'var(--text-muted)', 
                                marginBottom: '8px' 
                            }}>
                                BIO
                            </label>
                            <textarea
                                rows="3"
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                style={{ 
                                    width: '100%', 
                                    padding: '16px', 
                                    borderRadius: '12px', 
                                    background: 'var(--input-bg)', 
                                    color: 'var(--text-main)', 
                                    border: '1px solid var(--glass-border)', 
                                    outline: 'none', 
                                    resize: 'vertical',
                                    minHeight: '80px'
                                }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ 
                                alignSelf: 'flex-start', 
                                padding: '12px 30px',
                                borderRadius: '12px'
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                </form>

                {/* Theme Toggle */}
                <div className="glass-card" style={{ 
                    padding: '30px', 
                    borderRadius: '24px' 
                }}>
                    <h3 style={{ 
                        fontSize: '1.2rem', 
                        marginBottom: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        color: 'var(--text-main)' 
                    }}>
                        <span>🎨</span> Appearance
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-main)', fontWeight: '600', marginBottom: '4px' }}>Theme</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Switch between dark and light mode</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--card-bg)';
                                e.currentTarget.style.borderColor = 'var(--primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                        >
                            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
                            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
