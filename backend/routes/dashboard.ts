import { Router, Response } from 'express';
import Registration from '../models/Registration.js';
import ExamSession from '../models/ExamSession.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { dateFrom, dateTo } = req.query;

    const regFilter: any = {};
    const sessionFilter: any = {};
    if (dateFrom || dateTo) {
      sessionFilter.date = {};
      if (dateFrom) sessionFilter.date.$gte = dateFrom as string;
      if (dateTo) sessionFilter.date.$lte = dateTo as string;

      const sessionsInRange = await ExamSession.find(sessionFilter, { _id: 1 }).lean();
      const sessionIds = sessionsInRange.map(s => s._id.toString());
      if (sessionIds.length === 0) {
        return res.json({
          totalRegistrations: 0,
          sessionsToday: 0,
          pending: 0,
          completed: 0,
          totalRevenue: 0,
          feRegistrations: 0,
          peRegistrations: 0,
          chartData: [],
        });
      }
      regFilter.examSessionId = { $in: sessionIds };
    }

    const todaySessionFilter = dateFrom || dateTo ? { ...sessionFilter } : { date: today };

    const [totalRegistrations, sessionsToday, statusCounts, sessionStudentCounts, revenueAgg, typeCounts] =
      await Promise.all([
        Registration.countDocuments(regFilter),
        ExamSession.countDocuments(todaySessionFilter),
        Registration.aggregate([
          { $match: regFilter },
          { $group: { _id: '$processStatus', count: { $sum: 1 } } },
        ]),
        ExamSession.aggregate([
          { $match: sessionFilter },
          { $group: { _id: '$subjectId', studentCount: { $sum: '$studentCount' } } },
          { $sort: { studentCount: -1 } },
        ]),
        Registration.aggregate([
          { $match: { ...regFilter, supportPrice: { $ne: null } } },
          { $group: { _id: null, total: { $sum: '$supportPrice' } } },
        ]),
        ExamSession.aggregate([
          { $match: sessionFilter },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
      ]);

    const statusMap: Record<string, number> = { pending: 0, assigned: 0, supporting: 0, done: 0, cancelled: 0 };
    statusCounts.forEach((s: any) => { statusMap[s._id] = s.count; });

    const typeMap: Record<string, number> = {};
    typeCounts.forEach((t: any) => { typeMap[t._id] = t.count; });

    res.json({
      totalRegistrations,
      sessionsToday,
      pending: statusMap.pending,
      completed: statusMap.done,
      totalRevenue: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
      feRegistrations: typeMap.FE || 0,
      peRegistrations: typeMap.PE || 0,
      chartData: sessionStudentCounts.map((s: any) => ({
        subject: s._id,
        students: s.studentCount,
      })),
    });
  } catch (err) {
    console.error('GET /dashboard/stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
