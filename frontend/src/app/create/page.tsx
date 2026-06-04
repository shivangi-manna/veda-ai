'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  UploadCloud, 
  Calendar, 
  Plus, 
  Minus, 
  Trash2, 
  Loader2,
  FileText,
  X 
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore, IQuestionTypeConfig } from '@/store/useAssignmentStore';
import Header from '@/components/Header';

const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Essay Questions',
  'True/False Questions',
  'Fill in the Blanks',
  'Numerical Problems',
  'Diagram/Graph-Based Questions'
];

export default function CreateAssignment() {
  const router = useRouter();
  const store = useAssignmentStore();
  const socketRef = useRef<Socket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);

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

  // Set up socket listeners when a job is active
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !store.activeJobId || !store.activeAssignmentId) return;

    socket.connect();
    
    // Subscribe to the assignmentId room (backend sends events using assignmentId)
    socket.emit('subscribe:job', store.activeAssignmentId);
    console.log(`Subscribed to websocket room for assignment: ${store.activeAssignmentId}`);

    // Listen for progress updates
    socket.on('job:progress', (data: { progress: number; message: string }) => {
      store.updateProgress(data.progress, data.message, `[Worker] ${data.message}`);
    });

    // Listen for completion
    socket.on('job:completed', (data: { assignmentId: string; assignment: any }) => {
      store.completeGeneration(data.assignment);
      socket.emit('unsubscribe:job', store.activeAssignmentId);
      socket.disconnect();
      
      // Short delay so user can see "Completed!"
      setTimeout(() => {
        store.cancelGeneration(); // clears progress overlay
        router.push(`/output/${data.assignmentId}`);
      }, 1000);
    });

    // Listen for failures
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

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Accept text and pdf
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ext === 'txt') {
        store.setFormValue('formFile', file);
      } else {
        alert('Please upload only PDF or TXT files.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      store.setFormValue('formFile', e.target.files[0]);
    }
  };

  const removeFile = () => {
    store.setFormValue('formFile', null);
  };

  // Stepper handlers
  const adjustCount = (index: number, delta: number) => {
    const configs = [...store.formQuestionConfigs];
    const newCount = Math.max(1, configs[index].count + delta);
    store.updateQuestionConfigRow(index, 'count', newCount);
  };

  const adjustMarks = (index: number, delta: number) => {
    const configs = [...store.formQuestionConfigs];
    const newMarks = Math.max(1, configs[index].marks + delta);
    store.updateQuestionConfigRow(index, 'marks', newMarks);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);

    // Validation
    if (!store.formTitle.trim()) return setFormErrors('Please enter an assignment title');
    if (!store.formSubject.trim()) return setFormErrors('Please enter a subject name');
    if (!store.formGradeClass.trim()) return setFormErrors('Please specify the class/grade');
    if (!store.formSchoolName.trim()) return setFormErrors('Please enter your school/institution name');
    if (!store.formDueDate) return setFormErrors('Please select a due date');
    if (store.formTimeAllowed <= 0) return setFormErrors('Time allowed must be positive');

    // Verify configs
    for (const config of store.formQuestionConfigs) {
      if (config.count <= 0 || config.marks <= 0) {
        return setFormErrors('Question count and marks must be positive values');
      }
    }

    const result = await store.submitAssignment();
    if (result) {
      // Start loading tracking state
      store.startGeneration(result.jobId, result.assignmentId);
    } else {
      setFormErrors(store.error || 'Failed to submit assignment. Please try again.');
    }
  };

  // Total Summary
  const totalQuestions = store.formQuestionConfigs.reduce((acc, c) => acc + c.count, 0);
  const totalMarks = store.formQuestionConfigs.reduce((acc, c) => acc + c.count * c.marks, 0);

  return (
    <div>
      <Header />

      {/* Main card panel */}
      <div style={{ marginTop: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
          Create Assignment
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Set up a new assignment for your students
        </p>

        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-header">
            <h2 className="form-title">Assignment Details</h2>
            <p className="form-subtitle">Basic information about your assignment</p>
          </div>

          {formErrors && (
            <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 500, marginBottom: '20px' }}>
              {formErrors}
            </div>
          )}

          {/* School Name & Class Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">School / Institution</label>
              <input 
                type="text" 
                className="form-input-text" 
                placeholder="e.g. Delhi Public School"
                value={store.formSchoolName}
                onChange={(e) => store.setFormValue('formSchoolName', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Class / Grade</label>
              <input 
                type="text" 
                className="form-input-text" 
                placeholder="e.g. Grade 8 / Class 5th"
                value={store.formGradeClass}
                onChange={(e) => store.setFormValue('formGradeClass', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Title & Subject Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Assignment Topic / Title</label>
              <input 
                type="text" 
                className="form-input-text" 
                placeholder="e.g. Quiz on Electricity"
                value={store.formTitle}
                onChange={(e) => store.setFormValue('formTitle', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input 
                type="text" 
                className="form-input-text" 
                placeholder="e.g. Science"
                value={store.formSubject}
                onChange={(e) => store.setFormValue('formSubject', e.target.value)}
                required
              />
            </div>
          </div>

          {/* File Upload Zone */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Source Document (Optional)</label>
            {!store.formFile ? (
              <div 
                className={`upload-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-picker')?.click()}
              >
                <input 
                  type="file" 
                  id="file-picker" 
                  style={{ display: 'none' }} 
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                />
                <div className="upload-icon-wrapper">
                  <UploadCloud size={40} strokeWidth={1.5} color="var(--text-secondary)" />
                </div>
                <div className="upload-text-main">Choose a file or drag & drop it here</div>
                <div className="upload-text-sub">PDF, TXT up to 10MB</div>
                <button type="button" className="upload-browse-btn">Browse Files</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={24} color="var(--brand-accent)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{store.formFile.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{(store.formFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={removeFile}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
              Upload source materials like textbook chapters or revision notes to base questions on.
            </div>
          </div>

          {/* Due date & Time allowed Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  className="form-input-text" 
                  value={store.formDueDate}
                  onChange={(e) => store.setFormValue('formDueDate', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Time Allowed (minutes)</label>
              <input 
                type="number" 
                className="form-input-text" 
                placeholder="e.g. 45"
                min="1"
                value={store.formTimeAllowed}
                onChange={(e) => store.setFormValue('formTimeAllowed', Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Question types dynamic configs */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Question Types & Distribution</label>
            
            <div className="question-configs-list">
              {store.formQuestionConfigs.map((config, index) => (
                <div key={index} className="question-config-row">
                  {/* Select Dropdown */}
                  <select
                    className="filter-dropdown"
                    style={{ width: '100%' }}
                    value={config.type}
                    onChange={(e) => store.updateQuestionConfigRow(index, 'type', e.target.value)}
                  >
                    {QUESTION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>×</span>

                  {/* Question count stepper */}
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center' }}>No. of Questions</div>
                    <div className="stepper-container">
                      <button type="button" className="stepper-btn" onClick={() => adjustCount(index, -1)}>
                        <Minus size={12} />
                      </button>
                      <span className="stepper-value">{config.count}</span>
                      <button type="button" className="stepper-btn" onClick={() => adjustCount(index, 1)}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Question marks stepper */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center' }}>Marks per Question</div>
                      <div className="stepper-container">
                        <button type="button" className="stepper-btn" onClick={() => adjustMarks(index, -1)}>
                          <Minus size={12} />
                        </button>
                        <span className="stepper-value">{config.marks}</span>
                        <button type="button" className="stepper-btn" onClick={() => adjustMarks(index, 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {store.formQuestionConfigs.length > 1 && (
                      <button 
                        type="button" 
                        className="row-delete-btn" 
                        onClick={() => store.removeQuestionConfigRow(index)}
                        style={{ height: '38px', paddingBottom: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="add-config-btn" onClick={store.addQuestionConfigRow}>
              <Plus size={14} />
              <span>Add Question Type</span>
            </button>

            <div className="configs-summary-bar">
              <div className="configs-summary-item">Total Questions: <span>{totalQuestions}</span></div>
              <div className="configs-summary-item">Total Marks: <span>{totalMarks}</span></div>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="form-group">
            <label className="form-label">Additional Instructions (For better output)</label>
            <textarea 
              className="form-input-text" 
              style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="e.g. Focus on electric circuits, conductors, and resistance. Keep difficulty moderate. Include a question with a chemical equation."
              value={store.formAdditionalInstructions}
              onChange={(e) => store.setFormValue('formAdditionalInstructions', e.target.value)}
            />
          </div>
        </form>

        <div className="form-footer-buttons">
          <Link href="/">
            <button className="btn-secondary-pill">← Previous</button>
          </Link>
          <button 
            type="submit" 
            onClick={handleSubmit} 
            className="btn-primary-pill"
            style={{ padding: '12px 32px' }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Real-time Socket Progress Modal */}
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

            <h3 className="modal-title">Generating Question Paper</h3>
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
                Close & Review Errors
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
