import { create } from 'zustand';
import api from '../utils/api';
import { useUIStore } from './useUIStore';

export interface IQuestion {
  text: string;
  type: 'MCQ' | 'Short Answer' | 'Long Answer' | 'Fill in the blanks';
  options?: string[];
  correctAnswer?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IExam {
  _id: string;
  title: string;
  dueDate: string;
  instructions?: string;
  questionTypes: string[];
  totalQuestions: number;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'queued' | 'processing' | 'generating' | 'completed' | 'failed' | 'cancelled';
  errorMessage?: string;
  generatedPaper?: {
    sections: ISection[];
  };
  jobId?: string;
  startedAt?: string;
  completedAt?: string;
  processingDurationMs?: number;
  createdAt: string;
}

export interface IExamGenerationProgress {
  status: IExam['status'];
  progress: number;
  message: string;
}

interface ExamState {
  exams: IExam[];
  currentExam: IExam | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  progressUpdates: Record<string, IExamGenerationProgress>;
  fetchExams: (search?: string, status?: string) => Promise<void>;
  fetchExamById: (id: string) => Promise<IExam | null>;
  createExam: (formData: FormData) => Promise<IExam | null>;
  regenerateExam: (id: string, variant?: string) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  cancelExam: (id: string) => Promise<void>;
  updateExamProgress: (examId: string, update: IExamGenerationProgress) => void;
  clearCurrentExam: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  exams: [],
  currentExam: null,
  loading: false,
  creating: false,
  error: null,
  progressUpdates: {},

