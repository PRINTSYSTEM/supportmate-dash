import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Tool {
  _id: string;
  name: string;
  version: string;
}

export default function ToolsPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.get('/tools').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tools', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Đã thêm Tool');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể thêm Tool'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/tools/${data._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Đã cập nhật Tool');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể cập nhật Tool'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Đã xóa Tool');
    },
    onError: () => toast.error('Không thể xóa Tool'),
  });

  const openNew = () => {
    setEditTool(null);
    setName('');
    setVersion('');
    setShowDialog(true);
  };

  const openEdit = (t: Tool) => {
    setEditTool(t);
    setName(t.name);
    setVersion(t.version);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditTool(null);
    setName('');
    setVersion('');
  };

  const handleSave = () => {
    if (!name.trim() || !version.trim()) {
      toast.error('Vui lòng nhập tên và phiên bản');
      return;
    }
    if (editTool) {
      updateMutation.mutate({ _id: editTool._id, name: name.trim(), version: version.trim() });
    } else {
      createMutation.mutate({ name: name.trim(), version: version.trim() });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Tool</h1>
            <p className="text-sm text-muted-foreground">Quản lý danh sách các tool hỗ trợ thi</p>
          </div>
          <Button onClick={openNew} className="gap-1 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Thêm Tool
          </Button>
        </div>

        <Card className="shadow-sm border-0 shadow-foreground/5">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tên Tool</TableHead>
                    <TableHead>Phiên bản</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                        Không có tool nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    tools.map((t: Tool) => (
                      <TableRow key={t._id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.version}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm('Bạn có chắc chắn muốn xóa tool này?')) {
                                  deleteMutation.mutate(t._id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {showDialog && (
        <Dialog open onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editTool ? 'Cập nhật Tool' : 'Thêm Tool mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Tên Tool</Label>
                <Input
                  id="name"
                  placeholder="Nhập tên tool (ví dụ: Bính Ngọ, Đinh Dậu)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="version">Phiên bản</Label>
                <Input
                  id="version"
                  placeholder="Nhập phiên bản (ví dụ: 1.0.0)"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Hủy</Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
