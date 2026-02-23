import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiDelete, apiGet, apiPatch, apiPost } from '../api';

export default function UseCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    // Fetch valid statuses
    apiGet('/statuses')
      .then((data) => setStatuses(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    apiGet(`/usecases/${id}/detail`)
      .then((response) => {
        setData(response);
        setSelectedStatus(response?.useCase?.status || 'Intake');
      })
      .catch(() => setError('Failed to load use case'));
  }, [id]);

  const useCase = data?.useCase || {};
  let strategicDetails = useCase.strategicDetails || null;
  try {
    if (strategicDetails && typeof strategicDetails === 'string') {
      strategicDetails = JSON.parse(strategicDetails);
    }
  } catch (e) {
    // keep as string
  }

  const capabilityAreas = useCase.capabilityAreas
    ? useCase.capabilityAreas.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  const strategicThemeList = useCase.strategicTheme
    ? useCase.strategicTheme.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  const availableYears = (() => {
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2025, currentYear);
    const endYear = Math.min(2040, currentYear + 3);
    const years = [];
    for (let year = startYear; year <= endYear; year += 1) {
      years.push(String(year));
    }
    return years;
  })();

  if (error) return <div className="app-panel">{error}</div>;
  if (!data) return <div className="app-panel">Loading…</div>;

  const handleReview = async () => {
    setStatus('Creating review session...');
    try {
      const session = await apiPost('/reviewsessions', { useCaseId: useCase.useCaseId, assignedCoEId: '' });
      const invite = await apiPost('/reviewinvites', { sessionId: session.sessionId, canEdit: true });
      setStatus('Review ready');
      navigate(`/review?token=${invite.token}`);
    } catch (e) {
      setStatus('Unable to start review');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this use case? This cannot be undone.');
    if (!confirmed) return;
    setStatus('Deleting...');
    try {
      await apiDelete(`/usecases/${useCase.useCaseId}`);
      navigate('/use-cases', { state: { deleted: true, title: useCase.title } });
    } catch (e) {
      setStatus('Unable to delete use case');
    }
  };

  const updateStatus = async () => {
    setStatus('Updating status...');
    try {
      await apiPatch(`/usecases/${useCase.useCaseId}`, { status: selectedStatus });
      setStatus('Status updated');
    } catch (e) {
      setStatus('Unable to update status');
    }
  };

  return (
    <div className="app-panel">
      <div className="app-panel__header">
        <div>
          <h2 className="app-panel__title">Use Case Detail</h2>
          <p style={{ color: 'var(--text-500)' }}>{useCase.title}</p>
        </div>
        <div className="app-panel__actions">
          <button className="button button--ghost" onClick={handleReview}>Review</button>
          <Link className="button button--ghost" to={`/usecase/${useCase.useCaseId}/edit`}>Edit</Link>
          <button className="button button--ghost" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Project Name
          <input value={useCase.title || ''} readOnly />
        </label>
        <label>
          Requestor
          <input value={useCase.requestor || ''} readOnly />
        </label>
        <label>
          Department
          <input value={useCase.businessUnit || ''} readOnly />
        </label>
        <label>
          Business Sponsor
          <input value={useCase.sponsor || ''} readOnly />
        </label>
        <label>
          Technical Sponsor
          <input value={useCase.technicalSponsor || ''} readOnly />
        </label>
        <label>
          Executive Sponsor
          <input value={useCase.executiveSponsor || ''} readOnly />
        </label>
        <fieldset className="full">
          <legend>Strategic Alignment (SEAR)</legend>
          {['Sales', 'Expenses', 'Asset Optimization', 'Risk'].map((item) => (
            <div key={item} className="sear-row">
              <label className="checkbox">
                <input type="checkbox" checked={strategicThemeList.includes(item)} readOnly />
                {item}
              </label>
              <textarea
                readOnly
                value={(strategicDetails && strategicDetails[item]) || ''}
                placeholder="No details provided"
              />
            </div>
          ))}
        </fieldset>
        <fieldset className="full">
          <legend>Capability Category</legend>
          <div className="capability-row" role="group" aria-label="Capability categories">
            {['AI', 'Data', 'DevOps', 'GIS'].map((item) => {
              const isActive = capabilityAreas.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  className={`capability-pill${isActive ? ' is-active' : ''}`}
                  aria-pressed={isActive}
                  disabled
                >
                  <span className="capability-pill__icon">{item.charAt(0)}</span>
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <label>
          Use Case Status
          <div className="status-control">
            <select
              className="status-select"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              {statuses.length > 0 ? (
                statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.displayName}
                  </option>
                ))
              ) : (
                <option value="Intake">Intake</option>
              )}
            </select>
            <button className="button button--primary" type="button" onClick={updateStatus}>Update Status</button>
          </div>
        </label>
        <label className="full">
          Problem / Opportunity
          <textarea value={useCase.description || ''} readOnly rows={4} />
        </label>
        <label className="full">
          Desired Outcomes
          <textarea value={useCase.outcomesJson || ''} readOnly rows={3} />
        </label>
        <label>
          Target Year
          <div className="year-buttons">
            {availableYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`year-button${String(useCase.targetYear || '') === year ? ' is-active' : ''}`}
                aria-pressed={String(useCase.targetYear || '') === year}
                disabled
              >
                {year}
              </button>
            ))}
          </div>
        </label>
        <div className="form-actions">
          <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
