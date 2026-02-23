import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPatch } from '../api';

export default function UseCaseEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState('');
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
      .then((data) => {
        const useCase = data.useCase || {};
        let strategicDetails = useCase.strategicDetails || {
          Sales: '',
          Expenses: '',
          'Asset Optimization': '',
          Risk: ''
        };
        try {
          if (typeof strategicDetails === 'string') {
            strategicDetails = JSON.parse(strategicDetails);
          }
        } catch (e) {
          // keep as-is
        }
        setForm({
          ...useCase,
          strategicTheme: useCase.strategicTheme
            ? useCase.strategicTheme.split(',').map((item) => item.trim()).filter(Boolean)
            : [],
          capabilityAreas: useCase.capabilityAreas
            ? useCase.capabilityAreas.split(',').map((item) => item.trim()).filter(Boolean)
            : [],
          strategicDetails,
          targetYear: useCase.targetYear ? String(useCase.targetYear) : ''
        });
      })
      .catch(() => {});
  }, [id]);

  const handle = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const toggleStrategicTheme = (value) => {
    setForm((prev) => {
      const exists = prev.strategicTheme.includes(value);
      return {
        ...prev,
        strategicTheme: exists
          ? prev.strategicTheme.filter((item) => item !== value)
          : [...prev.strategicTheme, value]
      };
    });
  };

  const handleStrategicDetailChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      strategicDetails: {
        ...prev.strategicDetails,
        [key]: value
      }
    }));
  };

  const toggleCapabilityArea = (value) => {
    setForm((prev) => {
      const exists = prev.capabilityAreas.includes(value);
      return {
        ...prev,
        capabilityAreas: exists
          ? prev.capabilityAreas.filter((item) => item !== value)
          : [...prev.capabilityAreas, value]
      };
    });
  };

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

  if (!form) return <div className="app-panel">Loading…</div>;

  const submit = async () => {
    setStatus('Saving...');
    try {
      await apiPatch(`/usecases/${id}`, {
        title: form.title,
        description: form.description,
        businessUnit: form.businessUnit,
        strategicTheme: form.strategicTheme.join(', '),
        strategicDetails: JSON.stringify(form.strategicDetails),
        sponsor: form.sponsor,
        technicalSponsor: form.technicalSponsor,
        executiveSponsor: form.executiveSponsor,
        requestor: form.requestor,
        stakeholders: form.stakeholders,
        capabilityAreas: form.capabilityAreas.join(', '),
        targetYear: form.targetYear,
        outcomesJson: form.outcomesJson,
        status: form.status,
      });
      setStatus('Saved');
      nav(`/usecase/${id}`);
    } catch (e) {
      setStatus('Failed');
    }
  };

  return (
    <div className="app-panel">
      <h2 className="app-panel__title">Edit Use Case</h2>
      <div className="form-grid">
        <label>
          Project Name
          <input value={form.title || ''} onChange={(e) => handle('title', e.target.value)} />
        </label>
        <label>
          Requestor
          <input value={form.requestor || ''} onChange={(e) => handle('requestor', e.target.value)} />
        </label>
        <label>
          Department
          <input value={form.businessUnit || ''} onChange={(e) => handle('businessUnit', e.target.value)} />
        </label>
        <label>
          Business Sponsor
          <input value={form.sponsor || ''} onChange={(e) => handle('sponsor', e.target.value)} />
        </label>
        <label>
          Technical Sponsor
          <input value={form.technicalSponsor || ''} onChange={(e) => handle('technicalSponsor', e.target.value)} />
        </label>
        <label>
          Executive Sponsor
          <input value={form.executiveSponsor || ''} onChange={(e) => handle('executiveSponsor', e.target.value)} />
        </label>
        <label>
          Use Case Status
          <select
            className="status-select"
            value={form.status || 'Intake'}
            onChange={(e) => handle('status', e.target.value)}
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
        </label>
        <fieldset className="full">
          <legend>Strategic Alignment (SEAR)</legend>
          {['Sales', 'Expenses', 'Asset Optimization', 'Risk'].map((item) => (
            <div key={item} className="sear-row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.strategicTheme.includes(item)}
                  onChange={() => toggleStrategicTheme(item)}
                />
                {item}
              </label>
              <textarea
                placeholder={`Describe the ${item.toLowerCase()} alignment`}
                value={form.strategicDetails?.[item] || ''}
                onChange={(event) => handleStrategicDetailChange(item, event.target.value)}
              />
            </div>
          ))}
        </fieldset>
        <fieldset className="full">
          <legend>Capability Category</legend>
          <div className="capability-row" role="group" aria-label="Capability categories">
            {['AI', 'Data', 'DevOps', 'GIS'].map((item) => {
              const isActive = form.capabilityAreas.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  className={`capability-pill${isActive ? ' is-active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => toggleCapabilityArea(item)}
                >
                  <span className="capability-pill__icon">{item.charAt(0)}</span>
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="full">
          Problem / Opportunity
          <textarea value={form.description || ''} onChange={(e) => handle('description', e.target.value)} rows={4} />
        </label>
        <label className="full">
          Desired Outcomes
          <textarea value={form.outcomesJson || ''} onChange={(e) => handle('outcomesJson', e.target.value)} rows={3} />
        </label>
        <label>
          Target Year
          <div className="year-buttons">
            {availableYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`year-button${form.targetYear === year ? ' is-active' : ''}`}
                aria-pressed={form.targetYear === year}
                onClick={() => handle('targetYear', year)}
              >
                {year}
              </button>
            ))}
          </div>
        </label>
        <div className="form-actions">
          <button className="button button--primary" onClick={submit}>Save</button>
          <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
