import { Router, Response } from 'express';
import Tool from '../models/Tool.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const items = await Tool.find().sort({ name: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('GET /tools error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tool = await Tool.create(req.body);
    res.status(201).json(tool);
  } catch (err) {
    console.error('POST /tools error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Tool.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /tools error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Tool.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /tools error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
