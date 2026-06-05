'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useExamStore, IExam } from '../../store/useExamStore';
import {
  BookOpen,
  Award,
  Download,
  Plus,
  ArrowRight,
  FileText,
  Bookmark,
  Sparkles,
  ClipboardList,
  CheckCircle,
} from 'lucide-react';

export default function LibraryPage() {
  const { exams, fetchExams } = useExamStore();
  const [activeTab, setActiveTab] = useState<'syllabus' | 'rubrics' | 'past'>('syllabus');

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const completedExams = exams.filter((e) => e.status === 'completed');

  const syllabusBlueprints = [
    {
      id: 'science-8',
      title: 'CBSE Grade 8 Science - Chemical Effects',
      description: 'Covers conduction of electricity in liquids, LED tester models, electroplating, and safety precautions.',
      topics: 4,
      difficulty: 'Medium',
    },
    {
      id: 'maths-7',
      title: 'NCERT Grade 7 Mathematics - Algebra Basics',
      description: 'Covers algebraic expressions, variables, coefficients, linear equations, and basic word problems.',
      topics: 5,
      difficulty: 'Easy',
    },
    {
      id: 'physics-10',
      title: 'CBSE Grade 10 Physics - Reflection & Refraction',
      description: 'Covers spherical mirrors, magnification, lens formula, refractive index, and ray diagrams.',
      topics: 6,
      difficulty: 'Hard',
    },
  ];

  const gradingRubrics = [
    {
      id: 'cbse-standard',
      name: 'CBSE CBSE Marking Guidelines',
      description: 'Allocates marks proportionally for correct formula, step-by-step derivation, and final correct answer.',
      type: 'Structured Rubric',
      savedOn: '01-06-2026',
    },
    {
      id: 'mcq-negative',
      name: 'Objective Marking Pattern',
      description: 'MCQ questions scoring 1 mark with no partial marking. Highly optimized for quick grading.',
      type: 'Objective Rubric',
      savedOn: '28-05-2026',
    },
    {
      id: 'numerical-partial',
      name: 'Numerical Problems Step-Credits',
      description: 'Allows partial credit (0.5 or 1.0 marks) for correct values listed and circuit mapping diagrams.',
      type: 'Step Rubric',
      savedOn: '15-05-2026',
    },
  ];

  return (
    <div className="flex-1 flex flex-col relative pb-24 px-1 lg:px-4 space-y-8 text-left">
      
      {/* Page Header */}
      <div className="mb-2 mt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34c759] flex-shrink-0" />
          <h2 className="text-[19px] font-bold text-[#181818] tracking-tight">Reference Library</h2>
        </div>
        <p className="text-gray-500 text-xs mt-1 pl-[18px]">Manage study material templates, custom rubrics, and generated papers.</p>
      </div>

      {/* Tabs Selector Bar */}
      <div className="bg-white rounded-full border border-[#eaeaea] h-[48px] px-2 flex items-center shadow-sm w-fit gap-1.5 no-print">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'syllabus'
              ? 'bg-[#181818] text-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Syllabus Blueprints
        </button>
        <button
          onClick={() => setActiveTab('rubrics')}
          className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rubrics'
              ? 'bg-[#181818] text-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          AI Grading Rubrics
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'past'
              ? 'bg-[#181818] text-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Past Papers ({completedExams.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1">
        
        {/* Tab 1: Syllabus Blueprints */}
        {activeTab === 'syllabus' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {syllabusBlueprints.map((blueprint) => (
              <div
                key={blueprint.id}
                className="bg-white border border-[#eaeaea] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative min-h-[180px]"
              >
                <div className="space-y-2 text-left">
                  <div className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#ed6c37] border border-orange-100 mb-1">
                    {blueprint.difficulty} Difficulty
                  </div>
                  <h4 className="font-bold text-sm text-[#181818] leading-snug">
                    {blueprint.title}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed truncate-3-lines">
                    {blueprint.description}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50">
                  <span className="text-[10px] font-semibold text-gray-400">
                    {blueprint.topics} Syllabus Topics
                  </span>
                  <Link
                    href="/build-paper"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ed6c37] hover:underline"
                  >
                    <span>Use Syllabus</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Create New Blueprint Box */}
            <Link
              href="/build-paper"
              className="border-2 border-dashed border-[#e4e4e7] hover:border-orange-200 hover:bg-orange-50/10 rounded-[24px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[180px]"
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <h4 className="font-bold text-sm text-[#181818]">Add Blueprint</h4>
              <p className="text-xs text-gray-400 max-w-[180px] mt-1 leading-normal">
                Upload new study references for quick exam generation.
              </p>
            </Link>
          </div>
        )}

        {/* Tab 2: AI Grading Rubrics */}
        {activeTab === 'rubrics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {gradingRubrics.map((rubric) => (
              <div
                key={rubric.id}
                className="bg-white border border-[#eaeaea] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative min-h-[180px]"
              >
                <div className="space-y-2 text-left">
                  <div className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 mb-1">
                    {rubric.type}
                  </div>
                  <h4 className="font-bold text-sm text-[#181818] leading-snug">
                    {rubric.name}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed truncate-3-lines">
                    {rubric.description}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50 text-[10px] font-semibold text-gray-400">
                  <span>Saved on: {rubric.savedOn}</span>
                  <div className="text-blue-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 fill-blue-50 text-blue-600" />
                    <span>Active</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Rubric Box */}
            <div className="border-2 border-dashed border-[#e4e4e7] hover:border-blue-200 hover:bg-blue-50/10 rounded-[24px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[180px]">
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <h4 className="font-bold text-sm text-[#181818]">Add Custom Rubric</h4>
              <p className="text-xs text-gray-400 max-w-[180px] mt-1 leading-normal">
                Define customized marking schemes for student answers.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Past Papers */}
        {activeTab === 'past' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-fade-in">
            {completedExams.length === 0 ? (
              <div className="col-span-2 bg-white border border-[#eaeaea] p-12 rounded-[24px] text-center space-y-4">
                <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-[#181818]">No past papers found</h4>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Once your AI exam paper generations are completed, they will automatically be archived in this folder.
                </p>
              </div>
            ) : (
              completedExams.map((exam) => (
                <div
                  key={exam._id}
                  className="bg-white border border-[#eaeaea] rounded-[24px] p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative min-h-[140px]"
                >
                  <div className="flex items-start justify-between gap-4 text-left">
                    <h4 className="font-bold text-base text-[#181818] tracking-tight truncate-2-lines">
                      {exam.title}
                    </h4>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/exams/${exam._id}/pdf`}
                      download
                      className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex justify-between items-center mt-6 text-xs font-semibold text-gray-500 border-t border-gray-50 pt-4">
                    <span>Generated on: {formatDate(exam.createdAt)}</span>
                    <Link
                      href={`/paper-view/${exam._id}`}
                      className="text-[#ed6c37] hover:underline font-bold"
                    >
                      View Exam Paper
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

    </div>
  );
}