  fetchExams: async (search, status) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/exams', {
        params: { search, status },
      });
      set({ exams: response.data.data, loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error fetching exams';
      set({ error: msg, loading: false });
      useUIStore.getState().addToast(msg, 'error');
    }
  },

  fetchExamById: async (id) => {
    const current = get().currentExam;
    const isGenerating = current && current._id === id && ['queued', 'processing', 'generating'].includes(current.status);

    if (!isGenerating) {
      set({ loading: true, error: null });
    }
    try {
      const response = await api.get(`/exams/${id}`);
      const exam = response.data.data;
      
      console.log(`[Zustand] fetchExamById success for ID: ${id}, status: ${exam.status}`);
      
      set((state) => {
        const exams = state.exams.map((a) => (a._id === id ? exam : a));
        return {
          currentExam: exam,
          exams,
          loading: false,
        };
      });
      return exam;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error fetching exam details';
      set({ error: msg, loading: false });
      useUIStore.getState().addToast(msg, 'error');
      return null;
    }
  },

  createExam: async (formData) => {
    set({ creating: true, error: null });

    // Extract form variables for Optimistic UI insertion
    const title = formData.get('title') as string;
    const dueDate = formData.get('dueDate') as string;
    const difficulty = formData.get('difficulty') as IExam['difficulty'];
    const totalQuestions = Number(formData.get('totalQuestions') || 1);
    const marks = Number(formData.get('marks') || 10);
    const instructions = formData.get('instructions') as string;
    
    let questionTypes: string[] = [];
    try {
      questionTypes = JSON.parse(formData.get('questionTypes') as string);
    } catch {
      questionTypes = [formData.get('questionTypes') as string];
    }

    // Create a temporary ID and mock exam
    const tempId = `temp-${Date.now()}`;
    const optimisticExam: IExam = {
      _id: tempId,
      title,
      dueDate,
      difficulty,
      totalQuestions,
      marks,
      instructions,
      questionTypes,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };

    // Insert optimistically at the top of the exams list
    set((state) => ({
      exams: [optimisticExam, ...state.exams],
    }));

    useUIStore.getState().addToast('Creating exam. AI generating questions...', 'info');

    try {
      const response = await api.post('/exams', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const realExam = response.data.data;

      // Replace optimistic exam with the real one returned by Express
      set((state) => ({
        exams: state.exams.map((a) => (a._id === tempId ? realExam : a)),
        creating: false,
      }));

      useUIStore.getState().addToast('Exam queued for AI generation!', 'success');
      return realExam;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error creating exam';
      
      // Remove the optimistic exam on failure
      set((state) => ({
        exams: state.exams.filter((a) => a._id !== tempId),
        error: msg,
        creating: false,
      }));

      useUIStore.getState().addToast(msg, 'error');
      return null;
    }
  },

  regenerateExam: async (id, variant = 'default') => {
    useUIStore.getState().addToast(`Enqueuing AI regeneration (${variant})...`, 'info');
    
    // Update local card status to queued optimistically
    set((state) => ({
      exams: state.exams.map((a) =>
        a._id === id ? { ...a, status: 'queued', errorMessage: undefined } : a
      ),
      currentExam:
        state.currentExam?._id === id
          ? { ...state.currentExam, status: 'queued', errorMessage: undefined }
          : state.currentExam,
    }));

    try {
      const response = await api.post(`/exams/${id}/regenerate`, null, {
        params: { variant },
      });
      
      const updated = response.data.data;
      set((state) => ({
        exams: state.exams.map((a) => (a._id === id ? updated : a)),
        currentExam: state.currentExam?._id === id ? updated : state.currentExam,
      }));

      useUIStore.getState().addToast('Exam enqueued for regeneration!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error regenerating exam';
      useUIStore.getState().addToast(msg, 'error');
    }
  },

  deleteExam: async (id) => {
    const previousExams = get().exams;
    
    // Optimistic UI deletion
    set((state) => ({
      exams: state.exams.filter((a) => a._id !== id),
      currentExam: state.currentExam?._id === id ? null : state.currentExam,
    }));

    try {
      await api.delete(`/exams/${id}`);
      useUIStore.getState().addToast('Exam deleted successfully', 'success');
    } catch (err: any) {
      // Revert on failure
      set({ exams: previousExams });
      const msg = err.response?.data?.message || 'Error deleting exam';
      useUIStore.getState().addToast(msg, 'error');
    }
  },

  cancelExam: async (id) => {
    useUIStore.getState().addToast('Cancelling AI generation...', 'info');

    // Optimistically update status to cancelled
    set((state) => ({
      exams: state.exams.map((a) =>
        a._id === id ? { ...a, status: 'cancelled' } : a
      ),
      currentExam:
        state.currentExam?._id === id
          ? { ...state.currentExam, status: 'cancelled' }
          : state.currentExam,
    }));

    try {
      await api.post(`/exams/${id}/cancel`);
      useUIStore.getState().addToast('Exam generation cancelled', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error cancelling exam';
      useUIStore.getState().addToast(msg, 'error');
      
      const fetched = await get().fetchExamById(id);
      if (!fetched) {
        get().fetchExams();
      }
    }
  },

  updateExamProgress: (examId, update) => {
    set((state) => {
      console.log(`[Zustand] updateExamProgress for ${examId}:`, update);
      // Update individual progress tracking dictionary
      const updatedProgress = {
        ...state.progressUpdates,
        [examId]: update,
      };

      // Also update the status inside the exams list
      const updatedExams = state.exams.map((a) =>
        a._id === examId
          ? {
              ...a,
              status: update.status,
              errorMessage: update.status === 'failed' ? update.message : a.errorMessage,
            }
          : a
      );

      // And update the currentExam if it's currently open
      let updatedCurrent = state.currentExam;
      if (updatedCurrent && updatedCurrent._id === examId) {
        updatedCurrent = {
          ...updatedCurrent,
          status: update.status,
          errorMessage: update.status === 'failed' ? update.message : updatedCurrent.errorMessage,
        };
      }

      return {
        progressUpdates: updatedProgress,
        exams: updatedExams,
        currentExam: updatedCurrent,
      };
    });
  },

  clearCurrentExam: () => set({ currentExam: null }),
}));
