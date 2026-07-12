import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { PricingConfig, ToolType } from '@/data/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

interface FormState {
  toolDayPrice: string;
  toolTermPrice: string;
  feSlotPrice: string;
  peSlotPrice: string;
  discountEnabled: boolean;
  discountAmount: string;
  activeToolTypeId: string;
}

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({
    toolDayPrice: '800000',
    toolTermPrice: '1800000',
    feSlotPrice: '200000',
    peSlotPrice: '0',
    discountEnabled: true,
    discountAmount: '200000',
    activeToolTypeId: '',
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  const { data: pricing, isLoading: pricingLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => api.get('/pricing').then(r => r.data as PricingConfig),
  });

  const { data: toolTypes = [] } = useQuery({
    queryKey: ['tool-types-admin'],
    queryFn: () => api.get('/tool-types/admin').then(r => r.data as ToolType[]),
  });

  useEffect(() => {
    if (pricing && initialLoadRef.current) {
      setForm({
        toolDayPrice: String(pricing.toolDayPrice),
        toolTermPrice: String(pricing.toolTermPrice),
        feSlotPrice: String(pricing.feSlotPrice),
        peSlotPrice: String(pricing.peSlotPrice),
        discountEnabled: pricing.discountEnabled,
        discountAmount: String(pricing.discountAmount),
        activeToolTypeId: pricing.activeToolTypeId || '',
      });
      initialLoadRef.current = false;
    }
  }, [pricing]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/pricing', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      setSaveStatus('saved');
    },
    onError: () => {
      setSaveStatus('error');
      toast.error('Failed to save pricing config');
    },
  });

  const updateField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSaveStatus('saving');
      const payload: any = {};
      payload.toolDayPrice = parseInt(form.toolDayPrice) || 0;
      payload.toolTermPrice = parseInt(form.toolTermPrice) || 0;
      payload.feSlotPrice = parseInt(form.feSlotPrice) || 0;
      payload.peSlotPrice = parseInt(form.peSlotPrice) || 0;
      payload.discountEnabled = form.discountEnabled;
      payload.discountAmount = parseInt(form.discountAmount) || 0;
      payload.activeToolTypeId = form.activeToolTypeId || null;

      if (field === 'toolDayPrice') payload.toolDayPrice = parseInt(value as string) || 0;
      if (field === 'toolTermPrice') payload.toolTermPrice = parseInt(value as string) || 0;
      if (field === 'feSlotPrice') payload.feSlotPrice = parseInt(value as string) || 0;
      if (field === 'peSlotPrice') payload.peSlotPrice = parseInt(value as string) || 0;
      if (field === 'discountEnabled') payload.discountEnabled = value as boolean;
      if (field === 'discountAmount') payload.discountAmount = parseInt(value as string) || 0;
      if (field === 'activeToolTypeId') payload.activeToolTypeId = value as string || null;

      updateMutation.mutate(payload);
    }, 600);
  }, [form, updateMutation]);

  if (pricingLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Pricing Configuration</h1>
          <p className="text-sm text-muted-foreground">Cấu hình giá cho đăng ký tool (auto-save)</p>
        </div>

        <Card className="shadow-sm border-0 shadow-foreground/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Giá cả</CardTitle>
            <div className="flex items-center gap-2 text-xs">
              {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>}
              {saveStatus === 'saved' && <><CheckCircle2 className="w-3 h-3 text-green-600" /> Saved</>}
              {saveStatus === 'error' && <><AlertCircle className="w-3 h-3 text-destructive" /> Error</>}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tool — Ngày ({formatVND(parseInt(form.toolDayPrice) || 0)})</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.toolDayPrice}
                  onChange={e => updateField('toolDayPrice', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tool — Kỳ ({formatVND(parseInt(form.toolTermPrice) || 0)})</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.toolTermPrice}
                  onChange={e => updateField('toolTermPrice', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slot FE ({formatVND(parseInt(form.feSlotPrice) || 0)})</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.feSlotPrice}
                  onChange={e => updateField('feSlotPrice', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slot PE ({formatVND(parseInt(form.peSlotPrice) || 0)})</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.peSlotPrice}
                  onChange={e => updateField('peSlotPrice', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.discountEnabled}
                onCheckedChange={v => updateField('discountEnabled', v)}
                id="discount-enabled"
              />
              <Label htmlFor="discount-enabled" className="font-medium">Bật giảm giá</Label>
            </div>

            {form.discountEnabled && (
              <div className="space-y-1.5 max-w-xs">
                <Label>Số tiền giảm ({formatVND(parseInt(form.discountAmount) || 0)})</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.discountAmount}
                  onChange={e => updateField('discountAmount', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5 max-w-xs">
              <Label>Loại tool mặc định</Label>
              <Select
                value={form.activeToolTypeId}
                onValueChange={v => updateField('activeToolTypeId', v)}
              >
                <SelectTrigger><SelectValue placeholder="Chọn loại tool" /></SelectTrigger>
                <SelectContent>
                  {toolTypes.map((tt: ToolType) => (
                    <SelectItem key={tt._id} value={tt._id}>{tt.name} {!tt.isActive ? '(inactive)' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
