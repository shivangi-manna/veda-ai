import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Assignment } from '../models/Assignment';
import { addGenerationJob } from '../queues/generationQueue';
import { generateAssignmentPDF } from '../services/pdfService';
import { polishSingleQuestion } from '../services/aiService';

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// SEED demo assignments
router.post('/seed', async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear existing assignments first to avoid duplicate seeds
    await Assignment.deleteMany({});

    const demoAssignments = [
      {
        title: 'Quiz on Electricity',
        subject: 'Science',
        gradeClass: 'Grade 8',
        schoolName: 'Delhi Public School',
        timeAllowed: 45,
        dueDate: new Date('2025-08-21T18:00:00.000Z'),
        createdAt: new Date('2025-08-20T10:00:00.000Z'),
        status: 'completed',
        questionConfigs: [
          { type: 'Multiple Choice Questions', count: 4, marks: 1 },
          { type: 'Short Questions', count: 3, marks: 2 }
        ],
        sections: [
          {
            title: 'Section A: Multiple Choice Questions',
            instruction: 'Select the single best answer for each question.',
            questions: [
              { text: 'Which of the following is a good conductor of electricity?', difficulty: 'Easy', marks: 1, taxonomy: 'Remembering', rubric: '1 mark for correct selection.' },
              { text: 'What unit is used to measure electrical current?', difficulty: 'Easy', marks: 1, taxonomy: 'Remembering', rubric: '1 mark for Ampere.' },
              { text: 'What is the function of a fuse in an electrical circuit?', difficulty: 'Moderate', marks: 1, taxonomy: 'Understanding', rubric: '1 mark for safety prevention.' },
              { text: 'If voltage is doubled in a circuit while resistance is constant, what happens to current?', difficulty: 'Hard', marks: 1, taxonomy: 'Analyzing', rubric: '1 mark for doubled current.' }
            ]
          },
          {
            title: 'Section B: Short Questions',
            instruction: 'Provide concise, descriptive answers for each question.',
            questions: [
              { text: 'Explain Ohm\'s Law and write its mathematical formula.', difficulty: 'Moderate', marks: 2, taxonomy: 'Understanding', rubric: '1 mark for correct description, 1 mark for formula V = I * R.' },
              { text: 'What is the difference between static electricity and current electricity?', difficulty: 'Easy', marks: 2, taxonomy: 'Analyzing', rubric: '1 mark for defining static, 1 mark for current flow.' },
              { text: 'Describe how a series circuit differs from a parallel circuit.', difficulty: 'Hard', marks: 2, taxonomy: 'Creating', rubric: '1 mark for series single-path definition, 1 mark for parallel multi-path definition.' }
            ]
          }
        ],
        answerKey: [
          { questionIndex: 1, sectionTitle: 'Section A: Multiple Choice Questions', questionText: 'Which of the following is a good conductor of electricity?', answer: 'Copper (Metals are generally good conductors due to free electrons).' },
          { questionIndex: 2, sectionTitle: 'Section A: Multiple Choice Questions', questionText: 'What unit is used to measure electrical current?', answer: 'Ampere (A) is the SI unit of electric current.' },
          { questionIndex: 3, sectionTitle: 'Section A: Multiple Choice Questions', questionText: 'What is the function of a fuse in an electrical circuit?', answer: 'To protect the circuit from excessive current flow by melting and breaking the circuit connection.' },
          { questionIndex: 4, sectionTitle: 'Section A: Multiple Choice Questions', questionText: 'If voltage is doubled in a circuit while resistance is constant, what happens to current?', answer: 'The current is doubled (According to V = I * R, current scales proportionally with voltage).' },
          { questionIndex: 1, sectionTitle: 'Section B: Short Questions', questionText: 'Explain Ohm\'s Law and write its mathematical formula.', answer: 'Ohm\'s Law states that the current flowing through a conductor is directly proportional to the potential difference across its ends, provided temperature remains constant. Formula: V = I * R.' },
          { questionIndex: 2, sectionTitle: 'Section B: Short Questions', questionText: 'What is the difference between static electricity and current electricity?', answer: 'Static electricity is the accumulation of electric charge on an object\'s surface (non-moving), whereas current electricity is the continuous flow of electrons through a conductive path.' },
          { questionIndex: 3, sectionTitle: 'Section B: Short Questions', questionText: 'Describe how a series circuit differs from a parallel circuit.', answer: 'In a series circuit, all components are connected end-to-end along a single path, meaning the same current flows through all of them. In a parallel circuit, components are connected across multiple branches, dividing the current.' }
        ]
      },
      {
        title: 'Algebra Fundamentals Test',
        subject: 'Mathematics',
        gradeClass: 'Grade 9',
        schoolName: 'Delhi Public School',
        timeAllowed: 60,
        dueDate: new Date('2025-08-25T18:00:00.000Z'),
        createdAt: new Date('2025-08-22T09:00:00.000Z'),
        status: 'completed',
        questionConfigs: [
          { type: 'Multiple Choice Questions', count: 2, marks: 1 },
          { type: 'Short Questions', count: 1, marks: 4 }
        ],
        sections: [
          {
            title: 'Section A: Multiple Choice',
            instruction: 'Select the correct choice.',
            questions: [
              { text: 'Solve for x: 3x + 5 = 20.', difficulty: 'Easy', marks: 1, taxonomy: 'Applying', rubric: '1 mark for correct choice.' },
              { text: 'Which of the following equations represents a linear equation?', difficulty: 'Easy', marks: 1, taxonomy: 'Remembering', rubric: '1 mark for linear option.' }
            ]
          },
          {
            title: 'Section B: Algebra Short Questions',
            instruction: 'Solve and show step-by-step working.',
            questions: [
              { text: 'Find the roots of the quadratic equation x^2 - 5x + 6 = 0.', difficulty: 'Moderate', marks: 4, taxonomy: 'Applying', rubric: '2 marks for factoring, 2 marks for final roots x=2, x=3.' }
            ]
          }
        ],
        answerKey: [
          { questionIndex: 1, sectionTitle: 'Section A: Multiple Choice', questionText: 'Solve for x: 3x + 5 = 20.', answer: 'x = 5 (3x = 15 => x = 5).' },
          { questionIndex: 2, sectionTitle: 'Section A: Multiple Choice', questionText: 'Which of the following equations represents a linear equation?', answer: 'y = mx + c (or any equation where the highest degree of variable is 1).' },
          { questionIndex: 1, sectionTitle: 'Section B: Algebra Short Questions', questionText: 'Find the roots of the quadratic equation x^2 - 5x + 6 = 0.', answer: 'x^2 - 3x - 2x + 6 = 0 => (x-3)(x-2) = 0. Therefore, the roots are x = 2 and x = 3.' }
        ]
      },
      {
        title: 'Photosynthesis & Respiration',
        subject: 'Biology',
        gradeClass: 'Grade 7',
        schoolName: 'Delhi Public School',
        timeAllowed: 40,
        dueDate: new Date('2025-08-15T18:00:00.000Z'),
        createdAt: new Date('2025-08-14T11:00:00.000Z'),
        status: 'completed',
        questionConfigs: [
          { type: 'Short Answer Questions', count: 2, marks: 2 }
        ],
        sections: [
          {
            title: 'Section A: Short Answer Questions',
            instruction: 'Answer all questions fully.',
            questions: [
              { text: 'What are the primary reactants required for photosynthesis?', difficulty: 'Easy', marks: 2, taxonomy: 'Remembering', rubric: '1 mark for Carbon Dioxide, 1 mark for Water.' },
              { text: 'Where does photosynthesis take place inside a plant cell?', difficulty: 'Easy', marks: 2, taxonomy: 'Remembering', rubric: '2 marks for Chloroplast.' }
            ]
          }
        ],
        answerKey: [
          { questionIndex: 1, sectionTitle: 'Section A: Short Answer Questions', questionText: 'What are the primary reactants required for photosynthesis?', answer: 'Carbon dioxide (CO2) and Water (H2O), in the presence of sunlight and chlorophyll.' },
          { questionIndex: 2, sectionTitle: 'Section A: Short Answer Questions', questionText: 'Where does photosynthesis take place inside a plant cell?', answer: 'In the Chloroplast, specifically in the thylakoids (light reactions) and stroma (dark reactions).' }
        ]
      }
    ];

    const seeded = await Assignment.insertMany(demoAssignments);

    res.status(201).json({
      message: 'Demo assignments seeded successfully',
      count: seeded.length,
      assignments: seeded
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message || 'Failed to seed data' });
  }
});

