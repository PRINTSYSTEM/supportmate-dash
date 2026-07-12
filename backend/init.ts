import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';
import ToolType from './models/ToolType.js';
import PricingConfig from './models/PricingConfig.js';

let ensured = false;

export async function ensureDefaultData() {
  if (ensured) return;
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    await Admin.create({ username: 'admin', password: hashed });
    console.log('Default admin created: admin / admin123');
  }

  const toolTypeCount = await ToolType.countDocuments();
  if (toolTypeCount === 0) {
    const binhNgo = await ToolType.create({
      name: 'Bính Ngọ',
      slug: 'binh-ngo',
      isActive: true,
    });
    await ToolType.create({
      name: 'Viper',
      slug: 'viper',
      isActive: true,
    });
    console.log('Default tool types created');

    const pricingCount = await PricingConfig.countDocuments();
    if (pricingCount === 0) {
      await PricingConfig.create({
        toolDayPrice: 800000,
        toolTermPrice: 1800000,
        feSlotPrice: 200000,
        peSlotPrice: 0,
        discountEnabled: true,
        discountAmount: 200000,
        activeToolTypeId: binhNgo._id.toString(),
      });
      console.log('Default pricing config created');
    }
  }

  ensured = true;
}
