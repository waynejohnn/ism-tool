import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside style={{ width: 220, padding: 16 }}>
      <nav style={{ display: 'grid', gap: 8 }}>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/use-cases">Use Cases</NavLink>
        <NavLink to="/intake">Intake</NavLink>
      </nav>
    </aside>
  );
}
