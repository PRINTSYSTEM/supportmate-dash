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
      studentId: studentId.trim().toUpperCase(),
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
            studentId: studentId.trim().toUpperCase(),
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
    const limitNum = Math.min(10000, Math.max(1, parseInt(limit as string, 10) || 50));
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

// Routes with fixed paths must come BEFORE parameterized /:id
router.post('/normalize-student-ids', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const details: string[] = [];
    let normalized = 0;
    let mergedTotal = 0;

    // Bước 1: Uppercase studentId trong ToolRegistration
    const toolRegsToFix = await ToolRegistration.find({
      $expr: { $ne: [{ $toUpper: '$studentId' }, '$studentId'] }
    }).lean();
    for (const reg of toolRegsToFix) {
      await ToolRegistration.findByIdAndUpdate(reg._id, { $set: { studentId: reg.studentId.toUpperCase() } });
      normalized++;
    }

    // Bước 2: Uppercase studentId trong Registration  
    const regsToFix = await Registration.find({
      $expr: { $ne: [{ $toUpper: '$studentId' }, '$studentId'] }
    }).lean();
    for (const reg of regsToFix) {
      await Registration.findByIdAndUpdate(reg._id, { $set: { studentId: reg.studentId.toUpperCase() } });
      normalized++;
    }

    // Bước 3: Tìm nhóm trùng và merge
    const groups = await ToolRegistration.aggregate([
      { $group: { _id: '$studentId', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    for (const group of groups) {
      const regs = await ToolRegistration.find({ _id: { $in: group.ids } }).sort({ createdAt: 1 });
      const primary = regs[0];

      for (let i = 1; i < regs.length; i++) {
        const secondary = regs[i];

        // Chuyển child Registrations sang primary
        await Registration.updateMany(
          { toolRegistrationId: secondary._id.toString() },
          { $set: { toolRegistrationId: primary._id.toString() } }
        );

        // Cộng dồn amountReceived
        primary.amountReceived += secondary.amountReceived || 0;

        // Gộp note
        if (secondary.note) {
          primary.note = primary.note ? primary.note + ' | ' + secondary.note : secondary.note;
        }

        // Cộng dồn toolPrice nếu là 'day'
        if (secondary.toolPackage === 'day') {
          primary.priceSnapshot.toolPrice += secondary.priceSnapshot.toolPrice;
        }
        primary.priceSnapshot.feSlotCount += secondary.priceSnapshot.feSlotCount || 0;
        primary.priceSnapshot.peSlotCount += secondary.priceSnapshot.peSlotCount || 0;

        // Gộp dates (tránh trùng ngày)
        for (const sd of secondary.dates) {
          if (!primary.dates.some(pd => pd.date === sd.date)) {
            primary.dates.push(sd);
          }
        }

        // Giữ adminDiscount lớn nhất
        if (secondary.adminDiscount > primary.adminDiscount) {
          primary.adminDiscount = secondary.adminDiscount;
        }

        // Xóa secondary
        await ToolRegistration.findByIdAndDelete(secondary._id);
        mergedTotal++;
      }

      // Tính lại totalPrice từ children thực tế
      const activeChildren = await Registration.find({
        toolRegistrationId: primary._id.toString(),
        processStatus: { $nin: ['failed', 'cancelled'] }
      }).lean();
      const sumSupport = activeChildren.reduce((sum: number, c: any) => sum + (c.supportPrice || 0), 0);
      const discountAmt = primary.priceSnapshot.discountEnabled ? primary.priceSnapshot.discountAmount : 0;
      primary.totalPrice = Math.max((primary.priceSnapshot.toolPrice || 0) + sumSupport - discountAmt, 0);

      await ToolRegistration.findByIdAndUpdate(primary._id, {
        $set: {
          studentId: primary.studentId,
          amountReceived: primary.amountReceived,
          note: primary.note,
          dates: primary.dates,
          totalPrice: primary.totalPrice,
          'priceSnapshot.toolPrice': primary.priceSnapshot.toolPrice,
          'priceSnapshot.feSlotCount': primary.priceSnapshot.feSlotCount,
          'priceSnapshot.peSlotCount': primary.priceSnapshot.peSlotCount,
          adminDiscount: primary.adminDiscount,
        }
      });

      details.push(`${primary.studentId}: gộp ${regs.length} bản ghi, toolPrice = ${primary.priceSnapshot.toolPrice}`);
    }

    res.json({
      normalized,
      mergedRecords: mergedTotal,
      duplicateGroups: groups.length,
      details,
    });
  } catch (err) {
    console.error('POST /tool-registrations/normalize-student-ids error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────
// GET /tool-registrations/summary
// Tổng hợp tài chính gộp theo MSSV
// ──────────────────────────────────────────────────
router.get('/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const filter: any = {};
    if (search) {
      filter.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    const allToolRegs = await ToolRegistration.find(filter).sort({ createdAt: -1 }).lean();
    const allRegs = await Registration.find({}).lean();

    // Map child Registrations by toolRegistrationId
    const childrenByParentId: Record<string, any[]> = {};
    for (const r of allRegs) {
      if (r.toolRegistrationId) {
        const key = r.toolRegistrationId.toString();
        if (!childrenByParentId[key]) childrenByParentId[key] = [];
        childrenByParentId[key].push(r);
      }
    }

    // Group by uppercase studentId
    const groups: Record<string, { regs: any[] }> = {};
    for (const reg of allToolRegs) {
      const key = reg.studentId.toUpperCase();
      if (!groups[key]) groups[key] = { regs: [] };
      groups[key].regs.push(reg);
    }

    const result: any[] = [];

    for (const [studentId, group] of Object.entries(groups)) {
      const regs = group.regs;
      // Sắp xếp theo createdAt ASC để lấy thông tin
      regs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Tính toolFee
      let toolFee = 0;
      let hasCountedTerm = false;
      const allRegIds: string[] = [];

      for (const reg of regs) {
        allRegIds.push(reg._id.toString());
        if (reg.toolPackage === 'day') {
          toolFee += reg.priceSnapshot?.toolPrice || 0;
        } else if (reg.toolPackage === 'term' && !hasCountedTerm) {
          toolFee += reg.priceSnapshot?.toolPrice || 0;
          hasCountedTerm = true;
        }
      }

      // Tính supportFee từ child Registrations
      let supportFee = 0;
      for (const parentId of allRegIds) {
        const children = childrenByParentId[parentId] || [];
        for (const child of children) {
          if (child.processStatus !== 'failed' && child.processStatus !== 'cancelled') {
            supportFee += child.supportPrice || 0;
          }
        }
      }

      // Discount: lấy adminDiscount lớn nhất trong nhóm
      const discount = Math.max(...regs.map((r: any) => r.adminDiscount || 0));
      const totalServiceFee = toolFee + supportFee - discount;
      const amountReceived = regs.reduce((sum: number, r: any) => sum + (r.amountReceived || 0), 0);
      const debt = Math.max(totalServiceFee - amountReceived, 0);

      // Thông tin student từ bản ghi mới nhất
      const latest = regs[regs.length - 1];
      const oldest = regs[0];

      result.push({
        studentId,
        customerName: latest.customerName || oldest.customerName,
        campus: latest.campus || oldest.campus,
        registrationCount: regs.length,
        toolFee,
        supportFee,
        discount,
        totalServiceFee,
        amountReceived,
        debt,
        registrations: regs.map((r: any) => ({
          _id: r._id,
          createdAt: r.createdAt,
          toolPackage: r.toolPackage,
          toolTypeId: r.toolTypeId,
          keyCode: r.keyCode,
          processStatus: r.processStatus,
          totalPrice: r.totalPrice,
          amountReceived: r.amountReceived,
          priceSnapshot: r.priceSnapshot,
          dates: r.dates,
          note: r.note,
          childCount: (childrenByParentId[r._id.toString()] || []).length,
        })),
      });
    }

    // Sort: newest first by latest registration date
    result.sort((a, b) => {
      const aDate = Math.max(...a.registrations.map((r: any) => new Date(r.createdAt).getTime()));
      const bDate = Math.max(...b.registrations.map((r: any) => new Date(r.createdAt).getTime()));
      return bDate - aDate;
    });

    res.json(result);
  } catch (err) {
    console.error('GET /tool-registrations/summary error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────
// PUT /tool-registrations/summary/:studentId
// Cập nhật tài chính cho 1 sinh viên (gộp)
// ──────────────────────────────────────────────────
router.put('/summary/:studentId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const targetStudentId = req.params.studentId.toUpperCase();
    const { discount, amountReceived, note } = req.body;

    // Tìm tất cả ToolRegistration của sinh viên này
    const regs = await ToolRegistration.find({ studentId: targetStudentId }).sort({ createdAt: 1 });

    if (regs.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const primary = regs[0];

    // Cập nhật discount trên primary (record cũ nhất)
    if (discount !== undefined) {
      primary.adminDiscount = Math.max(0, Number(discount) || 0);
    }

    // Cập nhật amountReceived: phân bổ đều hoặc set cho primary
    if (amountReceived !== undefined) {
      primary.amountReceived = Math.max(0, Number(amountReceived) || 0);
    }

    if (note !== undefined) {
      primary.note = note;
    }

    await primary.save();

    // Nếu có amountReceived, sync lên tất cả regs (chia đều cho đơn giản)
    if (amountReceived !== undefined) {
      const totalAmount = Math.max(0, Number(amountReceived) || 0);
      const count = regs.length;
      let remaining = totalAmount;
      for (let i = 0; i < regs.length; i++) {
        const share = i < regs.length - 1 ? Math.floor(remaining / (count - i)) : remaining;
        await ToolRegistration.findByIdAndUpdate(regs[i]._id, {
          $set: { amountReceived: share }
        });
        remaining -= share;
      }
    }

    res.json({ message: 'Updated', studentId: targetStudentId });
  } catch (err) {
    console.error('PUT /tool-registrations/summary/:studentId error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────
// GET /tool-registrations/:id/quote
// Public endpoint — trả về data báo giá (đã che thông tin)
// ──────────────────────────────────────────────────
router.get('/:id/quote', async (req, res) => {
  try {
    const reg = await ToolRegistration.findById(req.params.id).lean();
    if (!reg) return res.status(404).json({ message: 'Not found' });

    let toolTypeName = '';
    if (reg.toolTypeId) {
      const tt = await ToolType.findById(reg.toolTypeId).lean();
      if (tt) toolTypeName = tt.name;
    }

    // Mask student info
    const nameParts = (reg.customerName || '').trim().split(/\s+/);
    const maskedName = nameParts.length > 2
      ? `${nameParts[0]} *** ${nameParts[nameParts.length - 1]}`
      : reg.customerName;
    const maskedId = (reg.studentId || '').length > 5
      ? reg.studentId.substring(0, 2) + '***' + reg.studentId.substring(reg.studentId.length - 3)
      : reg.studentId;

    const regsData = await Registration.find({
      toolRegistrationId: req.params.id,
      processStatus: { $nin: ['failed', 'cancelled'] }
    }).lean();

    const supportFee = regsData.reduce((sum, r) => sum + (r.supportPrice || 0), 0);
    const discount = reg.priceSnapshot?.discountEnabled ? (reg.priceSnapshot?.discountAmount || 0) : 0;
    const toolFee = reg.priceSnapshot?.toolPrice || 0;

    res.json({
      customerName: maskedName,
      studentId: maskedId,
      campus: reg.campus,
      toolPackage: reg.toolPackage,
      toolTypeName,
      dates: reg.dates,
      toolFee,
      supportFee,
      discount,
      amountReceived: reg.amountReceived || 0,
      totalPrice: Math.max(toolFee + supportFee - discount - (reg.amountReceived || 0), 0),
      createdAt: reg.createdAt,
    });
  } catch (err) {
    console.error('GET /tool-registrations/:id/quote error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────
// GET /tool-registrations/:id, PUT /:id, DELETE /:id
// Các route tham số hóa — đặt sau cùng
// ──────────────────────────────────────────────────
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
    const { keyCode, processStatus, note, amountReceived, adminDiscount } = req.body;

    if (keyCode !== undefined) allowedFields.keyCode = keyCode;
    if (processStatus !== undefined) {
      if (!['pending', 'assigned', 'supporting', 'done', 'failed', 'cancelled'].includes(processStatus)) {
        return res.status(400).json({ message: 'Invalid process status' });
      }
      allowedFields.processStatus = processStatus;
    }
    if (note !== undefined) allowedFields.note = note;
    if (amountReceived !== undefined) {
      allowedFields.amountReceived = Number(amountReceived) || 0;
    }
    if (adminDiscount !== undefined) {
      allowedFields.adminDiscount = Math.max(0, Number(adminDiscount) || 0);
    }

    const updated = await ToolRegistration.findByIdAndUpdate(
      req.params.id,
      { $set: allowedFields },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });

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

    await Registration.deleteMany({ toolRegistrationId: req.params.id });

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /tool-registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
