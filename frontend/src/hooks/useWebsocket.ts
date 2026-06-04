import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useExamStore } from '../store/useExamStore';
import { useUIStore } from '../store/useUIStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';

// Shared socket singleton instance to survive component remounts and React StrictMode
let sharedSocket: Socket | null = null;
let activeHookCount = 0;
let disconnectTimeout: NodeJS.Timeout | null = null;
let lastErrorToastTime = 0;

const getSharedSocket = () => {
  if (!sharedSocket) {
    console.log('[Websocket] Creating new shared socket connection instance');
    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });
  }
  return sharedSocket;
};

export const useWebsocket = (activeExamId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const updateExamProgress = useExamStore((state) => state.updateExamProgress);
  const fetchExamById = useExamStore((state) => state.fetchExamById);
  const fetchExams = useExamStore((state) => state.fetchExams);
  const addToast = useUIStore((state) => state.addToast);

  // Reactively select the exam status from the Zustand store
  const examStatus = useExamStore((state) => {
    if (!activeExamId) return null;
    const current = state.currentExam;
    if (current && current._id === activeExamId) return current.status;
    const found = state.exams.find((a) => a._id === activeExamId);
    return found ? found.status : null;
  });

  // 1. WebSocket Event Listeners
  useEffect(() => {
    if (disconnectTimeout) {
      clearTimeout(disconnectTimeout);
      disconnectTimeout = null;
    }

    const socket = getSharedSocket();
    socketRef.current = socket;
    activeHookCount++;
    console.log(`[Websocket] Hook mounted. Active hook count: ${activeHookCount}`);

    const joinRoom = () => {
      if (activeExamId) {
        console.log(`[Websocket] Subscribing/Joining room for exam: ${activeExamId}`);
        socket.emit('join-exam', activeExamId);
      }
    };

    // If socket is already connected, join the room immediately
    if (socket.connected) {
      joinRoom();
    }

    const onConnect = () => {
      console.log(`[Websocket] Connected with ID: ${socket.id}`);
      joinRoom();
    };

    const onDisconnect = () => {
      console.log('[Websocket] Disconnected');
    };

    const onConnectError = (err: any) => {
      console.error('[Websocket] Connection error:', err);
      const now = Date.now();
      if (now - lastErrorToastTime > 15000) {
        addToast('Real-time connection offline. Using polling fallback.', 'info');
        lastErrorToastTime = now;
      }
    };

    const onStatus = (data: { status: any; progress: number; message: string }) => {
      console.log(`[Websocket] Received "status" event:`, data);
      if (activeExamId) {
        updateExamProgress(activeExamId, data);
        
        if (data.status === 'completed') {
          console.log(`[Websocket] Generation completed for ${activeExamId}. Re-fetching details...`);
          fetchExamById(activeExamId);
          addToast('AI Generation Complete!', 'success');
        } else if (data.status === 'failed') {
          console.log(`[Websocket] Generation failed for ${activeExamId}. Re-fetching details...`);
          fetchExamById(activeExamId);
          addToast(`AI Generation Failed: ${data.message}`, 'error');
        } else if (data.status === 'cancelled') {
          console.log(`[Websocket] Generation cancelled for ${activeExamId}. Re-fetching details...`);
          fetchExamById(activeExamId);
          addToast('AI Generation Cancelled', 'warning');
        }
      }
    };

    const onExamUpdate = (data: { examId: string; status: any; progress: number; message: string }) => {
      console.log('[Websocket] Received "exam:update" event:', data);
      updateExamProgress(data.examId, data);

      if (data.status === 'completed') {
        addToast(`Paper generation complete!`, 'success');
        fetchExams();
      } else if (data.status === 'failed') {
        addToast(`Paper generation failed: ${data.message}`, 'error');
        fetchExams();
      } else if (data.status === 'cancelled') {
        addToast('Paper generation cancelled', 'info');
        fetchExams();
      }
    };

    // Register listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('status', onStatus);
    socket.on('exam:update', onExamUpdate);

    // Clean up listeners and disconnect if no hooks are active
    return () => {
      console.log('[Websocket] Cleaning up event listeners for this hook instance');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('status', onStatus);
      socket.off('exam:update', onExamUpdate);

      activeHookCount--;
      if (activeHookCount <= 0 && sharedSocket) {
        if (disconnectTimeout) clearTimeout(disconnectTimeout);
        disconnectTimeout = setTimeout(() => {
          if (activeHookCount <= 0 && sharedSocket) {
            console.log('[Websocket] No active hooks. Disconnecting shared socket connection.');
            sharedSocket.disconnect();
            sharedSocket = null;
          }
        }, 3000);
      }
    };
  }, [activeExamId, updateExamProgress, fetchExamById, fetchExams, addToast]);

  // 2. Polling Fallback Mechanism
  useEffect(() => {
    if (!activeExamId) return;

    const isGenerating = ['queued', 'processing', 'generating'].includes(examStatus || '');
    if (!isGenerating) {
      console.log(`[Polling Fallback] Exam ${activeExamId} status is "${examStatus}". Polling not active.`);
      return;
    }

    console.log(`[Polling Fallback] Starting 3s polling for exam ${activeExamId}`);

    const interval = setInterval(async () => {
      console.log(`[Polling Fallback] Polling fallback triggered for exam ${activeExamId}...`);
      const exam = await fetchExamById(activeExamId);
      if (exam) {
        console.log(`[Polling Fallback] Exam cache updated: status is "${exam.status}"`);
      }
    }, 3000);

    return () => {
      console.log(`[Polling Fallback] Stopping polling interval for exam ${activeExamId}`);
      clearInterval(interval);
    };
  }, [activeExamId, examStatus, fetchExamById]);

  return socketRef.current;
};
