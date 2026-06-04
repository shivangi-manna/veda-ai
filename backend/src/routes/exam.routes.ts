import { Router, Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { examController } from '../controllers/exam.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { apiRateLimiter } from '../middlewares/rateLimiter.middleware';
import {
  CreateExamSchema,
  RegenerateExamQuerySchema,
  GetExamSchema,
} from '../validators/exam.validator';

const router = Router();

// Configure multer to load files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB limit
  },
  fileFilter: (req: Request, file: any, cb: FileFilterCallback) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed.'));
    }
  },
});

// Applied rate limiting to create and regeneration endpoints
router.post(
  '/',
  apiRateLimiter,
  upload.single('file'),
  // Add request transformation since form-data comes in as text
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.questionTypes && typeof req.body.questionTypes === 'string') {
      try {
        req.body.questionTypes = JSON.parse(req.body.questionTypes);
      } catch (err) {
        req.body.questionTypes = [req.body.questionTypes];
      }
    }
    next();
  },
  validateRequest(CreateExamSchema),
  examController.createExam
);

router.get('/', examController.getExams);

router.get(
  '/:id',
  validateRequest(GetExamSchema),
  examController.getExamById
);

router.delete(
  '/:id',
  validateRequest(GetExamSchema),
  examController.deleteExam
);

router.post(
  '/:id/cancel',
  validateRequest(GetExamSchema),
  examController.cancelExam
);

router.post(
  '/:id/regenerate',
  apiRateLimiter,
  validateRequest(RegenerateExamQuerySchema),
  examController.regenerateExam
);

router.get(
  '/:id/pdf',
  validateRequest(GetExamSchema),
  examController.downloadPDF
);

export default router;
