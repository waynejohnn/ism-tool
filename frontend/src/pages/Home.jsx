// DESIGN LOCK: Do not change UI/UX without explicit project owner authorization.
import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api';

function StatusBarChart({ data }) {
  const maxValue = Math.max(...data.map(item => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        width: '100%'
      }}>
        {data.map((item, idx) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '13px'
              }}>
                <span style={{ 
                  fontWeight: 600, 
                  color: 'var(--text-700)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span 
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      background: item.color,
                      display: 'inline-block'
                    }}
                  />
                  {item.label}
                </span>
                <span style={{ 
                  fontWeight: 700, 
                  color: 'var(--text-900)',
                  fontSize: '14px'
                }}>
                  {item.value}
                </span>
              </div>
              <div style={{ 
                position: 'relative',
                height: '32px',
                background: 'var(--bg-100)',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border-200)'
              }}>
                <div 
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                    borderRadius: '7px',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: item.value > 0 ? `0 0 12px ${item.color}40` : 'none'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'linear-gradient(135deg, var(--bg-50) 0%, var(--bg-100) 100%)',
        borderRadius: '12px',
        border: '1px solid var(--border-200)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-600)', fontWeight: 600, marginBottom: '4px' }}>
          TOTAL USE CASES
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-900)' }}>
          {total}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [portfolio, setPortfolio] = useState([]);
  const [filters, setFilters] = useState({ targetYear: '', capability: '', executiveSponsor: '', status: '' });
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = () => {
      apiGet('/dashboard/portfolio')
        .then((data) => {
          if (isMounted) setPortfolio(data);
        })
        .catch(() => {
          if (isMounted) setPortfolio([]);
        });
    };
    load();
    const interval = setInterval(load, 30000);
    const handleFocus = () => load();
    window.addEventListener('focus', handleFocus);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filterOptions = useMemo(() => {
    const years = new Set();
    const capabilities = new Set();
    const sponsors = new Set();
    const statuses = new Set();
    portfolio.forEach((item) => {
      if (item.targetYear) years.add(String(item.targetYear));
      if (item.capabilityAreas) {
        item.capabilityAreas
          .split(',')
          .map((cap) => cap.trim())
          .filter(Boolean)
          .forEach((cap) => capabilities.add(cap));
      }
      if (item.executiveSponsor) sponsors.add(item.executiveSponsor);
      if (item.status) statuses.add(item.status);
    });
    return {
      years: Array.from(years).sort(),
      capabilities: Array.from(capabilities).sort(),
      sponsors: Array.from(sponsors).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }, [portfolio]);

  const filteredPortfolio = useMemo(() => {
    return portfolio.filter((item) => {
      const matchesYear = !filters.targetYear || String(item.targetYear || '') === filters.targetYear;
      const capabilities = item.capabilityAreas
        ? item.capabilityAreas.split(',').map((cap) => cap.trim()).filter(Boolean)
        : [];
      const matchesCapability = !filters.capability || capabilities.includes(filters.capability);
      const matchesSponsor = !filters.executiveSponsor || item.executiveSponsor === filters.executiveSponsor;
      const matchesStatus = !filters.status || (item.status || 'Intake') === filters.status;
      return matchesYear && matchesCapability && matchesSponsor && matchesStatus;
    });
  }, [portfolio, filters]);

  const metrics = useMemo(() => {
    const total = filteredPortfolio.length;
    const implemented = filteredPortfolio.filter((p) => p.status === 'Implemented').length;
    const approved = filteredPortfolio.filter((p) => p.status === 'Approved').length;
    const inReview = filteredPortfolio.filter((p) => p.status === 'In Review').length;
    const intake = filteredPortfolio.filter((p) => !p.status || p.status === 'Intake').length;
    const onHold = filteredPortfolio.filter((p) => p.status === 'On Hold').length;
    const priorityScores = filteredPortfolio
      .map((p) => {
        const priority = p.totals?.priority;
        if (typeof priority === 'string') {
          const match = priority.match(/^P(\d)/);
          return match ? parseInt(match[1], 10) : null;
        }
        return typeof priority === 'number' ? priority : null;
      })
      .filter((score) => score != null);
    const avgPriority = priorityScores.length
      ? (priorityScores.reduce((sum, value) => sum + value, 0) / priorityScores.length).toFixed(1)
      : '—';
    return { total, implemented, approved, inReview, intake, onHold, avgPriority };
  }, [filteredPortfolio]);

  const quadrantSummary = useMemo(() => {
    const VALUE_MIDPOINT = 2.13; // Midpoint of sValue dimension
    const FC_MIDPOINT = 2.09; // Midpoint of (sFeasibility + sOrgCapability) / 2
    return filteredPortfolio.reduce(
      (acc, useCase) => {
        if (!useCase.totals) return acc;
        const valueScore = useCase.totals.sValue != null ? Number(useCase.totals.sValue) : null;
        const feasibility = useCase.totals.sFeasibility != null ? Number(useCase.totals.sFeasibility) : null;
        const orgCap = useCase.totals.sOrgCapability != null ? Number(useCase.totals.sOrgCapability) : null;
        const capabilityScore = feasibility != null && orgCap != null
          ? (feasibility + orgCap) / 2
          : feasibility != null
            ? feasibility
            : orgCap;
        if (valueScore == null || capabilityScore == null) return acc;
        const valueHigh = valueScore >= VALUE_MIDPOINT;
        const fcHigh = capabilityScore >= FC_MIDPOINT;
        if (valueHigh && fcHigh) acc.accelerate += 1;
        else if (valueHigh && !fcHigh) acc.streamline += 1;
        else if (!valueHigh && fcHigh) acc.transform += 1;
        else acc.incubate += 1;
        return acc;
      },
      { accelerate: 0, streamline: 0, transform: 0, incubate: 0 }
    );
  }, [filteredPortfolio]);

  const topCandidates = useMemo(() => {
    return [...filteredPortfolio]
      .sort((a, b) => (b.totals?.priority ?? 0) - (a.totals?.priority ?? 0))
      .slice(0, 3);
  }, [filteredPortfolio]);

  const matrixStats = useMemo(() => {
    return filteredPortfolio.reduce(
      (acc, useCase) => {
        const totals = useCase.totals;
        if (!totals) return acc;
        const valueScore = totals.sValue != null ? Number(totals.sValue) : null;
        const feasibility = totals.sFeasibility != null ? Number(totals.sFeasibility) : null;
        const orgCap = totals.sOrgCapability != null ? Number(totals.sOrgCapability) : null;
        const capabilityScore = feasibility != null && orgCap != null
          ? (feasibility + orgCap) / 2
          : feasibility != null
            ? feasibility
            : orgCap;
        if (capabilityScore == null) acc.missingCapability += 1;
        if (valueScore == null) acc.missingValue += 1;
        return acc;
      },
      { missingCapability: 0, missingValue: 0 }
    );
  }, [filteredPortfolio]);

  const refreshStamp = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date());
  const currentYear = new Date().getFullYear();

  const getScoreTier = (score) => {
    if (score == null || Number.isNaN(Number(score))) return 'neutral';
    const value = Number(score);
    if (value >= 2.4) return 'high';
    if (value >= 2.0) return 'mid';
    if (value >= 1.4) return 'low';
    return 'risk';
  };

  return (
    <div className="home-grid">
      <section className="app-panel home-panel">
        <div className="home-header">
          <div>
            <p className="home-label">Portfolio pulse</p>
            <h2 className="app-panel__title">Innovation Use Case Portfolio</h2>
            <p className="home-subtitle">At-a-glance view into value delivery, readiness, and prioritization for the current intake.</p>
          </div>
          <div className="home-meta">
            <span>Updated {refreshStamp}</span>
          </div>
        </div>

        <div className="home-filters">
          <div className="home-filter">
            <label>Target Year</label>
            <select
              value={filters.targetYear}
              onChange={(event) => setFilters((prev) => ({ ...prev, targetYear: event.target.value }))}
            >
              <option value="">All</option>
              {filterOptions.years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="home-filter">
            <label>Capability Category</label>
            <select
              value={filters.capability}
              onChange={(event) => setFilters((prev) => ({ ...prev, capability: event.target.value }))}
            >
              <option value="">All</option>
              {filterOptions.capabilities.map((capability) => (
                <option key={capability} value={capability}>{capability}</option>
              ))}
            </select>
          </div>
          <div className="home-filter">
            <label>Executive Sponsor</label>
            <select
              value={filters.executiveSponsor}
              onChange={(event) => setFilters((prev) => ({ ...prev, executiveSponsor: event.target.value }))}
            >
              <option value="">All</option>
              {filterOptions.sponsors.map((sponsor) => (
                <option key={sponsor} value={sponsor}>{sponsor}</option>
              ))}
            </select>
          </div>
          <div className="home-filter">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="">All</option>
              {filterOptions.statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="home-filter-actions">
            <button
              className="button button--ghost"
              onClick={() => setFilters({ targetYear: '', capability: '', executiveSponsor: '', status: '' })}
            >
              Clear Filters
            </button>
            <button
              className="button button--primary"
              onClick={() => setFilters({ targetYear: String(currentYear), capability: '', executiveSponsor: '', status: '' })}
            >
              Current Year
            </button>
          </div>
        </div>

        <div className="home-metrics">
          <article className="metric-card">
            <span>Total Use Cases</span>
            <strong>{metrics.total}</strong>
            <small>{metrics.intake} in intake</small>
          </article>
          <article className="metric-card">
            <span>In Review</span>
            <strong>{metrics.inReview}</strong>
            <small>Scoring in progress</small>
          </article>
          <article className="metric-card">
            <span>Approved</span>
            <strong>{metrics.approved}</strong>
            <small>Ready for implementation</small>
          </article>
          <article className="metric-card">
            <span>Implemented</span>
            <strong>{metrics.implemented}</strong>
            <small>Completed projects</small>
          </article>
        </div>

        <div className="home-matrix">
          <div className="home-matrix__header">
            <div>
              <h3>Prioritization Matrix</h3>
              <p>Composite value (x) vs. fit/complexity (y).</p>
              {matrixStats.missingCapability > 0 && (
                <p className="matrix-warning">Portfolio grid not applicable for {matrixStats.missingCapability} item(s) with no capability score.</p>
              )}
              {matrixStats.missingValue > 0 && (
                <p className="matrix-warning">Value is N/A for {matrixStats.missingValue} item(s); capability-only placement shown.</p>
              )}
            </div>
            <div className="legend">
              <span>Value →</span>
              <span>Fit / Complexity ↑</span>
            </div>
          </div>
          <div className="home-matrix__chart">
            <svg viewBox="0 0 100 100" className="home-matrix__svg" role="img" aria-label="Use case prioritization matrix">
              <line x1="0" y1="50" x2="100" y2="50" />
              <line x1="50" y1="0" x2="50" y2="100" />
            </svg>
            <div className="matrix-quadrant-label matrix-quadrant-label--top-left">Strategic Bets</div>
            <div className="matrix-quadrant-label matrix-quadrant-label--top-right">Quick Wins</div>
            <div className="matrix-quadrant-label matrix-quadrant-label--bottom-left">Re-evaluate</div>
            <div className="matrix-quadrant-label matrix-quadrant-label--bottom-right">Opportunistic</div>
            {filteredPortfolio
              .filter((p) => p.totals)
              .map((p) => {
                const valueScore = p.totals?.sValue != null ? Number(p.totals.sValue) : null;
                const feasibility = p.totals?.sFeasibility != null ? Number(p.totals.sFeasibility) : null;
                const orgCap = p.totals?.sOrgCapability != null ? Number(p.totals.sOrgCapability) : null;
                const capabilityScore = feasibility != null && orgCap != null
                  ? (feasibility + orgCap) / 2
                  : feasibility != null
                    ? feasibility
                    : orgCap;
                if (capabilityScore == null) {
                  return null;
                }
                const x = valueScore == null
                  ? 50
                  : Math.min(95, Math.max(5, ((valueScore - 1) / 2) * 100));
                const y = Math.min(95, Math.max(5, 100 - (((capabilityScore - 1) / 2) * 100)));
                const tier = getScoreTier(p.totals?.sComposite);
                return (
                  <div
                    key={p.useCaseId}
                    className={`matrix-point matrix-point--${tier}`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onMouseEnter={() => setHovered(p.useCaseId)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span>{p.useCaseNumber || '—'}</span>
                    {hovered === p.useCaseId && (
                      <div className="matrix-tooltip">
                        <div className="matrix-tooltip__title">Use Case #{p.useCaseNumber || '—'}</div>
                        <div className="matrix-tooltip__subtitle">{p.title || 'Untitled Use Case'}</div>
                        <div className="matrix-tooltip__meta">
                          <span>{p.businessUnit || 'Unassigned'}</span>
                          <span>{p.status || 'Intake'}</span>
                          <span>Priority {p.totals?.priority ?? '—'}</span>
                        </div>
                        <div className="matrix-tooltip__scores">
                          <div>Value: {p.totals?.sValue != null ? Number(p.totals.sValue).toFixed(2) : '—'}</div>
                          <div>Feasibility: {p.totals?.sFeasibility != null ? Number(p.totals.sFeasibility).toFixed(2) : '—'}</div>
                          <div>Org Cap: {p.totals?.sOrgCapability != null ? Number(p.totals.sOrgCapability).toFixed(2) : '—'}</div>
                          <div>Strategic: {p.totals?.sStrategic != null ? Number(p.totals.sStrategic).toFixed(2) : '—'}</div>
                          <div>Composite: {p.totals?.sComposite != null ? Number(p.totals.sComposite).toFixed(2) : '—'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
          <div className="home-matrix__legend">
            <div className="legend-item">
              <span className="legend-pill">Accelerate</span>
              <strong>{quadrantSummary.accelerate}</strong>
            </div>
            <div className="legend-item">
              <span className="legend-pill">Streamline</span>
              <strong>{quadrantSummary.streamline}</strong>
            </div>
            <div className="legend-item">
              <span className="legend-pill">Transform</span>
              <strong>{quadrantSummary.transform}</strong>
            </div>
            <div className="legend-item">
              <span className="legend-pill">Incubate</span>
              <strong>{quadrantSummary.incubate}</strong>
            </div>
          </div>
        </div>

        <div className="home-spotlight">
          <h3>Spotlight</h3>
          <p>Top scoring candidates ready for executive review.</p>
          <div className="spotlight-list">
            {topCandidates.map((useCase) => (
              <div key={useCase.useCaseId} className="spotlight-item">
                <div>
                  <div className="spotlight-title">{useCase.title}</div>
                  <div className="spotlight-meta">{useCase.businessUnit || 'Unassigned'}</div>
                </div>
                <div className="spotlight-score">{useCase.totals?.priority ?? '—'}</div>
              </div>
            ))}
            {!topCandidates.length && <div className="spotlight-empty">No scored use cases yet.</div>}
          </div>
          <div className="status-distribution">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-700)', marginBottom: '16px', textAlign: 'center' }}>Status Distribution</h4>
            <StatusBarChart 
              data={[
                { label: 'Intake', value: metrics.intake, color: '#94a3b8' },
                { label: 'In Review', value: metrics.inReview, color: '#3b82f6' },
                { label: 'Approved', value: metrics.approved, color: '#22c55e' },
                { label: 'Implemented', value: metrics.implemented, color: '#8b5cf6' },
                { label: 'On Hold', value: metrics.onHold, color: '#f59e0b' }
              ]}
            />
          </div>
        </div>

        <div className="home-table">
          <div className="home-table__header">
            <h3>Portfolio Detail</h3>
            <p>Track readiness, ownership, and scoring status for every submission.</p>
          </div>
          <div className="home-table__scroll">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Business Unit</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Strategic Theme</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredPortfolio.map((item) => (
                  <tr key={item.useCaseId}>
                    <td>{item.title}</td>
                    <td>{item.businessUnit || '—'}</td>
                    <td>{item.status || 'Intake'}</td>
                    <td>{item.totals?.priority ?? '—'}</td>
                    <td>{item.strategicTheme || '—'}</td>
                    <td>
                      <a className="button button--ghost" href={`/usecase/${item.useCaseId}`}>View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredPortfolio.length && <div className="home-table__empty">No use cases match the selected filters.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
