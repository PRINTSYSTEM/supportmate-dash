import { useState, useMemo } from 'react';
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
import { Search, Pencil, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  const [editKeyCode, setEditKeyCode] = useState('');
  const [editStatus, setEditStatus] = useState<ToolProcessStatus>('pending');
  const [editNote, setEditNote] = useState('');

  const { data: toolTypes = [] } = useQuery({
    queryKey: ['tool-types-admin'],
    queryFn: () => api.get('/tool-types/admin').then(r => r.data),
  });

  const { data: regsData, isLoading } = useQuery({
    queryKey: ['tool-registrations'],
    queryFn: () => api.get('/tool-registrations').then(r => r.data),
  });

  const regs: ToolRegistration[] = regsData?.items ?? [];

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

  const getToolTypeName = (id: string) => {
    const tt = toolTypes.find((t: any) => t._id === id);
    return tt?.name || '—';
  };

  const openModal = (r: ToolRegistration) => {
    setModalReg(r);
    setEditKeyCode(r.keyCode || '');
    setEditStatus(r.processStatus);
    setEditNote(r.note);
  };

  const handleSave = () => {
    if (!modalReg) return;
    updateMutation.mutate({
      id: modalReg._id,
      data: {
        keyCode: editKeyCode || null,
        processStatus: editStatus,
        note: editNote,
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Tool Registrations</h1>
          <p className="text-sm text-muted-foreground">Quản lý đăng ký tool hỗ trợ thi</p>
        </div>

        <Card className="shadow-sm border-0 shadow-foreground/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by MSSV or Name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPackage} onValueChange={setFilterPackage}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Package" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  <SelectItem value="day">Ngày</SelectItem>
                  <SelectItem value="term">Kỳ</SelectItem>
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
                      <TableHead>MSSV</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Gói</TableHead>
                      <TableHead>Keycode</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(r => (
                      <TableRow key={r._id} className="hover:bg-muted/30">
                        <TableCell className="text-sm whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className="font-medium text-sm">{r.studentId}</TableCell>
                        <TableCell className="text-sm">{r.customerName}</TableCell>
                        <TableCell className="text-sm">{getToolTypeName(r.toolTypeId)}</TableCell>
                        <TableCell className="text-sm">{getToolPackageLabel(r.toolPackage)}</TableCell>
                        <TableCell className="text-sm font-mono">{r.keyCode || '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{formatVND(r.totalPrice)}</TableCell>
                        <TableCell><StatusBadge status={r.processStatus as any} /></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(r)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
        <Dialog open onOpenChange={() => setModalReg(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Chi tiết — {modalReg.customerName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
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

              <div className="border-t pt-3 text-sm">
                <Label className="text-muted-foreground">Breakdown giá</Label>
                <p>Tool: {formatVND(modalReg.priceSnapshot.toolPrice)}</p>
                {modalReg.priceSnapshot.feSlotCount > 0 && <p>FE slots x{modalReg.priceSnapshot.feSlotCount}: {formatVND(modalReg.priceSnapshot.feSlotCount * modalReg.priceSnapshot.feSlotPrice)}</p>}
                {modalReg.priceSnapshot.peSlotCount > 0 && <p>PE slots x{modalReg.priceSnapshot.peSlotCount}: {formatVND(modalReg.priceSnapshot.peSlotCount * modalReg.priceSnapshot.peSlotPrice)}</p>}
                {modalReg.priceSnapshot.discountEnabled && <p>Discount: -{formatVND(modalReg.priceSnapshot.discountAmount)}</p>}
                <p className="font-bold">Total: {formatVND(modalReg.totalPrice)}</p>
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
                <Label className="text-sm font-medium">Trạng thái</Label>
                <Select value={editStatus} onValueChange={v => setEditStatus(v as ToolProcessStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Ghi chú</Label>
                <Textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalReg(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
