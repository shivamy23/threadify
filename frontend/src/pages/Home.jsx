import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="container flex-center" style={{ justifyContent: 'space-between', padding: '20px' }}>
        <h1 style={{ fontSize: '1.5rem' }}><span className="text-gradient">Threadify</span></h1>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/login" className="btn-outline">Log In</Link>
          <Link to="/" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container grid-cols-2 min-h-screen" style={{ marginTop: '-60px' }}>
        <div className="animate-fade-in">
          <h1 style={{ fontSize: '4rem', marginBottom: '20px' }}>
            Elevate Your <br />
            <span className="text-gradient">Discussions</span> with AI.
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '40px', maxWidth: '500px' }}>
            The next-generation discussion platform. Threadify uses advanced NLP to moderate, summarize, and enhance community interactions in real-time.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/" className="btn-primary" style={{ padding: '16px 40px' }}>Join the Future</Link>
            <Link to="/login" className="btn-outline" style={{ padding: '16px 40px' }}>Demo Platform</Link>
          </div>
        </div>

        <div className="animate-fade-in delay-200 flex-center">
          <div className="glass-card" style={{ width: '100%', height: '400px', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px' }}>
                <div style={{ height: '8px', width: '40%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '12px' }}></div>
                <div style={{ height: '32px', width: '80%', background: 'var(--grad-primary)', borderRadius: '8px', marginBottom: '24px', opacity: 0.8 }}></div>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '10px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', marginBottom: '8px' }}></div>
                      <div style={{ height: '10px', width: '90%', background: 'rgba(255,255,255,0.03)', borderRadius: '5px' }}></div>
                    </div>
                  </div>
                ))}
             </div>
             {/* Abstract glows */}
             <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.3 }}></div>
             <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'var(--secondary)', filter: 'blur(80px)', opacity: 0.2 }}></div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="container" style={{ padding: '100px 0' }}>
        <div className="animate-fade-in delay-300" style={{ textAlign: 'center', marginBottom: '60px' }}>
           <h2 style={{ fontSize: '2.5rem' }}>Powering <span className="text-gradient">Quality</span> Conversations</h2>
        </div>
        <div className="grid-cols-2" style={{ gap: '30px' }}>
          <div className="glass" style={{ padding: '40px' }}>
            <h3 style={{ marginBottom: '15px' }}>🤖 AI Auto-Moderation</h3>
            <p style={{ color: 'var(--text-muted)' }}>Advanced Transformers-based models detect and filter toxic content instantly, maintaining a healthy community.</p>
          </div>
          <div className="glass" style={{ padding: '40px' }}>
            <h3 style={{ marginBottom: '15px' }}>⚡ Smart Summaries</h3>
            <p style={{ color: 'var(--text-muted)' }}>Get the gist of long discussions in seconds with our AI-powered thread summarization engine.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container" style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
        <p>© 2026 Threadify - Modern Conversations, Enhanced by AI.</p>
      </footer>
    </div>
  );
}

export default Home;
