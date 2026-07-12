import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ImportExcelDialog } from '@/components/ImportExcelDialog';

interface Subject {
  _id: string;
  subjectId: string;
  name: string;
}

const subjectColumns = [
  { key: 'subjectId', label: 'Subject Code', required: true },
  { key: 'name', label: 'Name', required: true },
];

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [name, setName] = useState('');

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/subjects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject added');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add subject'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/subjects/${data._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject updated');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update subject'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject deleted');
    },
    onError: () => toast.error('Failed to delete subject'),
  });

  const openNew = () => {
    setEditSubject(null);
    setSubjectId('');
    setName('');
    setShowDialog(true);
  };

  const openEdit = (s: Subject) => {
    setEditSubject(s);
    setSubjectId(s.subjectId);
    setName(s.name);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditSubject(null);
    setSubjectId('');
    setName('');
  };

  const handleSave = () => {
    if (!subjectId.trim() || !name.trim()) {
      toast.error('Subject code and name are required');
      return;
    }
    if (editSubject) {
      updateMutation.mutate({ _id: editSubject._id, subjectId: subjectId.trim().toUpperCase(), name: name.trim() });
    } else {
      createMutation.mutate({ subjectId: subjectId.trim(), name: name.trim() });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Subjects</h1>
            <p className="text-sm text-muted-foreground">Manage exam subjects for registration</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4 mr-2" />Import Excel
            </Button>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Subject</Button>
          </div>
          </div>
        <Card className="shadow-sm border-0 shadow-foreground/5 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(subjects as Subject[]).map(s => (
                    <TableRow key={s._id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{s.subjectId}</TableCell>
                      <TableCell className="text-sm">{s.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(s._id)}>
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

      <ImportExcelDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Subjects"
        columns={subjectColumns}
        templateUrl="subjects-template.xlsx"
        apiEndpoint="/subjects/import"
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['subjects'] })}
      />

      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editSubject ? 'Edit' : 'Add'} Subject</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Subject Code</Label>
              <Input value={subjectId} onChange={e => setSubjectId(e.target.value)} placeholder="e.g. CS101" />
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Computer Science 101" />
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
