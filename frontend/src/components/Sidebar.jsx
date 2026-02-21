import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const isActive = (path) => location.pathname === path ? "active" : "";

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo-icon">📊</div>
                <div className="sidebar-brand">
                    <h2>Analytics AI</h2>
                    <span>Admin</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
                    <span className="sidebar-link-icon">📈</span> Dashboard
                </Link>
                <Link to="/analytics" className={`sidebar-link ${isActive('/analytics')}`}>
                    <span className="sidebar-link-icon">📉</span> Analytics
                </Link>
                <Link to="/chat" className={`sidebar-link ${isActive('/chat')}`}>
                    <span className="sidebar-link-icon">💬</span> AI Chat
                </Link>
                <Link to="/reports" className={`sidebar-link ${isActive('/reports')}`}>
                    <span className="sidebar-link-icon">📄</span> Reports
                </Link>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user-email">admin@example.com</div>
                <button onClick={handleLogout} className="sidebar-btn-logout">
                    <span>[→</span> Logout
                </button>
            </div>
        </aside>
    );
}
