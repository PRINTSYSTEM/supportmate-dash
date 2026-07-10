import { Router, Response } from 'express';
import ExamSession from '../models/ExamSession';
import { AuthRequest, requireAuth } from '../middleware/auth';

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
