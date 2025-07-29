import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'tl':
        return 'Team Lead';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="nav">
        <div className="container">
          <div className="flex justify-between items-center p-2 flex-column">
            <div className="nav-brand">Sales Dashboard</div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <span className="text-sm">
                {user?.name} ({getRoleDisplayName(user?.role)})
              </span>
              <button onClick={logout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-header">
        <div className="container">
          <h1 className="text-2xl font-bold text-center">{title}</h1>
        </div>
      </div>

      <div className="container">
        {children}
      </div>
    </div>
  );
};

export default Layout;