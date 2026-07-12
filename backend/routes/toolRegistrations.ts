import { Router, Response } from 'express';
import ToolRegistration from '../models/ToolRegistration.js';
import PricingConfig from '../models/PricingConfig.js';
import ToolType from '../models/ToolType.js';
import Subject from '../models/Subject.js';
import Registration from '../models/Registration.js';
import ExamSession from '../models/ExamSession.js';
import Seller from '../models/Seller.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { calculatePrice } from '../utils/pricing.js';
import { validateToolRegistration } from '../utils/validation.js';

const router = Router();

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const errors = validateToolRegistration(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const { studentId, customerName, toolPackage, toolTypeId, dates, note } = req.body;

    if (toolTypeId) {
      const toolType = await ToolType.findById(toolTypeId).lean();
      if (!toolType || !toolType.isActive) {
        return res.status(400).json({ message: 'Tool type not found or inactive' });
      }
    }

    const subjectIds = [...new Set(dates.flatMap((d: any) => d.subjects.map((s: any) => s.subjectId)))];
    const existingSubjects = await Subject.find({ subjectId: { $in: subjectIds } }).lean();
    const existingSubjectIds = new Set(existingSubjects.map((s: any) => s.subjectId));
    const missingSubjectIds = subjectIds.filter(id => !existingSubjectIds.has(id));
    if (missingSubjectIds.length > 0) {
      return res.status(400).json({ message: `Subjects not found: ${missingSubjectIds.join(', ')}` });
    }

    const pricing = await PricingConfig.findOne().sort({ createdAt: -1 }).lean();
    if (!pricing) {
      return res.status(500).json({ message: 'Pricing config not found' });
    }

    const { toolPrice, feSlotCount, peSlotCount, totalPrice } = calculatePrice(
      pricing as any,
      toolPackage,
      dates
    );

    const registration = await ToolRegistration.create({
      studentId: studentId.trim(),
      customerName: customerName.trim(),
      toolPackage,
      toolTypeId: toolTypeId || null,
      keyCode: null,
      processStatus: 'pending',
      dates,
      priceSnapshot: {
        toolPrice,
        feSlotPrice: pricing.feSlotPrice,
        peSlotPrice: pricing.peSlotPrice,
        feSlotCount,
        peSlotCount,
        discountEnabled: pricing.discountEnabled,
        discountAmount: pricing.discountAmount,
      },
      totalPrice,
      note: note || '',
      campus: req.body.campus || 'HCM',
    });

    // Find or create default seller
    const defaultSeller = await Seller.findOne().lean();
    let sellerId = '';
    if (!defaultSeller) {
      const newSeller = await Seller.create({ name: 'Default Seller' });
      sellerId = newSeller._id.toString();
    } else {
      sellerId = defaultSeller._id.toString();
    }

    // Split and create individual Registration items
    for (const dateItem of dates) {
      for (const subjectItem of dateItem.subjects) {
        for (const et of subjectItem.examTypes) {
          const sessionType = (et.type === 'FE' || et.type === 'RETAKE_FE') ? 'FE' : 'PE';

          // Try to find matching ExamSession
          let session = await ExamSession.findOne({
            date: dateItem.date,
            subjectId: subjectItem.subjectId,
            type: sessionType,
            startTime: et.time,
            campus: registration.campus
          });

          // Create ExamSession if it doesn't exist
          if (!session) {
            let endTime = '10:00';
            if (et.time) {
              const [h, m] = et.time.split(':');
              const endH = (parseInt(h, 10) + 2).toString().padStart(2, '0');
              endTime = `${endH}:${m || '00'}`;
            }
            session = await ExamSession.create({
              date: dateItem.date,
              startTime: et.time,
              endTime,
              type: sessionType,
              subjectId: subjectItem.subjectId,
              term: 'Spring26',
              campus: registration.campus,
              studentCount: 1
            });
          } else {
            session.studentCount += 1;
            await session.save();
          }

          // FE slots get default supportPrice (fallback to 200000), PE slots get null
          const defaultSupportPrice = sessionType === 'FE' ? (pricing.feSlotPrice || 200000) : null;

          // Create the flat Registration record
          await Registration.create({
            studentId: studentId.trim(),
            customerName: customerName.trim(),
            subjectId: subjectItem.subjectId,
            examSessionId: session._id.toString(),
            toolId: null,
            keyCode: null,
            keyType: toolPackage === 'day' ? 'by_day' : 'by_term',
            sellerId,
            processStatus: 'pending',
            note: note || '',
            campus: registration.campus,
            toolRegistrationId: registration._id.toString(),
            supportPrice: defaultSupportPrice,
          });
        }
      }
    }

    res.status(201).json(registration);
  } catch (err) {
    console.error('POST /tool-registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { search, toolTypeId, toolPackage, status, dateFrom, dateTo, page = '1', limit = '50' } = req.query;
    const filter: any = {};

    if (status) filter.processStatus = status;
    if (toolTypeId) filter.toolTypeId = toolTypeId;
    if (toolPackage) filter.toolPackage = toolPackage;

    if (search) {
      filter.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo as string);
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      ToolRegistration.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      ToolRegistration.countDocuments(filter),
    ]);

    res.json({ items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error('GET /tool-registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const item = await ToolRegistration.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('GET /tool-registrations/:id error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const allowedFields: any = {};
    const { keyCode, processStatus, note } = req.body;

    if (keyCode !== undefined) allowedFields.keyCode = keyCode;
    if (processStatus !== undefined) {
      if (!['pending', 'assigned', 'done', 'cancelled'].includes(processStatus)) {
        return res.status(400).json({ message: 'Invalid process status' });
      }
      allowedFields.processStatus = processStatus;
    }
    if (note !== undefined) allowedFields.note = note;

    const updated = await ToolRegistration.findByIdAndUpdate(
      req.params.id,
      { $set: allowedFields },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });

    // Sync to flat registrations
    const syncFields: any = {};
    if (keyCode !== undefined) syncFields.keyCode = keyCode;
    if (processStatus !== undefined) syncFields.processStatus = processStatus;
    if (note !== undefined) syncFields.note = note;

    if (Object.keys(syncFields).length > 0) {
      await Registration.updateMany(
        { toolRegistrationId: req.params.id },
        { $set: syncFields }
      );
    }

    res.json(updated);
  } catch (err) {
    console.error('PUT /tool-registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await ToolRegistration.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });

    // Also delete associated flat registrations
    await Registration.deleteMany({ toolRegistrationId: req.params.id });

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /tool-registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
