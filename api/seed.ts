import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../backend/db.js';
import Admin from '../backend/models/Admin.js';
import Tool from '../backend/models/Tool.js';
import Seller from '../backend/models/Seller.js';
import Key from '../backend/models/Key.js';
import ExamSession from '../backend/models/ExamSession.js';
import Subject from '../backend/models/Subject.js';
import Term from '../backend/models/Term.js';
import Registration from '../backend/models/Registration.js';
import ToolType from '../backend/models/ToolType.js';
import PricingConfig from '../backend/models/PricingConfig.js';
import ToolRegistration from '../backend/models/ToolRegistration.js';

async function seed() {
  await connectDB();
  console.log('Connected to MongoDB.');
  
  const adminCount = await (Admin as any).countDocuments();
  if (adminCount > 0) {
    console.log('Database already initialized. Skipping seed to prevent overwriting.');
    process.exit(0);
  }

  console.log('Seeding...');
  // Clear existing data
  await Promise.all([
    (Admin as any).deleteMany({}),
    (Subject as any).deleteMany({}),
    (Term as any).deleteMany({}),
    (Tool as any).deleteMany({}),
    (Seller as any).deleteMany({}),
    (Key as any).deleteMany({}),
    (ExamSession as any).deleteMany({}),
    (Registration as any).deleteMany({}),
    (ToolType as any).deleteMany({}),
    (PricingConfig as any).deleteMany({}),
    (ToolRegistration as any).deleteMany({}),
  ]);

  // Subjects
  await (Subject as any).insertMany([
    { subjectId: 'CS101', name: 'Computer Science 101' },
    { subjectId: 'MATH201', name: 'Mathematics 201' },
    { subjectId: 'ENG102', name: 'English 102' },
    { subjectId: 'PHY301', name: 'Physics 301' },
    { subjectId: 'BIO201', name: 'Biology 201' },
    { subjectId: 'CHEM101', name: 'Chemistry 101' },
  ]);

  // Terms
  await (Term as any).insertMany([
    { termId: 'Spring26', name: 'Spring 2026' },
    { termId: 'Summer26', name: 'Summer 2026' },
    { termId: 'Fall26', name: 'Fall 2026' },
    { termId: 'Spring27', name: 'Spring 2027' },
  ]);

  // Tool Types
  const binhNgo = await (ToolType as any).create({
    name: 'Bính Ngọ',
    slug: 'binh-ngo',
    isActive: true,
  });
  await (ToolType as any).create({
    name: 'Viper',
    slug: 'viper',
    isActive: true,
  });

  // Pricing Config
  await (PricingConfig as any).create({
    toolDayPrice: 800000,
    toolTermPrice: 1800000,
    feSlotPrice: 200000,
    peSlotPrice: 0,
    discountEnabled: true,
    discountAmount: 200000,
    activeToolTypeId: binhNgo._id.toString(),
  });

  // Admin
  const hashed = await bcrypt.hash('admin123', 10);
  await (Admin as any).create({ username: 'admin', password: hashed });

  // Tools
  const tools = await (Tool as any).insertMany([
    { name: 'Respondus LockDown Browser', version: '2.0.9' },
    { name: 'ExamSoft', version: '3.1.0' },
    { name: 'ProctorU', version: '1.5.2' },
    { name: 'Safe Exam Browser', version: '3.5.0' },
  ]);
  const [t1, t2, t3, t4] = tools;

  // Sellers
  const sellers = await (Seller as any).insertMany([
    { name: 'VN Soft' },
    { name: 'EduKey' },
    { name: 'TechLicense' },
    { name: 'KeyMaster' },
  ]);
  const [s1, s2, s3, s4] = sellers;

  // Keys
  const keys = await (Key as any).insertMany([
    { keyCode: 'RLB-2026-A001', toolId: t1._id.toString(), type: 'by_term', status: 'available', expirationDate: '2026-06-30' },
    { keyCode: 'RLB-2026-A002', toolId: t1._id.toString(), type: 'by_term', status: 'used', expirationDate: '2026-06-30' },
    { keyCode: 'RLB-DAY-0401', toolId: t1._id.toString(), type: 'by_day', status: 'available', expirationDate: '2026-04-01' },
    { keyCode: 'ES-2026-B001', toolId: t2._id.toString(), type: 'by_term', status: 'available', expirationDate: '2026-08-31' },
    { keyCode: 'ES-DAY-0401', toolId: t2._id.toString(), type: 'by_day', status: 'used', expirationDate: '2026-04-01' },
    { keyCode: 'PU-2026-C001', toolId: t3._id.toString(), type: 'by_term', status: 'available', expirationDate: '2026-06-30' },
    { keyCode: 'SEB-DAY-0402', toolId: t4._id.toString(), type: 'by_day', status: 'available', expirationDate: '2026-04-02' },
    { keyCode: 'SEB-2026-D001', toolId: t4._id.toString(), type: 'by_term', status: 'available', expirationDate: '2026-12-31' },
    { keyCode: 'RLB-DAY-0403', toolId: t1._id.toString(), type: 'by_day', status: 'available', expirationDate: '2026-04-03' },
    { keyCode: 'ES-2026-B002', toolId: t2._id.toString(), type: 'by_term', status: 'available', expirationDate: '2026-08-31' },
  ]);

  // Exam Sessions
  const sessions = await (ExamSession as any).insertMany([
    { date: '2026-04-01', startTime: '08:00', endTime: '10:00', type: 'PE', subjectId: 'CS101', term: 'Spring26', campus: 'Main Campus', studentCount: 45 },
    { date: '2026-04-01', startTime: '13:00', endTime: '15:00', type: 'FE', subjectId: 'MATH201', term: 'Spring26', campus: 'Main Campus', studentCount: 60 },
    { date: '2026-04-02', startTime: '09:00', endTime: '11:00', type: 'PE', subjectId: 'ENG102', term: 'Spring26', campus: 'South Campus', studentCount: 35 },
    { date: '2026-04-02', startTime: '14:00', endTime: '16:00', type: 'FE', subjectId: 'PHY301', term: 'Spring26', campus: 'Main Campus', studentCount: 28 },
    { date: '2026-04-03', startTime: '08:00', endTime: '10:30', type: 'PE', subjectId: 'BIO201', term: 'Spring26', campus: 'North Campus', studentCount: 52 },
    { date: '2026-04-03', startTime: '13:00', endTime: '15:00', type: 'FE', subjectId: 'CS101', term: 'Spring26', campus: 'Main Campus', studentCount: 40 },
    { date: '2026-04-05', startTime: '09:00', endTime: '11:00', type: 'PE', subjectId: 'CHEM101', term: 'Spring26', campus: 'South Campus', studentCount: 30 },
  ]);
  const [es1, es2, es3, es4, es5, es6, es7] = sessions;

  // Registrations
  await (Registration as any).insertMany([
    { studentId: 'STU001', customerName: 'Nguyen Van A', subjectId: 'CS101', examSessionId: es1._id.toString(), toolId: t1._id.toString(), keyCode: 'RLB-2026-A002', keyType: 'by_term', sellerId: s1._id.toString(), processStatus: 'done', note: 'Completed successfully' },
    { studentId: 'STU002', customerName: 'Tran Thi B', subjectId: 'CS101', examSessionId: es1._id.toString(), toolId: t2._id.toString(), keyCode: 'ES-DAY-0401', keyType: 'by_day', sellerId: s2._id.toString(), processStatus: 'supporting', note: 'Student needs assistance' },
    { studentId: 'STU003', customerName: 'Le Van C', subjectId: 'MATH201', examSessionId: es2._id.toString(), toolId: null, keyCode: null, keyType: null, sellerId: s1._id.toString(), processStatus: 'pending', note: '' },
    { studentId: 'STU004', customerName: 'Pham Thi D', subjectId: 'MATH201', examSessionId: es2._id.toString(), toolId: t1._id.toString(), keyCode: 'RLB-2026-A001', keyType: 'by_term', sellerId: s3._id.toString(), processStatus: 'assigned', note: 'Key assigned' },
    { studentId: 'STU005', customerName: 'Hoang Van E', subjectId: 'ENG102', examSessionId: es3._id.toString(), toolId: null, keyCode: null, keyType: null, sellerId: s2._id.toString(), processStatus: 'pending', note: '' },
    { studentId: 'STU006', customerName: 'Vo Thi F', subjectId: 'ENG102', examSessionId: es3._id.toString(), toolId: t3._id.toString(), keyCode: 'PU-2026-C001', keyType: 'by_term', sellerId: s4._id.toString(), processStatus: 'done', note: '' },
    { studentId: 'STU007', customerName: 'Bui Van G', subjectId: 'PHY301', examSessionId: es4._id.toString(), toolId: t4._id.toString(), keyCode: null, keyType: 'by_day', sellerId: s1._id.toString(), processStatus: 'assigned', note: 'Waiting for key' },
    { studentId: 'STU008', customerName: 'Dang Thi H', subjectId: 'BIO201', examSessionId: es5._id.toString(), toolId: null, keyCode: null, keyType: null, sellerId: s3._id.toString(), processStatus: 'pending', note: '' },
    { studentId: 'STU009', customerName: 'Ngo Van I', subjectId: 'BIO201', examSessionId: es5._id.toString(), toolId: t2._id.toString(), keyCode: 'ES-2026-B001', keyType: 'by_term', sellerId: s2._id.toString(), processStatus: 'supporting', note: 'In progress' },
    { studentId: 'STU010', customerName: 'Do Thi K', subjectId: 'CS101', examSessionId: es6._id.toString(), toolId: t1._id.toString(), keyCode: 'RLB-DAY-0403', keyType: 'by_day', sellerId: s4._id.toString(), processStatus: 'cancelled', note: 'Student withdrew' },
    { studentId: 'STU011', customerName: 'Truong Van L', subjectId: 'CHEM101', examSessionId: es7._id.toString(), toolId: null, keyCode: null, keyType: null, sellerId: s1._id.toString(), processStatus: 'pending', note: '' },
    { studentId: 'STU012', customerName: 'Mai Thi M', subjectId: 'CS101', examSessionId: es1._id.toString(), toolId: t1._id.toString(), keyCode: null, keyType: null, sellerId: s2._id.toString(), processStatus: 'pending', note: '' },
  ]);

  console.log('Seed complete!');
  console.log('Admin login: admin / admin123');
  console.log('Tool types: Bính Ngọ, Viper');
  console.log('Pricing config created with defaults');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
