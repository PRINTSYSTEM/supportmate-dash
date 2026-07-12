import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { GraduationCap, CheckCircle2, ArrowLeft, Send, Loader2, Plus, X, Trash2, Clock, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useTranslation } from '@/i18n';
import type { ExamTypeSlot, ExamTypeSlotData, ToolSubject, ToolDate } from '@/data/types';

const ALL_EXAM_TYPES: ExamTypeSlot[] = ['PE', 'FE', 'RETAKE_PE', 'RETAKE_FE'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

interface PricingData {
  toolDayPrice: number;
  toolTermPrice: number;
  feSlotPrice: number;
  peSlotPrice: number;
  discountEnabled: boolean;
  discountAmount: number;
}

function emptySubject(): ToolSubject {
  return { subjectId: '', examTypes: [] };
}

function emptyDate(): ToolDate {
  return { date: '', subjects: [emptySubject()] };
}

interface FormState {
  customerName: string;
  studentId: string;
  toolTypeId: string;
  toolPackage: 'day' | 'term';
  dates: ToolDate[];
  note: string;
  campus: string;
}

const CAMPUSES = ['HCM', 'HL', 'CT', 'QN', 'DN'];

const initialForm: FormState = {
  customerName: '',
  studentId: '',
  toolTypeId: '',
  toolPackage: 'day',
  dates: [emptyDate()],
  note: '',
  campus: 'HCM',
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function GuestRegisterPage() {
  const { t, language, setLanguage } = useTranslation();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [submittedPrice, setSubmittedPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [toolTypes, setToolTypes] = useState<any[]>([]);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch) return subjects.slice(0, 100);
    const query = subjectSearch.toLowerCase();
    return subjects
      .filter((s: any) => 
        s.subjectId.toLowerCase().includes(query) || 
        s.name.toLowerCase().includes(query)
      )
      .slice(0, 100);
  }, [subjects, subjectSearch]);

  useEffect(() => {
    Promise.all([
      api.get('/subjects'),
      api.get('/tool-types'),
      api.get('/pricing'),
    ])
      .then(([sRes, tRes, pRes]) => {
        setSubjects(sRes.data);
        setToolTypes(tRes.data);
        setPricing(pRes.data);
        if (tRes.data && tRes.data.length > 0) {
          setForm(prev => ({ ...prev, toolTypeId: tRes.data[0]._id }));
        }
      })
      .catch(() => toast.error('Failed to load form data'))
      .finally(() => setLoading(false));
  }, []);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateDate = (dateIndex: number, date: string) => {
    setForm(prev => {
      const dates = prev.dates.map((d, i) => i === dateIndex ? { ...d, date } : d);
      return { ...prev, dates };
    });
  };

  const addDate = () => {
    setForm(prev => ({
      ...prev,
      dates: [...prev.dates, emptyDate()],
    }));
  };

  const removeDate = (dateIndex: number) => {
    setForm(prev => ({
      ...prev,
      dates: prev.dates.filter((_, i) => i !== dateIndex),
    }));
  };

  const updateSubject = (dateIndex: number, subjectIndex: number, subjectId: string) => {
    setForm(prev => {
      const dates = prev.dates.map((d, di) => {
        if (di !== dateIndex) return d;
        const subjects = d.subjects.map((s, si) => si === subjectIndex ? { ...s, subjectId, examTypes: [] } : s);
        return { ...d, subjects };
      });
      return { ...prev, dates };
    });
  };

  const addSubject = (dateIndex: number) => {
    setForm(prev => {
      const dates = prev.dates.map((d, di) => {
        if (di !== dateIndex) return d;
        return { ...d, subjects: [...d.subjects, emptySubject()] };
      });
      return { ...prev, dates };
    });
  };

  const removeSubject = (dateIndex: number, subjectIndex: number) => {
    setForm(prev => {
      const dates = prev.dates.map((d, di) => {
        if (di !== dateIndex) return d;
        return { ...d, subjects: d.subjects.filter((_, si) => si !== subjectIndex) };
      });
      return { ...prev, dates };
    });
  };

  const toggleExamType = (dateIndex: number, subjectIndex: number, examType: ExamTypeSlot) => {
    setForm(prev => {
      const dates = prev.dates.map((d, di) => {
        if (di !== dateIndex) return d;
        const subjects = d.subjects.map((s, si) => {
          if (si !== subjectIndex) return s;
          const existing = s.examTypes.find(et => et.type === examType);
          if (existing) {
            return { ...s, examTypes: s.examTypes.filter(et => et.type !== examType) };
          }
          if (s.examTypes.length >= 2) return s;
          return { ...s, examTypes: [...s.examTypes, { type: examType, time: '' }] };
        });
        return { ...d, subjects };
      });
      return { ...prev, dates };
    });
  };

  const updateExamTime = (dateIndex: number, subjectIndex: number, examType: ExamTypeSlot, time: string) => {
    setForm(prev => {
      const dates = prev.dates.map((d, di) => {
        if (di !== dateIndex) return d;
        const subjects = d.subjects.map((s, si) => {
          if (si !== subjectIndex) return s;
          const examTypes = s.examTypes.map(et => et.type === examType ? { ...et, time } : et);
          return { ...s, examTypes };
        });
        return { ...d, subjects };
      });
      return { ...prev, dates };
    });
  };

  const selectedSubjectIds = (dateIndex: number): string[] => {
    return form.dates[dateIndex]?.subjects.filter(s => s.subjectId).map(s => s.subjectId) || [];
  };

  const calcPricePreview = useMemo(() => {
    if (!pricing) return null;
    const toolPrice = form.toolPackage === 'day' ? pricing.toolDayPrice : pricing.toolTermPrice;
    let feCount = 0;
    let peCount = 0;
    for (const d of form.dates) {
      for (const s of d.subjects) {
        for (const et of s.examTypes) {
          if (et.type === 'FE' || et.type === 'RETAKE_FE') feCount++;
          if (et.type === 'PE' || et.type === 'RETAKE_PE') peCount++;
        }
      }
    }
    const subtotal = toolPrice + feCount * pricing.feSlotPrice + peCount * pricing.peSlotPrice;
    const total = Math.max(subtotal - (pricing.discountEnabled ? pricing.discountAmount : 0), 0);
    return { toolPrice, feCount, peCount, subtotal, discount: pricing.discountEnabled ? pricing.discountAmount : 0, total };
  }, [form, pricing]);

  const validate = (): string[] => {
    const errors: string[] = [];
    if (!form.customerName.trim()) errors.push(t('validation.required') + ': ' + t('field.fullName'));
    if (!form.studentId.trim()) errors.push(t('validation.required') + ': ' + t('field.studentId'));
    if (!form.toolTypeId) errors.push(t('validation.required') + ': ' + t('field.toolType'));
    if (form.dates.length === 0) errors.push(t('validation.required') + ': ' + t('field.examDate'));
    if (form.toolPackage === 'day' && form.dates.length > 1) errors.push('Gói Ngày chỉ được một ngày thi');
    const dateSet = new Set<string>();
    for (let di = 0; di < form.dates.length; di++) {
      const d = form.dates[di];
      if (!d.date) { errors.push(`Ngày thi thứ ${di + 1}: ` + t('validation.required')); continue; }
      if (dateSet.has(d.date)) { errors.push(`Ngày ${d.date}: ` + t('validation.duplicateDate')); }
      dateSet.add(d.date);
      if (d.subjects.length === 0) { errors.push(`Ngày ${d.date}: ` + t('validation.required') + ' môn thi'); continue; }
      const subjSet = new Set<string>();
      for (let si = 0; si < d.subjects.length; si++) {
        const s = d.subjects[si];
        if (!s.subjectId) { errors.push(`Ngày ${d.date}, môn ${si + 1}: ` + t('validation.selectSubject')); continue; }
        if (subjSet.has(s.subjectId)) { errors.push(`Ngày ${d.date}: ${s.subjectId} ` + t('validation.duplicateSubject')); }
        subjSet.add(s.subjectId);
        if (s.examTypes.length === 0) { errors.push(`Ngày ${d.date}, môn ${s.subjectId}: ` + t('validation.selectExamType')); continue; }
        for (const et of s.examTypes) {
          if (!et.time || !TIME_REGEX.test(et.time)) {
            errors.push(`Ngày ${d.date}, môn ${s.subjectId}, ${et.type}: ` + t('validation.invalidTime'));
          }
        }
      }
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (errors.length > 0) {
      toast.error(errors.join('\n'), { duration: 5000 });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customerName: form.customerName.trim(),
        studentId: form.studentId.trim(),
        toolTypeId: form.toolTypeId,
        toolPackage: form.toolPackage,
        dates: form.dates,
        note: form.note.trim(),
        campus: form.campus,
      };
      const res = await api.post('/tool-registrations', payload);
      setSubmittedId(res.data._id);
      setSubmittedPrice(res.data.totalPrice);
      setSubmitted(true);
      toast.success(t('app.success.title'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit registration';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setSubmitted(false);
    setSubmittedId('');
    setSubmittedPrice(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/40 to-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-secondary/40 to-background">
        <Card className="w-full max-w-md border-0 shadow-xl shadow-foreground/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[hsl(142,71%,45%/0.15)] text-[hsl(142,71%,35%)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t('app.success.title')}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('app.success.message', { name: form.customerName, id: submittedId.slice(-6).toUpperCase() })}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>{t('app.success.submitAnother')}</Button>
              <Button asChild className="flex-1"><Link to="/">{t('app.success.goHome')}</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/40 to-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">{t('app.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('app.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={language === 'vi' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setLanguage('vi')}
            >
              VI
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setLanguage('en')}
            >
              EN
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />{t('app.admin')}</Link>
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-xl shadow-foreground/5">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('field.fullName')} <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder={t('field.fullName')}
                    value={form.customerName}
                    onChange={e => updateField('customerName', e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('field.studentId')} <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="MSSV"
                    value={form.studentId}
                    onChange={e => updateField('studentId', e.target.value)}
                    maxLength={20}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Cơ sở <span className="text-destructive">*</span></Label>
                  <Select value={form.campus} onValueChange={v => updateField('campus', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn cơ sở" /></SelectTrigger>
                    <SelectContent>
                      {CAMPUSES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('field.toolPackage')} <span className="text-destructive">*</span></Label>
                <RadioGroup
                  value={form.toolPackage}
                  onValueChange={v => updateField('toolPackage', v as 'day' | 'term')}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="day" id="pkg-day" />
                    <Label htmlFor="pkg-day" className="font-normal">{t('package.day')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="term" id="pkg-term" />
                    <Label htmlFor="pkg-term" className="font-normal">{t('package.term')}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('field.examDate')}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDate}>
                    <Plus className="w-4 h-4 mr-1" />{t('action.addDate')}
                  </Button>
                </div>

                {form.dates.map((dateItem, dateIndex) => (
                  <div key={dateIndex} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs">{t('field.examDate')} {dateIndex + 1}</Label>
                        <Input
                          type="date"
                          value={dateItem.date}
                          onChange={e => updateDate(dateIndex, e.target.value)}
                        />
                      </div>
                      {form.dates.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 mt-5 text-destructive" onClick={() => removeDate(dateIndex)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {dateItem.subjects.map((subjectItem, subjectIndex) => {
                        const usedSubjectIds = selectedSubjectIds(dateIndex).filter(id => id !== subjectItem.subjectId);
                        return (
                          <div key={subjectIndex} className="border rounded p-3 space-y-3 bg-background">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 space-y-1.5">
                                <Label className="text-xs">{t('field.subject')}</Label>
                                <Popover
                                  open={openPopover === `${dateIndex}-${subjectIndex}`}
                                  onOpenChange={(open) => {
                                    setOpenPopover(open ? `${dateIndex}-${subjectIndex}` : null);
                                    if (open) {
                                      setSubjectSearch('');
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openPopover === `${dateIndex}-${subjectIndex}`}
                                      className={cn(
                                        "w-full justify-between font-normal text-left border border-input bg-background hover:bg-background h-10 px-3",
                                        !subjectItem.subjectId && "text-muted-foreground"
                                      )}
                                    >
                                      <span className="truncate">
                                        {subjectItem.subjectId
                                          ? `${subjectItem.subjectId} — ${subjects.find((s) => s.subjectId === subjectItem.subjectId)?.name || ''}`
                                          : t('action.selectSubject')}
                                      </span>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput
                                        placeholder="Tìm kiếm môn học..."
                                        value={subjectSearch}
                                        onValueChange={setSubjectSearch}
                                      />
                                      <CommandList>
                                        <CommandEmpty>Không tìm thấy môn học.</CommandEmpty>
                                        <CommandGroup>
                                          {filteredSubjects
                                            .filter((s: any) => !usedSubjectIds.includes(s.subjectId))
                                            .map((s: any) => (
                                              <CommandItem
                                                key={s._id}
                                                value={s.subjectId}
                                                onSelect={() => {
                                                  updateSubject(dateIndex, subjectIndex, s.subjectId);
                                                  setOpenPopover(null);
                                                  setSubjectSearch('');
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    subjectItem.subjectId === s.subjectId ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                {s.subjectId} — {s.name}
                                              </CommandItem>
                                            ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {dateItem.subjects.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 mt-5 text-destructive" onClick={() => removeSubject(dateIndex, subjectIndex)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>

                            {subjectItem.subjectId && (
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">{t('field.examType')} ({t('validation.maxExamTypes')})</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {ALL_EXAM_TYPES.map(et => {
                                    const checked = subjectItem.examTypes.some(e => e.type === et);
                                    const disabled = !checked && subjectItem.examTypes.length >= 2;
                                    const examTypeVal = subjectItem.examTypes.find(e => e.type === et);
                                    
                                    const timeStr = examTypeVal?.time || '';
                                    const [h, m] = timeStr.split(':');
                                    const currentHour = h || '';
                                    const currentMinute = m || '';

                                    return (
                                      <div key={et} className="flex items-center justify-between p-2 rounded-lg border bg-muted/5 h-12 gap-2">
                                        <div className="flex items-center gap-2 shrink-0">
                                          <Checkbox
                                            id={`et-${dateIndex}-${subjectIndex}-${et}`}
                                            checked={checked}
                                            disabled={disabled}
                                            onCheckedChange={() => toggleExamType(dateIndex, subjectIndex, et)}
                                          />
                                          <Label htmlFor={`et-${dateIndex}-${subjectIndex}-${et}`} className="text-sm font-normal cursor-pointer select-none">
                                            {t(`examType.${et}`)}
                                          </Label>
                                        </div>

                                        {checked && examTypeVal && (
                                          <div className="flex items-center gap-1 shrink-0 animate-in fade-in duration-200">
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className={cn(
                                                    "h-9 w-[110px] text-sm px-2.5 justify-between font-semibold border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 transition-colors shadow-sm",
                                                    !examTypeVal.time && "text-emerald-700/60"
                                                  )}
                                                >
                                                  <span className="truncate">
                                                    {examTypeVal.time || "Giờ thi"}
                                                  </span>
                                                  <Clock className="w-4 h-4 text-emerald-600 ml-1 shrink-0" />
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-[140px] p-0" align="end">
                                                <div className="flex h-48 divide-x">
                                                  {/* Hours Column */}
                                                  <div className="flex-1 overflow-y-auto p-1 scrollbar-none">
                                                    <div className="flex flex-col gap-0.5">
                                                      {Array.from({ length: 17 }, (_, i) => {
                                                        const h = (i + 6).toString().padStart(2, '0');
                                                        const isSelected = currentHour === h;
                                                        return (
                                                          <button
                                                            key={h}
                                                            type="button"
                                                            className={cn(
                                                              "h-8 text-xs rounded transition-colors text-center w-full",
                                                              isSelected
                                                                ? "bg-primary text-primary-foreground font-semibold"
                                                                : "hover:bg-muted"
                                                            )}
                                                            onClick={() => {
                                                              const min = currentMinute || '00';
                                                              updateExamTime(dateIndex, subjectIndex, et, `${h}:${min}`);
                                                            }}
                                                          >
                                                            {h}
                                                          </button>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                  {/* Minutes Column */}
                                                  <div className="flex-1 overflow-y-auto p-1 scrollbar-none">
                                                    <div className="flex flex-col gap-0.5">
                                                      {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => {
                                                        const isSelected = currentMinute === m;
                                                        return (
                                                          <button
                                                            key={m}
                                                            type="button"
                                                            className={cn(
                                                              "h-8 text-xs rounded transition-colors text-center w-full",
                                                              isSelected
                                                                ? "bg-primary text-primary-foreground font-semibold"
                                                                : "hover:bg-muted"
                                                            )}
                                                            onClick={() => {
                                                              const hr = currentHour || '07';
                                                              updateExamTime(dateIndex, subjectIndex, et, `${hr}:${m}`);
                                                            }}
                                                          >
                                                            {m}
                                                          </button>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <Button type="button" variant="ghost" size="sm" onClick={() => addSubject(dateIndex)}>
                        <Plus className="w-4 h-4 mr-1" />{t('action.addSubject')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('field.note')}</Label>
                <Input
                  placeholder="Ghi chú (không bắt buộc)"
                  value={form.note}
                  onChange={e => updateField('note', e.target.value)}
                  maxLength={500}
                />
              </div>



              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={resetForm} disabled={submitting}>
                  {t('app.reset')}
                </Button>
                <Button type="button" className="flex-1" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {submitting ? t('app.submitting') : t('app.submit')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Thông tin chỉ được sử dụng để xử lý đăng ký tool hỗ trợ thi.
        </p>
      </div>
    </div>
  );
}
