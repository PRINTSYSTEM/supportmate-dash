import { useState, useEffect } from 'react';
import { ProcessStatus, KeyType } from '@/data/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface RegistrationData {
  _id: string;
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
  supportPrice?: number | null;
}

interface Props {
  registration: RegistrationData;
  onClose: () => void;
}

export function AssignToolModal({ registration, onClose }: Props) {
  const queryClient = useQueryClient();
  const [toolId, setToolId] = useState(registration.toolId ?? '');
  const [keyType, setKeyType] = useState<KeyType | ''>(registration.keyType ?? '');
  const [keyCode, setKeyCode] = useState(registration.keyCode ?? '');
  const [supportPrice, setSupportPrice] = useState('');
  const [status, setStatus] = useState<ProcessStatus>(registration.processStatus);
  const [note, setNote] = useState(registration.note);
  const [examType, setExamType] = useState<'PE' | 'FE' | ''>('');

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.get('/tools').then(r => r.data),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions').then(r => r.data),
  });

  const session = sessions.find((s: any) => s._id === registration.examSessionId);

  useEffect(() => {
    if (session) {
      setExamType(session.type);
    }
  }, [session]);

  useEffect(() => {
    if (registration.supportPrice !== undefined && registration.supportPrice !== null) {
      setSupportPrice((registration.supportPrice / 1000).toString());
    } else if (session) {
      if (session.type === 'FE') {
        setSupportPrice('200');
      } else {
        setSupportPrice('');
      }
    }
  }, [registration.supportPrice, session]);

  const handleExamTypeChange = (newType: 'PE' | 'FE') => {
    setExamType(newType);
    if (newType === 'FE' && !supportPrice) {
      setSupportPrice('200');
    } else if (newType === 'PE' && supportPrice === '200') {
      setSupportPrice('');
    }
  };

  const mutation = useMutation({
    mutationFn: (data: any) => api.put(`/registrations/${registration._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['all-registrations-raw'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Registration updated');
      onClose();
    },
    onError: () => toast.error('Failed to update registration'),
  });

  const handleSave = () => {
    mutation.mutate({
      toolId: toolId || null,
      keyType: (keyType as KeyType) || null,
      keyCode: keyCode || null,
      supportPrice: supportPrice ? parseFloat(supportPrice) * 1000 : null,
      processStatus: status,
      note,
      examType: examType || null,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Phân bổ Tool — {registration.customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Loại thi</Label>
            <Select value={examType} onValueChange={(v) => handleExamTypeChange(v as 'PE' | 'FE')}>
              <SelectTrigger><SelectValue placeholder="Chọn loại thi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PE">PE</SelectItem>
                <SelectItem value="FE">FE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tool</Label>
            <Select value={toolId} onValueChange={setToolId}>
              <SelectTrigger><SelectValue placeholder="Chọn tool" /></SelectTrigger>
              <SelectContent>
                {tools.map((t: any) => <SelectItem key={t._id} value={t._id}>{t.name} v{t.version}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Loại Key</Label>
            <Select value={keyType} onValueChange={(v) => setKeyType(v as KeyType)}>
              <SelectTrigger><SelectValue placeholder="Chọn loại key" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="by_day">Theo ngày</SelectItem>
                <SelectItem value="by_term">Theo kỳ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Mã Key</Label>
            <Input value={keyCode} onChange={e => setKeyCode(e.target.value)} placeholder="Nhập mã key" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Giá hỗ trợ (kđ)</Label>
            <Input type="number" value={supportPrice} onChange={e => setSupportPrice(e.target.value)} placeholder="FE mặc định là 200, PE để trống" min={0} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProcessStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="supporting">Đang hỗ trợ</SelectItem>
                <SelectItem value="done">Hoàn thành</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Ghi chú</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập ghi chú..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
