import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { AssignToolModal } from '@/components/AssignToolModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Calendar, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ProcessStatus } from '@/data/types';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const today = new Date().toISOString().split('T')[0];

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
  processStatus: ProcessStatus;
  note: string;
  campus: string;
  supportPrice?: number | null;
  createdAt: string;
}

export default function TodaySupportPage() {
  const { data: sessionsData = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions').then(r => r.data),
  });

  const { data: toolsData = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.get('/tools').then(r => r.data),
  });

  const { data: regsData, isLoading } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => api.get('/registrations', { params: { limit: 1000 } }).then(r => r.data),
  });

  const regs: RegistrationItem[] = regsData?.items ?? [];

  const todaySessionIds = useMemo(() => {
    return new Set(
      (sessionsData as any[])
        .filter((s: any) => s.date === today)
        .map((s: any) => s._id)
    );
  }, [sessionsData]);

  const getSession = (id: string) => (sessionsData as any[]).find(s => s._id === id);
  const getTool = (id: string | null) => id ? (toolsData as any[]).find(t => t._id === id)?.name ?? '—' : '—';

  const todayRegs = useMemo(() => {
    return regs
      .filter(r => todaySessionIds.has(r.examSessionId))
      .sort((a, b) => {
        const sessionA = getSession(a.examSessionId);
        const sessionB = getSession(b.examSessionId);
        const timeA = sessionA?.startTime || '';
        const timeB = sessionB?.startTime || '';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return (a.subjectId || '').localeCompare(b.subjectId || '');
      });
  }, [regs, todaySessionIds]);

  const [modalReg, setModalReg] = useState<RegistrationItem | null>(null);

  const stats = useMemo(() => {
    const total = todayRegs.length;
    const pending = todayRegs.filter(r => r.processStatus === 'pending').length;
    const supporting = todayRegs.filter(r => r.processStatus === 'supporting').length;
    const done = todayRegs.filter(r => r.processStatus === 'done').length;
    const failed = todayRegs.filter(r => r.processStatus === 'failed' || r.processStatus === 'cancelled').length;
    return { total, pending, supporting, done, failed };
  }, [todayRegs]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Hỗ trợ hôm nay</h1>
            <p className="text-sm text-muted-foreground">
              Danh sách yêu cầu hỗ trợ thi — <span className="font-semibold">{formatDate(today)}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="shadow-sm border-0 shadow-foreground/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Tổng yêu cầu</p>
              <p className="text-xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0 shadow-foreground/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Chờ xử lý</p>
              <p className="text-xl font-bold mt-1 text-[hsl(25,95%,53%)]">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0 shadow-foreground/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Đang hỗ trợ</p>
              <p className="text-xl font-bold mt-1 text-primary">{stats.supporting}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0 shadow-foreground/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Hoàn thành</p>
              <p className="text-xl font-bold mt-1 text-[hsl(142,71%,45%)]">{stats.done}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0 shadow-foreground/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Thất bại / Đã hủy</p>
              <p className="text-xl font-bold mt-1 text-rose-600">{stats.failed}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-0 shadow-foreground/5 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : todayRegs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Calendar className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">Hôm nay không có lịch hỗ trợ thi nào</p>
              <p className="text-xs mt-1">Ngày {formatDate(today)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Giờ</TableHead>
                    <TableHead className="hidden md:table-cell">Ngày</TableHead>
                    <TableHead>MSSV</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead className="hidden md:table-cell">Cơ sở</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead className="hidden md:table-cell">Loại thi</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Mã Key</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayRegs.map(r => {
                    const session = getSession(r.examSessionId);
                    const isPE = session?.type === 'PE';
                    return (
                      <TableRow key={r._id} className="hover:bg-muted/30">
                        <TableCell className="text-sm whitespace-nowrap">{session?.startTime || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{formatDate(session?.date)}</TableCell>
                        <TableCell className="font-medium text-sm">{r.studentId}</TableCell>
                        <TableCell className="text-sm truncate max-w-[100px] md:max-w-none">{r.customerName}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{r.campus || '—'}</TableCell>
                        <TableCell className="text-sm truncate max-w-[80px] md:max-w-none">{r.subjectId}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {session ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                              isPE ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {session.type}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[80px] md:max-w-none">{getTool(r.toolId)}</TableCell>
                        <TableCell className="text-sm font-mono truncate max-w-[80px] md:max-w-none">{r.keyCode || '—'}</TableCell>
                        <TableCell><StatusBadge status={r.processStatus as any} /></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setModalReg(r)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
