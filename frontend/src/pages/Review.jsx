import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../api';

const DIMENSIONS = [
  { raw: 'Value', key: 'Value', label: 'Value', weight: 0.35, weightLabel: '35%', color: '#1b5e20' },
  { raw: 'Feasibility', key: 'Feasibility', label: 'Feasibility', weight: 0.25, weightLabel: '25%', color: '#0d47a1' },
  { raw: 'Organizational', key: 'Organizational Capability', label: 'Org Capability', weight: 0.25, weightLabel: '25%', color: '#1565c0' },
  { raw: 'Strategic', key: 'Strategic Alignment & Risk', label: 'Strategic & Risk', weight: 0.15, weightLabel: '15%', color: '#e65100' }
];

const dimensionMap = DIMENSIONS.reduce((acc, dim) => {
  acc[dim.raw] = dim.key;
  return acc;
}, {});

const ISM_ITEMS = [
  {
    criterionId: 'C01',
    dimension: 'Value',
    name: 'Financial Impact',
    guidanceText: 'How much measurable financial value will the initiative generate?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C02',
    dimension: 'Value',
    name: 'Health & Safety Impact',
    guidanceText: 'To what extent does the initiative reduce safety incidents or improve well-being?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C03',
    dimension: 'Value',
    name: 'Risk Mitigation',
    guidanceText: 'How effectively does the initiative reduce operational, compliance, or strategic risks?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C04',
    dimension: 'Value',
    name: 'Customer Experience Impact',
    guidanceText: 'How significantly will customer satisfaction or service quality improve?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C05',
    dimension: 'Value',
    name: 'Employee Experience Impact',
    guidanceText: 'How much does the initiative improve employee workflows or satisfaction?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C06',
    dimension: 'Value',
    name: 'Environmental Impact',
    guidanceText: 'What positive environmental or sustainability benefits will be realized?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C07',
    dimension: 'Value',
    name: 'Regulatory/Compliance Value',
    guidanceText: 'How strongly does the initiative support compliance obligations?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C08',
    dimension: 'Feasibility',
    name: 'Solution Complexity',
    guidanceText: 'How complex is the solution architecture or implementation?',
    polarity: 'COST'
  },
  {
    criterionId: 'C09',
    dimension: 'Feasibility',
    name: 'Data Availability',
    guidanceText: 'Is the required data accessible and complete?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C10',
    dimension: 'Feasibility',
    name: 'Data Quality',
    guidanceText: 'Is the data accurate, timely, and fit for use?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C11',
    dimension: 'Feasibility',
    name: 'Technical Maturity',
    guidanceText: 'How proven and stable is the underlying technology?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C12',
    dimension: 'Feasibility',
    name: 'Integration Complexity',
    guidanceText: 'How difficult will integration with existing systems be?',
    polarity: 'COST'
  },
  {
    criterionId: 'C13',
    dimension: 'Organizational',
    name: 'Leadership Priority & Commitment',
    guidanceText: 'How strongly do executives support this initiative?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C14',
    dimension: 'Organizational',
    name: 'Business Ownership & SME Availability',
    guidanceText: 'Are business owners and SMEs available and engaged?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C15',
    dimension: 'Organizational',
    name: 'Engineering/Technical Capacity',
    guidanceText: 'Does the organization have the technical resources to deliver?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C16',
    dimension: 'Organizational',
    name: 'Budget Availability',
    guidanceText: 'Is funding secured or readily accessible?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C17',
    dimension: 'Organizational',
    name: 'Process Maturity',
    guidanceText: 'Are supporting processes standardized and reliable?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C18',
    dimension: 'Organizational',
    name: 'Stakeholder Complexity & Adoption Risk',
    guidanceText: 'How difficult will stakeholder alignment and adoption be?',
    polarity: 'COST'
  },
  {
    criterionId: 'C19',
    dimension: 'Organizational',
    name: 'Time to First Impact',
    guidanceText: 'How quickly can the initiative deliver measurable value?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C20',
    dimension: 'Organizational',
    name: 'Year-One Value Capture',
    guidanceText: 'How much value can realistically be realized in the first year?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C21',
    dimension: 'Strategic',
    name: 'Strategic Theme Alignment',
    guidanceText: 'How well does the initiative align with enterprise strategy?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C22',
    dimension: 'Strategic',
    name: 'Portfolio Balance Contribution',
    guidanceText: 'Does the initiative help maintain a balanced portfolio?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C23',
    dimension: 'Strategic',
    name: 'Long-Term Roadmap Fit',
    guidanceText: 'Does the initiative support long-term architectural or operational roadmaps?',
    polarity: 'BENEFIT'
  },
  {
    criterionId: 'C24',
    dimension: 'Strategic',
    name: 'Cybersecurity Risk',
    guidanceText: 'What level of cybersecurity exposure does the initiative introduce?',
    polarity: 'COST'
  },
  {
    criterionId: 'C25',
    dimension: 'Strategic',
    name: 'Privacy Risk',
    guidanceText: 'What privacy or data protection risks exist?',
    polarity: 'COST'
  },
  {
    criterionId: 'C26',
    dimension: 'Strategic',
    name: 'Operational Risk',
    guidanceText: 'What operational disruptions could the initiative introduce?',
    polarity: 'COST'
  },
  {
    criterionId: 'C27',
    dimension: 'Strategic',
    name: 'Change Saturation Risk',
    guidanceText: 'Does the initiative contribute to organizational change fatigue?',
    polarity: 'COST'
  },
  {
    criterionId: 'C28',
    dimension: 'Strategic',
    name: 'Strategic Opportunity Cost',
    guidanceText: 'What is the cost of not pursuing this initiative relative to alternatives?',
    polarity: 'BENEFIT'
  }
];

