import { Router, Response } from 'express';
import Registration from '../models/Registration.js';
import ToolRegistration from '../models/ToolRegistration.js';
import ExamSession from '../models/ExamSession.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, subject, toolRegistrationId, date, page = '1', limit = '50' } = req.query;
    const filter: any = {};
    if (status) filter.processStatus = status;
    if (subject) filter.subjectId = subject;
    if (toolRegistrationId) filter.toolRegistrationId = toolRegistrationId;
    if (date) {
      const sessionsOnDate = await ExamSession.find({ date }).lean();
      filter.examSessionId = { $in: sessionsOnDate.map(s => s._id.toString()) };
    }
    if (search) {
      filter.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(10000, Math.max(1, parseInt(limit as string, 10) || 50));
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
    const { studentId, customerName, subjectId, examSessionId, toolId, keyCode, keyType, sellerId, processStatus, note, supportPrice } = req.body;
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
      supportPrice: supportPrice || null,
    });
    res.status(201).json(registration);
  } catch (err) {
    console.error('POST /registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Not found' });

    if (req.body.examType) {
      const currentSession = await ExamSession.findById(registration.examSessionId);
      if (currentSession && currentSession.type !== req.body.examType) {
        // Find or create a session with the new type
        let targetSession = await ExamSession.findOne({
          date: currentSession.date,
          startTime: currentSession.startTime,
          subjectId: registration.subjectId,
          campus: registration.campus,
          type: req.body.examType
        });

        if (!targetSession) {
          targetSession = await ExamSession.create({
            date: currentSession.date,
            startTime: currentSession.startTime,
            endTime: currentSession.endTime,
            type: req.body.examType,
            subjectId: registration.subjectId,
            term: currentSession.term,
            campus: registration.campus,
            studentCount: 0
          });
        }

        // Update studentCount
        currentSession.studentCount = Math.max(0, currentSession.studentCount - 1);
        await currentSession.save();

        targetSession.studentCount += 1;
        await targetSession.save();

        req.body.examSessionId = targetSession._id.toString();
      }
    }

    // Remove examType from body as it is not part of the schema
    delete req.body.examType;

    const updated = await Registration.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Not found' });

    // Sync back to ToolRegistration if linked
    if (updated.toolRegistrationId) {
      const siblings = await Registration.find({ toolRegistrationId: updated.toolRegistrationId }).lean();
      
      let parentStatus: 'pending' | 'assigned' | 'supporting' | 'done' | 'failed' | 'cancelled' = 'pending';
      const allDone = siblings.every(s => s.processStatus === 'done');
      const allCancelled = siblings.every(s => s.processStatus === 'cancelled');
      const allFailed = siblings.every(s => s.processStatus === 'failed');
      const anySupporting = siblings.some(s => s.processStatus === 'supporting');
      const anyAssigned = siblings.some(s => s.processStatus === 'assigned');

      if (allDone) parentStatus = 'done';
      else if (allCancelled) parentStatus = 'cancelled';
      else if (allFailed) parentStatus = 'failed';
      else if (anySupporting) parentStatus = 'supporting';
      else if (anyAssigned) parentStatus = 'assigned';

      const updateFields: any = { processStatus: parentStatus };
      if (req.body.keyCode !== undefined) {
        updateFields.keyCode = req.body.keyCode;
      }

      const parentToolReg = await ToolRegistration.findById(updated.toolRegistrationId);
      if (parentToolReg) {
        const sumOfSupportPrices = siblings.reduce((sum, s) => sum + (s.supportPrice || 0), 0);
        const toolPrice = parentToolReg.priceSnapshot?.toolPrice || 0;
        const discountAmount = parentToolReg.priceSnapshot?.discountEnabled ? (parentToolReg.priceSnapshot.discountAmount || 0) : 0;
        const newTotalPrice = Math.max(toolPrice + sumOfSupportPrices - discountAmount, 0);

        updateFields.totalPrice = newTotalPrice;
      }

      await ToolRegistration.findByIdAndUpdate(updated.toolRegistrationId, { $set: updateFields });
    }

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

    // Sync back to ToolRegistration if linked
    if (deleted.toolRegistrationId) {
      const siblings = await Registration.find({ toolRegistrationId: deleted.toolRegistrationId }).lean();
      
      let parentStatus: 'pending' | 'assigned' | 'supporting' | 'done' | 'failed' | 'cancelled' = 'pending';
      const allDone = siblings.every(s => s.processStatus === 'done');
      const allCancelled = siblings.every(s => s.processStatus === 'cancelled');
      const allFailed = siblings.every(s => s.processStatus === 'failed');
      const anySupporting = siblings.some(s => s.processStatus === 'supporting');
      const anyAssigned = siblings.some(s => s.processStatus === 'assigned');

      if (siblings.length === 0) {
        parentStatus = 'cancelled';
      } else if (allDone) {
        parentStatus = 'done';
      } else if (allCancelled) {
        parentStatus = 'cancelled';
      } else if (allFailed) {
        parentStatus = 'failed';
      } else if (anySupporting) {
        parentStatus = 'supporting';
      } else if (anyAssigned) {
        parentStatus = 'assigned';
      }

      const updateFields: any = { processStatus: parentStatus };
      
      const parentToolReg = await ToolRegistration.findById(deleted.toolRegistrationId);
      if (parentToolReg) {
        const sumOfSupportPrices = siblings.reduce((sum, s) => sum + (s.supportPrice || 0), 0);
        const toolPrice = parentToolReg.priceSnapshot?.toolPrice || 0;
        const discountAmount = parentToolReg.priceSnapshot?.discountEnabled ? (parentToolReg.priceSnapshot.discountAmount || 0) : 0;
        const newTotalPrice = Math.max(toolPrice + sumOfSupportPrices - discountAmount, 0);

        updateFields.totalPrice = newTotalPrice;
      }

      await ToolRegistration.findByIdAndUpdate(deleted.toolRegistrationId, { $set: updateFields });
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
