'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useExamStore } from '../store/useExamStore';
import { useUIStore } from '../store/useUIStore';
import {
  Sparkles,
  FileText,
  Clock,
  Users,
  Notebook,
  History,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Plus,
} from 'lucide-react';

export default function HomeDashboard() {
  const { exams, loading, fetchExams } = useExamStore();
  const { userName, organizationName } = useUIStore();

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const completedExams = exams.filter((e) => e.status === 'completed');
  
  // Calculate total questions generated across all completed exams
  const totalQuestions = completedExams.reduce((sum, exam) => {
    let qCount = 0;
    if (exam.generatedPaper?.sections) {
      exam.generatedPaper.sections.forEach((sec) => {
        qCount += sec.questions.length;
      });
    }
    return sum + qCount;
  }, 0);

  // Calculate total hours saved (approx. 2.5 hours per paper)
  const hoursSaved = completedExams.length * 2.5;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Medium':
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Hard':
      case 'Challenging':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col relative pb-24 px-1 lg:px-4 space-y-8 text-left">
      
      {/* 1. Welcoming Hero Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#2d2d30] to-[#18181b] p-8 lg:p-10 shadow-lg text-white">
        {/* Absolute decorative gradient circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-b from-[#ed6c37]/25 to-transparent blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-gradient-to-t from-pink-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-[#f07b4d]">
            <Sparkles className="w-3.5 h-3.5 fill-[#f07b4d]" />
            <span>AI Exam Engine Workspace</span>
          </div>
          <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-[#f07b4d]">{userName || 'John Doe'}</span>!
          </h1>
          <p className="text-gray-300 text-xs lg:text-sm max-w-lg leading-relaxed">
            Construct high-quality, CBSE-aligned exam papers from study reference files in less than 2 minutes. Ready to build another assessment?
          </p>
          <div className="pt-2">
            <Link
              href="/build-paper"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ed6c37] to-[#f07b4d] hover:from-[#f07b4d] hover:to-[#ed6c37] text-white px-6 py-3 rounded-full font-bold text-xs shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Build Exam Paper</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white border border-[#eaeaea] p-5 rounded-[24px] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Exams Generated</p>
            <p className="text-2xl font-black text-[#181818]">{completedExams.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#ed6c37]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-[#eaeaea] p-5 rounded-[24px] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Questions</p>
            <p className="text-2xl font-black text-[#181818]">{totalQuestions}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-[#eaeaea] p-5 rounded-[24px] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Time Saved</p>
            <p className="text-2xl font-black text-[#181818]">{hoursSaved} hrs</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white border border-[#eaeaea] p-5 rounded-[24px] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Groups</p>
            <p className="text-2xl font-black text-[#181818]">4</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Action Grid & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Quick Tools */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-[#181818]">Quick Tools</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Tool 1 */}
            <Link
              href="/build-paper"
              className="bg-white border border-[#eaeaea] p-5 rounded-[20px] shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex flex-col justify-between h-[160px]"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#ed6c37] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#181818]">Build Exam Paper</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Upload PDF references to generate customized CBSE-aligned question sheets.
                </p>
              </div>
              <div className="text-[11px] font-bold text-[#ed6c37] flex items-center gap-1.5 mt-2">
                <span>Configure Exam</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Tool 2 */}
            <Link
              href="/toolkit"
              className="bg-white border border-[#eaeaea] p-5 rounded-[20px] shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between h-[160px]"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Notebook className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#181818]">AI Teacher's Toolkit</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Evaluate custom grading rubrics, syllabus summaries, and mock parameters.
                </p>
              </div>
              <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5 mt-2">
                <span>Open Toolkit</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Tool 3 */}
            <Link
              href="/library"
              className="bg-white border border-[#eaeaea] p-5 rounded-[20px] shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col justify-between h-[160px]"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#181818]">Reference Library</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Access past templates, reusable documents, and syllabus blueprints.
                </p>
              </div>
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 mt-2">
                <span>View Library</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Tool 4 */}
            <Link
              href="/my-groups"
              className="bg-white border border-[#eaeaea] p-5 rounded-[20px] shadow-sm hover:shadow-md hover:border-purple-200 transition-all group flex flex-col justify-between h-[160px]"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#181818]">Student Groups</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Organize student sections, assign generated test papers, and view grades.
                </p>
              </div>
              <div className="text-[11px] font-bold text-purple-600 flex items-center gap-1.5 mt-2">
                <span>Manage Groups</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Right 1 Column: Recent Exams Activity */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-[#181818]">Recent Activity</h3>
            <Link href="/exams" className="text-xs font-bold text-[#ed6c37] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {completedExams.length === 0 ? (
              <div className="bg-white border border-[#eaeaea] p-6 rounded-[24px] text-center space-y-2">
                <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-500">No exams yet</p>
                <p className="text-[10px] text-gray-400">Your generated exam papers will appear here.</p>
              </div>
            ) : (
              completedExams.slice(0, 3).map((exam) => (
                <Link
                  href={`/paper-view/${exam._id}`}
                  key={exam._id}
                  className="block bg-white border border-[#eaeaea] p-4 rounded-[20px] shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div className="space-y-2 text-left">
                    <h4 className="font-bold text-xs text-[#181818] truncate leading-snug">
                      {exam.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getDifficultyColor(exam.difficulty)}`}>
                        {exam.difficulty}
                      </span>
                      <span className="text-[9px] font-semibold text-gray-400">
                        {exam.marks} Marks
                      </span>
                      <span className="text-[9px] font-semibold text-gray-400">
                        • {formatDate(exam.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
