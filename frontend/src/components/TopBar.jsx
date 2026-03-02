import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', !darkMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="top-bar">
      <div className="top-bar__actions">
        <NavLink to="/" className="top-bar__title-link">
          Use Case Assessment
        </NavLink>

        <span className="top-bar__spacer" />

        <div className="top-bar__auth">
          {isLoggedIn ? (
            <button className="top-bar__logout-btn" onClick={handleLogout}>
              <span className="top-bar__logout-icon">⎋</span>
              Logout
            </button>
          ) : (
            <button className="top-bar__login-btn" onClick={handleLogin}>
              <span className="top-bar__login-icon">→</span>
              Login
            </button>
          )}
        </div>

        <div className="top-bar__logo">
          <img src="/ism-icon.svg" alt="ISM icon" width="28" height="28" />
        </div>
      </div>
    </div>
  );
}
