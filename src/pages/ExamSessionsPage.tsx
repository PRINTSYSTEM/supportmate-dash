import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { examSessions as initialSessions } from '@/data/sampleData';
import { ExamSession } from '@/data/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil } from 'lucide-react';

export default function ExamSessionsPage() {
  const [sessions, setSessions] = useState<ExamSession[]>(initialSessions);
  const [editSession, setEditSession] = useState<ExamSession | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setIsNew(true);
    setEditSession({ id: `es${Date.now()}`, date: '', startTime: '', endTime: '', type: 'PE', subjectId: '', term: 'Spring26', campus: '', studentCount: 0 });
  };

  const handleSave = () => {
    if (!editSession) return;
    if (isNew) {
      setSessions(prev => [...prev, editSession]);
    } else {
      setSessions(prev => prev.map(s => s.id === editSession.id ? editSession : s));
    }
    setEditSession(null);
    setIsNew(false);
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
                {sessions.map(s => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
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
                    <SelectItem value="Spring26">Spring 26</SelectItem>
                    <SelectItem value="Summer26">Summer 26</SelectItem>
                    <SelectItem value="Fall26">Fall 26</SelectItem>
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
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
