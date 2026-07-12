import { Router, Response } from 'express';
import ExamSession from '../models/ExamSession.js';
import Subject from '../models/Subject.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { validateSessionImport } from '../utils/validation.js';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const items = await ExamSession.find().sort({ date: 1, startTime: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('GET /sessions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const session = await ExamSession.create(req.body);
    res.status(201).json(session);
  } catch (err) {
    console.error('POST /sessions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/import', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const subjectIds = [...new Set(items.map((i: any) => i.subjectId).filter(Boolean))];
    const existingSubjects = await Subject.find({ subjectId: { $in: subjectIds } }).lean();
    const existingSubjectIds = new Set(existingSubjects.map((s: any) => s.subjectId));

    const errors: { index: number; message: string }[] = [];
    const validItems: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const err = validateSessionImport(item);
      if (err) {
        errors.push({ index: i, message: err });
      } else if (!existingSubjectIds.has(item.subjectId)) {
        errors.push({ index: i, message: `Subject not found: ${item.subjectId}` });
      } else {
        validItems.push(item);
      }
    }

    let inserted = 0;
    let skipped = 0;

    if (validItems.length > 0) {
      const bulkOps = validItems.map(item => ({
        updateOne: {
          filter: {
            date: item.date,
            startTime: item.startTime,
            type: item.type,
            subjectId: item.subjectId,
            term: item.term,
            campus: item.campus,
          },
          update: { $set: { ...item, studentCount: item.studentCount ?? 0 } },
          upsert: true,
        },
      }));

      const bulkResult = await ExamSession.bulkWrite(bulkOps, { ordered: false });
      inserted = bulkResult.upsertedCount + bulkResult.modifiedCount;
      skipped = validItems.length - inserted;
    }

    res.json({ total: items.length, inserted, skipped, errors });
  } catch (err) {
    console.error('POST /sessions/import error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await ExamSession.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /sessions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await ExamSession.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /sessions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