// CREATE assignment & Queue background generation
router.post('/generate', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      subject,
      gradeClass,
      schoolName,
      timeAllowed,
      dueDate,
      questionConfigs, // JSON string or array
      additionalInstructions
    } = req.body;

    if (!title || !subject || !gradeClass || !schoolName || !timeAllowed || !dueDate || !questionConfigs) {
       res.status(400).json({ error: 'Missing required assignment fields' });
       return;
    }

    // Parse questionConfigs if it comes as a JSON string (e.g. from multipart form-data)
    let parsedQuestionConfigs;
    try {
      parsedQuestionConfigs = typeof questionConfigs === 'string' 
        ? JSON.parse(questionConfigs) 
        : questionConfigs;
    } catch (parseErr) {
       res.status(400).json({ error: 'Invalid questionConfigs JSON structure' });
       return;
    }

    const assignment = new Assignment({
      title,
      subject,
      gradeClass,
      schoolName,
      timeAllowed: Number(timeAllowed),
      dueDate: new Date(dueDate),
      questionConfigs: parsedQuestionConfigs,
      additionalInstructions,
      fileUrl: req.file ? req.file.path : undefined,
      fileName: req.file ? req.file.originalname : undefined,
      status: 'pending'
    });

    await assignment.save();

    // Trigger BullMQ background job
    const job = await addGenerationJob(assignment._id.toString());

    res.status(201).json({
      message: 'Assignment queued for generation successfully',
      assignmentId: assignment._id,
      jobId: job.id
    });
  } catch (error: any) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// LIST all assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    // Sort by newest first
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET specific assignment details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
       res.status(404).json({ error: 'Assignment not found' });
       return;
    }
    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// REGENERATE existing assignment
