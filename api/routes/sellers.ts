import { Router, Response } from 'express';
import Seller from '../models/Seller';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const items = await Seller.find().sort({ name: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('GET /sellers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const seller = await Seller.create(req.body);
    res.status(201).json(seller);
  } catch (err) {
    console.error('POST /sellers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
