import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api';

const initialState = {
  title: '',
  requestor: '',
  businessUnit: '',
  sponsor: '',
  technicalSponsor: '',
  executiveSponsor: '',
  stakeholders: [],
  stakeholderInput: '',
  description: '',
  strategicTheme: [],
  strategicDetails: {
    Sales: '',
    Expenses: '',
    'Asset Optimization': '',
    Risk: ''
  },
  capabilityAreas: [],
  targetYear: '',
  outcomesJson: '',
  expectedTimeline: ''
};

export default function Intake() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

  const addStakeholder = () => {
    const trimmed = form.stakeholderInput.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      stakeholders: [...prev.stakeholders, trimmed],
      stakeholderInput: ''
    }));
  };

  const removeStakeholder = (index) => {
    setForm((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('Submitting...');
    try {
      const created = await apiPost('/usecases', {
        ...form,
        stakeholders: form.stakeholders.join(', '),
        strategicTheme: form.strategicTheme.join(', '),
        strategicDetails: JSON.stringify(form.strategicDetails),
        capabilityAreas: form.capabilityAreas.join(', '),
        targetYear: form.targetYear
      });
      setStatus('Thank you for submitting the use case successfully.');
      const useCaseId = created?.useCaseId;
      if (useCaseId) {
        setTimeout(() => navigate(`/usecase/${useCaseId}`), 600);
      } else {
        setForm(initialState);
      }
    } catch (error) {
      setStatus('Submission failed');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-header__title">Use Case Intake</h1>
        <p className="page-header__description">Submit a new use case for evaluation and prioritization</p>
      </div>
      
      <form className="modern-form" onSubmit={handleSubmit}>
        <div className="form-section form-section--core">
          <h3 className="form-section__title">Core Details</h3>
          <div className="form-grid form-grid--core">
            <div className="form-field">
              <label className="form-label">
                Project Name
                <span className="form-label__required">*</span>
              </label>
              <input 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                required 
                className="form-input"
              />
            </div>
            
            <div className="form-field">
              <label className="form-label">Requestor</label>
              <input 
                name="requestor" 
                value={form.requestor} 
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-field">
              <label className="form-label">Department</label>
              <input 
                name="businessUnit" 
                value={form.businessUnit} 
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-field form-field--sponsors">
              <label className="form-label">Business Sponsor</label>
              <input 
                name="sponsor" 
                value={form.sponsor} 
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-field form-field--sponsors">
              <label className="form-label">Technical Sponsor</label>
              <input 
                name="technicalSponsor" 
                value={form.technicalSponsor} 
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-field form-field--sponsors">
              <label className="form-label">Executive Sponsor</label>
              <input 
                name="executiveSponsor" 
                value={form.executiveSponsor} 
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-field form-field--full">
            <label className="form-label">Stakeholders</label>
            <div className="chip-input-group">
              <input
                name="stakeholderInput"
                value={form.stakeholderInput}
                onChange={handleChange}
                placeholder="Add stakeholder name"
                className="form-input"
              />
              <button type="button" className="btn btn--secondary btn--compact" onClick={addStakeholder}>
                <span className="btn__icon">+</span>
                Add
              </button>
            </div>
            <div className="chip-list">
              {form.stakeholders.map((stakeholder, index) => (
                <span key={`${stakeholder}-${index}`} className="chip">
                  {stakeholder}
                  <button type="button" className="chip__remove" onClick={() => removeStakeholder(index)} aria-label="Remove stakeholder">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section__title">Strategic Alignment (SEAR)</h3>
          <div className="sear-grid">
            <div className="sear-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.strategicTheme.includes('Sales')}
                  onChange={() => toggleStrategicTheme('Sales')}
                  className="checkbox-input"
                />
                <span>Sales (S)</span>
              </label>
              <textarea
                placeholder="Describe the sales alignment"
                value={form.strategicDetails.Sales}
                onChange={(event) => handleStrategicDetailChange('Sales', event.target.value)}
                className="form-textarea"
              />
            </div>
            
            <div className="sear-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.strategicTheme.includes('Expenses')}
                  onChange={() => toggleStrategicTheme('Expenses')}
                  className="checkbox-input"
                />
                <span>Expenses (E)</span>
              </label>
              <textarea
                placeholder="Describe the expense alignment"
                value={form.strategicDetails.Expenses}
                onChange={(event) => handleStrategicDetailChange('Expenses', event.target.value)}
                className="form-textarea"
              />
            </div>
            
            <div className="sear-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.strategicTheme.includes('Asset Optimization')}
                  onChange={() => toggleStrategicTheme('Asset Optimization')}
                  className="checkbox-input"
                />
                <span>Asset Optimization (A)</span>
              </label>
              <textarea
                placeholder="Describe the asset optimization alignment"
                value={form.strategicDetails['Asset Optimization']}
                onChange={(event) => handleStrategicDetailChange('Asset Optimization', event.target.value)}
                className="form-textarea"
              />
            </div>
            
            <div className="sear-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.strategicTheme.includes('Risk')}
                  onChange={() => toggleStrategicTheme('Risk')}
                  className="checkbox-input"
                />
                <span>Risk (R)</span>
              </label>
              <textarea
                placeholder="Describe the risk alignment"
                value={form.strategicDetails.Risk}
                onChange={(event) => handleStrategicDetailChange('Risk', event.target.value)}
                className="form-textarea"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section__title">Capability Category</h3>
          <div className="capability-pills" role="group" aria-label="Capability categories">
            {['AI', 'Data', 'DevOps', 'GIS'].map((item) => {
              const isActive = form.capabilityAreas.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  className={`capability-pill${isActive ? ' capability-pill--active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => toggleCapabilityArea(item)}
                >
                  <span className="capability-pill__icon">{item.charAt(0)}</span>
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section__title">Opportunity & Outcomes</h3>
          <div className="form-field form-field--full">
            <label className="form-label">Problem / Opportunity</label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              rows="4"
              className="form-textarea"
            />
          </div>
          
          <div className="form-field form-field--full">
            <label className="form-label">Desired Outcomes</label>
            <textarea 
              name="outcomesJson" 
              value={form.outcomesJson} 
              onChange={handleChange} 
              rows="3"
              className="form-textarea"
            />
          </div>
          
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Expected Timeline</label>
              <input 
                name="expectedTimeline" 
                value={form.expectedTimeline} 
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-field">
              <label className="form-label">Target Year</label>
              <div className="year-button-group">
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const startYear = Math.max(2025, currentYear);
                  const endYear = Math.min(2040, currentYear + 3);
                  const years = [];
                  for (let year = startYear; year <= endYear; year += 1) {
                    years.push(year);
                  }
                  return years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      className={`year-button${form.targetYear === String(year) ? ' year-button--active' : ''}`}
                      aria-pressed={form.targetYear === String(year)}
                      onClick={() => setForm((prev) => ({ ...prev, targetYear: String(year) }))}
                    >
                      {year}
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn--primary" type="submit">Submit Intake</button>
          {status && <span className="status-message">{status}</span>}
        </div>
      </form>
    </div>
  );
}