export default function Review() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [useCase, setUseCase] = useState(null);
  const [criteria, setCriteria] = useState(ISM_ITEMS);
  const [scores, setScores] = useState({});
  const [itemNA, setItemNA] = useState({});
  const [dimensionNA, setDimensionNA] = useState({
    Value: false,
    Feasibility: false,
    'Organizational Capability': false,
    'Strategic Alignment & Risk': false
  });
  const [dimensionJustifications, setDimensionJustifications] = useState({
    Value: '',
    Feasibility: '',
    'Organizational Capability': '',
    'Strategic Alignment & Risk': ''
  });
  const [reviewerApproval, setReviewerApproval] = useState(false);
  const [technicalInitiative, setTechnicalInitiative] = useState(false);
  const [backendTotals, setBackendTotals] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const response = await apiGet(`/review?token=${token}`);
        let savedScores = [];
        try {
          savedScores = await apiGet(`/scores?token=${token}`);
        } catch (scoreErr) {
          console.error('Error loading saved scores:', scoreErr);
          savedScores = [];
        }
        console.log('Fetched savedScores from API:', savedScores);
        setUseCase(response.useCase);
        setDimensionNA({
          Value: Boolean(response.useCase?.naValue),
          Feasibility: Boolean(response.useCase?.naFeasibility),
          'Organizational Capability': Boolean(response.useCase?.naOrgCapability),
          'Strategic Alignment & Risk': Boolean(response.useCase?.naStrategic)
        });
        setDimensionJustifications({
          Value: response.useCase?.naValueJustification || '',
          Feasibility: response.useCase?.naFeasibilityJustification || '',
          'Organizational Capability': response.useCase?.naOrgCapabilityJustification || '',
          'Strategic Alignment & Risk': response.useCase?.naStrategicJustification || ''
        });
        setReviewerApproval(Boolean(response.useCase?.naReviewerApproval));
        setTechnicalInitiative(Boolean(response.useCase?.naTechnicalInitiative));
        
        setBackendTotals(response.useCase?.totals || null);
        
        const nextItemNA = {};
        setScores((prev) => {
          const next = { ...prev };
          console.log('API Response savedScores array:', Array.isArray(savedScores), 'length:', savedScores?.length);
          (savedScores || []).forEach((score) => {
            console.log(`  Processing score: ${score.criterionId} = ${score.rawScore}`);
            if (score.isNA) {
              nextItemNA[score.criterionId] = true;
            } else if (score.rawScore != null) {
              next[score.criterionId] = Number(score.rawScore);
            }
          });
          ISM_ITEMS.forEach((criterion) => {
            if (next[criterion.criterionId] == null) {
              next[criterion.criterionId] = 2.0;
            }
          });
          console.log('Loaded scores object:', next);
          console.log('Sample scores - C01:', next['C01'], ', C13:', next['C13'], ', C21:', next['C21']);
          return next;
        });
        setItemNA((prev) => ({ ...prev, ...nextItemNA }));
        setError('');
      } catch (err) {
        console.error('Error loading review:', err);
        setError('Unable to load review inputs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const groupedCriteria = useMemo(() => {
    const result = criteria.reduce((acc, criterion) => {
      const mappedKey = dimensionMap[criterion.dimension] || criterion.dimension || 'General';
      acc[mappedKey] = acc[mappedKey] || [];
      acc[mappedKey].push(criterion);
      return acc;
    }, {});
    console.log('GroupedCriteria recalculated:', result);
    return result;
  }, [criteria]);

  const dimensionItemCounts = useMemo(() => {
    const counts = {};
    DIMENSIONS.forEach((dimension) => {
      const items = groupedCriteria[dimension.key] || [];
      const applicableItems = items.filter(
        (item) => !dimensionNA[dimension.key] && !itemNA[item.criterionId]
      );
      counts[dimension.key] = {
        applicable: applicableItems.length,
        total: items.length
      };
    });
    return counts;
  }, [groupedCriteria, dimensionNA, itemNA]);

  const dimensionScores = useMemo(() => {
    const result = {};
    DIMENSIONS.forEach((dimension) => {
      if (dimensionNA[dimension.key]) {
        result[dimension.key] = 'N/A';
        return;
      }
      const items = groupedCriteria[dimension.key] || [];
      const applicableItems = items.filter((item) => !itemNA[item.criterionId]);
      const normalizedScores = applicableItems.map((item) => {
        const rawScore = scores[item.criterionId] ?? 2.0;
        return item.polarity === 'COST' ? 4.0 - rawScore : rawScore;
      });
      const total = normalizedScores.reduce((sum, score) => sum + score, 0);
      result[dimension.key] = applicableItems.length > 0 ? (total / applicableItems.length).toFixed(2) : '—';
    });
    console.log('Dimension scores calculated:', result);
    return result;
  }, [groupedCriteria, scores, itemNA, dimensionNA]);

  const naDimensionCount = useMemo(() => {
    return Object.values(dimensionNA).filter(Boolean).length;
  }, [dimensionNA]);

  const normalizedWeights = useMemo(() => {
    const applicable = DIMENSIONS.filter((d) => {
      const score = parseFloat(dimensionScores[d.key]);
      return !dimensionNA[d.key] && !Number.isNaN(score);
    });
    const total = applicable.reduce((sum, d) => sum + d.weight, 0);
    const weights = {};
    applicable.forEach((d) => {
      weights[d.key] = total ? d.weight / total : 0;
    });
    return weights;
  }, [dimensionNA, dimensionScores]);

  const compositeScore = useMemo(() => {
    // Use backend-computed composite score if available
    if (backendTotals && backendTotals.sComposite != null) {
      console.log('Using backend composite score:', backendTotals.sComposite);
      return String(backendTotals.sComposite.toFixed(2));
    }
    
    // Fallback to local calculation
    const applicable = Object.entries(normalizedWeights);
    if (!applicable.length) return null;
    const total = applicable.reduce((sum, [key, weight]) => {
      const score = parseFloat(dimensionScores[key]);
      return Number.isNaN(score) ? sum : sum + weight * score;
    }, 0);
    console.log('Using locally calculated composite score');
    return total ? total.toFixed(2) : null;
  }, [dimensionScores, backendTotals, normalizedWeights]);

  const compositeFormula = useMemo(() => {
    const labelMap = {
      Value: 'VS',
      Feasibility: 'FS',
      'Organizational Capability': 'OCS',
      'Strategic Alignment & Risk': 'SS'
    };
    return DIMENSIONS
      .map((d) => {
        const weight = normalizedWeights[d.key];
        if (!weight) return null;
        return `${weight.toFixed(2)} × ${labelMap[d.key]}`;
      })
      .filter(Boolean)
      .join(' + ');
  }, [normalizedWeights]);

  const priorityLevel = useMemo(() => {
    if (!compositeScore) return '—';
    const cs = parseFloat(compositeScore);
    if (cs >= 2.4) return 'P1';
    if (cs >= 2.0) return 'P2';
    if (cs >= 1.4) return 'P3';
    return 'P4';
  }, [compositeScore]);

  const quadrantPlacement = useMemo(() => {
    // Use backend-computed quadrant if available
    if (backendTotals && backendTotals.quadrant) {
      console.log('Using backend quadrant:', backendTotals.quadrant);
      return backendTotals.quadrant;
    }
    
    // Fallback to local calculation
    const v = parseFloat(dimensionScores.Value);
    const f = parseFloat(dimensionScores.Feasibility);
    const o = parseFloat(dimensionScores['Organizational Capability']);
    const hasValue = !Number.isNaN(v);
    const hasF = !Number.isNaN(f);
    const hasO = !Number.isNaN(o);
    const capability = hasF && hasO ? (f + o) / 2 : hasF ? f : hasO ? o : null;
    if (!hasValue || capability == null) return '—';
    if (v >= 2.15 && capability >= 2.15) return 'Quick Wins';
    if (v >= 2.15 && capability < 2.15) return 'Strategic Bets';
    if (v < 2.15 && capability >= 2.15) return 'Opportunistic';
    return 'Re-evaluate';
  }, [dimensionScores, backendTotals]);

  const rankedDimensions = useMemo(() => {
    return Object.entries(dimensionScores)
      .map(([key, value]) => [key, parseFloat(value)])
      .filter(([, value]) => !Number.isNaN(value))
      .sort(([, a], [, b]) => b - a);
  }, [dimensionScores]);

  const handleScoreChange = (criterionId, value) => {
    setScores((prev) => ({ ...prev, [criterionId]: Number(value) }));
  };

  const handleItemNAChange = (criterionId, checked) => {
    setItemNA((prev) => ({ ...prev, [criterionId]: checked }));
  };

  const handleDimensionNAChange = (dimensionKey, checked) => {
    setDimensionNA((prev) => ({ ...prev, [dimensionKey]: checked }));
  };

  const handleJustificationChange = (dimensionKey, value) => {
    setDimensionJustifications((prev) => ({ ...prev, [dimensionKey]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return;
    setStatus('Saving review...');
    try {
      const naCount = Object.values(dimensionNA).filter(Boolean).length;
      const missingJustifications = Object.entries(dimensionNA)
        .filter(([key, isNa]) => isNa && !dimensionJustifications[key]?.trim())
        .map(([key]) => key);

      if (naCount === 4) {
        setStatus('All dimensions are N/A. Scoring is blocked.');
        return;
      }
      if (missingJustifications.length) {
        setStatus('Please provide justification for all N/A dimensions.');
        return;
      }
      if (naCount === 3 && !technicalInitiative) {
        setStatus('Three dimensions are N/A. Mark as technical/infrastructure initiative to proceed.');
        return;
      }
      if (naCount === 3 && !reviewerApproval) {
        setStatus('Reviewer approval is required when three dimensions are N/A.');
        return;
      }

      await apiPost(`/review/na?token=${token}`, {
        naValue: dimensionNA.Value,
        naFeasibility: dimensionNA.Feasibility,
        naOrgCapability: dimensionNA['Organizational Capability'],
        naStrategic: dimensionNA['Strategic Alignment & Risk'],
        naValueJustification: dimensionJustifications.Value,
        naFeasibilityJustification: dimensionJustifications.Feasibility,
        naOrgCapabilityJustification: dimensionJustifications['Organizational Capability'],
        naStrategicJustification: dimensionJustifications['Strategic Alignment & Risk'],
        naReviewerApproval: reviewerApproval,
        naTechnicalInitiative: technicalInitiative
      });

      // Submit all criterion scores
      for (const criterion of criteria) {
        const dimensionKey = dimensionMap[criterion.dimension] || criterion.dimension || 'General';
        const dimensionExcluded = Boolean(dimensionNA[dimensionKey]);
        const isNA = dimensionExcluded || Boolean(itemNA[criterion.criterionId]);
        await apiPost(`/scores?token=${token}`, {
          criterionId: criterion.criterionId,
          rawScore: isNA ? null : Number(scores[criterion.criterionId] ?? 0),
          isNA
        });
      }
      
      // Trigger backend computation of dimension totals
      if (useCase?.useCaseId) {
        const totals = await apiPost(`/compute/${useCase.useCaseId}`, {});
        console.log('Updated backend totals after compute:', totals);
        setBackendTotals(totals);
      }
      setStatus('Review saved and totals updated');
    } catch (err) {
      console.error('Error saving review:', err);
      setStatus('Unable to save review');
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContent = () => {
    if (error) return <div className="app-panel">{error}</div>;
    if (!token) return <div className="app-panel">Missing review token.</div>;
    if (loading || !useCase) return <div className="app-panel">Loading…</div>;

    return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header__content">
          <div className="page-header__title-group">
            <p className="page-header__label">Innovation Scoring Matrix (ISM)</p>
            <h1 className="page-header__title">{useCase.title}</h1>
            <p className="page-header__description">{useCase.description || 'No description provided.'}</p>
          </div>
          <div className="page-header__meta">
            <div className="meta-item">
              <span className="meta-item__label">Date Scored</span>
              <strong className="meta-item__value">{getCurrentDateTime()}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-item__label">Business Unit</span>
              <strong className="meta-item__value">{useCase.businessUnit || '—'}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-item__label">Requestor</span>
              <strong className="meta-item__value">{useCase.requestor || '—'}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-item__label">Sponsor</span>
              <strong className="meta-item__value">{useCase.sponsor || '—'}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-item__label">Status</span>
              <strong className="meta-item__value">{useCase.status || 'Intake'}</strong>
            </div>
          </div>
        </div>
        <div className="page-header__info">
          <p className="page-header__info-text">
            <strong>Scoring Scale:</strong> 1.0 (Low) — 2.0 (Medium) — 3.0 (High).
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="ism-form">
        <div className="dimension-grid">
          {Object.entries(groupedCriteria).map(([dimension, items]) => {
            const dimConfig = DIMENSIONS.find((d) => d.key === dimension);
            const dimColor = dimConfig?.color || '#ccc';
            const weightValue = normalizedWeights[dimension];
            const weightLabel = dimensionNA[dimension]
              ? 'Excluded'
              : weightValue
                ? `${(weightValue * 100).toFixed(0)}%`
                : dimConfig?.weightLabel || '—';
            const counts = dimensionItemCounts[dimension] || { applicable: 0, total: items.length };
            return (
              <div key={dimension} className={`dimension-card ${dimensionNA[dimension] ? 'dimension-card--na' : ''}`}>
                <div className="dimension-card__header" style={{ borderTopColor: dimColor }}>
                  <div className="dimension-card__title-group">
                    <h2 className="dimension-card__title">{dimConfig?.label || dimension}</h2>
                    <span className="dimension-card__weight">{weightLabel}</span>
                  </div>
                  <div className="dimension-card__score">
                    <span className="dimension-card__score-label">Score</span>
                    <span className="dimension-card__score-value">{dimensionScores[dimension]}</span>
                  </div>
                </div>
                
                <div className="dimension-card__body">
                  <div className="dimension-card__na-control">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(dimensionNA[dimension])}
                        onChange={(e) => handleDimensionNAChange(dimension, e.target.checked)}
                        className="checkbox-input"
                      />
                      <span>Mark entire dimension as Not Applicable</span>
                    </label>
                  </div>
                  
                  {dimensionNA[dimension] && (
                    <div className="dimension-card__justification">
                      <label className="form-label">Justification (required)</label>
                      <textarea
                        value={dimensionJustifications[dimension] || ''}
                        onChange={(e) => handleJustificationChange(dimension, e.target.value)}
                        placeholder="Provide rationale for excluding this dimension"
                        rows={3}
                        className="form-textarea"
                      />
                    </div>
                  )}
                  
                  <div className="dimension-card__items">
                    {items.map((criterion) => (
                      <div key={criterion.criterionId} className={`criterion-item ${criterion.polarity === 'COST' ? 'criterion-item--inverted' : ''}`}>
                        <div className="criterion-item__header">
                          <div className="criterion-item__name">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong>{criterion.name}</strong>
                              {criterion.polarity === 'COST' && (
                                <span className="inverted-indicator" title="Inverted scale - Lower is better">
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 12L3 7h10l-5 5z"/>
                                    <path d="M8 4L3 9h10L8 4z" opacity="0.4"/>
                                  </svg>
                                </span>
                              )}
                            </div>
                            {criterion.guidanceText && (
                              <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginTop: '4px', fontWeight: 'normal' }}>
                                {criterion.guidanceText}
                              </p>
                            )}
                          </div>
                          <div className="criterion-item__na">
                            <input
                              type="checkbox"
                              checked={Boolean(itemNA[criterion.criterionId])}
                              onChange={(e) => handleItemNAChange(criterion.criterionId, e.target.checked)}
                              disabled={Boolean(dimensionNA[dimension])}
                            />
                            <span>N/A</span>
                          </div>
                        </div>
                        
                        <div className="criterion-item__controls">
                          <div className="modern-slider-container">
                            <input
                              type="range"
                              min="0"
                              max="3"
                              step="0.1"
                              value={scores[criterion.criterionId] ?? 2}
                              onChange={(e) => handleScoreChange(criterion.criterionId, e.target.value)}
                              className={`modern-slider ${criterion.polarity === 'COST' ? 'modern-slider--inverted' : ''}`}
                              disabled={Boolean(dimensionNA[dimension] || itemNA[criterion.criterionId])}
                            />
                            <div className="modern-slider__labels">
                              {criterion.polarity === 'COST' ? (
                                <>
                                  <span>High</span>
                                  <span>Medium</span>
                                  <span>Low</span>
                                </>
                              ) : (
                                <>
                                  <span>Low</span>
                                  <span>Medium</span>
                                  <span>High</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="criterion-item__value">
                            {Number(scores[criterion.criterionId] ?? 2).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="dimension-card__footer">
                    <span className="dimension-card__count">
                      {counts.applicable} of {counts.total} items applicable
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {naDimensionCount >= 2 && (
          <div className={`alert ${naDimensionCount === 4 ? 'alert--danger' : 'alert--warning'}`}>
            {naDimensionCount === 2 && (
              <p>This assessment is based on a reduced set of dimensions.</p>
            )}
            {naDimensionCount === 3 && (
              <p>This is a Limited Scope Evaluation. Reviewer approval may be required.</p>
            )}
            {naDimensionCount === 4 && (
              <p>This initiative cannot be scored using the ISM because all dimensions are marked Not Applicable.</p>
            )}
          </div>
        )}

        {naDimensionCount === 3 && (
          <div className="modern-card">
            <h3 className="modern-card__title">N/A Approval Requirements</h3>
            <div className="modern-card__body">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={technicalInitiative}
                  onChange={(e) => setTechnicalInitiative(e.target.checked)}
                  className="checkbox-input"
                />
                <span>This is a technical or infrastructure initiative</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reviewerApproval}
                  onChange={(e) => setReviewerApproval(e.target.checked)}
                  className="checkbox-input"
                />
                <span>Reviewer approval obtained</span>
              </label>
            </div>
          </div>
        )}

        <section className="results-section">
          <h2 className="results-section__title">Dimension Scoring</h2>
          <div className="results-grid">
            <div className="result-card">
              <span className="result-card__label">Value (VS)</span>
              <strong className="result-card__value">{dimensionScores.Value}</strong>
              <p className="result-card__note">
                {normalizedWeights.Value ? `${(normalizedWeights.Value * 100).toFixed(0)}% weight` : 'Excluded'}
              </p>
            </div>
            <div className="result-card">
              <span className="result-card__label">Feasibility (FS)</span>
              <strong className="result-card__value">{dimensionScores.Feasibility}</strong>
              <p className="result-card__note">
                {normalizedWeights.Feasibility ? `${(normalizedWeights.Feasibility * 100).toFixed(0)}% weight` : 'Excluded'}
              </p>
            </div>
            <div className="result-card">
              <span className="result-card__label">Org Capability (OCS)</span>
              <strong className="result-card__value">{dimensionScores['Organizational Capability']}</strong>
              <p className="result-card__note">
                {normalizedWeights['Organizational Capability']
                  ? `${(normalizedWeights['Organizational Capability'] * 100).toFixed(0)}% weight`
                  : 'Excluded'}
              </p>
            </div>
            <div className="result-card">
              <span className="result-card__label">Strategic & Risk (SS)</span>
              <strong className="result-card__value">{dimensionScores['Strategic Alignment & Risk']}</strong>
              <p className="result-card__note">
                {normalizedWeights['Strategic Alignment & Risk']
                  ? `${(normalizedWeights['Strategic Alignment & Risk'] * 100).toFixed(0)}% weight`
                  : 'Excluded'}
              </p>
            </div>
          </div>
        </section>

        <section className="composite-section">
          <div className="composite-header">
            <h2 className="composite-header__title">Composite Score</h2>
            <p className="composite-header__formula">{compositeFormula || '—'}</p>
          </div>
          <div className="composite-display">
            <div className="composite-result">
              <span className="composite-result__label">Weighted Composite</span>
              <strong className="composite-result__value">{compositeScore ?? '—'}</strong>
            </div>
            <div className="composite-bar">
              <div
                className="composite-bar__fill"
                style={{ width: `${(parseFloat(compositeScore || 0) / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </section>

        <section className="outcomes-section">
          <div className="outcomes-grid">
            <div className="outcome-card outcome-card--priority">
              <h3 className="outcome-card__title">Priority Level</h3>
              <div className={`priority-badge priority-badge--${priorityLevel.toLowerCase()}`}>{priorityLevel}</div>
              <p className="outcome-card__description">
                {priorityLevel === 'P1' && 'Immediate strategic priority — advance to planning'}
                {priorityLevel === 'P2' && 'Near-term candidate — schedule review and resource planning'}
                {priorityLevel === 'P3' && 'Monitor and develop — requires business case strengthening'}
                {priorityLevel === 'P4' && 'Re-evaluate or defer — reconsider timing or scope'}
              </p>
            </div>

            <div className="outcome-card outcome-card--quadrant">
              <h3 className="outcome-card__title">Portfolio Quadrant</h3>
              <div className="quadrant-badge">{quadrantPlacement}</div>
              <p className="outcome-card__description">
                {quadrantPlacement === 'Quick Wins' && 'High value, high capability — proceed confidently'}
                {quadrantPlacement === 'Strategic Bets' && 'High value, lower capability — allocate resources'}
                {quadrantPlacement === 'Opportunistic' && 'Lower value, high capability — consider as filler'}
                {quadrantPlacement === 'Re-evaluate' && 'Lower value, lower capability — reassess'}
              </p>
            </div>
          </div>
        </section>

        <section className="summary-section">
          <h2 className="summary-section__title">Executive Summary</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <h4 className="summary-card__title">Key Strengths</h4>
              <ul className="summary-card__list">
                <li>
                  Dimension with highest score:{' '}
                  <strong>
                    {
                      rankedDimensions[0]?.[0] || '—'
                    }
                  </strong>
                </li>
                <li>
                  Composite score of <strong>{compositeScore ?? '—'}</strong> indicates
                  {' '}
                  {compositeScore
                    ? parseFloat(compositeScore || 0) >= 2.4
                      ? 'strong strategic alignment'
                      : parseFloat(compositeScore || 0) >= 2.0
                        ? 'solid viability'
                        : parseFloat(compositeScore || 0) >= 1.4
                          ? 'moderate potential'
                          : 'limited alignment'
                    : 'insufficient data to determine alignment'}
                </li>
              </ul>
            </div>

            <div className="summary-card">
              <h4 className="summary-card__title">Key Risks</h4>
              <ul className="summary-card__list">
                <li>
                  Dimension with lowest score:{' '}
                  <strong>
                    {
                      rankedDimensions[rankedDimensions.length - 1]?.[0] || '—'
                    }
                  </strong>
                </li>
                <li>
                  Priority {priorityLevel} classification requires focus on
                  {' '}
                  {priorityLevel === 'P1' || priorityLevel === 'P2'
                    ? 'execution readiness'
                    : priorityLevel === 'P3'
                      ? 'business case improvement'
                      : 'value articulation'}
                </li>
              </ul>
            </div>

            <div className="summary-card">
              <h4 className="summary-card__title">Recommended Next Steps</h4>
              <ul className="summary-card__list">
                <li>
                  {priorityLevel === 'P1' && 'Schedule governance review; begin resource and dependency planning.'}
                  {priorityLevel === 'P2' && 'Develop detailed implementation roadmap; secure executive sponsorship.'}
                  {priorityLevel === 'P3' && 'Strengthen business case; address low-scoring dimensions.'}
                  {priorityLevel === 'P4' && 'Reassess scope, timing, or strategic fit; revisit in next planning cycle.'}
                </li>
                <li>
                  {quadrantPlacement === 'Quick Wins' && 'Proceed to detailed planning; plan incremental delivery.'}
                  {quadrantPlacement === 'Strategic Bets' && 'Build capability roadmap; identify build vs. buy options.'}
                  {quadrantPlacement === 'Opportunistic' && 'Consider portfolio balance; evaluate timing vs. other initiatives.'}
                  {quadrantPlacement === 'Re-evaluate' && 'Explore scope reduction or alternative approaches.'}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary">Save Review</button>
          {status && <span className="status-message">{status}</span>}
        </div>
      </form>

      <div className="page-footer">
        <Link className="btn btn--ghost" to={`/usecase/${useCase.useCaseId}`}>← Back to Use Case</Link>
        <Link className="btn btn--ghost" to="/use-cases">Portfolio List</Link>
      </div>
    </div>
    );
  };

  try {
    return renderContent();
  } catch (err) {
    console.error('Review render error:', err);
    return <div className="app-panel">Render error: {String(err)}</div>;
  }
}
