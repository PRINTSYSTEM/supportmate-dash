import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { AssignToolModal } from '@/components/AssignToolModal';
import { registrations as initialRegs, examSessions, tools, sellers } from '@/data/sampleData';
import { Registration, ProcessStatus } from '@/data/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Wrench, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 8;

export default function RegistrationsPage() {
  const [regs, setRegs] = useState<Registration[]>(initialRegs);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [page, setPage] = useState(0);
  const [modalReg, setModalReg] = useState<Registration | null>(null);

  const subjects = [...new Set(examSessions.map(s => s.subjectId))];

  const filtered = useMemo(() => {
    return regs.filter(r => {
      const matchSearch = !search || r.studentId.toLowerCase().includes(search.toLowerCase()) || r.customerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || r.processStatus === filterStatus;
      const matchSubject = filterSubject === 'all' || r.subjectId === filterSubject;
      return matchSearch && matchStatus && matchSubject;
    });
  }, [regs, search, filterStatus, filterSubject]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getSession = (id: string) => examSessions.find(s => s.id === id);
  const getTool = (id: string | null) => id ? tools.find(t => t.id === id)?.name ?? '—' : '—';
  const getSeller = (id: string) => sellers.find(s => s.id === id)?.name ?? '—';

  const handleSave = (updated: Registration) => {
    setRegs(prev => prev.map(r => r.id === updated.id ? updated : r));
    setModalReg(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Registrations</h1>
          <p className="text-sm text-muted-foreground">Manage student exam support registrations</p>
        </div>

        <Card className="shadow-sm border-0 shadow-foreground/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by Student ID or Name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="supporting">Supporting</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 shadow-foreground/5 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Key Code</TableHead>
                  <TableHead>Key Type</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(r => {
                  const session = getSession(r.examSessionId);
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm">{session?.date ?? '—'}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{session ? `${session.startTime} - ${session.endTime}` : '—'}</TableCell>
                      <TableCell className="font-medium text-sm">{r.studentId}</TableCell>
                      <TableCell className="text-sm">{r.customerName}</TableCell>
                      <TableCell className="text-sm">{r.subjectId}</TableCell>
                      <TableCell className="text-sm">{getTool(r.toolId)}</TableCell>
                      <TableCell className="text-sm font-mono">{r.keyCode ?? '—'}</TableCell>
                      <TableCell className="text-sm">{r.keyType ?? '—'}</TableCell>
                      <TableCell className="text-sm">{getSeller(r.sellerId)}</TableCell>
                      <TableCell><StatusBadge status={r.processStatus} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{r.note || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setModalReg(r)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setModalReg(r)}>
                            <Wrench className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {modalReg && (
        <AssignToolModal
          registration={modalReg}
          onClose={() => setModalReg(null)}
          onSave={handleSave}
        />
      )}
    </DashboardLayout>
  );
}
