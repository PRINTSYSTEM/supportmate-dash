import { Router, Request, Response } from 'express';
import PricingConfig from '../models/PricingConfig.js';
import ToolType from '../models/ToolType.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    let config = await PricingConfig.findOne().sort({ createdAt: -1 }).lean();
    if (!config) {
      config = await PricingConfig.create({
        toolDayPrice: 800000,
        toolTermPrice: 1800000,
        feSlotPrice: 200000,
        peSlotPrice: 0,
        discountEnabled: true,
        discountAmount: 200000,
        activeToolTypeId: null,
      });
    }
    res.json(config);
  } catch (err) {
    console.error('GET /pricing error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { toolDayPrice, toolTermPrice, feSlotPrice, peSlotPrice, discountEnabled, discountAmount, activeToolTypeId } = req.body;

    if (toolDayPrice != null && toolDayPrice < 0) return res.status(400).json({ message: 'toolDayPrice cannot be negative' });
    if (toolTermPrice != null && toolTermPrice < 0) return res.status(400).json({ message: 'toolTermPrice cannot be negative' });
    if (feSlotPrice != null && feSlotPrice < 0) return res.status(400).json({ message: 'feSlotPrice cannot be negative' });
    if (peSlotPrice != null && peSlotPrice < 0) return res.status(400).json({ message: 'peSlotPrice cannot be negative' });
    if (discountAmount != null && discountAmount < 0) return res.status(400).json({ message: 'discountAmount cannot be negative' });

    if (activeToolTypeId) {
      const toolType = await ToolType.findById(activeToolTypeId).lean();
      if (!toolType || !toolType.isActive) {
        return res.status(400).json({ message: 'Tool type not found or inactive' });
      }
    }

    const updateData: any = {};
    if (toolDayPrice != null) updateData.toolDayPrice = toolDayPrice;
    if (toolTermPrice != null) updateData.toolTermPrice = toolTermPrice;
    if (feSlotPrice != null) updateData.feSlotPrice = feSlotPrice;
    if (peSlotPrice != null) updateData.peSlotPrice = peSlotPrice;
    if (discountEnabled != null) updateData.discountEnabled = discountEnabled;
    if (discountAmount != null) updateData.discountAmount = discountAmount;
    if (activeToolTypeId !== undefined) updateData.activeToolTypeId = activeToolTypeId;
    if (req.admin?.id) updateData.updatedBy = req.admin.id;

    const config = await PricingConfig.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true }
    ).lean();

    res.json(config);
  } catch (err) {
    console.error('PUT /pricing error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
