import { Registration, ExamSession, Tool, Key, Seller, ProcessStatus } from './types';

export const sellers: Seller[] = [
  { id: 's1', name: 'VN Soft' },
  { id: 's2', name: 'EduKey' },
  { id: 's3', name: 'TechLicense' },
  { id: 's4', name: 'KeyMaster' },
];

export const tools: Tool[] = [
  { id: 't1', name: 'Respondus LockDown Browser', version: '2.0.9' },
  { id: 't2', name: 'ExamSoft', version: '3.1.0' },
  { id: 't3', name: 'ProctorU', version: '1.5.2' },
  { id: 't4', name: 'Safe Exam Browser', version: '3.5.0' },
];

export const keys: Key[] = [
  { id: 'k1', keyCode: 'RLB-2026-A001', toolId: 't1', type: 'by_term', status: 'available', expirationDate: '2026-06-30' },
  { id: 'k2', keyCode: 'RLB-2026-A002', toolId: 't1', type: 'by_term', status: 'used', expirationDate: '2026-06-30' },
  { id: 'k3', keyCode: 'RLB-DAY-0401', toolId: 't1', type: 'by_day', status: 'available', expirationDate: '2026-04-01' },
  { id: 'k4', keyCode: 'ES-2026-B001', toolId: 't2', type: 'by_term', status: 'available', expirationDate: '2026-08-31' },
  { id: 'k5', keyCode: 'ES-DAY-0401', toolId: 't2', type: 'by_day', status: 'used', expirationDate: '2026-04-01' },
  { id: 'k6', keyCode: 'PU-2026-C001', toolId: 't3', type: 'by_term', status: 'available', expirationDate: '2026-06-30' },
  { id: 'k7', keyCode: 'SEB-DAY-0402', toolId: 't4', type: 'by_day', status: 'available', expirationDate: '2026-04-02' },
  { id: 'k8', keyCode: 'SEB-2026-D001', toolId: 't4', type: 'by_term', status: 'available', expirationDate: '2026-12-31' },
  { id: 'k9', keyCode: 'RLB-DAY-0403', toolId: 't1', type: 'by_day', status: 'available', expirationDate: '2026-04-03' },
  { id: 'k10', keyCode: 'ES-2026-B002', toolId: 't2', type: 'by_term', status: 'available', expirationDate: '2026-08-31' },
];

export const examSessions: ExamSession[] = [
  { id: 'es1', date: '2026-04-01', startTime: '08:00', endTime: '10:00', type: 'PE', subjectId: 'CS101', term: 'Spring26', campus: 'Main Campus', studentCount: 45 },
  { id: 'es2', date: '2026-04-01', startTime: '13:00', endTime: '15:00', type: 'FE', subjectId: 'MATH201', term: 'Spring26', campus: 'Main Campus', studentCount: 60 },
  { id: 'es3', date: '2026-04-02', startTime: '09:00', endTime: '11:00', type: 'PE', subjectId: 'ENG102', term: 'Spring26', campus: 'South Campus', studentCount: 35 },
  { id: 'es4', date: '2026-04-02', startTime: '14:00', endTime: '16:00', type: 'FE', subjectId: 'PHY301', term: 'Spring26', campus: 'Main Campus', studentCount: 28 },
  { id: 'es5', date: '2026-04-03', startTime: '08:00', endTime: '10:30', type: 'PE', subjectId: 'BIO201', term: 'Spring26', campus: 'North Campus', studentCount: 52 },
  { id: 'es6', date: '2026-04-03', startTime: '13:00', endTime: '15:00', type: 'FE', subjectId: 'CS101', term: 'Spring26', campus: 'Main Campus', studentCount: 40 },
  { id: 'es7', date: '2026-04-05', startTime: '09:00', endTime: '11:00', type: 'PE', subjectId: 'CHEM101', term: 'Spring26', campus: 'South Campus', studentCount: 30 },
];

export const registrations: Registration[] = [
  { id: 'r1', studentId: 'STU001', customerName: 'Nguyen Van A', subjectId: 'CS101', examSessionId: 'es1', toolId: 't1', keyCode: 'RLB-2026-A002', keyType: 'by_term', sellerId: 's1', processStatus: 'done', note: 'Completed successfully' },
  { id: 'r2', studentId: 'STU002', customerName: 'Tran Thi B', subjectId: 'CS101', examSessionId: 'es1', toolId: 't2', keyCode: 'ES-DAY-0401', keyType: 'by_day', sellerId: 's2', processStatus: 'supporting', note: 'Student needs assistance' },
  { id: 'r3', studentId: 'STU003', customerName: 'Le Van C', subjectId: 'MATH201', examSessionId: 'es2', toolId: null, keyCode: null, keyType: null, sellerId: 's1', processStatus: 'pending', note: '' },
  { id: 'r4', studentId: 'STU004', customerName: 'Pham Thi D', subjectId: 'MATH201', examSessionId: 'es2', toolId: 't1', keyCode: 'RLB-2026-A001', keyType: 'by_term', sellerId: 's3', processStatus: 'assigned', note: 'Key assigned' },
  { id: 'r5', studentId: 'STU005', customerName: 'Hoang Van E', subjectId: 'ENG102', examSessionId: 'es3', toolId: null, keyCode: null, keyType: null, sellerId: 's2', processStatus: 'pending', note: '' },
  { id: 'r6', studentId: 'STU006', customerName: 'Vo Thi F', subjectId: 'ENG102', examSessionId: 'es3', toolId: 't3', keyCode: 'PU-2026-C001', keyType: 'by_term', sellerId: 's4', processStatus: 'done', note: '' },
  { id: 'r7', studentId: 'STU007', customerName: 'Bui Van G', subjectId: 'PHY301', examSessionId: 'es4', toolId: 't4', keyCode: null, keyType: 'by_day', sellerId: 's1', processStatus: 'assigned', note: 'Waiting for key' },
  { id: 'r8', studentId: 'STU008', customerName: 'Dang Thi H', subjectId: 'BIO201', examSessionId: 'es5', toolId: null, keyCode: null, keyType: null, sellerId: 's3', processStatus: 'pending', note: '' },
  { id: 'r9', studentId: 'STU009', customerName: 'Ngo Van I', subjectId: 'BIO201', examSessionId: 'es5', toolId: 't2', keyCode: 'ES-2026-B001', keyType: 'by_term', sellerId: 's2', processStatus: 'supporting', note: 'In progress' },
  { id: 'r10', studentId: 'STU010', customerName: 'Do Thi K', subjectId: 'CS101', examSessionId: 'es6', toolId: 't1', keyCode: 'RLB-DAY-0403', keyType: 'by_day', sellerId: 's4', processStatus: 'cancelled', note: 'Student withdrew' },
  { id: 'r11', studentId: 'STU011', customerName: 'Truong Van L', subjectId: 'CHEM101', examSessionId: 'es7', toolId: null, keyCode: null, keyType: null, sellerId: 's1', processStatus: 'pending', note: '' },
  { id: 'r12', studentId: 'STU012', customerName: 'Mai Thi M', subjectId: 'CS101', examSessionId: 'es1', toolId: 't1', keyCode: null, keyType: null, sellerId: 's2', processStatus: 'pending', note: '' },
];
