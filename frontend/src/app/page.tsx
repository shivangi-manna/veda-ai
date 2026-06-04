'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Bell, 
  MoreVertical, 
  Plus, 
  FileQuestion,
  Loader2,
  Sparkles,
  BookOpen,
  BarChart3,
  CheckSquare,
  FileSpreadsheet,
  Users,
  Award,
  TrendingUp,
  Send,
  Eye,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useAssignmentStore, IAssignment } from '@/store/useAssignmentStore';
import Header from '@/components/Header';

// Carousel Images list mapped to the 12 reference screenshots


// Mock Student Answers for AI Grading Desk
const MOCK_STUDENTS = [
  { id: '1', name: 'Aarav Sharma', score: '45/50', status: 'graded', initials: 'AS' },
  { id: '2', name: 'Diya Patel', score: '48/50', status: 'graded', initials: 'DP' },
  { id: '3', name: 'Kabir Sen', score: '32/50', status: 'graded', initials: 'KS' },
  { id: '4', name: 'Riya Das', score: '--', status: 'pending', initials: 'RD' }
];

const MOCK_ANSWERS: Record<string, Array<{ qNum: number; qText: string; studentAns: string; scoreAwarded: number; maxScore: number; rubric: string; aiFeedback: string }>> = {
  '1': [
    {
      qNum: 1,
      qText: 'What is the SI unit of electric current? Define it.',
      studentAns: 'The SI unit of electric current is the Ampere (A). It is defined as one Coulomb of charge passing through a circuit per second (1 A = 1 C/s).',
      scoreAwarded: 2,
      maxScore: 2,
      rubric: '1 mark for naming Ampere. 1 mark for charge definition formula.',
      aiFeedback: 'Perfect answer. The student named the unit correctly and provided the standard definition with the matching formula.'
    },
    {
      qNum: 2,
      qText: 'State Ohm\'s Law and write its mathematical formula.',
      studentAns: 'Ohm\'s Law states that current is directly proportional to voltage across a conductor, as long as temperature stays the same. Formula is V = I * R.',
      scoreAwarded: 3,
      maxScore: 3,
      rubric: '1 mark for proportionality statement. 1 mark for constant temperature condition. 1 mark for formula V = IR.',
      aiFeedback: 'Excellent response. All three grading conditions are met, including the constant temperature condition which is often missed.'
    },
    {
      qNum: 3,
      qText: 'Describe the magnetic effect of electric current with a simple example.',
      studentAns: 'When current passes through a wire, it behaves like a magnet. An example is wrapping wire around an iron nail and connecting it to a battery; the nail starts attracting paper clips because it becomes an electromagnet.',
      scoreAwarded: 5,
      maxScore: 5,
      rubric: '2 marks for explaining magnetism in wire. 3 marks for describing a valid electromagnet setup with coils, core, and battery.',
      aiFeedback: 'Highly descriptive answer. The paperclip electromagnet experiment is a textbook example. Outstanding application of theory.'
    }
  ],
  '2': [
    {
      qNum: 1,
      qText: 'What is the SI unit of electric current? Define it.',
      studentAns: 'Ampere is the unit. It is the amount of current when a coulomb of charge flows every second.',
      scoreAwarded: 2,
      maxScore: 2,
      rubric: '1 mark for naming Ampere. 1 mark for charge definition formula.',
      aiFeedback: 'Correct and concise. Standard definition and name are accurate.'
    },
    {
      qNum: 2,
      qText: 'State Ohm\'s Law and write its mathematical formula.',
      studentAns: 'Voltage equals Current times Resistance. Mathematically V = I / R.',
      scoreAwarded: 1.5,
      maxScore: 3,
      rubric: '1 mark for proportionality statement. 1 mark for constant temperature condition. 1 mark for formula V = IR.',
      aiFeedback: 'Formula is written incorrectly as V = I/R (should be V=IR). Proportionality is stated, but constant temperature is omitted. Awarded half marks.'
    },
    {
      qNum: 3,
      qText: 'Describe the magnetic effect of electric current with a simple example.',
      studentAns: 'An electric current produces a magnetic field around it. Like in electric motors where the coils rotate in magnets when electricity passes through them.',
      scoreAwarded: 4,
      maxScore: 5,
      rubric: '2 marks for explaining magnetism in wire. 3 marks for describing a valid electromagnet setup.',
      aiFeedback: 'Good conceptual knowledge. Mentioned rotation in motors, but did not describe the electromagnetism core experiment in detail.'
    }
  ],
  '3': [
    {
      qNum: 1,
      qText: 'What is the SI unit of electric current? Define it.',
      studentAns: 'It is the Volt. 1 Volt = 1 Joule per Coulomb.',
      scoreAwarded: 0,
      maxScore: 2,
      rubric: '1 mark for naming Ampere. 1 mark for charge definition formula.',
      aiFeedback: 'Incorrect unit named. The student defined the Volt (unit of potential difference) instead of the Ampere (unit of current).'
    },
    {
      qNum: 2,
      qText: 'State Ohm\'s Law and write its mathematical formula.',
      studentAns: 'Ohm\'s law says that current increases when voltage increases. V = IR.',
      scoreAwarded: 2,
      maxScore: 3,
      rubric: '1 mark for proportionality statement. 1 mark for constant temperature condition. 1 mark for formula V = IR.',
      aiFeedback: 'Correct formula and general relation. Omitted the critical condition that physical parameters like temperature must remain constant.'
    },
    {
      qNum: 3,
      qText: 'Describe the magnetic effect of electric current with a simple example.',
      studentAns: 'Current wire acts like a magnet. An example is a compass needle moving when placed near a current wire.',
      scoreAwarded: 3,
      maxScore: 5,
      rubric: '2 marks for explaining magnetism in wire. 3 marks for describing a valid electromagnet setup.',
      aiFeedback: 'Correctly identified Oersted\'s compass experiment. However, did not elaborate on electromagnet structure or applications.'
    }
  ],
  '4': [
    {
      qNum: 1,
      qText: 'What is the SI unit of electric current? Define it.',
      studentAns: 'Ampere is the unit. It is when charges move inside a circuit wire.',
      scoreAwarded: 1,
      maxScore: 2,
      rubric: '1 mark for naming Ampere. 1 mark for charge definition formula.',
      aiFeedback: 'Named the unit correctly. The definition is too vague; does not specify the flow rate of one coulomb per second. Awarded 1 mark.'
    },
    {
      qNum: 2,
      qText: 'State Ohm\'s Law and write its mathematical formula.',
      studentAns: 'Ohm\'s law links Voltage, Current, and Resistance together. V = I * R.',
      scoreAwarded: 2,
      maxScore: 3,
      rubric: '1 mark for proportionality statement. 1 mark for constant temperature condition. 1 mark for formula V = IR.',
      aiFeedback: 'Identified the variables and formula correctly, but failed to state the law itself (current directly proportional to voltage).'
    },
    {
      qNum: 3,
      qText: 'Describe the magnetic effect of electric current with a simple example.',
      studentAns: 'Electricity makes magnets. Like when you wrap iron.',
      scoreAwarded: 1,
      maxScore: 5,
      rubric: '2 marks for explaining magnetism in wire. 3 marks for describing a valid electromagnet setup.',
      aiFeedback: 'Answer is incomplete. Only states that wrapping iron is involved without explaining current flow, electromagnetism, or battery context.'
    }
  ]
};

