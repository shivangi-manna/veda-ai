'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  CheckCircle,
  X,
  Palette
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore, IAssignment } from '@/store/useAssignmentStore';
import Header from '@/components/Header';

type ThemeType = 'classic' | 'modern' | 'vintage';

export default function AssignmentOutput() {
  const params = useParams();
  const router = useRouter();
  const store = useAssignmentStore();
  const socketRef = useRef<Socket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const assignmentId = params.id as string;
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [localAssignment, setLocalAssignment] = useState<IAssignment | null>(null);
  
  // Custom Creative States
  const [theme, setTheme] = useState<ThemeType>('classic');
  const [expandedRubric, setExpandedRubric] = useState<Record<string, boolean>>({});
  const [polishTarget, setPolishTarget] = useState<{ sIdx: number; qIdx: number } | null>(null);
  const [polishInstruction, setPolishInstruction] = useState('');
  const [polishingLoading, setPolishingLoading] = useState(false);
  const [pulseKey, setPulseKey] = useState<string | null>(null);
  const [polishSeconds, setPolishSeconds] = useState(0);

  useEffect(() => {
    if (!polishingLoading) {
      setPolishSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setPolishSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [polishingLoading]);

  const getPolishProgress = (seconds: number) => {
    if (seconds <= 3) return seconds * 15;
    if (seconds <= 8) return 45 + (seconds - 3) * 7;
    if (seconds <= 15) return 80 + (seconds - 8) * 2;
    return Math.min(98, 94 + (seconds - 15) * 0.4);
  };

  // Initialize socket client connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';
    socketRef.current = io(socketUrl, {
      withCredentials: true,
      autoConnect: false
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch assignment details on load
  useEffect(() => {
    if (assignmentId) {
      store.fetchAssignmentDetails(assignmentId).then((data) => {
        if (data) setLocalAssignment(data);
      });
    }
  }, [assignmentId, store.fetchAssignmentDetails]);

  // Set up socket listeners for regeneration progress
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !store.activeJobId || !store.activeAssignmentId) return;

    socket.connect();
    socket.emit('subscribe:job', store.activeAssignmentId);

    socket.on('job:progress', (data: { progress: number; message: string }) => {
      store.updateProgress(data.progress, data.message, `[Worker] ${data.message}`);
    });

    socket.on('job:completed', (data: { assignmentId: string; assignment: any }) => {
      store.completeGeneration(data.assignment);
      setLocalAssignment(data.assignment);
      socket.emit('unsubscribe:job', store.activeAssignmentId);
      socket.disconnect();
      
      setTimeout(() => {
        store.cancelGeneration();
      }, 1000);
    });

    socket.on('job:failed', (data: { error: string }) => {
      store.failGeneration(data.error);
      socket.emit('unsubscribe:job', store.activeAssignmentId);
      socket.disconnect();
    });

    return () => {
      if (store.activeAssignmentId) {
        socket.emit('unsubscribe:job', store.activeAssignmentId);
      }
      socket.off('job:progress');
      socket.off('job:completed');
      socket.off('job:failed');
      socket.disconnect();
    };
  }, [store.activeJobId, store.activeAssignmentId]);

  // Scroll to bottom of logs when updated
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [store.generationLogs]);

  // Download PDF Handler
  const handleDownloadPDF = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/assignments'}/${assignmentId}/pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${localAssignment?.title || 'assignment'}_exam.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Regenerate Handler
  const handleRegenerate = async () => {
    if (confirm('Are you sure you want to regenerate this question paper? This will overwrite the existing questions.')) {
      const result = await store.regenerateAssignment(assignmentId);
      if (result) {
        store.startGeneration(result.jobId, assignmentId);
      } else {
        alert(store.error || 'Failed to start regeneration. Please try again.');
      }
    }
  };

  // In-place Single Question Polishing
  const handlePolishSubmit = async (e: React.FormEvent, sIdx: number, qIdx: number) => {
    e.preventDefault();
    if (!polishInstruction.trim()) return;

    setPolishingLoading(true);
    const success = await store.polishQuestion(assignmentId, sIdx, qIdx, polishInstruction);
    setPolishingLoading(false);
    
    if (success) {
      // Reload assignment details to update answers
      const updated = await store.fetchAssignmentDetails(assignmentId);
      if (updated) setLocalAssignment(updated);

      // Trigger pulse animation feedback
      const key = `${sIdx}-${qIdx}`;
      setPulseKey(key);
      setTimeout(() => setPulseKey(null), 1500);

      // Clear states
      setPolishTarget(null);
      setPolishInstruction('');
    } else {
      alert(store.error || 'Polishing failed. Please try again.');
    }
  };

  const toggleRubric = (sIdx: number, qIdx: number) => {
    const key = `${sIdx}-${qIdx}`;
    setExpandedRubric(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (store.loading && !localAssignment && !polishingLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={40} color="var(--brand-accent)" />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading assessment sheet...</p>
      </div>
    );
  }

  if (!localAssignment) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', fontWeight: 600 }}>Assessment not found</p>
        <Link href="/" style={{ textDecoration: 'none', marginTop: '16px' }}>
          <button className="btn-secondary-pill">Back to Dashboard</button>
        </Link>
      </div>
    );
  }

  // Calculate totals
  const totalQuestions = localAssignment.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0;
  const totalMarks = localAssignment.sections?.reduce((acc, s) => acc + (s.questions?.reduce((mAcc, q) => mAcc + q.marks, 0) || 0), 0) || 0;

  // Calculate Bloom's Taxonomy Distribution
  const bloomCategories = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'];
  const bloomCounts: Record<string, number> = {
    'Remembering': 0, 'Understanding': 0, 'Applying': 0, 'Analyzing': 0, 'Evaluating': 0, 'Creating': 0
  };
  let totalClassified = 0;

  localAssignment.sections?.forEach(sec => {
    sec.questions?.forEach(q => {
      const tax = q.taxonomy || 'Understanding';
      if (bloomCounts[tax] !== undefined) {
        bloomCounts[tax]++;
        totalClassified++;
      } else {
        // Fallback or mapping
        bloomCounts['Understanding']++;
        totalClassified++;
      }
    });
  });

  return (
    <div>
      <Header />

      {/* Banner strip */}
      <div className="output-header-bar">
        <div className="output-header-text">
          Certainly! Here is the customized Question Paper for your Grade/Class{' '}
          <strong>{localAssignment.gradeClass}</strong> <strong>{localAssignment.subject}</strong> classes on{' '}
          <strong>&quot;{localAssignment.title}&quot;</strong>:
        </div>
        <div className="output-header-actions">
          {/* Theme Presets Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRight: '1px solid #334155', paddingRight: '12px', marginRight: '4px' }}>
            <Palette size={14} color="var(--text-muted)" />
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeType)}
              className="filter-dropdown"
              style={{ backgroundColor: '#1e293b', color: 'white', border: '1px solid #475569', padding: '4px 8px', fontSize: '11px', height: '28px' }}
            >
              <option value="classic">Classic Academic</option>
              <option value="modern">Modern Minimalist</option>
              <option value="vintage">Vintage Ledger</option>
            </select>
          </div>

          <button onClick={handleRegenerate} className="btn-download-pdf" style={{ backgroundColor: 'transparent', border: '1px solid white', color: 'white' }}>
            <RefreshCw size={14} />
            <span>Regenerate</span>
          </button>
          <button onClick={handleDownloadPDF} className="btn-download-pdf">
            <Download size={14} />
            <span>Download as PDF</span>
          </button>
        </div>
      </div>

      {/* Cognitive Analysis Panel (Bloom's Taxonomy Visualizer) */}
      <div className="bloom-analysis-panel">
        <div className="bloom-analysis-title">
          <Award size={18} color="var(--brand-accent)" />
          <span>VedaAI Cognitive Analysis (Bloom&#39;s Taxonomy Distribution)</span>
        </div>
        <div className="bloom-chart-container">
          {bloomCategories.map(cat => {
            const count = bloomCounts[cat];
            const pct = totalClassified > 0 ? Math.round((count / totalClassified) * 100) : 0;
            return (
              <div key={cat} className="bloom-bar-group">
                <span className="bloom-percentage">{pct}%</span>
                <div className="bloom-bar-track">
                  <div className="bloom-bar-fill" style={{ height: `${pct}%` }}></div>
                </div>
                <span className="bloom-label">{cat}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({count} q)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exam Sheet Layout */}
      <div className="exam-paper-container">
        <div className={`exam-paper-sheet theme-${theme}`}>
          {polishingLoading && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.85)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
              <div style={{ textAlign: 'center', width: '320px', padding: '24px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid var(--border-light)' }}>
                <Loader2 className="animate-spin" size={36} color="var(--brand-accent)" style={{ margin: '0 auto 16px auto' }} />
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Polishing question with AI...</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Making requested adjustments</div>
                
                {/* Progress bar container */}
                <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${getPolishProgress(polishSeconds)}%`, backgroundColor: 'var(--brand-accent)', transition: 'width 0.5s ease-out' }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{getPolishProgress(polishSeconds).toFixed(0)}% Complete</span>
                  <span>Elapsed: {polishSeconds}s (Est: ~4-10s)</span>
                </div>
              </div>
            </div>
          )}

          <div className="exam-school-name">{localAssignment.schoolName}</div>
          <div className="exam-subject-class">Subject: {localAssignment.subject} | Class: {localAssignment.gradeClass}</div>
          <div className="exam-topic">Topic: {localAssignment.title}</div>
          
          <div className="exam-meta-row">
            <span>Time Allowed: {localAssignment.timeAllowed} minutes</span>
            <span>Maximum Marks: {totalMarks}</span>
          </div>

          <div className="exam-instructions">
            All questions are compulsory unless stated otherwise.
          </div>

          {/* Student details form */}
          <div className="exam-student-info">
            <div className="info-line">
              <span>Name:</span>
              <input type="text" placeholder="________________________________" disabled />
            </div>
            <div className="info-line">
              <span>Roll Number:</span>
              <input type="text" placeholder="____________" disabled />
            </div>
            <div className="info-line" style={{ gridColumn: 'span 2' }}>
              <span>Class &amp; Section:</span>
              <input type="text" placeholder="________________________________________" disabled />
            </div>
          </div>

          {/* Section rendering */}
          {localAssignment.sections?.map((section, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '32px' }}>
              <div className="exam-section-header">{section.title}</div>
              <div className="exam-section-instruction">{section.instruction}</div>

              {section.questions?.map((question, qIdx) => {
                const qKey = `${sIdx}-${qIdx}`;
                const isPulsing = pulseKey === qKey;
                const isPolishOpen = polishTarget?.sIdx === sIdx && polishTarget?.qIdx === qIdx;
                
                return (
                  <div key={qIdx} className={`exam-question-wrapper ${isPulsing ? 'pulse-animation' : ''}`} style={{ marginBottom: '20px' }}>
                    <div className="exam-question-item">
                      <span style={{ fontWeight: 600 }}>{qIdx + 1}.</span>
                      <div className="exam-question-text" style={{ whiteSpace: 'pre-line' }}>
                        {question.text}
                      </div>
                      
                      <div className="exam-badge-container">
                        <span className={`badge ${question.difficulty.toLowerCase()}`}>
                          {question.difficulty}
                        </span>
                        <span className="exam-question-marks" style={{ fontSize: '11px' }}>
                          [{question.marks} Mark{question.marks > 1 ? 's' : ''}]
                        </span>
                      </div>
                    </div>

                    {/* AI Polish Trigger Hover Button */}
                    <button 
                      className="ai-polish-trigger-btn"
                      onClick={() => {
                        setPolishInstruction('');
                        setPolishTarget(isPolishOpen ? null : { sIdx, qIdx });
                      }}
                    >
                      <Sparkles size={10} />
                      <span>AI Polish</span>
                    </button>

                    {/* Collapsible Rubric Button & panel */}
                    <div style={{ marginLeft: '18px', marginTop: '6px' }}>
                      <button 
                        type="button"
                        onClick={() => toggleRubric(sIdx, qIdx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                      >
                        <CheckCircle size={10} color="#22c55e" />
                        <span>{expandedRubric[qKey] ? 'Hide Grading Rubric' : 'Show Grading Rubric'}</span>
                      </button>

                      {expandedRubric[qKey] && question.rubric && (
                        <div style={{ marginTop: '6px', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '10.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Grading Breakdown ({question.marks} Marks):</strong>
                          {question.rubric}
                        </div>
                      )}
                    </div>

                    {/* In-place Refine Input Tooltip popup */}
                    {isPolishOpen && (
                      <div className="ai-polish-popup">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>Refine this Question with AI</span>
                          <button type="button" onClick={() => setPolishTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={12} />
                          </button>
                        </div>
                        <form onSubmit={(e) => handlePolishSubmit(e, sIdx, qIdx)}>
                          <input 
                            type="text"
                            value={polishInstruction}
                            onChange={(e) => setPolishInstruction(e.target.value)}
                            placeholder="e.g. Make it harder, convert to MCQ..."
                            className="ai-polish-input"
                            autoFocus
                          />
                          <div className="ai-polish-popup-buttons" style={{ marginTop: '8px' }}>
                            <button type="button" onClick={() => setPolishTarget(null)} className="btn-mini">Cancel</button>
                            <button type="submit" className="btn-mini submit">Refine</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="exam-end-text">End of Question Paper</div>
        </div>
      </div>

      {/* Answer Key Box */}
      {localAssignment.answerKey && localAssignment.answerKey.length > 0 && (
        <div className="answer-key-box">
          <div 
            className="answer-key-title"
            onClick={() => setShowAnswerKey(!showAnswerKey)}
          >
            <span>Show Answer Key &amp; Explanations</span>
            {showAnswerKey ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {showAnswerKey && (
            <div className="answer-key-list">
              {localAssignment.answerKey.map((item, index) => (
                <div key={index} className="answer-key-item">
                  <div className="answer-key-q">
                    Q{item.questionIndex}. ({item.sectionTitle}) {item.questionText}
                  </div>
                  <div className="answer-key-a" style={{ whiteSpace: 'pre-line' }}>
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real-time Socket Progress Modal (for Regeneration) */}
      {store.isGenerating && (
        <div className="modal-overlay">
          <div className="modal-content">
            {store.displayedProgress < 100 && store.generationStatusText !== 'Failed' ? (
              <div className="modal-spinner"></div>
            ) : store.generationStatusText === 'Failed' ? (
              <div style={{ color: '#ef4444', fontSize: '48px', marginBottom: '16px' }}>✕</div>
            ) : (
              <div style={{ color: '#22c55e', fontSize: '48px', marginBottom: '16px' }}>✓</div>
            )}

            <h3 className="modal-title">Regenerating Question Paper</h3>
            <p className="modal-status-text">{store.generationStatusText}</p>

            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${store.displayedProgress}%` }}
              ></div>
            </div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <span>AI Worker Pipeline</span>
              <span>{store.displayedProgress}%</span>
            </div>

            <div className="modal-logs-box">
              {store.generationLogs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
              ))}
              <div ref={logEndRef}></div>
            </div>

            {store.generationStatusText === 'Failed' && (
              <button 
                type="button" 
                className="btn-secondary-pill" 
                onClick={store.cancelGeneration}
                style={{ marginTop: '20px', width: '100%' }}
              >
                Close &amp; Review Errors
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
