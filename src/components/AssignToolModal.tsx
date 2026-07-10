import { useState, useEffect } from 'react';
import { ProcessStatus, KeyType } from '@/data/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
  const [status, setStatus] = useState<ProcessStatus>(registration.processStatus);
  const [note, setNote] = useState(registration.note);

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.get('/tools').then(r => r.data),
  });

  const { data: keys = [] } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.get('/keys').then(r => r.data),
  });

  const availableKeys = keys.filter((k: any) => {
    if (!toolId) return false;
    const matchTool = k.toolId === toolId;
    const matchType = !keyType || k.type === keyType;
    const isAvailable = k.status === 'available' || k.keyCode === registration.keyCode;
    return matchTool && matchType && isAvailable;
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.put(`/registrations/${registration._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
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
      processStatus: status,
      note,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Tool — {registration.customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tool</Label>
            <Select value={toolId} onValueChange={setToolId}>
              <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
              <SelectContent>
                {tools.map((t: any) => <SelectItem key={t._id} value={t._id}>{t.name} v{t.version}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Key Type</Label>
            <Select value={keyType} onValueChange={(v) => { setKeyType(v as KeyType); setKeyCode(''); }}>
              <SelectTrigger><SelectValue placeholder="Select key type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="by_day">By Day</SelectItem>
                <SelectItem value="by_term">By Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Key Code</Label>
            <Select value={keyCode} onValueChange={setKeyCode}>
              <SelectTrigger><SelectValue placeholder={availableKeys.length ? 'Select key' : 'No keys available'} /></SelectTrigger>
              <SelectContent>
                {availableKeys.map((k: any) => <SelectItem key={k._id} value={k.keyCode}>{k.keyCode} (exp: {k.expirationDate})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Process Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProcessStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="supporting">Supporting</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Note</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
