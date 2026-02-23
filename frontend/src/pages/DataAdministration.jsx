import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import '../styles/DataAdministration.css';

const CATEGORIES = [
  { value: 'TargetYear', label: 'Target Year', icon: '📅' },
  { value: 'CapabilityCategory', label: 'Capability Category', icon: '🎯' },
  { value: 'ExecutiveSponsor', label: 'Executive Sponsor', icon: '👤' },
  { value: 'Status', label: 'Status', icon: '📊' },
];

export default function DataAdministration() {
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('TargetYear');
  const [showForm, setShowForm] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [formData, setFormData] = useState({ value: '', displayName: '', sortOrder: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/admin/filter-options');
      setFilterOptions(data || {});
      setError('');
    } catch (err) {
      setError('Failed to load filter options');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setEditingOption(null);
    setFormData({ value: '', displayName: '', sortOrder: 0 });
    setShowForm(true);
    setError('');
  };

  const handleEditOption = (option) => {
    setEditingOption(option);
    setFormData({
      value: option.value,
      displayName: option.displayName,
      sortOrder: option.sortOrder,
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (!formData.displayName) {
        setError('Display name is required');
        return;
      }

      if (editingOption) {
        await apiPut(`/admin/filter-options/${editingOption.optionId}`, {
          displayName: formData.displayName,
          sortOrder: parseInt(formData.sortOrder) || 0,
        });
        setSuccess('Option updated successfully');
      } else {
        if (!formData.value) {
          setError('Value is required for new options');
          return;
        }
        await apiPost('/admin/filter-options', {
          category: selectedCategory,
          value: formData.value,
          displayName: formData.displayName,
          sortOrder: parseInt(formData.sortOrder) || 0,
        });
        setSuccess('Option created successfully');
      }

      setShowForm(false);
      setFormData({ value: '', displayName: '', sortOrder: 0 });
      await loadFilterOptions();
    } catch (err) {
      setError(err.message || 'Failed to save option');
    }
  };

  const handleDeleteOption = async (optionId) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
      try {
        setError('');
        await apiDelete(`/admin/filter-options/${optionId}`);
        setSuccess('Option deleted successfully');
        await loadFilterOptions();
      } catch (err) {
        setError('Failed to delete option');
      }
    }
  };

  const currentCategoryOptions = filterOptions[selectedCategory] || [];
  const currentCategoryLabel = CATEGORIES.find(c => c.value === selectedCategory)?.label || 'Option';

  return (
    <div style={{ padding: '0 24px', minHeight: '100vh', backgroundColor: '#fafbfc' }}>
      {/* Header Section */}
      <div style={{ paddingTop: 32, paddingBottom: 32 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700, color: 'var(--text-900)' }}>
          Data Administration
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--text-500)', fontWeight: 400 }}>
          Manage portfolio filter options and configurations
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
          {/* Category Cards */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-500)', letterSpacing: '0.05em' }}>
              Select Category
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    padding: '20px',
                    border: selectedCategory === cat.value ? '2px solid var(--primary)' : '1px solid #e7e7e7',
                    borderRadius: 12,
                    backgroundColor: selectedCategory === cat.value ? '#f0f7ff' : 'white',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: 15,
                    color: selectedCategory === cat.value ? 'var(--primary)' : 'var(--text-900)',
                    transition: 'all 0.2s',
                    boxShadow: selectedCategory === cat.value ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== cat.value) {
                      e.target.style.borderColor = '#d0d0d0';
                      e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== cat.value) {
                      e.target.style.borderColor = '#e7e7e7';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
                  <div style={{ fontSize: 14 }}>{cat.label}</div>
                  <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-500)', fontWeight: 400 }}>
                    {(filterOptions[cat.value] || []).length} items
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{currentCategoryLabel}</h2>
            <button
              onClick={handleAddOption}
              className="btn-primary"
            >
              <span className="btn-icon">+</span> Add {currentCategoryLabel}
            </button>
          </div>

          {/* Options Table */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-500)' }}>
              <div style={{ fontSize: 14 }}>Loading options...</div>
            </div>
          ) : currentCategoryOptions.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: 12,
              border: '1px solid #e7e7e7',
              color: 'var(--text-500)',
            }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>No options found</div>
              <div style={{ fontSize: 14 }}>Click "Add {currentCategoryLabel}" to create one</div>
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
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-700)' }}>Value</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-700)' }}>Display Name</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--text-700)' }}>Order</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--text-700)' }}>Status</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--text-700)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCategoryOptions
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((option, idx) => (
                      <tr key={option.optionId} style={{ 
                        borderBottom: '1px solid #e7e7e7',
                        backgroundColor: idx % 2 === 0 ? 'white' : '#fafbfc',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#fafbfc'}
                      >
                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: 'var(--text-600)' }}>
                          {option.value}
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--text-900)' }}>
                          {option.displayName}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-600)' }}>
                          {option.sortOrder}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: 6,
                            backgroundColor: option.isActive ? '#e8f5e9' : '#f3e5f5',
                            color: option.isActive ? '#2e7d32' : '#6a1b9a',
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            {option.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div className="actions-group">
                            <button
                              onClick={() => handleEditOption(option)}
                              className="btn-action btn-action--edit"
                              title="Edit option"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDeleteOption(option.optionId)}
                              className="btn-action btn-action--delete"
                              title="Delete option"
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
            {editingOption ? `Edit ${currentCategoryLabel}` : `Add New ${currentCategoryLabel}`}
          </h2>
          <form onSubmit={handleSubmit}>
            {!editingOption && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'var(--text-900)', fontSize: 14 }}>
                  Value *
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g., 2025, Cloud Services"
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
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'var(--text-900)', fontSize: 14 }}>
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="How this option appears to users"
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
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
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
                {editingOption ? 'Update' : 'Create'}
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
