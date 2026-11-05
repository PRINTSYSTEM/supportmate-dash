import { useState, useMemo, Fragment, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, ChevronLeft, ChevronRight, Loader2, Users, RefreshCw, ChevronDown, ChevronUp, Pencil, Filter, FileText, Download, Copy, Link } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { QuoteView } from '@/components/QuoteView';
import type { QuoteData } from '@/components/QuoteView';
import { ThesisMoneySection } from '@/components/ThesisMoneySection';
import type { MoneySummaryItem, ToolProcessStatus } from '@/data/types';

const PAGE_SIZE = 8;

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function MoneyManagementPage() {
  const queryClient = useQueryClient();
  const [moneyTab, setMoneyTab] = useState<'exam' | 'thesis'>('exam');
  const [search, setSearch] = useState('');
  const [filterPackage, setFilterPackage] = useState('all');
  const [term, setTerm] = useState<string | undefined>(undefined); // NEW: term filter
  const [page, setPage] = useState(0);
  const [merging, setMerging] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [editStudent, setEditStudent] = useState<MoneySummaryItem | null>(null);
  const [editDiscount, setEditDiscount] = useState('');
  const [editAmountReceived, setEditAmountReceived] = useState('');
  const [editNote, setEditNote] = useState('');

  const [editReg, setEditReg] = useState<any>(null);
  const [editRegKeyCode, setEditRegKeyCode] = useState('');
  const [editRegStatus, setEditRegStatus] = useState<ToolProcessStatus>('pending');
  const [editRegNote, setEditRegNote] = useState('');
  const [editRegAmount, setEditRegAmount] = useState('');

  const [quoteStudent, setQuoteStudent] = useState<MoneySummaryItem | null>(null);
  const quoteRef = useRef<HTMLDivElement>(null);

  const buildQuoteData = (item: MoneySummaryItem): QuoteData => {
    const nameParts = (item.customerName || '').trim().split(/\s+/);
    const maskedName = nameParts.length > 2
      ? `${nameParts[0]} *** ${nameParts[nameParts.length - 1]}`
      : item.customerName;
    const maskedId = (item.studentId || '').length > 5
      ? item.studentId.substring(0, 2) + '***' + item.studentId.substring(item.studentId.length - 3)
      : item.studentId;

    const toolPackage = item.registrations[0]?.toolPackage || 'day';
    const toolTypeName = getToolTypeName(item.registrations[0]?.toolTypeId || '');

    const allDates = item.registrations.flatMap(r => r.dates || []);

    return {
      customerName: maskedName,
      studentId: maskedId,
      campus: item.campus,
      toolPackage,
      toolTypeName,
      dates: allDates,
      toolFee: item.toolFee,
      supportFee: item.supportFee,
      discount: item.discount,
      amountReceived: item.amountReceived,
      totalPrice: item.debt,
    };
  };

  const getQuoteCanvas = () =>
    html2canvas(quoteRef.current!, { scale: 2, useCORS: true });

  const getBlob = (canvas: HTMLCanvasElement) =>
    new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!)));

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveImage = async () => {
    if (!quoteRef.current) return;
    try {
      const canvas = await getQuoteCanvas();
      const blob = await getBlob(canvas);
      const file = new File([blob], `baogia-${quoteStudent?.studentId || ''}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Báo giá dịch vụ' });
      } else {
        downloadBlob(blob, file.name);
      }
      toast.success('Đã lưu ảnh báo giá');
    } catch {
      toast.error('Không thể lưu ảnh');
    }
  };

  const handleCopyImage = async () => {
    if (!quoteRef.current) return;
    try {
      const canvas = await getQuoteCanvas();
      const blob = await getBlob(canvas);

      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success('Đã copy ảnh báo giá');
      } catch {
        const file = new File([blob], 'baogia.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Báo giá dịch vụ' });
          toast.success('Đã lưu ảnh báo giá');
        } else {
          downloadBlob(blob, `baogia-${quoteStudent?.studentId || ''}.png`);
          toast.success('Đã tải ảnh báo giá');
        }
      }
    } catch {
      toast.error('Không thể thao tác với ảnh');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/quote/${itemIdMap[quoteStudent?.studentId || ''] || ''}`;
    if (link.includes('undefined')) {
      toast.error('Không tìm thấy mã đăng ký');
      return;
    }
    navigator.clipboard.writeText(link);
    toast.success('Đã copy link báo giá');
  };

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data),
  });

  const { data: summary, isLoading } = useQuery({
    queryKey: ['money-summary', term],
    queryFn: () => api.get('/tool-registrations/summary', { params: { search, term } }).then(r => r.data),
    refetchOnMount: true,
  });

  const { data: toolTypes = [] } = useQuery({
    queryKey: ['tool-types-admin'],
    queryFn: () => api.get('/tool-types/admin').then(r => r.data),
  });

  const items: MoneySummaryItem[] = summary ?? [];

  // Build a map of studentId -> toolRegistrationId for quote links
  const itemIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of items) {
      const firstReg = item.registrations?.[0];
      if (firstReg) {
        map[item.studentId] = firstReg._id;
      }
    }
    return map;
  }, [items]);

  const billingMetrics = useMemo(() => {
    const totalToolFee = items.reduce((s, i) => s + i.toolFee, 0);
    const totalSupportFee = items.reduce((s, i) => s + i.supportFee, 0);
    const totalDiscount = items.reduce((s, i) => s + i.discount, 0);
    const totalReceived = items.reduce((s, i) => s + i.amountReceived, 0);
    const totalDebt = items.reduce((s, i) => s + i.debt, 0);
    const totalRevenue = totalToolFee + totalSupportFee - totalDiscount;
    return { totalToolFee, totalSupportFee, totalDiscount, totalReceived, totalDebt, totalRevenue, studentCount: items.length };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchSearch = !search || i.studentId.toLowerCase().includes(search.toLowerCase()) || i.customerName.toLowerCase().includes(search.toLowerCase());
      const matchPackage = filterPackage === 'all' || i.registrations.some(r => r.toolPackage === filterPackage);
      // Term filter: if term is set, only show students who have registrations (we'll rely on backend filtering)
      const matchTerm = !term || term === 'all';
      return matchSearch && matchPackage && matchTerm;
    });
  }, [items, search, filterPackage, term]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleMerge = async () => {
    if (!confirm('Bạn có chắc muốn chuẩn hóa MSSV (viết hoa) và gộp các bản ghi trùng của cùng 1 sinh viên? Dữ liệu gốc sẽ được hợp nhất và không thể hoàn tác.')) return;
    setMerging(true);
    try {
      const res = await api.post('/tool-registrations/normalize-student-ids');
      const data = res.data;
      toast.success(`Đã chuẩn hóa ${data.normalized} MSSV, gộp ${data.mergedRecords} bản ghi trùng thành ${data.duplicateGroups} nhóm`);
      queryClient.invalidateQueries({ queryKey: ['money-summary'] });
      queryClient.invalidateQueries({ queryKey: ['tool-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['all-registrations-raw'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi gộp MSSV');
    } finally {
      setMerging(false);
    }
  };

  const updateStudentMutation = useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: any }) =>
      api.put(`/tool-registrations/summary/${studentId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-summary'] });
      toast.success('Đã cập nhật thông tin tài chính');
      setEditStudent(null);
    },
    onError: () => toast.error('Lỗi khi cập nhật'),
  });

  const updateRegMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/tool-registrations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-summary'] });
      toast.success('Đã cập nhật đăng ký');
      setEditReg(null);
    },
    onError: () => toast.error('Lỗi khi cập nhật đăng ký'),
  });

  const openEditStudent = (item: MoneySummaryItem) => {
    setEditStudent(item);
    setEditDiscount(item.discount.toString());
    setEditAmountReceived(item.amountReceived.toString());
    setEditNote('');
  };

  const saveStudent = () => {
    if (!editStudent) return;
    updateStudentMutation.mutate({
      studentId: editStudent.studentId,
      data: {
        discount: parseFloat(editDiscount) || 0,
        amountReceived: parseFloat(editAmountReceived) || 0,
        note: editNote,
      },
    });
  };

  const openEditReg = (reg: any) => {
    setEditReg(reg);
    setEditRegKeyCode(reg.keyCode || '');
    setEditRegStatus(reg.processStatus);
    setEditRegNote(reg.note);
    setEditRegAmount((reg.amountReceived || 0).toString());
  };

  const saveReg = () => {
    if (!editReg) return;
    updateRegMutation.mutate({
      id: editReg._id,
      data: {
        keyCode: editRegKeyCode || null,
        processStatus: editRegStatus,
        note: editRegNote,
        amountReceived: parseFloat(editRegAmount) || 0,
      },
    });
  };

  const getToolTypeName = (id: string) => {
    const tt = toolTypes.find((t: any) => t._id === id);
    return tt?.name || '\u2014';
  };

  const getToolPackageLabel = (pkg: string) => pkg === 'day' ? 'Ngày' : 'Kỳ';

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Quản lý tiền</h1>
            <p className="text-sm text-muted-foreground">Gộp và quản lý tài chính theo MSSV</p>
          </div>
          <Button variant="outline" onClick={handleMerge} disabled={merging} className="w-full sm:w-auto">
            {merging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
            {merging ? 'Đang gộp...' : 'Gộp MSSV trùng'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={moneyTab === 'exam' ? 'default' : 'outline'}
            onClick={() => setMoneyTab('exam')}
          >
            Hỗ trợ thi
          </Button>
          <Button
            variant={moneyTab === 'thesis' ? 'default' : 'outline'}
            onClick={() => setMoneyTab('thesis')}
          >
            Khóa luận / Đồ án
          </Button>
        </div>

        {moneyTab === 'exam' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card className="shadow-sm border-0 shadow-foreground/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
                  <p className="text-xl font-bold mt-1 text-emerald-700">{formatVND(billingMetrics.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0 shadow-foreground/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Tổng tiền Tool</p>
                  <p className="text-xl font-bold mt-1">{formatVND(billingMetrics.totalToolFee)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0 shadow-foreground/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Tổng tiền Support</p>
                  <p className="text-xl font-bold mt-1">{formatVND(billingMetrics.totalSupportFee)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0 shadow-foreground/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Đã nhận</p>
                  <p className="text-xl font-bold mt-1 text-blue-600">{formatVND(billingMetrics.totalReceived)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0 shadow-foreground/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Còn nợ</p>
                  <p className="text-xl font-bold mt-1 text-rose-600">{formatVND(billingMetrics.totalDebt)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0 shadow-foreground/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Tổng sinh viên</p>
                  <p className="text-xl font-bold mt-1">{billingMetrics.studentCount}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm border-0 shadow-foreground/5">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[160px] sm:min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm theo MSSV hoặc Họ tên..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 md:hidden"
                    onClick={() => setShowFilters(v => !v)}
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                  <div className={`flex-wrap gap-3 ${showFilters ? 'flex' : 'hidden'} md:flex`}>
                    <Select value={filterPackage} onValueChange={setFilterPackage}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Gói" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả gói</SelectItem>
                        <SelectItem value="day">Ngày</SelectItem>
                        <SelectItem value="term">Kỳ</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={term} onValueChange={setTerm}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Học kỳ" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả học kỳ</SelectItem>
                        {(terms as any[]).map(t => (
                          <SelectItem key={t._id} value={t.termId}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['money-summary'] })}>
                      <RefreshCw className="w-4 h-4 mr-2" />Làm mới
                    </Button>
                  </div>
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
                          <TableHead>MSSV</TableHead>
                          <TableHead>Họ tên</TableHead>
                          <TableHead className="hidden md:table-cell">CS</TableHead>
                          <TableHead className="text-center">SL</TableHead>
                          <TableHead className="hidden md:table-cell">Giá Tool</TableHead>
                          <TableHead className="hidden md:table-cell">Giá Support</TableHead>
                          <TableHead className="hidden md:table-cell">Giảm giá</TableHead>
                          <TableHead className="hidden md:table-cell">Tổng phí DV</TableHead>
                          <TableHead className="hidden md:table-cell">Tiền nhận</TableHead>
                          <TableHead>Còn nợ</TableHead>
                          <TableHead className="hidden lg:table-cell">Ghi chú</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paged.map(item => {
                          const notes = item.registrations.map(r => r.note).filter(Boolean).join('; ');
                          return (
                            <TableRow key={item.studentId} className="hover:bg-muted/30">
                              <TableCell className="font-bold text-sm">{item.studentId}</TableCell>
                              <TableCell className="text-sm truncate max-w-[120px] md:max-w-none">{item.customerName}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm">{item.campus}</TableCell>
                              <TableCell className="text-sm text-center">{item.registrationCount}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm font-semibold whitespace-nowrap">{formatVND(item.toolFee)}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm font-semibold text-emerald-600 whitespace-nowrap">{formatVND(item.supportFee)}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm font-semibold text-orange-600 whitespace-nowrap">{formatVND(item.discount)}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm font-bold whitespace-nowrap">{formatVND(item.totalServiceFee)}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm font-semibold text-blue-600 whitespace-nowrap">{formatVND(item.amountReceived)}</TableCell>
                              <TableCell className="text-sm font-bold text-rose-600 whitespace-nowrap">{formatVND(item.debt)}</TableCell>
                              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[150px]" title={notes}>
                                {notes || '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setQuoteStudent(item); }}>
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openEditStudent(item); }}>
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
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}
                    </p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-9 w-9" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </>
        ) : (
          <ThesisMoneySection />
        )}
      </div>

      {/* Modal: Sửa thông tin tài chính sinh viên */}
      {editStudent && (
        <Dialog open onOpenChange={() => setEditStudent(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editStudent.studentId} \u2014 {editStudent.customerName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Giá Tool</Label><p className="font-semibold">{formatVND(editStudent.toolFee)}</p></div>
                <div><Label className="text-muted-foreground text-xs">Giá Support</Label><p className="font-semibold">{formatVND(editStudent.supportFee)}</p></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Giảm giá (VNĐ)</Label>
                <Input type="number" value={editDiscount} onChange={e => setEditDiscount(e.target.value)} min={0} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tiền đã nhận (VNĐ)</Label>
                <Input type="number" value={editAmountReceived} onChange={e => setEditAmountReceived(e.target.value)} min={0} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Ghi chú</Label>
                <Textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={2} placeholder="Ghi chú cho sinh viên này" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditStudent(null)}>Hủy</Button>
              <Button onClick={saveStudent} disabled={updateStudentMutation.isPending}>
                {updateStudentMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Sửa từng ToolRegistration */}
      {editReg && (
        <Dialog open onOpenChange={() => setEditReg(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Chi tiết đăng ký</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="space-y-1.5">
                <Label>Keycode</Label>
                <Input value={editRegKeyCode} onChange={e => setEditRegKeyCode(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select value={editRegStatus} onValueChange={v => setEditRegStatus(v as ToolProcessStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="assigned">Đã gán</SelectItem>
                    <SelectItem value="supporting">Retake</SelectItem>
                    <SelectItem value="done">Đã support</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tiền đã nhận (VNĐ)</Label>
                <Input type="number" value={editRegAmount} onChange={e => setEditRegAmount(e.target.value)} min={0} />
              </div>
              <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Textarea value={editRegNote} onChange={e => setEditRegNote(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditReg(null)}>Hủy</Button>
              <Button onClick={saveReg} disabled={updateRegMutation.isPending}>
                {updateRegMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Báo giá */}
      {quoteStudent && (
        <Dialog open onOpenChange={() => setQuoteStudent(null)}>
          <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
            <div ref={quoteRef}>
              <QuoteView data={buildQuoteData(quoteStudent)} />
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Button onClick={handleSaveImage} size="sm">
                <Download className="w-4 h-4 mr-1.5" />Lưu ảnh
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyImage}>
                <Copy className="w-4 h-4 mr-1.5" />Copy ảnh
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Link className="w-4 h-4 mr-1.5" />Copy link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}