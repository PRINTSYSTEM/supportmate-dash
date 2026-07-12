import { Router, Response } from 'express';
import Subject from '../models/Subject.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { validateSubjectImport } from '../utils/validation.js';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const items = await Subject.find().sort({ subjectId: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('GET /subjects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId, name } = req.body;
    if (!subjectId?.trim() || !name?.trim()) {
      return res.status(400).json({ message: 'subjectId and name required' });
    }
    const subject = await Subject.create({ subjectId: subjectId.trim().toUpperCase(), name: name.trim() });
    res.status(201).json(subject);
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ message: 'Subject code already exists' });
    console.error('POST /subjects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/import', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const errors: { index: number; message: string }[] = [];
    const validItems: { subjectId: string; name: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const err = validateSubjectImport(items[i]);
      if (err) {
        errors.push({ index: i, message: err });
      } else {
        validItems.push({
          subjectId: items[i].subjectId.trim().toUpperCase(),
          name: items[i].name.trim(),
        });
      }
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    if (validItems.length > 0) {
      const bulkOps = validItems.map(item => ({
        updateOne: {
          filter: { subjectId: item.subjectId },
          update: { $set: { name: item.name } },
          upsert: true,
        },
      }));

      const bulkResult = await Subject.bulkWrite(bulkOps, { ordered: false });
      inserted = bulkResult.upsertedCount;
      updated = bulkResult.modifiedCount;
      skipped = validItems.length - inserted - updated;
    }

    res.json({ total: items.length, inserted, updated, skipped, errors });
  } catch (err) {
    console.error('POST /subjects/import error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /subjects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /subjects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