router.post('/:id/regenerate', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
       res.status(404).json({ error: 'Assignment not found' });
       return;
    }

    assignment.status = 'pending';
    assignment.sections = [];
    assignment.answerKey = [];
    assignment.error = undefined;
    await assignment.save();

    const job = await addGenerationJob(assignment._id.toString());

    res.json({
      message: 'Regeneration job started successfully',
      assignmentId: assignment._id,
      jobId: job.id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DOWNLOAD as PDF
router.get('/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
       res.status(404).json({ error: 'Assignment not found' });
       return;
    }

    if (assignment.status !== 'completed') {
       res.status(400).json({ error: 'PDF generation is only available for completed assignments' });
       return;
    }

    const pdfBuffer = await generateAssignmentPDF(assignment);

    const filename = `${assignment.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_exam.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// IN-PLACE SINGLE QUESTION AI POLISHING
router.post('/:id/questions/:sectionIdx/:questionIdx/polish', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, sectionIdx, questionIdx } = req.params;
    const { instruction } = req.body;

    if (!instruction) {
      res.status(400).json({ error: 'Missing polish instruction' });
      return;
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const sIdx = Number(sectionIdx);
    const qIdx = Number(questionIdx);

    if (!assignment.sections || !assignment.sections[sIdx] || !assignment.sections[sIdx].questions[qIdx]) {
      res.status(400).json({ error: 'Target question not found in assignment' });
      return;
    }

    const targetSection = assignment.sections[sIdx];
    const targetQuestion = targetSection.questions[qIdx];

    // Call single question polish service
    const polishedData = await polishSingleQuestion({
      questionText: targetQuestion.text,
      marks: targetQuestion.marks,
      subject: assignment.subject,
      gradeClass: assignment.gradeClass,
      schoolName: assignment.schoolName,
      instruction
    });

    // Update target question properties
    targetQuestion.text = polishedData.text;
    targetQuestion.difficulty = polishedData.difficulty;
    targetQuestion.taxonomy = polishedData.taxonomy;
    targetQuestion.rubric = polishedData.rubric;

    // Search and update corresponding Answer Key Item
    const qNumber = qIdx + 1;
    if (assignment.answerKey) {
      const answerIndex = assignment.answerKey.findIndex(
        (item) => item.sectionTitle === targetSection.title && item.questionIndex === qNumber
      );
      if (answerIndex !== -1) {
        assignment.answerKey[answerIndex].questionText = polishedData.text;
        assignment.answerKey[answerIndex].answer = polishedData.answer;
      } else {
        assignment.answerKey.push({
          sectionTitle: targetSection.title,
          questionIndex: qNumber,
          questionText: polishedData.text,
          answer: polishedData.answer
        });
      }
    }

    // Save back to DB
    await assignment.save();

    res.json({
      message: 'Question polished successfully',
      question: targetQuestion,
      assignment
    });
  } catch (error: any) {
    console.error('Polish question error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE assignment
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
       res.status(404).json({ error: 'Assignment not found' });
       return;
    }

    // Clean up uploaded file if it exists
    if (assignment.fileUrl && fs.existsSync(assignment.fileUrl)) {
      try {
        fs.unlinkSync(assignment.fileUrl);
      } catch (fileErr) {
        console.error('Failed to delete associated upload file:', fileErr);
      }
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
