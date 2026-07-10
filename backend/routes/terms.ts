import { Router, Response } from 'express';
import Term from '../models/Term.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const items = await Term.find().sort({ termId: -1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('GET /terms error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { termId, name } = req.body;
    if (!termId?.trim() || !name?.trim()) {
      return res.status(400).json({ message: 'termId and name required' });
    }
    const term = await Term.create({ termId: termId.trim(), name: name.trim() });
    res.status(201).json(term);
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ message: 'Term already exists' });
    console.error('POST /terms error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Term.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /terms error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Term.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /terms error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
