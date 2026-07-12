import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { AssignToolModal } from '@/components/AssignToolModal';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Pencil, ChevronLeft, ChevronRight, Loader2, Calendar, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ProcessStatus, KeyType } from '@/data/types';

const PAGE_SIZE = 10;

interface RegistrationItem {
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
  campus: string;
  supportPrice?: number | null;
  createdAt: string;
}

export default function RegistrationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterCampus, setFilterCampus] = useState('all');
  const [filterExamType, setFilterExamType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(0);
  const [modalReg, setModalReg] = useState<RegistrationItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/registrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast.success('Đã xóa dòng hỗ trợ thi');
    },
    onError: () => {
      toast.error('Không thể xóa dòng hỗ trợ thi');
    }
  });

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

  const subjects = [...new Map((sessionsData as any[]).map(s => [s.subjectId, s.subjectId])).values()];

  const getSession = (id: string) => (sessionsData as any[]).find(s => s._id === id);
  const getTool = (id: string | null) => id ? (toolsData as any[]).find(t => t._id === id)?.name ?? '\u2014' : '\u2014';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '\u2014';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dateStr;
  };

  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filtered = useMemo(() => {
    const list = regs.filter(r => {
      const matchSearch = !search || r.studentId.toLowerCase().includes(search.toLowerCase()) || r.customerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || r.processStatus === filterStatus;
      const matchSubject = filterSubject === 'all' || r.subjectId === filterSubject;
      const matchCampus = filterCampus === 'all' || r.campus === filterCampus;
      
      const session = getSession(r.examSessionId);
      const matchExamType = filterExamType === 'all' || (session && session.type === filterExamType);
      const matchDate = !filterDate || (session && session.date === filterDate);
      
      return matchSearch && matchStatus && matchSubject && matchCampus && matchExamType && matchDate;
    });

    // Sort by exam date (ngày thi), then by exam time (giờ thi) - ascending
    return list.sort((a, b) => {
      const sessionA = getSession(a.examSessionId);
      const sessionB = getSession(b.examSessionId);

      const dateA = sessionA?.date || '';
      const dateB = sessionB?.date || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      const timeA = sessionA?.startTime || '';
      const timeB = sessionB?.startTime || '';
      return timeA.localeCompare(timeB);
    });
  }, [regs, search, filterStatus, filterSubject, filterCampus, filterExamType, filterDate, sessionsData]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Hỗ trợ thi</h1>
          <p className="text-sm text-muted-foreground">Quản lý yêu cầu hỗ trợ thi của sinh viên</p>
        </div>

        <Card className="shadow-sm border-0 shadow-foreground/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Tìm kiếm theo MSSV hoặc Họ tên..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-40"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="supporting">Đang hỗ trợ</SelectItem>
                  <SelectItem value="done">Hoàn thành</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Môn học" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả môn học</SelectItem>
                  {subjects.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCampus} onValueChange={setFilterCampus}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Cơ sở" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cơ sở</SelectItem>
                  <SelectItem value="HCM">HCM</SelectItem>
                  <SelectItem value="HL">HL</SelectItem>
                  <SelectItem value="CT">CT</SelectItem>
                  <SelectItem value="QN">QN</SelectItem>
                  <SelectItem value="DN">DN</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterExamType} onValueChange={setFilterExamType}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Loại thi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại thi</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="FE">FE</SelectItem>
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
                      <TableHead>Ngày thi</TableHead>
                      <TableHead>Giờ thi</TableHead>
                      <TableHead>MSSV</TableHead>
                      <TableHead>Họ và Tên</TableHead>
                      <TableHead>Cơ sở</TableHead>
                      <TableHead>Môn học</TableHead>
                      <TableHead>Loại thi</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Mã Key</TableHead>
                      <TableHead>Loại Key</TableHead>
                      <TableHead>Giá hỗ trợ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(r => {
                      const session = getSession(r.examSessionId);
                      const isPE = session?.type === 'PE';
                      return (
                        <TableRow key={r._id} className="hover:bg-muted/30">
                          <TableCell className="text-sm">{formatDate(session?.date)}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{session ? session.startTime : '\u2014'}</TableCell>
                          <TableCell className="font-medium text-sm">{r.studentId}</TableCell>
                          <TableCell className="text-sm">{r.customerName}</TableCell>
                          <TableCell className="text-sm font-semibold">{r.campus ?? '\u2014'}</TableCell>
                          <TableCell className="text-sm">{r.subjectId}</TableCell>
                          <TableCell className="text-sm">
                            {session ? (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                                isPE 
                                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}>
                                {session.type}
                              </span>
                            ) : '\u2014'}
                          </TableCell>
                          <TableCell className="text-sm">{getTool(r.toolId)}</TableCell>
                          <TableCell className="text-sm font-mono">{r.keyCode ?? '\u2014'}</TableCell>
                          <TableCell className="text-sm">{r.keyType === 'by_day' ? 'Theo ngày' : r.keyType === 'by_term' ? 'Theo kỳ' : '\u2014'}</TableCell>
                          <TableCell className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                            {r.supportPrice ? formatVND(r.supportPrice) : '\u2014'}
                          </TableCell>
                          <TableCell><StatusBadge status={r.processStatus as any} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{r.note || '\u2014'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setModalReg(r)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm('Bạn có chắc chắn muốn xóa dòng đăng ký hỗ trợ thi này?')) {
                                    deleteMutation.mutate(r._id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
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
                  Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} trên tổng số {filtered.length}
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
