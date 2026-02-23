import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import '../styles/UserAdministration.css';

const ROLES = [
  { value: 'Admin', label: 'Admin', icon: '🔐', color: '#e3f2fd', textColor: '#1976d2' },
  { value: 'Reviewer', label: 'Reviewer', icon: '👀', color: '#f3e5f5', textColor: '#7b1fa2' },
  { value: 'Read Only', label: 'Read Only', icon: '👁️', color: '#e8f5e9', textColor: '#388e3c' },
];

export default function UserAdministration() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', fullName: '', role: 'Read Only', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/admin/users');
      setUsers(data || []);
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ email: '', fullName: '', role: 'Read Only', password: '' });
    setShowForm(true);
    setError('');
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({ email: user.email, fullName: user.fullName, role: user.role, password: '' });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (!formData.email || !formData.fullName) {
        setError('Email and full name are required');
        return;
      }

      if (editingUser) {
        const updateData = {
          fullName: formData.fullName,
          role: formData.role,
        };
        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        await apiPut(`/admin/users/${editingUser.userId}`, updateData);
        setSuccess('User updated successfully');
      } else {
        if (!formData.password) {
          setError('Password is required for new users');
          return;
        }
        await apiPost('/admin/users', formData);
        setSuccess('User created successfully');
      }

      setShowForm(false);
      setFormData({ email: '', fullName: '', role: 'Read Only', password: '' });
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError('');
        await apiDelete(`/admin/users/${userId}`);
        setSuccess('User deleted successfully');
        await loadUsers();
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const handleToggleActive = async (user) => {
    try {
      setError('');
      await apiPut(`/admin/users/${user.userId}`, {
        isActive: !user.isActive,
      });
      setSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      await loadUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  return (
    <div style={{ padding: '0 24px', minHeight: '100vh', backgroundColor: '#fafbfc' }}>
      {/* Header Section */}
      <div style={{ paddingTop: 32, paddingBottom: 32 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700, color: 'var(--text-900)' }}>
          User Administration
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--text-500)', fontWeight: 400 }}>
          Manage user accounts, assign roles, and control access
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div style={{
          padding: '16px 20px',
          marginBottom: 24,
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: 12,
          color: '#c33',
          fontSize: 14,
          fontWeight: 500,
        }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '16px 20px',
          marginBottom: 24,
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: 12,
          color: '#3c3',
          fontSize: 14,
          fontWeight: 500,
        }}>
          ✓ {success}
        </div>
      )}

      {!showForm ? (
        <>
          {/* Add Button */}
          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Users</h2>
            <button
              onClick={handleAddUser}
              className="btn-primary"
            >
              <span className="btn-icon">+</span> Add User
            </button>
          </div>

          {/* Users Table */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-500)' }}>
              <div style={{ fontSize: 14 }}>Loading users...</div>
            </div>
          ) : users.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: 12,
              border: '1px solid #e7e7e7',
              color: 'var(--text-500)',
            }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>No users found</div>
              <div style={{ fontSize: 14 }}>Click "Add User" to create one</div>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: 12,
              border: '1px solid #e7e7e7',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e7e7e7' }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-700)' }}>Email</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-700)' }}>Full Name</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-700)' }}>Role</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--text-700)' }}>Status</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--text-700)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.userId}
                      style={{
                        borderBottom: '1px solid #e7e7e7',
                        backgroundColor: idx % 2 === 0 ? 'white' : '#fafbfc',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#fafbfc'}
                    >
                      <td style={{ padding: '16px 20px', color: 'var(--text-600)', fontSize: 13 }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--text-900)' }}>
                        {user.fullName}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {(() => {
                          const roleConfig = ROLES.find(r => r.value === user.role);
                          return (
                            <span style={{
                              display: 'inline-block',
                              padding: '6px 12px',
                              borderRadius: 6,
                              backgroundColor: roleConfig?.color,
                              color: roleConfig?.textColor,
                              fontSize: 12,
                              fontWeight: 600,
                            }}>
                              {roleConfig?.icon} {user.role}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: 6,
                          backgroundColor: user.isActive ? '#e8f5e9' : '#f3e5f5',
                          color: user.isActive ? '#2e7d32' : '#6a1b9a',
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {user.isActive ? '✓ Active' : '⊘ Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div className="actions-group">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="btn-action btn-action--edit"
                            title="Edit user"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className="btn-action btn-action--toggle"
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.isActive ? '⊘' : '✓'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.userId)}
                            className="btn-action btn-action--delete"
                            title="Delete user"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Form Modal */
        <div style={{
          maxWidth: 500,
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: 12,
          border: '1px solid #e7e7e7',
          padding: 32,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: 20, fontWeight: 600 }}>
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'var(--text-900)', fontSize: 14 }}>
                Email {editingUser ? '(read-only)' : '*'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingUser}
                placeholder="user@example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e7e7e7',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                  opacity: editingUser ? 0.6 : 1,
                  backgroundColor: editingUser ? '#f5f5f5' : 'white',
                  cursor: editingUser ? 'not-allowed' : 'auto',
                }}
                onFocus={(e) => !editingUser && (e.target.style.borderColor = 'var(--primary)')}
                onBlur={(e) => !editingUser && (e.target.style.borderColor = '#e7e7e7')}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'var(--text-900)', fontSize: 14 }}>
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e7e7e7',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = '#e7e7e7'}
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'var(--text-900)', fontSize: 14 }}>
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e7e7e7',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = '#e7e7e7'}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.icon} {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'var(--text-900)', fontSize: 14 }}>
                Password {editingUser ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e7e7e7',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = '#e7e7e7'}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                className="btn-primary btn-primary--full"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary btn-secondary--full"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
