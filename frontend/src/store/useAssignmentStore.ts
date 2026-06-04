import { create } from 'zustand';

export interface IQuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface IQuestion {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  taxonomy?: string;
  rubric?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAnswerKeyItem {
  questionIndex: number;
  sectionTitle: string;
  questionText: string;
  answer: string;
}

export interface IAssignment {
  _id: string;
  title: string;
  subject: string;
  gradeClass: string;
  schoolName: string;
  timeAllowed: number;
  dueDate: string;
  questionConfigs: IQuestionTypeConfig[];
  additionalInstructions?: string;
  fileName?: string;
  fileUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sections?: ISection[];
  answerKey?: IAnswerKeyItem[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface IAssignmentState {
  assignments: IAssignment[];
  activeAssignment: IAssignment | null;
  loading: boolean;
  error: string | null;

  // Form State
  formTitle: string;
  formSubject: string;
  formGradeClass: string;
  formSchoolName: string;
  formTimeAllowed: number;
  formDueDate: string;
  formQuestionConfigs: IQuestionTypeConfig[];
  formAdditionalInstructions: string;
  formFile: File | null;

  // Job Progress State
  isGenerating: boolean;
  generationProgress: number;
  displayedProgress: number;
  generationStatusText: string;
  generationLogs: string[];
  activeJobId: string | null;
  activeAssignmentId: string | null;

  // Actions
  setFormValue: (key: string, value: any) => void;
  resetForm: () => void;
  addQuestionConfigRow: () => void;
  removeQuestionConfigRow: (index: number) => void;
  updateQuestionConfigRow: (index: number, key: keyof IQuestionTypeConfig, value: any) => void;

  // API Actions
  fetchAssignments: () => Promise<void>;
  fetchAssignmentDetails: (id: string) => Promise<IAssignment | null>;
  deleteAssignment: (id: string) => Promise<void>;
  submitAssignment: () => Promise<{ assignmentId: string; jobId: string } | null>;
  regenerateAssignment: (id: string) => Promise<{ jobId: string } | null>;

  // Theme Preset
  activeTheme: 'classic' | 'modern' | 'vintage';
  setActiveTheme: (theme: 'classic' | 'modern' | 'vintage') => void;

  // Progress Actions
  startGeneration: (jobId: string, assignmentId: string) => void;
  updateProgress: (progress: number, text: string, log?: string) => void;
  completeGeneration: (assignment: IAssignment) => void;
  failGeneration: (errorText: string) => void;
  cancelGeneration: () => void;
  polishQuestion: (id: string, sectionIdx: number, questionIdx: number, instruction: string) => Promise<boolean>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/assignments';

let progressInterval: NodeJS.Timeout | null = null;

const defaultQuestionConfigs: IQuestionTypeConfig[] = [
  { type: 'Multiple Choice Questions', count: 4, marks: 1 },
  { type: 'Short Questions', count: 3, marks: 2 }
];

export const useAssignmentStore = create<IAssignmentState>((set, get) => ({
  assignments: [],
  activeAssignment: null,
  loading: false,
  error: null,

  // Default Form values
  formTitle: 'Quiz on Electricity',
  formSubject: 'Science',
  formGradeClass: 'Grade 8',
  formSchoolName: 'Delhi Public School',
  formTimeAllowed: 45,
  formDueDate: '',
  formQuestionConfigs: defaultQuestionConfigs,
  formAdditionalInstructions: '',
  formFile: null,

  // Generation progress
  isGenerating: false,
  generationProgress: 0,
  displayedProgress: 0,
  generationStatusText: '',
  generationLogs: [],
  activeJobId: null,
  activeAssignmentId: null,

  setFormValue: (key, value) => set({ [key]: value }),

  resetForm: () =>
    set({
      formTitle: '',
      formSubject: '',
      formGradeClass: '',
      formSchoolName: 'Delhi Public School',
      formTimeAllowed: 45,
      formDueDate: '',
      formQuestionConfigs: [
        { type: 'Multiple Choice Questions', count: 4, marks: 1 }
      ],
      formAdditionalInstructions: '',
      formFile: null
    }),

  addQuestionConfigRow: () => {
    const current = get().formQuestionConfigs;
    set({
      formQuestionConfigs: [...current, { type: 'Short Questions', count: 3, marks: 2 }]
    });
  },

  removeQuestionConfigRow: (index) => {
    const current = get().formQuestionConfigs;
    if (current.length <= 1) return; // Keep at least one row
    set({
      formQuestionConfigs: current.filter((_, i) => i !== index)
    });
  },

  updateQuestionConfigRow: (index, key, value) => {
    const current = [...get().formQuestionConfigs];
    current[index] = {
      ...current[index],
      [key]: value
    };
    set({ formQuestionConfigs: current });
  },

  fetchAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch assignments');
      const data = await response.json();
      set({ assignments: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error fetching assignments', loading: false });
    }
  },

  fetchAssignmentDetails: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch assignment details');
      const data = await response.json();
      set({ activeAssignment: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Error fetching assignment', loading: false });
      return null;
    }
  },

  deleteAssignment: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete assignment');
      // Remove from list
      set({
        assignments: get().assignments.filter((a) => a._id !== id)
      });
    } catch (err: any) {
      console.error('Delete error:', err);
    }
  },

  submitAssignment: async () => {
    set({ loading: true, error: null });
    try {
      const state = get();
      
      const formData = new FormData();
      formData.append('title', state.formTitle);
      formData.append('subject', state.formSubject);
      formData.append('gradeClass', state.formGradeClass);
      formData.append('schoolName', state.formSchoolName);
      formData.append('timeAllowed', state.formTimeAllowed.toString());
      formData.append('dueDate', state.formDueDate);
      formData.append('questionConfigs', JSON.stringify(state.formQuestionConfigs));
      formData.append('additionalInstructions', state.formAdditionalInstructions);
      
      if (state.formFile) {
        formData.append('file', state.formFile);
      }

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to submit assignment');
      }

      const data = await response.json();
      set({ loading: false });
      
      return {
        assignmentId: data.assignmentId,
        jobId: data.jobId
      };
    } catch (err: any) {
      set({ error: err.message || 'Error creating assignment', loading: false });
      return null;
    }
  },

  regenerateAssignment: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/regenerate`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to start regeneration');
      const data = await response.json();
      set({ loading: false });
      return { jobId: data.jobId };
    } catch (err: any) {
      set({ error: err.message || 'Error regenerating assignment', loading: false });
      return null;
    }
  },

  startGeneration: (jobId, assignmentId) => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    
    set({
      isGenerating: true,
      generationProgress: 10,
      displayedProgress: 10,
      generationStatusText: 'Queueing background job...',
      generationLogs: ['[Queue] Added generation job to queue.', `[Job] Job ID: ${jobId}`],
      activeJobId: jobId,
      activeAssignmentId: assignmentId
    });

    // Start crawling interval
    progressInterval = setInterval(() => {
      const { generationProgress, isGenerating, displayedProgress } = get();
      if (!isGenerating) {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        return;
      }

      const target = generationProgress;
      const prev = displayedProgress;

      if (target === 100) {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        set({ displayedProgress: 100 });
        return;
      }

      if (prev >= 100) return;

      if (prev < target) {
        // quickly catch up if behind actual progress
        set({ displayedProgress: prev + 1 });
        return;
      }

      // Crawl slowly towards next step limits
      let limit = 99;
      if (target === 10) limit = 29;
      else if (target === 30) limit = 39;
      else if (target === 40) limit = 79;
      else if (target === 80) limit = 95;

      if (prev < limit) {
        set({ displayedProgress: prev + 1 });
      }
    }, 350);
  },

  updateProgress: (progress, text, log) => {
    const logs = [...get().generationLogs];
    if (log) logs.push(log);
    logs.push(`[Progress ${progress}%] ${text}`);
    
    set((state) => ({
      generationProgress: progress,
      displayedProgress: Math.max(state.displayedProgress, progress),
      generationStatusText: text,
      generationLogs: logs
    }));
  },

  completeGeneration: (assignment) => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    const logs = [...get().generationLogs];
    logs.push('[Success] Paper generated and finalized.');
    set({
      generationProgress: 100,
      displayedProgress: 100,
      generationStatusText: 'Completed!',
      generationLogs: logs,
      activeAssignment: assignment
    });
  },

  failGeneration: (errorText) => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    const logs = [...get().generationLogs];
    logs.push(`[Error] Generation failed: ${errorText}`);
    set({
      generationProgress: 100,
      displayedProgress: 100,
      generationStatusText: 'Failed',
      generationLogs: logs
    });
  },

  cancelGeneration: () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    set({
      isGenerating: false,
      activeJobId: null,
      activeAssignmentId: null,
      generationProgress: 0,
      displayedProgress: 0,
      generationStatusText: '',
      generationLogs: []
    });
  },

  // Theme Preset Actions
  activeTheme: 'classic',
  setActiveTheme: (theme) => set({ activeTheme: theme }),

  // In-place Single Question Polish Action
  polishQuestion: async (id, sectionIdx, questionIdx, instruction) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/questions/${sectionIdx}/${questionIdx}/polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction })
      });
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to polish question');
      }
      const data = await response.json();
      set({ 
        activeAssignment: data.assignment,
        loading: false 
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Error polishing question', loading: false });
      return false;
    }
  }
}));
