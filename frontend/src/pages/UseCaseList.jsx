import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiGet, apiPatch } from '../api';

export default function UseCaseList() {
  const [list, setList] = useState([]);
  const location = useLocation();
  const [notice, setNotice] = useState('');

  useEffect(() => {
    apiGet('/dashboard/portfolio').then(setList).catch(() => setList([]));
  }, []);

  useEffect(() => {
    if (location.state?.deleted) {
      const title = location.state.title ? ` "${location.state.title}"` : '';
      setNotice(`Use case${title} was deleted successfully.`);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const updateStatus = async (useCaseId, nextStatus) => {
    try {
      await apiPatch(`/usecases/${useCaseId}`, { status: nextStatus });
      setList((prev) => prev.map((item) => (
        item.useCaseId === useCaseId ? { ...item, status: nextStatus } : item
      )));
      setNotice('Status updated successfully.');
    } catch (e) {
      setNotice('Unable to update status.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-header__title">Use Cases</h1>
        <p className="page-header__description">Track status, priority, and ownership across the portfolio.</p>
      </div>

      {notice && (
        <div className="alert alert--info">
          {notice}
        </div>
      )}

      <div className="table-card">
        <div className="table-card__header">
          <h3>Portfolio List</h3>
          <span className="table-card__count">{list.length} total</span>
        </div>
        <div className="table-card__body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Business Unit</th>
                <th>Capability</th>
                <th>Target Year</th>
                <th>Status</th>
                <th>Priority</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.useCaseId}>
                  <td className="data-table__title">{item.title}</td>
                  <td>{item.businessUnit || '—'}</td>
                  <td>{item.capabilityAreas || '—'}</td>
                  <td>{item.targetYear || '—'}</td>
                  <td>
                    <span className={`status-pill status-pill--${(item.status || 'Intake').toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.status || 'Intake'}
                    </span>
                  </td>
                  <td>
                    <span className="priority-pill">{item.totals?.priority ?? '—'}</span>
                  </td>
                  <td className="data-table__action">
                    <a className="btn btn--ghost" href={`/usecase/${item.useCaseId}`}>View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <div className="table-empty">No use cases found.</div>}
        </div>
      </div>
    </div>
  );
}
