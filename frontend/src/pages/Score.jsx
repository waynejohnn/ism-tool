import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../api';

export default function Score() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      apiGet(`/review?token=${tokenParam}`).then((response) => {
        setCriteria(response.criteria);
      }).catch(() => {});
    }
  }, [searchParams]);

  const loadReview = async () => {
    const response = await apiGet(`/review?token=${token}`);
    setCriteria(response.criteria);
  };

  const updateScore = (criterionId, value) => {
    setScores((prev) => ({ ...prev, [criterionId]: value }));
  };

  const submitScores = async () => {
    setStatus('Submitting...');
    try {
      for (const criterion of criteria) {
        const rawScore = parseFloat(scores[criterion.criterionId]);
        if (!rawScore) continue;
        await apiPost(`/scores?token=${token}`, {
          criterionId: criterion.criterionId,
          rawScore
        });
      }
      setStatus('Submitted');
    } catch (error) {
      setStatus('Submission failed');
    }
  };

  return (
    <div className="app-panel">
      <h2 className="app-panel__title">Scoring Sheet</h2>
      <div className="form-grid">
        <label className="full">
          Review Token
          <input value={token} onChange={(e) => setToken(e.target.value)} />
        </label>
        <button className="button button--primary" onClick={loadReview}>Load Criteria</button>
      </div>
      <div className="score-grid">
        {criteria.map((criterion) => (
          <label key={criterion.criterionId} className="score-item">
            <span>{criterion.name}</span>
            <input
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={scores[criterion.criterionId] || ''}
              onChange={(e) => updateScore(criterion.criterionId, e.target.value)}
            />
            <small>{criterion.polarity}</small>
          </label>
        ))}
      </div>
      {criteria.length > 0 && (
        <button className="button button--primary" onClick={submitScores}>
          Submit Scores
        </button>
      )}
      {status && <p>{status}</p>}
    </div>
  );
}
