import { Router, Response } from 'express';
import Registration from '../models/Registration';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, subject, page = '1', limit = '50' } = req.query;
    const filter: any = {};
    if (status) filter.processStatus = status;
    if (subject) filter.subjectId = subject;
    if (search) {
      filter.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Registration.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Registration.countDocuments(filter),
    ]);
    res.json({ items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error('GET /registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, customerName, subjectId, examSessionId, toolId, keyCode, keyType, sellerId, processStatus, note } = req.body;
    if (!studentId?.trim() || !customerName?.trim() || !subjectId || !examSessionId || !sellerId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const registration = await Registration.create({
      studentId: studentId.trim(),
      customerName: customerName.trim(),
      subjectId,
      examSessionId,
      toolId: toolId || null,
      keyCode: keyCode || null,
      keyType: keyType || null,
      sellerId,
      processStatus: processStatus || 'pending',
      note: note || '',
    });
    res.status(201).json(registration);
  } catch (err) {
    console.error('POST /registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Registration.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Registration.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
