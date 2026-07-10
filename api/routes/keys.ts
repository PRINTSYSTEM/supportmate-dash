import { Router, Response } from 'express';
import Key from '../models/Key';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, toolId, type } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (toolId) filter.toolId = toolId;
    if (type) filter.type = type;
    const items = await Key.find(filter).sort({ keyCode: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('GET /keys error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const key = await Key.create(req.body);
    res.status(201).json(key);
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ message: 'Key code already exists' });
    console.error('POST /keys error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Key.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /keys error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Key.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /keys error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
