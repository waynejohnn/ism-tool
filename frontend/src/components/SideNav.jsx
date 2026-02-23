import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function SideNav() {
  const [expanded, setExpanded] = useState(false);

  const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard' },
    { path: '/use-cases', icon: '📋', label: 'Use Cases' },
    { path: '/intake', icon: '➕', label: 'New Use Case' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
    { path: '/admin/data', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <nav 
      className={`side-nav ${expanded ? 'side-nav--expanded' : 'side-nav--collapsed'}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="side-nav__header">
        <div className="side-nav__logo">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#0A5C36"/>
            <path d="M8 12h16M8 16h16M8 20h16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div className="side-nav__menu">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `side-nav__item ${isActive ? 'side-nav__item--active' : ''}`}
            title={!expanded ? item.label : ''}
          >
            <span className="side-nav__icon">{item.icon}</span>
            {expanded && <span className="side-nav__label">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
