import { IPricingConfig } from '../models/PricingConfig.js';
import { IToolDate } from '../models/ToolRegistration.js';

export function calculatePrice(
  pricing: IPricingConfig,
  toolPackage: 'day' | 'term',
  dates: IToolDate[]
) {
  const toolPrice = toolPackage === 'day' ? pricing.toolDayPrice : pricing.toolTermPrice;

  let feSlotCount = 0;
  let peSlotCount = 0;

  for (const d of dates) {
    for (const s of d.subjects) {
      for (const et of s.examTypes) {
        if (et.type === 'FE' || et.type === 'RETAKE_FE') feSlotCount++;
        if (et.type === 'PE' || et.type === 'RETAKE_PE') peSlotCount++;
      }
    }
  }

  const subtotal = toolPrice + feSlotCount * pricing.feSlotPrice + peSlotCount * pricing.peSlotPrice;
  const totalPrice = Math.max(subtotal - (pricing.discountEnabled ? pricing.discountAmount : 0), 0);

  return {
    toolPrice,
    feSlotCount,
    peSlotCount,
    totalPrice,
  };
}
