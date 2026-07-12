import { IToolDate } from '../models/ToolRegistration.js';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_EXAM_TYPES = ['PE', 'FE', 'RETAKE_PE', 'RETAKE_FE'];

export interface ValidationError {
  field: string;
  message: string;
}

export function validateToolRegistration(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.customerName?.trim()) {
    errors.push({ field: 'customerName', message: 'Họ tên không được để trống' });
  }

  if (!data.studentId?.trim()) {
    errors.push({ field: 'studentId', message: 'MSSV không được để trống' });
  }

  if (!data.toolPackage || !['day', 'term'].includes(data.toolPackage)) {
    errors.push({ field: 'toolPackage', message: 'Phải chọn gói tool (Ngày hoặc Kỳ)' });
  }

  if (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
    errors.push({ field: 'dates', message: 'Phải có ít nhất một ngày thi' });
  } else {
    if (data.toolPackage === 'day' && data.dates.length > 1) {
      errors.push({ field: 'dates', message: 'Gói Ngày chỉ được có một ngày thi' });
    }

    const dateStrings = data.dates.map((d: any) => d.date);
    const uniqueDates = new Set(dateStrings);
    if (uniqueDates.size !== dateStrings.length) {
      errors.push({ field: 'dates', message: 'Các ngày thi không được trùng nhau' });
    }

    for (let di = 0; di < data.dates.length; di++) {
      const d = data.dates[di];
      const dateErrors = validateDate(d, di);
      errors.push(...dateErrors);
    }
  }

  return errors;
}

function validateDate(d: IToolDate, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `dates[${index}]`;

  if (!d.date || !DATE_REGEX.test(d.date)) {
    errors.push({ field: `${prefix}.date`, message: `Ngày thi thứ ${index + 1} không hợp lệ (cần định dạng YYYY-MM-DD)` });
  }

  if (!d.subjects || !Array.isArray(d.subjects) || d.subjects.length === 0) {
    errors.push({ field: `${prefix}.subjects`, message: `Ngày thi thứ ${index + 1} phải có ít nhất một môn thi` });
  } else {
    const subjectIds = d.subjects.map(s => s.subjectId);
    const uniqueSubjects = new Set(subjectIds);
    if (uniqueSubjects.size !== subjectIds.length) {
      errors.push({ field: `${prefix}.subjects`, message: `Ngày thi thứ ${index + 1} có môn thi bị trùng` });
    }

    for (let si = 0; si < d.subjects.length; si++) {
      const s = d.subjects[si];
      const subjectErrors = validateSubject(s, index, si);
      errors.push(...subjectErrors);
    }
  }

  return errors;
}

function validateSubject(s: any, dateIndex: number, subjectIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `dates[${dateIndex}].subjects[${subjectIndex}]`;

  if (!s.subjectId?.trim()) {
    errors.push({ field: `${prefix}.subjectId`, message: `Môn thi thứ ${subjectIndex + 1} tại ngày ${dateIndex + 1} không được để trống` });
  }

  if (!s.examTypes || !Array.isArray(s.examTypes) || s.examTypes.length === 0) {
    errors.push({ field: `${prefix}.examTypes`, message: `Môn thi thứ ${subjectIndex + 1} tại ngày ${dateIndex + 1} phải chọn ít nhất một loại thi` });
  } else if (s.examTypes.length > 2) {
    errors.push({ field: `${prefix}.examTypes`, message: `Môn thi thứ ${subjectIndex + 1} tại ngày ${dateIndex + 1} chỉ được chọn tối đa 2 loại thi` });
  } else {
    const typeSet = new Set<string>();
    for (let ti = 0; ti < s.examTypes.length; ti++) {
      const et = s.examTypes[ti];
      if (!VALID_EXAM_TYPES.includes(et.type)) {
        errors.push({ field: `${prefix}.examTypes[${ti}].type`, message: `Loại thi không hợp lệ: ${et.type}` });
      }
      if (typeSet.has(et.type)) {
        errors.push({ field: `${prefix}.examTypes[${ti}].type`, message: `Loại thi ${et.type} bị trùng trong cùng môn` });
      }
      typeSet.add(et.type);

      if (!et.time || !TIME_REGEX.test(et.time)) {
        errors.push({ field: `${prefix}.examTypes[${ti}].time`, message: `Giờ thi không hợp lệ (cần HH:mm) cho ${et.type}` });
      }
    }
  }

  return errors;
}

export function validateSubjectImport(item: any): string | null {
  if (!item.subjectId?.trim()) return 'Subject code is required';
  if (!item.name?.trim()) return 'Subject name is required';
  return null;
}

export function validateSessionImport(item: any): string | null {
  if (!item.date || !DATE_REGEX.test(item.date)) return `Invalid date: ${item.date}`;
  if (!item.startTime || !TIME_REGEX.test(item.startTime)) return `Invalid startTime: ${item.startTime}`;
  if (!item.endTime || !TIME_REGEX.test(item.endTime)) return `Invalid endTime: ${item.endTime}`;
  if (item.startTime >= item.endTime) return `startTime must be before endTime: ${item.startTime}-${item.endTime}`;
  if (!['PE', 'FE'].includes(item.type)) return `Invalid type: ${item.type}`;
  if (!item.subjectId?.trim()) return 'Subject ID is required';
  if (item.studentCount != null && (typeof item.studentCount !== 'number' || item.studentCount < 0)) return 'Student count must be non-negative';
  return null;
}
