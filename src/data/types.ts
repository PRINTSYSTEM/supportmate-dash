export type ProcessStatus = 'pending' | 'assigned' | 'supporting' | 'done' | 'cancelled';
export type KeyType = 'by_day' | 'by_term';
export type ExamType = 'PE' | 'FE';
export type KeyStatus = 'available' | 'used';
export type Term = 'Spring26' | 'Summer26' | 'Fall26';

export interface Registration {
  id: string;
  studentId: string;
  customerName: string;
  subjectId: string;
  examSessionId: string;
  toolId: string | null;
  keyCode: string | null;
  keyType: KeyType | null;
  sellerId: string;
  processStatus: ProcessStatus;
  note: string;
}

export interface ExamSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: ExamType;
  subjectId: string;
  term: Term;
  campus: string;
  studentCount: number;
}

export interface Tool {
  id: string;
  name: string;
  version: string;
}

export interface Key {
  id: string;
  keyCode: string;
  toolId: string;
  type: KeyType;
  status: KeyStatus;
  expirationDate: string;
}

export interface Seller {
  id: string;
  name: string;
}

// --- New types for Tool Registration ---

export type ToolPackage = 'day' | 'term';
export type ToolProcessStatus = 'pending' | 'assigned' | 'done' | 'cancelled';
export type ExamTypeSlot = 'PE' | 'FE' | 'RETAKE_PE' | 'RETAKE_FE';

export interface ExamTypeSlotData {
  type: ExamTypeSlot;
  time: string;
}

export interface ToolSubject {
  subjectId: string;
  examTypes: ExamTypeSlotData[];
}

export interface ToolDate {
  date: string;
  subjects: ToolSubject[];
}

export interface PriceSnapshot {
  toolPrice: number;
  feSlotPrice: number;
  peSlotPrice: number;
  feSlotCount: number;
  peSlotCount: number;
  discountEnabled: boolean;
  discountAmount: number;
}

export interface ToolRegistration {
  _id: string;
  studentId: string;
  customerName: string;
  toolPackage: ToolPackage;
  toolTypeId: string;
  keyCode: string | null;
  processStatus: ToolProcessStatus;
  dates: ToolDate[];
  priceSnapshot: PriceSnapshot;
  totalPrice: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolType {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface PricingConfig {
  _id: string;
  toolDayPrice: number;
  toolTermPrice: number;
  feSlotPrice: number;
  peSlotPrice: number;
  discountEnabled: boolean;
  discountAmount: number;
  activeToolTypeId: string | null;
  updatedBy: string | null;
}
