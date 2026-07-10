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

interface Term {
  _id: string;
  termId: string;
  name: string;
}

export default function TermsPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editTerm, setEditTerm] = useState<Term | null>(null);
  const [termId, setTermId] = useState('');
  const [name, setName] = useState('');

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/terms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Term added');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add term'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/terms/${data._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Term updated');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update term'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/terms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Term deleted');
    },
    onError: () => toast.error('Failed to delete term'),
  });

  const openNew = () => {
    setEditTerm(null);
    setTermId('');
    setName('');
    setShowDialog(true);
  };

  const openEdit = (t: Term) => {
    setEditTerm(t);
    setTermId(t.termId);
    setName(t.name);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditTerm(null);
    setTermId('');
    setName('');
  };

  const handleSave = () => {
    if (!termId.trim() || !name.trim()) {
      toast.error('Term ID and name are required');
      return;
    }
    if (editTerm) {
      updateMutation.mutate({ _id: editTerm._id, termId: termId.trim(), name: name.trim() });
    } else {
      createMutation.mutate({ termId: termId.trim(), name: name.trim() });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Terms</h1>
            <p className="text-sm text-muted-foreground">Manage academic terms / semesters</p>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Term</Button>
        </div>
        <Card className="shadow-sm border-0 shadow-foreground/5 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Term ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(terms as Term[]).map(t => (
                    <TableRow key={t._id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{t.termId}</TableCell>
                      <TableCell className="text-sm">{t.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(t._id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editTerm ? 'Edit' : 'Add'} Term</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Term ID</Label>
              <Input value={termId} onChange={e => setTermId(e.target.value)} placeholder="e.g. Spring27" />
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring 2027" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
