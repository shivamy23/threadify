import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import PasswordSignup from "./pages/PasswordSignup";
import PasswordLogin from "./pages/PasswordLogin";
import Posts from "./pages/Posts";
import Home from "./pages/Home";
import Communities from "./pages/Communities";
import CommunityPage from "./pages/CommunityPage";
import Settings from "./pages/Settings";
import Saved from "./pages/Saved";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import RedditProfile from "./pages/RedditProfile";
import AdminDashboard from "./pages/AdminDashboard";
import SearchResults from "./pages/SearchResults";
import DashboardLayout from "./components/DashboardLayout";
import { AuthContext } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AdvancedAuthProvider } from "./context/AdvancedAuthContext";

function App() {
  const { user } = useContext(AuthContext);

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <ThemeProvider>
      <AdvancedAuthProvider>
        <BrowserRouter>
          <Routes>

            {/* Root logic */}
            <Route
              path="/"
              element={
                user ? <Navigate to="/posts" replace /> : <PasswordSignup />
              }
            />

            <Route
              path="/signup"
              element={
                user ? <Navigate to="/posts" replace /> : <PasswordSignup />
              }
            />

            <Route
              path="/login"
              element={
                user ? <Navigate to="/posts" replace /> : <PasswordLogin />
              }
            />

            {/* Protected Dashboard Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/posts" element={<Posts />} />
              <Route path="/home" element={<Home />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/c/:communityId" element={<CommunityPage />} />
              <Route path="/t/:slug" element={<CommunityPage />} />
              <Route path="/u/:username" element={<RedditProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/search" element={<SearchResults />} />
            </Route>

            {/* Catch all */}
            <Route
              path="*"
              element={
                user ? <Navigate to="/posts" replace /> : <Navigate to="/" replace />
              }
            />

          </Routes>
        </BrowserRouter>
      </AdvancedAuthProvider>
    </ThemeProvider>
  );
}

export default App;
