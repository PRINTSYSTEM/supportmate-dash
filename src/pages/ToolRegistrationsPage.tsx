import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { Search, Pencil, ChevronLeft, ChevronRight, Loader2, Trash2, Wallet, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { ToolRegistration, ToolProcessStatus } from '@/data/types';

const PAGE_SIZE = 10;

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function getToolPackageLabel(pkg: string): string {
  return pkg === 'day' ? 'Ngày' : 'Kỳ';
}

export default function ToolRegistrationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPackage, setFilterPackage] = useState('all');
  const [page, setPage] = useState(0);
  const [modalReg, setModalReg] = useState<ToolRegistration | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editKeyCode, setEditKeyCode] = useState('');
  const [editStatus, setEditStatus] = useState<ToolProcessStatus>('pending');
  const [editNote, setEditNote] = useState('');
  const [editAmountReceived, setEditAmountReceived] = useState('');

  const { data: toolTypes = [] } = useQuery({
    queryKey: ['tool-types-admin'],
    queryFn: () => api.get('/tool-types/admin').then(r => r.data),
  });

  const { data: regsData, isLoading } = useQuery({
    queryKey: ['tool-registrations'],
    queryFn: () => api.get('/tool-registrations').then(r => r.data),
  });

  const { data: allRegsData } = useQuery({
    queryKey: ['all-registrations-raw'],
    queryFn: () => api.get('/registrations', { params: { limit: 1000 } }).then(r => r.data),
  });
  const allRegs = allRegsData?.items ?? [];

  const { data: sessionsData = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions').then(r => r.data),
  });

  const regs: ToolRegistration[] = regsData?.items ?? [];

  const getToolRegStats = (trId: string) => {
    const siblingRegs = allRegs.filter((reg: any) => reg.toolRegistrationId === trId);
    const numSubjects = new Set(siblingRegs.map((reg: any) => reg.subjectId)).size;
    
    let feSuccessCount = 0;
    let peSuccessCount = 0;
    let totalSupportPrice = 0;
    
    siblingRegs.forEach((reg: any) => {
      if (reg.processStatus === 'done') {
        const session = sessionsData.find((s: any) => s._id === reg.examSessionId);
        const isFE = session ? session.type === 'FE' : false;
        if (isFE) {
          feSuccessCount++;
        } else {
          peSuccessCount++;
        }
        totalSupportPrice += reg.supportPrice || 0;
      }
    });

    const activeSiblingRegs = siblingRegs.filter((reg: any) => reg.processStatus !== 'failed' && reg.processStatus !== 'cancelled');
    const totalAllSupportPrice = activeSiblingRegs.reduce((sum: number, reg: any) => sum + (reg.supportPrice || 0), 0);

    return {
      numSubjects,
      feSuccessCount,
      peSuccessCount,
      totalSupportPrice,
      totalAllSupportPrice,
    };
  };

  const billingMetrics = useMemo(() => {
    const total = regs.reduce((s, r) => s + r.totalPrice, 0);
    const byStatus: Record<string, number> = { pending: 0, assigned: 0, supporting: 0, done: 0, failed: 0, cancelled: 0 };
    regs.forEach(r => { byStatus[r.processStatus] = (byStatus[r.processStatus] || 0) + 1; });
    return { totalRevenue: total, byStatus, totalRegistrations: regs.length };
  }, [regs]);

  const filtered = useMemo(() => {
    return regs.filter(r => {
      const matchSearch = !search || r.studentId.toLowerCase().includes(search.toLowerCase()) || r.customerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || r.processStatus === filterStatus;
      const matchPackage = filterPackage === 'all' || r.toolPackage === filterPackage;
      return matchSearch && matchStatus && matchPackage;
    });
  }, [regs, search, filterStatus, filterPackage]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/tool-registrations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-registrations'] });
      toast.success('Registration updated');
      setModalReg(null);
    },
    onError: () => toast.error('Failed to update registration'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tool-registrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['all-registrations-raw'] });
      toast.success('Đã xóa đăng ký tool');
    },
    onError: () => toast.error('Không thể xóa đăng ký tool'),
  });

  const getToolTypeName = (id: string) => {
    const tt = toolTypes.find((t: any) => t._id === id);
    return tt?.name || '—';
  };

  const openModal = (r: ToolRegistration) => {
    setModalReg(r);
    setEditKeyCode(r.keyCode || '');
    setEditStatus(r.processStatus);
    setEditNote(r.note);
    setEditAmountReceived(r.amountReceived ? (r.amountReceived / 1000).toString() : '0');
  };

  const handleSave = () => {
    if (!modalReg) return;
    updateMutation.mutate({
      id: modalReg._id,
      data: {
        keyCode: editKeyCode || null,
        processStatus: editStatus,
        note: editNote,
        amountReceived: editAmountReceived ? parseFloat(editAmountReceived) * 1000 : 0,
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Đăng ký Tool</h1>
            <p className="text-sm text-muted-foreground">Quản lý đăng ký tool hỗ trợ thi</p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/money-management"><Wallet className="w-4 h-4 mr-2" />Quản lý tiền</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-0 shadow-foreground/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
              <p className="text-2xl font-bold mt-1">{formatVND(billingMetrics.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0 shadow-foreground/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Tổng số đăng ký</p>
              <p className="text-2xl font-bold mt-1">{billingMetrics.totalRegistrations}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0 shadow-foreground/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Chờ xử lý</p>
              <p className="text-2xl font-bold mt-1 text-[hsl(25,95%,53%)]">{billingMetrics.byStatus.pending}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0 shadow-foreground/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Hoàn thành</p>
              <p className="text-2xl font-bold mt-1 text-[hsl(142,71%,45%)]">{billingMetrics.byStatus.done}</p>
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
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="supporting">Đang hỗ trợ</SelectItem>
                    <SelectItem value="done">Hoàn thành</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPackage} onValueChange={setFilterPackage}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Gói" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả các gói</SelectItem>
                    <SelectItem value="day">Ngày</SelectItem>
                    <SelectItem value="term">Kỳ</SelectItem>
                  </SelectContent>
                </Select>
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
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead>MSSV</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead className="hidden md:table-cell">Cơ sở</TableHead>
                      <TableHead className="hidden md:table-cell">Tool</TableHead>
                      <TableHead>Gói</TableHead>
                      <TableHead className="hidden md:table-cell">Mã Key</TableHead>
                      <TableHead className="hidden md:table-cell">Giá Tool</TableHead>
                      <TableHead className="hidden md:table-cell">Giá Support</TableHead>
                      <TableHead>Tổng phí dịch vụ</TableHead>
                      <TableHead>Tiền đã nhận</TableHead>
                      <TableHead>Còn nợ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(r => (
                      <TableRow key={r._id} className="hover:bg-muted/30">
                        <TableCell className="text-sm whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className="font-medium text-sm">{r.studentId}</TableCell>
                        <TableCell className="text-sm truncate max-w-[120px] md:max-w-none">{r.customerName}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-semibold">{r.campus ?? '\u2014'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{getToolTypeName(r.toolTypeId)}</TableCell>
                        <TableCell className="text-sm">{getToolPackageLabel(r.toolPackage)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-mono">{r.keyCode || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-semibold whitespace-nowrap">{formatVND(r.priceSnapshot?.toolPrice ?? 0)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-semibold text-emerald-600 whitespace-nowrap">{formatVND(getToolRegStats(r._id).totalAllSupportPrice)}</TableCell>
                        <TableCell className="text-sm">
                          <div className="font-bold text-foreground whitespace-nowrap">{formatVND(r.totalPrice)}</div>
                          {getToolRegStats(r._id).totalSupportPrice > 0 && (
                            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 whitespace-nowrap bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 inline-block">
                              Đã hoàn thành: {formatVND(getToolRegStats(r._id).totalSupportPrice)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                          {formatVND(r.amountReceived ?? 0)}
                        </TableCell>
                        <TableCell className="text-sm font-bold text-rose-600 whitespace-nowrap">
                          {formatVND(Math.max(r.totalPrice - (r.amountReceived ?? 0), 0))}
                        </TableCell>
                        <TableCell><StatusBadge status={r.processStatus as any} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(r)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm('Bạn có chắc chắn muốn xóa dòng đăng ký Tool này và các lịch thi hỗ trợ liên quan?')) {
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
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} trên tổng số {filtered.length}
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
      </div>

      {modalReg && (
        <Dialog open onOpenChange={() => setModalReg(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Chi tiết — {modalReg.customerName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Label className="text-muted-foreground">MSSV</Label><p className="font-medium">{modalReg.studentId}</p></div>
                <div><Label className="text-muted-foreground">Họ tên</Label><p className="font-medium">{modalReg.customerName}</p></div>
                <div><Label className="text-muted-foreground">Tool</Label><p className="font-medium">{getToolTypeName(modalReg.toolTypeId)}</p></div>
                <div><Label className="text-muted-foreground">Gói</Label><p className="font-medium">{getToolPackageLabel(modalReg.toolPackage)}</p></div>
              </div>

              <div>
                <Label className="text-sm font-medium">Lịch thi</Label>
                <div className="mt-1 space-y-2 text-sm">
                  {modalReg.dates.map((d, di) => (
                    <div key={di} className="border rounded p-2">
                      <p className="font-medium">{d.date}</p>
                      {d.subjects.map((s, si) => (
                        <p key={si} className="text-muted-foreground ml-2">
                          • {s.subjectId}: {s.examTypes.map(et => `${et.type} ${et.time}`).join(', ')}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

               <div className="border-t pt-3 text-sm space-y-1">
                <Label className="text-muted-foreground font-semibold">Breakdown giá</Label>
                <div className="flex justify-between"><span>Tiền Tool đăng ký:</span><span>{formatVND(modalReg.priceSnapshot?.toolPrice ?? 0)}</span></div>
                
                {(() => {
                  const stats = getToolRegStats(modalReg._id);
                  const remainingDebt = Math.max(modalReg.totalPrice - (modalReg.amountReceived ?? 0), 0);
                  return (
                    <>
                      <div className="bg-muted/40 rounded p-2.5 mt-2 space-y-1">
                        <Label className="text-xs font-semibold text-primary uppercase tracking-wider">Chỉ số hỗ trợ thi</Label>
                        <div className="flex justify-between text-xs"><span>Số môn đăng ký:</span><span>{stats.numSubjects} môn</span></div>
                        <div className="flex justify-between text-xs"><span>Thành công PE:</span><span className="font-medium text-blue-600">{stats.peSuccessCount} lượt</span></div>
                        <div className="flex justify-between text-xs"><span>Thành công FE:</span><span className="font-medium text-purple-600">{stats.feSuccessCount} lượt</span></div>
                        <div className="flex justify-between text-xs font-semibold border-t pt-1 mt-1 text-emerald-600">
                          <span>Tổng tiền support (không tính hủy/thất bại):</span>
                          <span>{formatVND(stats.totalAllSupportPrice)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                        <span>Tổng phí dịch vụ:</span>
                        <span className="text-emerald-700">{formatVND(modalReg.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-sm text-blue-600">
                        <span>Tiền đã nhận:</span>
                        <span>{formatVND(modalReg.amountReceived ?? 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-rose-600">
                        <span>Còn nợ:</span>
                        <span>{formatVND(remainingDebt)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Keycode</Label>
                <Input
                  value={editKeyCode}
                  onChange={e => setEditKeyCode(e.target.value)}
                  placeholder="Nhập keycode"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tiền đã nhận (kđ)</Label>
                <Input
                  type="number"
                  value={editAmountReceived}
                  onChange={e => setEditAmountReceived(e.target.value)}
                  placeholder="Nhập tiền đã nhận (ví dụ: 2000 tương đương 2.000.000đ)"
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Trạng thái</Label>
                <Select value={editStatus} onValueChange={v => setEditStatus(v as ToolProcessStatus)}>
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
                <Textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={2} />
              </div>
            </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setModalReg(null)}>Hủy</Button>
               <Button onClick={handleSave} disabled={updateMutation.isPending}>
                 {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
               </Button>
             </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
