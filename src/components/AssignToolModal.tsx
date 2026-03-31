import { useState } from 'react';
import { Registration, ProcessStatus, KeyType } from '@/data/types';
import { tools, keys } from '@/data/sampleData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  registration: Registration;
  onClose: () => void;
  onSave: (updated: Registration) => void;
}

export function AssignToolModal({ registration, onClose, onSave }: Props) {
  const [toolId, setToolId] = useState(registration.toolId ?? '');
  const [keyType, setKeyType] = useState<KeyType | ''>(registration.keyType ?? '');
  const [keyCode, setKeyCode] = useState(registration.keyCode ?? '');
  const [status, setStatus] = useState<ProcessStatus>(registration.processStatus);
  const [note, setNote] = useState(registration.note);

  const availableKeys = keys.filter(k => {
    if (!toolId) return false;
    const matchTool = k.toolId === toolId;
    const matchType = !keyType || k.type === keyType;
    const isAvailable = k.status === 'available';
    return matchTool && matchType && isAvailable;
  });

  const handleSave = () => {
    onSave({
      ...registration,
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
                {tools.map(t => <SelectItem key={t.id} value={t.id}>{t.name} v{t.version}</SelectItem>)}
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
                {availableKeys.map(k => <SelectItem key={k.id} value={k.keyCode}>{k.keyCode} (exp: {k.expirationDate})</SelectItem>)}
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
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
