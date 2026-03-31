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
