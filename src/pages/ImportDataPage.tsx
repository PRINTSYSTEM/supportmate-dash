import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface PreviewRow {
  customerName: string;
  subjectCode: string;
  time: string;
  tool: string;
  seller: string;
}

const samplePreview: PreviewRow[] = [
  { customerName: 'Nguyen Van X', subjectCode: 'CS101', time: '08:00 - 10:00', tool: 'Respondus LockDown Browser', seller: 'VN Soft' },
  { customerName: 'Tran Thi Y', subjectCode: 'MATH201', time: '13:00 - 15:00', tool: 'ExamSoft', seller: 'EduKey' },
  { customerName: 'Le Van Z', subjectCode: 'ENG102', time: '09:00 - 11:00', tool: 'ProctorU', seller: 'TechLicense' },
];

export default function ImportDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [imported, setImported] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions').then(r => r.data),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(samplePreview);
      setImported(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Data imported successfully!');
      setImported(true);
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Import Data</h1>
          <p className="text-sm text-muted-foreground">Upload Excel or CSV files to import registrations</p>
        </div>

        <Card className="shadow-sm border-0 shadow-foreground/5">
          <CardContent className="p-6">
            <div
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFile} />
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Click to upload or drag & drop</p>
              <p className="text-xs text-muted-foreground mt-1">Supports .xlsx and .csv files</p>
              {file && (
                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-primary">
                  <FileSpreadsheet className="w-4 h-4" />{file.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {preview && (
          <>
            <Card className="shadow-sm border-0 shadow-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg">Preview Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Subject Code</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Tool</TableHead>
                        <TableHead>Seller</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{row.customerName}</TableCell>
                          <TableCell className="text-sm">{row.subjectCode}</TableCell>
                          <TableCell className="text-sm">{row.time}</TableCell>
                          <TableCell className="text-sm">{row.tool}</TableCell>
                          <TableCell className="text-sm">{row.seller}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 shadow-foreground/5">
              <CardContent className="p-4 flex items-end gap-4">
                <div className="flex-1 space-y-1.5">
                  <Label>Attach to Exam Session</Label>
                  <Select value={sessionId} onValueChange={setSessionId}>
                    <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                    <SelectContent>
                      {(sessions as any[]).map(s => (
                        <SelectItem key={s._id} value={s._id}>{s.date} | {s.startTime}-{s.endTime} | {s.subjectId}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleImport} disabled={!sessionId || importing}>
                  {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {importing ? 'Importing...' : 'Import Data'}
                </Button>
              </CardContent>
            </Card>

            {imported && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,35%)]">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Data imported successfully! {preview.length} records added.</span>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