const MOCK_REPORTS: Record<string, {
  name: string;
  id: string;
  score: string;
  rememberingPct: number;
  applyingPct: number;
  evaluatingPct: number;
  gapTitle: string;
  gapDesc: string;
  remediation: string;
  signature: string;
  email: string;
}> = {
  '1': {
    name: 'Aarav Sharma',
    id: 'aarav_sharma_08',
    score: '90% (Grade A)',
    rememberingPct: 100,
    applyingPct: 92,
    evaluatingPct: 80,
    gapTitle: 'Ohm\'s Law Formula Inversion',
    gapDesc: 'Aarav inverted current-to-voltage relationships once during subjective question #2. He solved the circuit algebra but inverted R = I/V calculations.',
    remediation: 'Assign 3 Ohm\'s Law algebraic worksheets to focus on numerator-denominator alignment of resistance formulas.',
    signature: 'R. Verma',
    email: 'aarav.parent@mail.com'
  },
  '2': {
    name: 'Diya Patel',
    id: 'diya_patel_12',
    score: '96% (Grade A+)',
    rememberingPct: 100,
    applyingPct: 100,
    evaluatingPct: 90,
    gapTitle: 'Ohm\'s Law Application',
    gapDesc: 'Diya displayed near perfect mastery, but had a slight formula inversion in parallel calculation at the end.',
    remediation: 'Provide advanced parallel grid problems for self-paced enrichment.',
    signature: 'R. Verma',
    email: 'diya.parent@mail.com'
  },
  '3': {
    name: 'Kabir Sen',
    id: 'kabir_sen_15',
    score: '64% (Grade C)',
    rememberingPct: 80,
    applyingPct: 60,
    evaluatingPct: 50,
    gapTitle: 'Unit of Current definition',
    gapDesc: 'Kabir struggled with defining SI units of current and drawing series/parallel comparison lines.',
    remediation: 'Assign remedial definitions homework and request a 1-on-1 tutoring review session.',
    signature: 'R. Verma',
    email: 'kabir.parent@mail.com'
  }
};

const SEGMENT_DETAILS: Record<string, { title: string; count: number; color: string; bg: string; students: string[] }> = {
  'A': {
    title: 'Grade A Students',
    count: 12,
    color: '#27ae60',
    bg: '#eafaf1',
    students: ['Aarav Sharma (49/50)', 'Diya Patel (48/50)', 'Amit Patel (47/50)', 'Priya Singh (46/50)', 'Rohan Das (45/50)', 'Sneha Reddy (45/50)', 'Ananya Iyer (45/50)', 'Vikram Malhotra (45/50)', 'Rahul Roy (45/50)', 'Neha Sen (45/50)', 'Arjun Gupta (45/50)', 'Kirti Rao (45/50)']
  },
  'B': {
    title: 'Grade B Students',
    count: 15,
    color: '#f1c40f',
    bg: '#fff9e6',
    students: ['Kabir Sen (42/50)', 'Riya Das (41/50)', 'Rohit Verma (40/50)', 'Pooja Sharma (39/50)', 'Dev Nair (38/50)', 'Nisha Kumar (38/50)', 'Tanvi Bose (37/50)', 'Kunal Shah (36/50)', 'Sid Rao (36/50)', 'Meera Joshi (35/50)', 'Yash Patil (35/50)', 'Alok Singh (35/50)', 'Sanjana Sen (35/50)', 'Ritika Dey (35/50)', 'Varun Mehta (35/50)']
  },
  'C': {
    title: 'Grade C Students',
    count: 13,
    color: '#e67e22',
    bg: '#fdf2e9',
    students: ['Simran Kaur (34/50)', 'Karan Johar (33/50)', 'Raj Malhotra (32/50)', 'Tina Dutta (31/50)', 'Sameer Sheikh (30/50)', 'Ritu Goel (30/50)', 'Prem Chopra (30/50)', 'Bobby Deol (29/50)', 'Sunny Deol (28/50)', 'Sanjay Dutt (28/50)', 'Juhi Chawla (27/50)', 'Karisma Kapoor (26/50)', 'Raveena Tandon (25/50)']
  },
  'Below D': {
    title: 'Below Grade D Students',
    count: 10,
    color: '#e74c3c',
    bg: '#fdedec',
    students: ['Uday Chopra (24/50)', 'Tushar Kapoor (22/50)', 'Abhishek Bachchan (20/50)', 'Dino Morea (19/50)', 'Zayed Khan (18/50)', 'Fardeen Khan (18/50)', 'Imran Khan (17/50)', 'Ashmit Patel (15/50)', 'Harman Baweja (12/50)', 'Jackky Bhagnani (10/50)']
  }
};

const CONCEPT_DETAILS: Record<number, { title: string; pct: string; desc: string; students: string[]; remediation: string }> = {
  1: {
    title: "Ohm's Law Application",
    pct: "23%",
    desc: "Students frequently invert the current-to-voltage relationships during algebraic manipulations (e.g., writing R = I/V instead of R = V/I).",
    students: ["Uday Chopra", "Tushar Kapoor", "Abhishek Bachchan", "Simran Kaur", "Sameer Sheikh"],
    remediation: "Assign 3 formula-triangle Ohm's Law worksheets focusing on cross-multiplication algebra."
  },
  2: {
    title: "Resistance in Parallel Circuits",
    pct: "18%",
    desc: "Students fail to calculate reciprocal sums correctly (1/Rp = 1/R1 + 1/R2) and forget to invert the final fraction.",
    students: ["Tanvi Bose", "Kunal Shah", "Tina Dutta", "Sunny Deol", "Bobby Deol"],
    remediation: "Run a 10-minute parallel resistor network board tutorial showing step-by-step division."
  },
  3: {
    title: "Potential Difference and EMF",
    pct: "15%",
    desc: "Confusion between the internal electromotive force of a battery cell and the potential drop across series load resistors.",
    students: ["Kabir Sen", "Pooja Sharma", "Harman Baweja", "Ashmit Patel"],
    remediation: "Use direct multi-meter circuit measurements in lab class to compare cell terminal voltage."
  },
  4: {
    title: "Interpreting Circuit Diagrams",
    pct: "12%",
    desc: "Difficulty tracing electric current paths in complex circuit diagrams with parallel branches or nested loops.",
    students: ["Jackky Bhagnani", "Karan Johar", "Raj Malhotra", "Dev Nair"],
    remediation: "Group review session tracing schematic circuit loops using multi-colored marker pens."
  },
  5: {
    title: "Series vs Parallel Circuits",
    pct: "8%",
    desc: "Misunderstanding current conservation in series paths vs voltage division among elements.",
    students: ["Simran Kaur", "Ritika Dey", "Imran Khan"],
    remediation: "Assign online circuit builder simulation tasks to analyze current readings in series vs parallel."
  }
};

