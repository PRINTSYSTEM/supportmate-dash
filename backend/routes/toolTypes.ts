import { Router, Request, Response } from 'express';
import ToolType from '../models/ToolType.js';
import ToolRegistration from '../models/ToolRegistration.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await ToolType.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('GET /tool-types error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const items = await ToolType.find().sort({ name: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('GET /tool-types/admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug } = req.body;
    if (!name?.trim() || !slug?.trim()) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }
    const toolType = await ToolType.create({ name: name.trim(), slug: slug.trim().toLowerCase() });
    res.status(201).json(toolType);
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ message: 'Slug already exists' });
    console.error('POST /tool-types error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await ToolType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /tool-types error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const used = await ToolRegistration.findOne({ toolTypeId: req.params.id }).lean();
    if (used) {
      await ToolType.findByIdAndUpdate(req.params.id, { isActive: false });
      return res.json({ message: 'Tool type is in use, set to inactive instead' });
    }
    const deleted = await ToolType.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /tool-types error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
