import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { keys as initialKeys, tools } from '@/data/sampleData';
import { Key, KeyType, KeyStatus } from '@/data/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Ban } from 'lucide-react';

export default function KeysPage() {
  const [keysList, setKeysList] = useState<Key[]>(initialKeys);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState<Partial<Key>>({ keyCode: '', toolId: '', type: 'by_day', status: 'available', expirationDate: '' });

  const getTool = (id: string) => tools.find(t => t.id === id)?.name ?? '—';

  const handleAdd = () => {
    setKeysList(prev => [...prev, { ...newKey, id: `k${Date.now()}` } as Key]);
    setShowAdd(false);
    setNewKey({ keyCode: '', toolId: '', type: 'by_day', status: 'available', expirationDate: '' });
  };

  const markUsed = (id: string) => {
    setKeysList(prev => prev.map(k => k.id === id ? { ...k, status: 'used' as KeyStatus } : k));
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Key Management</h1>
            <p className="text-sm text-muted-foreground">Manage license keys for exam tools</p>
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Add Key</Button>
        </div>
        <Card className="shadow-sm border-0 shadow-foreground/5 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Key Code</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keysList.map(k => (
                  <TableRow key={k.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-medium">{k.keyCode}</TableCell>
                    <TableCell className="text-sm">{getTool(k.toolId)}</TableCell>
                    <TableCell><Badge variant="outline">{k.type === 'by_day' ? 'By Day' : 'By Term'}</Badge></TableCell>
                    <TableCell>
                      <span className={`status-badge ${k.status === 'available' ? 'status-done' : 'status-cancelled'}`}>
                        {k.status === 'available' ? 'Available' : 'Used'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{k.expirationDate}</TableCell>
                    <TableCell className="text-right">
                      {k.status === 'available' && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => markUsed(k.id)}>
                          <Ban className="w-4 h-4 mr-1" />Mark Used
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {showAdd && (
        <Dialog open onOpenChange={() => setShowAdd(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add New Key</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>Key Code</Label>
                <Input value={newKey.keyCode} onChange={e => setNewKey({ ...newKey, keyCode: e.target.value })} placeholder="e.g. RLB-2026-A003" />
              </div>
              <div className="space-y-1.5">
                <Label>Tool</Label>
                <Select value={newKey.toolId} onValueChange={v => setNewKey({ ...newKey, toolId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
                  <SelectContent>
                    {tools.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={newKey.type} onValueChange={v => setNewKey({ ...newKey, type: v as KeyType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="by_day">By Day</SelectItem>
                    <SelectItem value="by_term">By Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expiration Date</Label>
                <Input type="date" value={newKey.expirationDate} onChange={e => setNewKey({ ...newKey, expirationDate: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
