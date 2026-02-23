import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';

export default function Dashboard() {
  const [kanban, setKanban] = useState({ Intake: [], 'Under Review': [], Completed: [] });
  const [portfolio, setPortfolio] = useState([]);
  const [reviewTokens, setReviewTokens] = useState({});
  const [reviewStatus, setReviewStatus] = useState('');

  useEffect(() => {
    apiGet('/dashboard/kanban').then(setKanban).catch(() => {});
    apiGet('/dashboard/portfolio').then(setPortfolio).catch(() => {});
  }, []);

  const launchReview = async (useCaseId) => {
    setReviewStatus('Creating review session...');
    try {
      const session = await apiPost('/reviewsessions', {
        useCaseId,
        assignedCoEId: 'coe-reviewer'
      });
      const invite = await apiPost('/reviewinvites', {
        sessionId: session.sessionId,
        canEdit: true
      });
      setReviewTokens((prev) => ({ ...prev, [useCaseId]: invite.token }));
      setReviewStatus('Review link created.');
    } catch (error) {
      setReviewStatus('Failed to create review link.');
    }
  };

  return (
    <div className="dashboard">
      <section className="app-panel">
        <div className="app-panel__header">
          <div>
            <h2 className="app-panel__title">Kanban</h2>
            <p className="app-hero__subtitle" style={{ color: 'var(--text-500)', marginTop: 6 }}>
              Move quickly from intake to review with one-click session setup.
            </p>
          </div>
          <div className="app-panel__actions">
            <a className="button button--ghost" href="/intake">Add Use Case</a>
            <a className="button button--primary" href="/review">Launch Review</a>
          </div>
        </div>
        <div className="kanban">
          {Object.entries(kanban).map(([lane, items]) => (
            <div key={lane} className="kanban-lane">
              <h3>{lane}</h3>
              {items.map((item) => (
                <div key={item.useCaseId} className="kanban-card">
                  <strong>{item.title}</strong>
                  <p>{item.businessUnit}</p>
                  {lane !== 'Completed' && (
                    <button
                      className="button button--primary"
                      type="button"
                      onClick={() => launchReview(item.useCaseId)}
                    >
                      Start Review
                    </button>
                  )}
                  {reviewTokens[item.useCaseId] && (
                    <div className="share-row">
                      <a
                        className="button button--ghost"
                        href={`/score?token=${reviewTokens[item.useCaseId]}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Review
                      </a>
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${window.location.origin}/score?token=${reviewTokens[item.useCaseId]}`
                          )
                        }
                      >
                        Copy Link
                      </button>
                      <span className="token">Token: {reviewTokens[item.useCaseId]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        {reviewStatus && <p className="status">{reviewStatus}</p>}
      </section>

      <section className="app-panel" style={{ marginTop: 24 }}>
        <h2 className="app-panel__title">Portfolio Ranking</h2>
        <div className="portfolio-list">
          {portfolio.map((item) => (
            <div key={item.useCaseId} className="portfolio-item">
              <div>
                <strong>{item.title}</strong>
                <p>{item.businessUnit}</p>
              </div>
              <span>{item.totals?.sComposite?.toFixed(2) ?? '--'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
