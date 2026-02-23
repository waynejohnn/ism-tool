import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopNav({ onAddUseCase }) {
  const navigate = useNavigate();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const addMenuRef = useRef(null);
  const adminMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setShowAdminMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddUseCase = () => {
    onAddUseCase();
    setShowAddMenu(false);
  };

  const handleNavigateAdmin = (path) => {
    navigate(path);
    setShowAdminMenu(false);
  };

  return (
    <header className="app-header" style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/favicon.ico" alt="logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
        <div style={{ fontWeight: 700 }}>Use Case Scoring</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input placeholder="Search use cases..." style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e7e7e7' }} />
        <div style={{ position: 'relative' }} ref={addMenuRef}>
          <button className="button button--primary" onClick={() => setShowAddMenu(!showAddMenu)}>+ Add</button>
          {showAddMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: 'white',
              border: '1px solid #e7e7e7',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              minWidth: 200,
              zIndex: 1000
            }}>
              <button
                onClick={handleAddUseCase}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text-900)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface-1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                + New Use Case
              </button>
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }} ref={adminMenuRef}>
          <button
            onClick={() => setShowAdminMenu(!showAdminMenu)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-500)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 4,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface-1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Admin ▼
          </button>
          {showAdminMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: 'white',
              border: '1px solid #e7e7e7',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              minWidth: 150,
              zIndex: 1000
            }}>
              <button
                onClick={() => handleNavigateAdmin('/admin/users')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text-900)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface-1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Users
              </button>
              <button
                onClick={() => handleNavigateAdmin('/admin/data')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text-900)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface-1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Data
              </button>
            </div>
          )}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>U</div>
      </div>
    </header>
  );
}
