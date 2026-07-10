import { Router, Response } from 'express';
import Registration from '../models/Registration';
import ExamSession from '../models/ExamSession';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/stats', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [totalRegistrations, sessionsToday, statusCounts, sessionStudentCounts] =
      await Promise.all([
        Registration.countDocuments(),
        ExamSession.countDocuments({ date: today }),
        Registration.aggregate([
          { $group: { _id: '$processStatus', count: { $sum: 1 } } },
        ]),
        ExamSession.aggregate([
          { $group: { _id: '$subjectId', studentCount: { $sum: '$studentCount' } } },
          { $sort: { studentCount: -1 } },
        ]),
      ]);

    const statusMap: Record<string, number> = { pending: 0, assigned: 0, supporting: 0, done: 0, cancelled: 0 };
    statusCounts.forEach((s: any) => { statusMap[s._id] = s.count; });

    res.json({
      totalRegistrations,
      sessionsToday,
      pending: statusMap.pending,
      completed: statusMap.done,
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