const ACTION_DETAILS: Record<number, { title: string; priority: string; desc: string; time: string }> = {
  1: {
    title: "Remedial Tutorial for Simran Kaur",
    priority: "High Priority",
    desc: "Simran misinterprets series vs parallel current division logic. Arrange a 1-on-1 circuit-building hardware review session with her.",
    time: "Arrange by Tomorrow"
  },
  2: {
    title: "Classroom Revision of Ohm's Law",
    priority: "High Priority",
    desc: "Plan a 15-minute whiteboard session showing real-world applications of Ohm's law (e.g., cell phone battery drain, heater element resistivity).",
    time: "Plan for Next Session"
  },
  3: {
    title: "Derivation of Electrical Power",
    priority: "Medium Priority",
    desc: "Derive power formulas (P = VI, P = I^2*R, P = V^2/R) clearly on board to clarify algebraic differences in parallel vs series loads.",
    time: "Incorporate in Lesson 4"
  },
  4: {
    title: "Extra Worksheets for Below D Students",
    priority: "High Priority",
    desc: "Draft and print a simplified formula triangle revision worksheet for the 10 students performing below Grade D (Abhishek, Zayed, Tushar, etc.).",
    time: "Distribute by Friday"
  },
  5: {
    title: "Hands-on Resistance Lab Demo",
    priority: "Low Priority",
    desc: "Use wire reels of varying lengths and thicknesses with multi-meters to demonstrate resistance factors (length, area, resistivity) in physical form.",
    time: "Schedule for Next Tuesday"
  }
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    assignments, 
    loading, 
    fetchAssignments, 
    deleteAssignment 
  } = useAssignmentStore();

  // Active Tab from query param
  const activeTab = searchParams.get('tab') || 'home';

  // Search & Filter workspace states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Analytics Interactive States
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);

  // Landing Page Interactive States
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // AI Grading Desk States
  const [selectedStudentId, setSelectedStudentId] = useState('1');
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerSendNotification = (email: string) => {
    setToastMessage(`Report sent successfully to ${email}!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };
  const [isGradingDone, setIsGradingDone] = useState<Record<string, boolean>>({
    '1': true, '2': true, '3': true, '4': false
  });
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({
    '1': 10, '2': 8, '3': 5, '4': 4
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter assignments
  const subjects = Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)));
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === '' || a.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  const renderTitle = (title: string) => {
    return title;
  };



  const triggerGradingEvaluation = (studentId: string) => {
    if (isGradingDone[studentId]) return;
    
    // Simulate AI grading with a loading delay
    setIsGradingDone(prev => ({ ...prev, [studentId]: true }));
  };

  return (
    <div>
      <Header />

      {/* ==========================================
         TAB 1: HOME (myvedaai.com Landing replica)
         ========================================== */}
      {activeTab === 'home' && (
        <div className="content-card" style={{ height: 'auto', minHeight: 'calc(100vh - 100px)', paddingBottom: '32px', overflowY: 'auto' }}>
          {/* Welcome Row */}
          <div className="content-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="active-dot-green"></span>
              <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Hi Madhur 👋
              </h1>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Welcome Back, Ready to create your next assignment?
            </p>
          </div>

          {/* First Row: Stats Cards Grid */}
          <div className="dashboard-stats-grid">
            {/* Card 1: Assignment Reviewed */}
            <div className="stat-card-dark">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '60%' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>Assignment Reviewed in last 30 days</span>
              </div>
              <div className="gauge-wrapper" style={{ height: '72px' }}>
                <svg width="90" height="72" viewBox="0 0 100 80">
                  <path d="M 11.9 74 A 44 44 0 1 1 88.1 74" fill="none" stroke="#33373D" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 11.9 74 A 44 44 0 1 1 88.1 74" fill="none" stroke="#ff5c39" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${184.3 * (67 / 80)} 184.3`} strokeDashoffset={0} />
                </svg>
                <div className="gauge-inner-text" style={{ bottom: '2px' }}>
                  <span className="gauge-val-big" style={{ fontSize: '22px' }}>67</span>
                  <span className="gauge-lbl-small" style={{ fontSize: '12px' }}>of 80</span>
                </div>
              </div>
            </div>

            {/* Card 2: Time Saved By AI */}
            <div className="stat-card-dark">
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', flex: 1 }}>
                <span style={{ fontSize: '17px', fontWeight: 600, color: '#9a9a9a' }}>Time Saved By AI</span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: 'white', margin: '4px 0' }}>31.7 hrs</span>
                <span style={{ fontSize: '12px', color: '#9a9a9a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  6.5 hrs more than last month
                  <svg width="14" height="10" viewBox="0 0 24 14" fill="none">
                    <path d="M2 12L8 8L14 10L22 2" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 2H22V8" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Card 3: Total Assignments Graded */}
            <div className="stat-card-light">
              <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Assignments Graded</span>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>128</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Submitted, pending evaluation</span>
            </div>

            {/* Avatar Circle Wrapper */}
            <div className="teacher-avatar-circle-wrapper">
              <img 
                src="/teacher_avatar.png" 
                alt="Teacher 3D Avatar" 
                className="teacher-avatar-image"
              />
            </div>
          </div>

          {/* Second Row: Recent Assignments */}
          <div className="dashboard-recent-section" style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="active-dot-green"></span>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Recent Assignments
                </h2>
              </div>
              <button onClick={() => router.push('/?tab=assignments')} className="btn-view-all">
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="assignment-grid">
              {/* Card 1: Assignment on Motion */}
              <div className="assignment-card dashboard-card">
                <div className="assignment-card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="assignment-card-title" style={{ margin: 0 }}>
                      {renderTitle("Assignment on Motion")}
                    </h3>
                    <span className="badge-active" style={{ backgroundColor: '#eafaf1', color: '#27ae60', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      Active
                    </span>
                  </div>
                  <button className="assignment-card-actions-btn" style={{ position: 'static' }}>
                    <MoreVertical size={16} />
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 16px 0' }}>Class 10-A • Science</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>50/50</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Submitted</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: '#555555', textAlign: 'right' }}>
                    <div><strong>Assigned on :</strong> 20-06-2025</div>
                    <div><strong>Due :</strong> 21-06-2025</div>
                  </div>
                </div>
                
                {/* 100% Progress Bar */}
                <div style={{ width: '100%', height: '4px', backgroundColor: '#efefef', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#ef7d57' }}></div>
                </div>
              </div>

              {/* Card 2: Quiz on Electricity */}
              <div className="assignment-card dashboard-card">
                <div className="assignment-card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="assignment-card-title" style={{ margin: 0 }}>
                      {renderTitle("Quiz on Electricity")}
                    </h3>
                    <span className="badge-closed" style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      Closed
                    </span>
                  </div>
                  <button className="assignment-card-actions-btn" style={{ position: 'static' }}>
                    <MoreVertical size={16} />
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 16px 0' }}>Class 10-A • Science</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>47/50</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Submitted</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: '#555555', textAlign: 'right' }}>
                    <div><strong>Assigned on :</strong> 20-06-2025</div>
                    <div><strong>Due :</strong> 21-06-2025</div>
                  </div>
                </div>
                
                {/* 94% Progress Bar */}
                <div style={{ width: '100%', height: '4px', backgroundColor: '#efefef', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '94%', height: '100%', backgroundColor: '#ef7d57' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Row: Creator Shortcuts */}
          <div className="dashboard-shortcuts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            {/* Shortcut 1: AI Assignment Grading — title + description only */}
            <div className="shortcut-card-ai" style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '20px', padding: '22px 26px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)', transition: 'all 0.15s ease' }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                AI Assignment Grading
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                Create assignments and automatically evaluate student responses.
              </p>
            </div>

            {/* Shortcut 2: AI Exam Grading */}
            <div className="shortcut-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #efefef', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.01)', transition: 'all 0.15s ease' }}>
              <div style={{ paddingRight: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  AI Exam Grading
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Automatically evaluate exam papers, generate instant scores, and provide detailed feedback and performance insights.
                </p>
              </div>
              <button onClick={() => router.push('/?tab=toolkit')} style={{ border: 'none', background: '#f1f5f9', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }}>
                <ChevronRight size={18} color="#111111" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
         TAB 2: ASSIGNMENTS (Assessment Creator Hub)
         ========================================== */}
      {activeTab === 'assignments' && (
        <>
          <div className="content-card">
            <div className="content-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span className="active-dot-green"></span>
                <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Assignments
                </h1>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Manage and create assignments for your classes.
              </p>

              {assignments.length > 0 && (
                /* Filter controls row inside header */
                <div className="filter-row">
                  <select 
                    className="filter-dropdown"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="">Filter By (All Subjects)</option>
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>

                  <div className="search-input-wrapper">
                    <Search className="search-icon" size={18} />
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder="Search Assignment" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {loading && assignments.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--brand-accent)" />
              </div>
            ) : assignments.length === 0 ? (
              /* Empty State */
              <div className="empty-state-wrapper">
                <div className="empty-state-image-wrapper">
                  {/* Replicating figma checklist drawing without static assets */}
                  <div className="figma-empty-illustration">
                    <div className="figma-empty-doc">
                      <div className="figma-doc-line long"></div>
                      <div className="figma-doc-line short"></div>
                      <div className="figma-doc-line long"></div>
                      <div className="figma-doc-line medium"></div>
                    </div>
                    <div className="figma-empty-glass">
                      <div className="figma-glass-lens">
                        <span className="figma-lens-cross">✕</span>
                      </div>
                      <div className="figma-glass-handle"></div>
                    </div>
                    <div className="figma-bubble small-dot-1"></div>
                    <div className="figma-bubble small-dot-2"></div>
                    <div className="figma-bubble bubble-rect-1"></div>
                    <div className="figma-bubble bubble-rect-2"></div>
                  </div>
                </div>
                <h2 className="empty-state-title">No assignments yet</h2>
                <p className="empty-state-desc">
                  Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'center' }}>
                  <Link href="/create">
                    <button className="btn-dark-capsule">
                      <Plus size={16} />
                      <span>Create Your First Assignment</span>
                    </button>
                  </Link>
                  <button 
                    className="btn-light-outline"
                    style={{
                      padding: '10px 18px',
                      borderRadius: '999px',
                      border: '1px solid #dcdcdc',
                      backgroundColor: 'transparent',
                      fontWeight: 600,
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onClick={async () => {
                      try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/assignments'}/seed`, {
                          method: 'POST'
                        });
                        if (response.ok) {
                          // Fetch updated list of assignments
                          await useAssignmentStore.getState().fetchAssignments();
                        }
                      } catch (err) {
                        console.error('Failed to seed demo data:', err);
                      }
                    }}
                  >
                    <span>Load Demo Assignments</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Filled State */
              <>
                {/* Scrollable grid area inside the card panel */}
                <div className="content-card-scroll-area">
                  <div className="assignment-grid">
                    {filteredAssignments.map((assignment) => (
                      <div key={assignment._id} className="assignment-card">
                        <div className="assignment-card-header-row">
                          <h3 className="assignment-card-title">{renderTitle(assignment.title)}</h3>
                          
                          {/* Actions Dropdown Button */}
                          <button 
                            className="assignment-card-actions-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === assignment._id ? null : assignment._id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        {/* Context Menu Dropdown */}
                        {activeMenuId === assignment._id && (
                          <div className="assignment-card-dropdown" ref={dropdownRef}>
                            <button 
                              className="assignment-card-dropdown-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                if (assignment.status === 'completed') {
                                  router.push(`/output/${assignment._id}`);
                                } else {
                                  setToastMessage(`Assignment status is ${assignment.status}. Wait for completion.`);
                                  setTimeout(() => setToastMessage(null), 3000);
                                }
                              }}
                            >
                              View Assignment
                            </button>
                            <button 
                              className="assignment-card-dropdown-item delete"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this assignment?')) {
                                  deleteAssignment(assignment._id);
                                  setActiveMenuId(null);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        <div className="assignment-card-bottom-row">
                          <div className="assignment-card-date-item">
                            <strong>Assigned on :</strong> {formatDate(assignment.createdAt)}
                          </div>
                          <div className="assignment-card-date-item">
                            <strong>Due :</strong> {formatDate(assignment.dueDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Floating bottom Create Assignment FAB — only when assignments exist */}
          {assignments.length > 0 && (
            <div className="fab-assignments-wrapper">
              <Link href="/create" style={{ textDecoration: 'none' }}>
                <button className="fab-assignments-btn">
                  <Plus size={17} />
                  <span>Create Assignment</span>
                </button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* ==========================================
         TAB 3: CLASSROOM INSIGHTS & ANALYTICS (Analytics)
         ========================================== */}
      {activeTab === 'toolkit' && (
        <div className="content-card" style={{ height: 'auto', minHeight: 'calc(100vh - 100px)', paddingBottom: '32px', overflowY: 'auto' }}>
          <div className="analytics-grid-two-col">
            
            {/* Left Column */}
            <div className="analytics-left-pane">
              
              {/* Card 1: Overall Class Performance Summary */}
              <div className="pane-card-white">
                <h3 className="pane-card-title-main">Overall Class Performance Summary</h3>
                <div className="summary-layout-horizontal">
                  
                  {/* Left: Submissions Dark Card */}
                  <div className="dark-submissions-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '1px' }}>Submissions</span>
                    
                    <div className="gauge-wrapper" style={{ width: '150px', height: '120px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                      <svg width="150" height="120" viewBox="0 0 100 80">
                        <path d="M 11.9 74 A 44 44 0 1 1 88.1 74" fill="none" stroke="#33373D" strokeWidth="10" strokeLinecap="round" />
                        <path d="M 11.9 74 A 44 44 0 1 1 88.1 74" fill="none" stroke="#ff5c39" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${184.3 * (45 / 50)} 184.3`} strokeDashoffset={0} />
                      </svg>
                      <div className="gauge-inner-text" style={{ position: 'absolute', bottom: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '40px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'baseline', justifyContent: 'center', lineHeight: 1 }}>
                          45
                          <span style={{ fontSize: '20px', color: '#9a9a9a', fontWeight: 600, marginLeft: '2px' }}>/50</span>
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#9a9a9a', marginTop: '2px' }}>Submissions</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center', gap: '12px', width: '100%', fontSize: '12px', fontWeight: 600, color: '#eaeaea' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: '#ff5c39', borderRadius: '50%', flexShrink: 0 }}></span>
                        <span>Submitted</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: '#33373D', borderRadius: '50%', flexShrink: 0 }}></span>
                        <span>Not Submitted</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: 2x2 White Stats Grid */}
                  <div className="light-stats-subgrid">
                    <div className="light-mini-stat-card">
                      <span style={{ fontSize: '32px', fontWeight: 800, color: '#27ae60' }}>82%</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>Average Score</span>
                    </div>
                    <div className="light-mini-stat-card">
                      <span style={{ fontSize: '32px', fontWeight: 800, color: '#ff5c39' }}>95%</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>TopScore</span>
                    </div>
                    <div className="light-mini-stat-card">
                      <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)' }}>20<span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/25</span></span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '6px' }}>Class Median</span>
                    </div>
                    <div className="light-mini-stat-card">
                      <span style={{ fontSize: '32px', fontWeight: 800, color: '#9a9a9a' }}>40%</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>Lowest Score</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 2: Student Segmentation (Orange backdrop) */}
              <div className="segmentation-card-orange">
                <div className="segmentation-left-content" style={{ flex: 1 }}>
                  <div className="segmentation-pillars-white-box">
                    <h4 className="segmentation-white-box-title">Student Segmentation (Based on grades)</h4>
                    <div className="segment-pillars-container">
                      {/* Pillar A */}
                      <button onClick={() => setSelectedSegment('A')} className="segment-pillar-button grade-a">
                        <span className="segment-letter">A</span>
                        <span className="segment-student-count">12 Students</span>
                      </button>

                      {/* Pillar B */}
                      <button onClick={() => setSelectedSegment('B')} className="segment-pillar-button grade-b">
                        <span className="segment-letter">B</span>
                        <span className="segment-student-count">15 Students</span>
                      </button>

                      {/* Pillar C */}
                      <button onClick={() => setSelectedSegment('C')} className="segment-pillar-button grade-c">
                        <span className="segment-letter">C</span>
                        <span className="segment-student-count">13 Students</span>
                      </button>

                      {/* Pillar Below D */}
                      <button onClick={() => setSelectedSegment('Below D')} className="segment-pillar-button grade-d">
                        <span className="segment-below-lbl">Below</span>
                        <span className="segment-letter" style={{ fontSize: '20px', lineHeight: 1 }}>D</span>
                        <span className="segment-student-count">10 Students</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Circular Profile Avatar on the right with decorative concentric rings */}
                <div className="teacher-avatar-circle-wrapper" style={{ flexShrink: 0, marginLeft: '24px' }}>
                  <div className="avatar-ring ring-1"></div>
                  <div className="avatar-ring ring-2"></div>
                  <div className="avatar-ring ring-3"></div>
                  
                  <div className="avatar-badge badge-top-right">🕒</div>
                  <div className="avatar-badge badge-bottom-left">📊</div>
                  <div className="avatar-badge badge-bottom-right">🎓</div>

                  <img 
                    src="/teacher_avatar.png" 
                    alt="Teacher 3D Avatar" 
                    className="teacher-avatar-image" 
                  />
                </div>
              </div>

              {/* Card 3: AI Feedback Summary (Checklist rows) */}
              <div className="pane-card-white" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', textAlign: 'left' }}>
                  AI Feedback Summary
                </h3>

                <div className="feedback-row-item">
                  <div className="feedback-icon-box green">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="feedback-text-main">
                    Assignment Graded : <strong>87</strong>
                  </span>
                </div>

                <div className="feedback-row-item">
                  <div className="feedback-icon-box dark">
                    <Award size={18} />
                  </div>
                  <span className="feedback-text-main">
                    Concept Understanding : <strong>Strong</strong>
                  </span>
                </div>

                <div className="feedback-row-item">
                  <div className="feedback-icon-box orange">
                    <TrendingUp size={18} />
                  </div>
                  <span className="feedback-text-main">
                    Suggested Improvement : <strong>Revise Ohm's Law</strong>
                  </span>
                </div>
              </div>

            </div>

            {/* Right Column (Learning Gaps Analysis Split Panels) */}
            <div className="analytics-right-pane">
              
              {/* Card 1: Frequently Missed Concepts */}
              <div className="pane-card-white">
                <h3 className="pane-card-title-main" style={{ textAlign: 'left', fontSize: '15px', marginBottom: '16px', borderBottom: '1px solid #efefef', paddingBottom: '8px' }}>Frequently missed concepts</h3>
                <div className="gaps-concept-list" style={{ margin: 0 }}>
                  <div onClick={() => setSelectedConcept(1)} className="gaps-concept-row">
                    <span className="gaps-concept-text">1. Ohm's Law Application</span>
                    <span className="gaps-concept-percentage">23%</span>
                  </div>
                  <div onClick={() => setSelectedConcept(2)} className="gaps-concept-row">
                    <span className="gaps-concept-text">2. Resistance in Parallel Circuits</span>
                    <span className="gaps-concept-percentage">18%</span>
                  </div>
                  <div onClick={() => setSelectedConcept(3)} className="gaps-concept-row">
                    <span className="gaps-concept-text">3. Potential Difference and EMF</span>
                    <span className="gaps-concept-percentage">15%</span>
                  </div>
                  <div onClick={() => setSelectedConcept(4)} className="gaps-concept-row">
                    <span className="gaps-concept-text">4. Interpreting Circuit Diagrams</span>
                    <span className="gaps-concept-percentage">12%</span>
                  </div>
                  <div onClick={() => setSelectedConcept(5)} className="gaps-concept-row">
                    <span className="gaps-concept-text">5. Series vs Parallel Circuits</span>
                    <span className="gaps-concept-percentage">8%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Recommended Actions for teachers */}
              <div className="pane-card-white">
                <h3 className="pane-card-title-main" style={{ textAlign: 'left', fontSize: '15px', marginBottom: '16px', borderBottom: '1px solid #efefef', paddingBottom: '8px' }}>Recommended Actions for teachers</h3>
                <div className="actions-list-vertical">
                  <div onClick={() => setSelectedAction(1)} className="action-row-item">
                    1. <strong>Simran Kaur</strong> – Misinterprets series vs parallel logic; needs circuit-building demo.
                  </div>
                  <div onClick={() => setSelectedAction(2)} className="action-row-item">
                    2. <strong>Revise in class : Ohm's Law</strong> – Use real-life problem-solving (e.g., fan, heater)
                  </div>
                  <div onClick={() => setSelectedAction(3)} className="action-row-item">
                    3. <strong>Concept of Power</strong> – Clarify derivations and differences between formulas.
                  </div>
                  <div onClick={() => setSelectedAction(4)} className="action-row-item">
                    4. <strong>Extra classes for students</strong> who scored less than Grade D
                  </div>
                  <div onClick={() => setSelectedAction(5)} className="action-row-item">
                    5. <strong>Extra classes for students</strong> who scored less than Grade D
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* ==========================================
             INTERACTIVE DETAIL DIAGNOSTIC MODALS
             ========================================== */}
          
          {/* Segment Modal */}
          {selectedSegment && SEGMENT_DETAILS[selectedSegment] && (
            <div className="analytics-modal-backdrop" onClick={() => setSelectedSegment(null)}>
              <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="analytics-modal-header" style={{ borderBottomColor: SEGMENT_DETAILS[selectedSegment].color + '20' }}>
                  <h4 className="analytics-modal-title" style={{ color: SEGMENT_DETAILS[selectedSegment].color }}>
                    {SEGMENT_DETAILS[selectedSegment].title} ({SEGMENT_DETAILS[selectedSegment].count} Students)
                  </h4>
                  <button onClick={() => setSelectedSegment(null)} className="analytics-modal-close-btn">&times;</button>
                </div>
                <div className="analytics-modal-body">
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    The following students are categorized in this grade group based on their recent subjective exam scores:
                  </p>
                  <div className="student-pills-list">
                    {SEGMENT_DETAILS[selectedSegment].students.map((student) => (
                      <span key={student} className="student-pill-item" style={{ borderLeft: `3px solid ${SEGMENT_DETAILS[selectedSegment].color}` }}>
                        {student}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Concept Modal */}
          {selectedConcept && CONCEPT_DETAILS[selectedConcept] && (
            <div className="analytics-modal-backdrop" onClick={() => setSelectedConcept(null)}>
              <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="analytics-modal-header" style={{ borderBottomColor: '#ef444420' }}>
                  <h4 className="analytics-modal-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#fdedec', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>{CONCEPT_DETAILS[selectedConcept].pct} Missed</span>
                    {CONCEPT_DETAILS[selectedConcept].title}
                  </h4>
                  <button onClick={() => setSelectedConcept(null)} className="analytics-modal-close-btn">&times;</button>
                </div>
                <div className="analytics-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Diagnostic Observation:</strong>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                      {CONCEPT_DETAILS[selectedConcept].desc}
                    </p>
                  </div>

                  <div>
                    <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Struggling Students:</strong>
                    <div className="student-pills-list" style={{ marginTop: '6px' }}>
                      {CONCEPT_DETAILS[selectedConcept].students.map((student) => (
                        <span key={student} className="student-pill-item" style={{ borderLeft: '3px solid #ef4444', fontSize: '12.5px' }}>
                          {student}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff5e6', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px' }}>
                    <strong style={{ display: 'block', fontSize: '12px', color: '#c2410c', textTransform: 'uppercase', marginBottom: '4px' }}>Recommended Remediation:</strong>
                    <p style={{ fontSize: '13px', color: '#9a3412', margin: 0, lineHeight: 1.4 }}>
                      {CONCEPT_DETAILS[selectedConcept].remediation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Modal */}
          {selectedAction && ACTION_DETAILS[selectedAction] && (
            <div className="analytics-modal-backdrop" onClick={() => setSelectedAction(null)}>
              <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="analytics-modal-header" style={{ borderBottomColor: '#ea580c20' }}>
                  <h4 className="analytics-modal-title" style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#fff5e6', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>{ACTION_DETAILS[selectedAction].priority}</span>
                    Action Plan
                  </h4>
                  <button onClick={() => setSelectedAction(null)} className="analytics-modal-close-btn">&times;</button>
                </div>
                <div className="analytics-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Action Item:</strong>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                      {ACTION_DETAILS[selectedAction].title}
                    </p>
                  </div>

                  <div>
                    <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Description & Execution Notes:</strong>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      {ACTION_DETAILS[selectedAction].desc}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #efefef', borderRadius: '12px', padding: '12px 16px', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Timeline Target:</span>
                    <strong style={{ color: '#ea580c' }}>{ACTION_DETAILS[selectedAction].time}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button onClick={() => {
                      setToastMessage("Suggested remediation assigned successfully!");
                      setSelectedAction(null);
                      setTimeout(() => setToastMessage(null), 3000);
                    }} className="btn-dark-capsule" style={{ flex: 1, padding: '10px', fontSize: '12.5px', justifyContent: 'center' }}>
                      Assign Remediation
                    </button>
                    <button onClick={() => {
                      setToastMessage("Action marked as resolved!");
                      setSelectedAction(null);
                      setTimeout(() => setToastMessage(null), 3000);
                    }} className="btn-secondary-pill" style={{ flex: 1, padding: '10px', fontSize: '12.5px', justifyContent: 'center' }}>
                      Mark as Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==========================================
         TAB 4: CLASSROOM ANALYTICS (My Groups)
         ========================================== */}
      {activeTab === 'groups' && (
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
            Classroom Insights & Analytics
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Trace student averages, score distributions, and learning gaps dynamically.
          </p>

          {/* Metric Row */}
          <div className="analytics-metric-grid">
            <div className="analytics-metric-card">
              <span className="analytics-metric-lbl">Class Average</span>
              <span className="analytics-metric-val">78.4%</span>
              <span className="analytics-metric-sub" style={{ color: '#166534' }}>↑ 2.4% vs past test</span>
            </div>
            <div className="analytics-metric-card">
              <span className="analytics-metric-lbl">Total Graded</span>
              <span className="analytics-metric-val">28 / 32</span>
              <span className="analytics-metric-sub" style={{ color: '#ea580c' }}>4 scripts remaining</span>
            </div>
            <div className="analytics-metric-card">
              <span className="analytics-metric-lbl">Top Learning Gap</span>
              <span className="analytics-metric-val">Resistance (58%)</span>
              <span className="analytics-metric-sub" style={{ color: '#ef4444' }}>Requires revision</span>
            </div>
            <div className="analytics-metric-card">
              <span className="analytics-metric-lbl">Cognitive Depth</span>
              <span className="analytics-metric-val">94%</span>
              <span className="analytics-metric-sub" style={{ color: '#166534' }}>Aligned with board</span>
            </div>
          </div>

          <div className="analytics-double-layout">
            {/* Learning Gaps Heatmap card */}
            <div className="analytics-panel-card">
              <h3 className="analytics-panel-title">
                <TrendingUp size={16} color="var(--brand-accent)" />
                <span>Topic Understanding Heatmap</span>
              </h3>
              
              <div className="analytics-heatmap">
                <div className="analytics-heatmap-row">
                  <span className="analytics-topic-name">1. Electric current definition</span>
                  <div className="analytics-topic-bar-track">
                    <div className="analytics-topic-bar-fill easy" style={{ width: '92%' }}></div>
                  </div>
                  <span className="analytics-topic-pct">92%</span>
                </div>

                <div className="analytics-heatmap-row">
                  <span className="analytics-topic-name">2. Ohm\'s law formulations</span>
                  <div className="analytics-topic-bar-track">
                    <div className="analytics-topic-bar-fill easy" style={{ width: '82%' }}></div>
                  </div>
                  <span className="analytics-topic-pct">82%</span>
                </div>

                <div className="analytics-heatmap-row">
                  <span className="analytics-topic-name">3. Series vs Parallel circuits</span>
                  <div className="analytics-topic-bar-track">
                    <div className="analytics-topic-bar-fill moderate" style={{ width: '64%' }}></div>
                  </div>
                  <span className="analytics-topic-pct">64%</span>
                </div>

                <div className="analytics-heatmap-row">
                  <span className="analytics-topic-name">4. Resistance & resistivity factors</span>
                  <div className="analytics-topic-bar-track">
                    <div className="analytics-topic-bar-fill hard" style={{ width: '48%' }}></div>
                  </div>
                  <span className="analytics-topic-pct">48%</span>
                </div>

                <div className="analytics-heatmap-row">
                  <span className="analytics-topic-name">5. Electromagnetism principles</span>
                  <div className="analytics-topic-bar-track">
                    <div className="analytics-topic-bar-fill moderate" style={{ width: '58%' }}></div>
                  </div>
                  <span className="analytics-topic-pct">58%</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '15px', color: '#991b1b', lineHeight: 1.4 }}>
                <strong>Pedagogical Advice:</strong> Over 50% of the class struggled with factors affecting resistance (length, cross-section area). Plan a 10-minute lab review before proceeding to Joule's heating laws.
              </div>
            </div>

            {/* Student performance table card */}
            <div className="analytics-panel-card">
              <h3 className="analytics-panel-title">
                <Users size={16} color="#3b82f6" />
                <span>Student Score Summary</span>
              </h3>

              <table className="analytics-student-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Submited Date</th>
                    <th>Score</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Aarav Sharma</td>
                    <td>01 Jun 2026</td>
                    <td>45 / 50</td>
                    <td><span className="score-badge-indicator high">A</span></td>
                  </tr>
                  <tr>
                    <td>Diya Patel</td>
                    <td>02 Jun 2026</td>
                    <td>48 / 50</td>
                    <td><span className="score-badge-indicator high">A+</span></td>
                  </tr>
                  <tr>
                    <td>Kabir Sen</td>
                    <td>31 May 2026</td>
                    <td>32 / 50</td>
                    <td><span className="score-badge-indicator mid">C</span></td>
                  </tr>
                  <tr>
                    <td>Rohan Gupta</td>
                    <td>02 Jun 2026</td>
                    <td>18 / 50</td>
                    <td><span className="score-badge-indicator low">F</span></td>
                  </tr>
                  <tr>
                    <td>Neha Verma</td>
                    <td>01 Jun 2026</td>
                    <td>38 / 50</td>
                    <td><span className="score-badge-indicator mid">B</span></td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Classroom Database Synced: Just now</span>
                <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Term 1 Analytics</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
         TAB 5: STUDENT REPORTS & FEEDBACK (Library)
         ========================================== */}
      {activeTab === 'library' && (
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
            Student Feedback & Report Cards
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Click on a student's card below to load and view their detailed learning diagnostic report.
          </p>

          <div className="report-card-grid">
            {/* Aarav Card */}
            <div 
              className={`report-card ${selectedReportStudentId === '1' ? 'active' : ''}`}
              onClick={() => setSelectedReportStudentId('1')}
              style={{ 
                cursor: 'pointer', 
                border: selectedReportStudentId === '1' ? '2.5px solid var(--brand-accent)' : '1px solid var(--border-light)',
                boxShadow: selectedReportStudentId === '1' ? '0 0 15px rgba(234, 88, 12, 0.15)' : 'none',
                transform: selectedReportStudentId === '1' ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div className="report-card-name">Aarav Sharma</div>
                <div className="report-card-class">Grade 8 Science | Roll: #10</div>
                
                <div className="report-card-stat-row">
                  <span className="report-card-stat-lbl">Total Score:</span>
                  <span className="report-card-stat-val">45 / 50 (90%)</span>
                </div>
                <div className="report-card-stat-row">
                  <span className="report-card-stat-lbl">Subject Rank:</span>
                  <span className="report-card-stat-val">3rd in Class</span>
                </div>
                <div className="report-card-stat-row">
                  <span className="report-card-stat-lbl">Identified Gaps:</span>
                  <span className="report-card-stat-val" style={{ color: '#166534', fontWeight: 600 }}>None (Core Strengths)</span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSendNotification('aarav.parent@mail.com');
                }}
                className="report-card-button"
              >
                <Send size={12} />
                <span>Send to Parents</span>
              </button>
            </div>

            {/* Diya Card */}
            <div 
              className={`report-card ${selectedReportStudentId === '2' ? 'active' : ''}`}
              onClick={() => setSelectedReportStudentId('2')}
              style={{ 
                cursor: 'pointer', 
                border: selectedReportStudentId === '2' ? '2.5px solid var(--brand-accent)' : '1px solid var(--border-light)',
                boxShadow: selectedReportStudentId === '2' ? '0 0 15px rgba(234, 88, 12, 0.15)' : 'none',
                transform: selectedReportStudentId === '2' ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div className="report-card-name">Diya Patel</div>
                <div className="report-card-class">Grade 8 Science | Roll: #20</div>
                
                <div className="report-card-stat-row">
                  <span className="report-card-stat-lbl">Total Score:</span>
                  <span className="report-card-stat-val">48 / 50 (96%)</span>
                </div>
                <div className="report-card-stat-row">
                  <span className="report-card-stat-lbl">Subject Rank:</span>
                  <span className="report-card-stat-val">1st in Class</span>
                </div>
                <div className="report-card-stat-row">
                  <span className="report-card-stat-lbl">Identified Gaps:</span>
                  <span className="report-card-stat-val" style={{ color: '#ea580c', fontWeight: 600 }}>Ohm's Law parallel error</span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSendNotification('diya.parent@mail.com');
                }}
                className="report-card-button"
              >
                <Send size={12} />
                <span>Send to Parents</span>
              </button>
            </div>

            {/* Kabir Card */}
            <div 
              className={`report-card ${selectedReportStudentId === '3' ? 'active' : ''}`}
              onClick={() => setSelectedReportStudentId('3')}
              style={{ 
                cursor: 'pointer', 
                border: selectedReportStudentId === '3' ? '2.5px solid var(--brand-accent)' : '1px solid var(--border-light)',
                boxShadow: selectedReportStudentId === '3' ? '0 0 15px rgba(234, 88, 12, 0.15)' : 'none',
                transform: selectedReportStudentId === '3' ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div className="report-card-name">Kabir Sen</div>
                <div className="report-card-class">Grade 8 Science | Roll: #30</div>
                
                <div className="report-card-stat-row">
                  <span className="report-card-stat-lbl">Total Score:</span>
                  <span className="report-card-stat-val">32 / 50 (64%)</span>
                </div>
                <div className="report-card-stat-row">
                  <span className="report-card-stat-lbl">Subject Rank:</span>
                  <span className="report-card-stat-val">22nd in Class</span>
                </div>
                <div className="report-card-stat-row">
                  <span className="report-card-stat-lbl">Identified Gaps:</span>
                  <span className="report-card-stat-val" style={{ color: '#ef4444', fontWeight: 600 }}>SI units definitions</span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSendNotification('kabir.parent@mail.com');
                }}
                className="report-card-button"
              >
                <Send size={12} />
                <span>Send to Parents</span>
              </button>
            </div>
          </div>

          {/* Detailed Interactive Student Report Diagnostics */}
          {selectedReportStudentId && MOCK_REPORTS[selectedReportStudentId] ? (
            <div style={{ marginTop: '40px', padding: '24px', background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-light)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    VedaAI Student Diagnostics Report: {MOCK_REPORTS[selectedReportStudentId].name}
                  </h3>
                  <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Student ID: {MOCK_REPORTS[selectedReportStudentId].id} | Generated on 02 Jun 2026
                  </p>
                </div>
                <div style={{ padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '16px', fontWeight: 700 }}>
                  Score: {MOCK_REPORTS[selectedReportStudentId].score}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left Column: Cognitive Depth */}
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Cognitive Skill Mastery (Bloom's Taxonomy)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Remembering & Understanding</span>
                        <span style={{ fontWeight: 600 }}>{MOCK_REPORTS[selectedReportStudentId].rememberingPct}% Mastery</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${MOCK_REPORTS[selectedReportStudentId].rememberingPct}%`, backgroundColor: '#22c55e' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Applying & Analyzing</span>
                        <span style={{ fontWeight: 600 }}>{MOCK_REPORTS[selectedReportStudentId].applyingPct}% Mastery</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${MOCK_REPORTS[selectedReportStudentId].applyingPct}%`, backgroundColor: '#3b82f6' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Evaluating & Creating</span>
                        <span style={{ fontWeight: 600 }}>{MOCK_REPORTS[selectedReportStudentId].evaluatingPct}% Mastery</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${MOCK_REPORTS[selectedReportStudentId].evaluatingPct}%`, backgroundColor: '#ea580c' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: AI Remediation Gaps */}
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>AI-Identified Gaps & Remediation</h4>
                  <div style={{ padding: '12px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '16px', color: '#c2410c' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>⚠️ {MOCK_REPORTS[selectedReportStudentId].gapTitle}:</div>
                    <div style={{ lineHeight: 1.4 }}>
                      {MOCK_REPORTS[selectedReportStudentId].gapDesc}
                    </div>
                    <div style={{ marginTop: '8px', fontWeight: 700, borderTop: '1px solid #fed7aa', paddingTop: '6px' }}>Suggested Action:</div>
                    <div style={{ lineHeight: 1.4, fontStyle: 'italic' }}>
                      {MOCK_REPORTS[selectedReportStudentId].remediation}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-secondary)' }}>
                  <span>Teacher Signature:</span>
                  <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {MOCK_REPORTS[selectedReportStudentId].signature}
                  </span>
                </div>
                <button 
                  onClick={() => triggerSendNotification(MOCK_REPORTS[selectedReportStudentId].email)}
                  className="btn-orange-glow"
                  style={{ padding: '8px 20px', fontSize: '16px' }}
                >
                  Send Diagnostic Report to Parents
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '40px', padding: '40px 24px', background: 'white', border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No Student Selected</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Select a student report card from the list above to view their diagnostic profile & Bloom's mastery mapping.
              </div>
            </div>
          )}
        </div>
      )}
      {toastMessage && (
        <div className="side-toast-notification">
          <CheckCircle2 size={16} color="#166534" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// Wrapper to prevent Next.js useSearchParams SSG build failures
export default function Dashboard() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--brand-accent)" style={{ marginRight: '8px' }} />
        <span>Loading VedaAI Dashboard...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
