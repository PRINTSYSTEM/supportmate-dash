import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tools, sellers, keys, examSessions } from '@/data/sampleData';
import { KeyType, ProcessStatus } from '@/data/types';
import { GraduationCap, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  studentId: string;
  customerName: string;
  subjectId: string;
  toolId: string;
  keyCode: string;
  keyType: KeyType | '';
  sellerId: string;
  processStatus: ProcessStatus;
  note: string;
}

const emptyForm: FormData = {
  studentId: '',
  customerName: '',
  subjectId: '',
  toolId: '',
  keyCode: '',
  keyType: '',
  sellerId: '',
  processStatus: 'pending',
  note: '',
};

export default function GuestRegisterPage() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const subjects = [...new Set(examSessions.map(s => s.subjectId))];
  const availableKeys = keys.filter(
    k => k.status === 'available' && (!form.toolId || k.toolId === form.toolId) && (!form.keyType || k.type === form.keyType)
  );

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.studentId.trim()) e.studentId = 'Required';
    else if (form.studentId.length > 20) e.studentId = 'Max 20 characters';
    if (!form.customerName.trim()) e.customerName = 'Required';
    else if (form.customerName.length > 100) e.customerName = 'Max 100 characters';
    if (!form.subjectId) e.subjectId = 'Required';
    if (form.note.length > 500) e.note = 'Max 500 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    // In-memory only; admins can pick this up in the Registrations page later.
    setSubmitted(true);
    toast.success('Registration submitted');
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-secondary/40 to-background">
        <Card className="w-full max-w-md border-0 shadow-xl shadow-foreground/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[hsl(142,71%,45%/0.15)] text-[hsl(142,71%,35%)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Registration received</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Thanks, <span className="font-medium text-foreground">{form.customerName}</span>. Our support team will process your request shortly.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Submit another</Button>
              <Button asChild className="flex-1"><Link to="/">Go home</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/40 to-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Exam Support</h1>
              <p className="text-xs text-muted-foreground">Quick registration form</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />Admin</Link>
          </Button>
        </div>

        <Card className="border-0 shadow-xl shadow-foreground/5">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Register for exam support</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Fill in your details — it takes less than a minute.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Student ID" error={errors.studentId} required>
                  <Input
                    placeholder="e.g. STU001"
                    value={form.studentId}
                    onChange={e => update('studentId', e.target.value)}
                    maxLength={20}
                  />
                </Field>
                <Field label="Customer Name" error={errors.customerName} required>
                  <Input
                    placeholder="Full name"
                    value={form.customerName}
                    onChange={e => update('customerName', e.target.value)}
                    maxLength={100}
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Subject" error={errors.subjectId} required>
                  <Select value={form.subjectId} onValueChange={v => update('subjectId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tool">
                  <Select value={form.toolId} onValueChange={v => { update('toolId', v); update('keyCode', ''); }}>
                    <SelectTrigger><SelectValue placeholder="Select tool (optional)" /></SelectTrigger>
                    <SelectContent>
                      {tools.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Key Type">
                  <Select value={form.keyType} onValueChange={v => { update('keyType', v as KeyType); update('keyCode', ''); }}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="by_day">By Day</SelectItem>
                      <SelectItem value="by_term">By Term</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Key Code">
                  <Select value={form.keyCode} onValueChange={v => update('keyCode', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={availableKeys.length ? 'Pick a key' : 'No keys available'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableKeys.map(k => (
                        <SelectItem key={k.id} value={k.keyCode}>{k.keyCode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Seller">
                  <Select value={form.sellerId} onValueChange={v => update('sellerId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select seller" /></SelectTrigger>
                    <SelectContent>
                      {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={form.processStatus} onValueChange={v => update('processStatus', v as ProcessStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="supporting">Supporting</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Note" error={errors.note}>
                <Textarea
                  placeholder="Anything we should know? (optional)"
                  rows={3}
                  value={form.note}
                  onChange={e => update('note', e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{form.note.length}/500</p>
              </Field>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                  Clear
                </Button>
                <Button type="submit" className="flex-1">
                  <Send className="w-4 h-4 mr-2" />Submit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your information is only used to process your exam support request.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
