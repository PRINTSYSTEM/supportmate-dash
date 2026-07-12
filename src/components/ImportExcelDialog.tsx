import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, Loader2, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ColumnDef {
  key: string;
  label: string;
  required?: boolean;
}

interface ImportResult {
  total: number;
  inserted: number;
  updated?: number;
  skipped: number;
  errors: { index: number; message: string }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: ColumnDef[];
  templateUrl: string;
  apiEndpoint: string;
  onSuccess: () => void;
}

export function ImportExcelDialog({ open, onClose, title, columns, templateUrl, apiEndpoint, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const header = columns.map(c => c.label);
    const sampleRow = columns.map(c => {
      if (c.key === 'type') return 'PE';
      if (c.key === 'subjectId') return 'CS101';
      if (c.key === 'term') return 'SUMMER2026';
      if (c.key === 'campus') return 'HCM';
      if (c.key === 'studentCount') return 30;
      if (c.key === 'name') return 'Example Subject';
      return `Sample ${c.label}`;
    });
    const ws = XLSX.utils.aoa_to_sheet([header, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, templateUrl);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[];

        const mapped = json.map((row: any) => {
          const item: any = {};
          for (const col of columns) {
            const colLabel = col.label.toLowerCase().replace(/\s+/g, '');
            const foundKey = Object.keys(row).find(k => k.toLowerCase().replace(/\s+/g, '') === colLabel);
            item[col.key] = foundKey ? row[foundKey] : '';
          }
          return item;
        });

        setPreview(mapped);
      } catch {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setImporting(true);
    try {
      const res = await api.post(apiEndpoint, { items: preview });
      setResult(res.data);
      toast.success(`Imported ${res.data.inserted} records`);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />Download Template
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />Select Excel File
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>

          {file && <p className="text-sm text-muted-foreground flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" />{file.name}</p>}

          {preview && preview.length > 0 && (
            <div className="overflow-x-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>#</TableHead>
                    {columns.map(c => <TableHead key={c.key}>{c.label}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      {columns.map(c => <TableCell key={c.key} className="text-sm">{String(row[c.key] ?? '')}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {preview.length > 50 && <p className="text-xs text-muted-foreground p-2">...and {preview.length - 50} more rows</p>}
            </div>
          )}

          {result && (
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> Inserted: {result.inserted}</p>
              {result.updated !== undefined && <p><CheckCircle2 className="w-4 h-4 text-green-600 inline" /> Updated: {result.updated}</p>}
              <p className="flex items-center gap-1"><AlertCircle className="w-4 h-4 text-yellow-600" /> Skipped: {result.skipped}</p>
              {result.errors.length > 0 && (
                <div className="text-destructive">
                  <p>Errors ({result.errors.length}):</p>
                  <ul className="list-disc pl-4 text-xs">
                    {result.errors.map((e, i) => <li key={i}>Row {e.index + 1}: {e.message}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleImport} disabled={!preview || preview.length === 0 || importing}>
            {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
