import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { AssignToolModal } from '@/components/AssignToolModal';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Pencil, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const PAGE_SIZE = 8;

interface RegistrationItem {
  _id: string;
  studentId: string;
  customerName: string;
  subjectId: string;
  examSessionId: string;
  toolId: string | null;
  keyCode: string | null;
  keyType: string | null;
  sellerId: string;
  processStatus: string;
  note: string;
  createdAt: string;
}

export default function RegistrationsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [page, setPage] = useState(0);
  const [modalReg, setModalReg] = useState<RegistrationItem | null>(null);

  const { data: sessionsData = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions').then(r => r.data),
  });

  const { data: toolsData = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.get('/tools').then(r => r.data),
  });

  const { data: sellersData = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => api.get('/sellers').then(r => r.data),
  });

  const { data: regsData, isLoading } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => api.get('/registrations').then(r => r.data),
  });

  const regs: RegistrationItem[] = regsData?.items ?? [];

  const subjects = [...new Map((sessionsData as any[]).map(s => [s.subjectId, s.subjectId])).values()];

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

  const getSession = (id: string) => (sessionsData as any[]).find(s => s._id === id);
  const getTool = (id: string | null) => id ? (toolsData as any[]).find(t => t._id === id)?.name ?? '\u2014' : '\u2014';
  const getSeller = (id: string) => (sellersData as any[]).find(s => s._id === id)?.name ?? '\u2014';

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
                  {subjects.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 shadow-foreground/5 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
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
                        <TableRow key={r._id} className="hover:bg-muted/30">
                          <TableCell className="text-sm">{session?.date ?? '\u2014'}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{session ? `${session.startTime} - ${session.endTime}` : '\u2014'}</TableCell>
                          <TableCell className="font-medium text-sm">{r.studentId}</TableCell>
                          <TableCell className="text-sm">{r.customerName}</TableCell>
                          <TableCell className="text-sm">{r.subjectId}</TableCell>
                          <TableCell className="text-sm">{getTool(r.toolId)}</TableCell>
                          <TableCell className="text-sm font-mono">{r.keyCode ?? '\u2014'}</TableCell>
                          <TableCell className="text-sm">{r.keyType ?? '\u2014'}</TableCell>
                          <TableCell className="text-sm">{getSeller(r.sellerId)}</TableCell>
                          <TableCell><StatusBadge status={r.processStatus as any} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{r.note || '\u2014'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setModalReg(r)}>
                                <Pencil className="w-4 h-4" />
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
            </>
          )}
        </Card>
      </div>

      {modalReg && (
        <AssignToolModal
          registration={modalReg}
          onClose={() => setModalReg(null)}
        />
      )}
    </DashboardLayout>
  );
}
