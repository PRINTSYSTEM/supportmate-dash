import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface SessionData {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'PE' | 'FE';
  subjectId: string;
  term: string;
  campus: string;
  studentCount: number;
}

const emptySession = { date: '', startTime: '', endTime: '', type: 'PE' as const, subjectId: '', term: 'Spring26', campus: '', studentCount: 0 };

export default function ExamSessionsPage() {
  const queryClient = useQueryClient();
  const [editSession, setEditSession] = useState<SessionData | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions').then(r => r.data),
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session created');
      setEditSession(null);
      setIsNew(false);
    },
    onError: () => toast.error('Failed to create session'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/sessions/${data._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session updated');
      setEditSession(null);
    },
    onError: () => toast.error('Failed to update session'),
  });

  const openNew = () => {
    setIsNew(true);
    setEditSession({ _id: '', ...emptySession } as SessionData);
  };

  const handleSave = () => {
    if (!editSession) return;
    const payload = { ...editSession };
    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exam Sessions</h1>
            <p className="text-sm text-muted-foreground">Manage exam session schedules</p>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Create Session</Button>
        </div>
        <Card className="shadow-sm border-0 shadow-foreground/5 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sessions as SessionData[]).map(s => (
                    <TableRow key={s._id} className="hover:bg-muted/30">
                      <TableCell className="text-sm">{s.date}</TableCell>
                      <TableCell className="text-sm">{s.startTime}</TableCell>
                      <TableCell className="text-sm">{s.endTime}</TableCell>
                      <TableCell className="text-sm font-medium">{s.subjectId}</TableCell>
                      <TableCell><Badge variant={s.type === 'PE' ? 'default' : 'secondary'}>{s.type}</Badge></TableCell>
                      <TableCell className="text-sm">{s.campus}</TableCell>
                      <TableCell className="text-sm">{s.term}</TableCell>
                      <TableCell className="text-sm font-medium">{s.studentCount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditSession(s); setIsNew(false); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {editSession && (
        <Dialog open onOpenChange={() => { setEditSession(null); setIsNew(false); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{isNew ? 'Create' : 'Edit'} Session</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={editSession.date} onChange={e => setEditSession({ ...editSession, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={editSession.subjectId} onChange={e => setEditSession({ ...editSession, subjectId: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input type="time" value={editSession.startTime} onChange={e => setEditSession({ ...editSession, startTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={editSession.endTime} onChange={e => setEditSession({ ...editSession, endTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={editSession.type} onValueChange={v => setEditSession({ ...editSession, type: v as 'PE' | 'FE' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="FE">FE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Term</Label>
                <Select value={editSession.term} onValueChange={v => setEditSession({ ...editSession, term: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(terms as any[]).map(t => (
                      <SelectItem key={t._id} value={t.termId}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Campus</Label>
                <Input value={editSession.campus} onChange={e => setEditSession({ ...editSession, campus: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditSession(null); setIsNew(false); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
