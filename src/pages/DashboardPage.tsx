import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardList, Calendar, Clock, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

interface Stats {
  totalRegistrations: number;
  sessionsToday: number;
  pending: number;
  completed: number;
  totalRevenue: number;
  feRegistrations: number;
  peRegistrations: number;
  chartData: { subject: string; students: number }[];
}

export default function DashboardPage() {
  const [term, setTerm] = useState('');
  const [examType, setExamType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMetricDate, setSelectedMetricDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['dashboard-stats', dateFrom, dateTo],
    queryFn: () => api.get('/dashboard/stats', { params: { dateFrom, dateTo } }).then(r => r.data),
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data),
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

  const summaryCards = [
    { title: 'Tổng đăng ký', value: stats?.totalRegistrations ?? 0, icon: ClipboardList, color: 'text-primary' },
    { title: 'Ca thi hôm nay', value: stats?.sessionsToday ?? 0, icon: Calendar, color: 'text-accent' },
    { title: 'Chờ xử lý', value: stats?.pending ?? 0, icon: Clock, color: 'text-[hsl(25,95%,53%)]' },
    { title: 'Hoàn thành', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'text-[hsl(142,71%,45%)]' },
    { title: 'Doanh thu', value: stats?.totalRevenue ? formatVND(stats.totalRevenue) : '0 ₫', icon: DollarSign, color: 'text-[hsl(142,71%,45%)]' },
    { title: 'FE / PE', value: `${stats?.feRegistrations ?? 0} / ${stats?.peRegistrations ?? 0}`, icon: ClipboardList, color: 'text-primary' },
  ];

  const dateStats = useMemo(() => {
    const sessionsOnDate = sessionsData.filter((s: any) => s.date === selectedMetricDate);
    const sessionIdsOnDate = new Set(sessionsOnDate.map((s: any) => s._id));
    const regsOnDate = allRegs.filter((r: any) => sessionIdsOnDate.has(r.examSessionId));
    
    const numStudents = new Set(regsOnDate.map((r: any) => r.studentId)).size;
    const numSubjects = new Set(regsOnDate.map((r: any) => r.subjectId)).size;
    
    const timeSlotMap: Record<string, number> = {};
    regsOnDate.forEach((r: any) => {
      const s = sessionsOnDate.find((s: any) => s._id === r.examSessionId);
      if (s && s.startTime) {
        timeSlotMap[s.startTime] = (timeSlotMap[s.startTime] || 0) + 1;
      }
    });
    
    const timeSlots = Object.entries(timeSlotMap)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => a.time.localeCompare(b.time));
      
    return { numStudents, numSubjects, timeSlots };
  }, [sessionsData, allRegs, selectedMetricDate]);

  const chartData = (stats?.chartData ?? []).map(d => ({
    name: d.subject,
    students: d.students,
    subject: d.subject,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Tổng quan hoạt động hỗ trợ thi</p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="w-36 bg-card"><SelectValue placeholder="Tất cả học kỳ" /></SelectTrigger>
              <SelectContent>
                {(terms as any[]).map(t => (
                  <SelectItem key={t._id} value={t.termId}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="w-28 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại thi</SelectItem>
                <SelectItem value="PE">PE</SelectItem>
                <SelectItem value="FE">FE</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" placeholder="Từ ngày" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" placeholder="Đến ngày" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaryCards.map((card) => (
                <Card key={card.title} className="shadow-sm border-0 shadow-foreground/5">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <p className="text-3xl font-bold mt-1">{card.value}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-muted ${card.color}`}>
                        <card.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-sm border-0 shadow-foreground/5 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Số lượng sinh viên theo môn học</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '0.75rem',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                          formatter={(value: number, _name: string, props: any) => [
                            `${value} sinh viên`,
                            props.payload.subject,
                          ]}
                        />
                        <Bar dataKey="students" fill="hsl(210 100% 45%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 shadow-foreground/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg font-bold">Thống kê theo ngày</CardTitle>
                  <Input
                    type="date"
                    value={selectedMetricDate}
                    onChange={e => setSelectedMetricDate(e.target.value)}
                    className="w-36 h-8 text-xs bg-card"
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Sinh viên hỗ trợ</p>
                      <p className="text-2xl font-extrabold text-blue-900 mt-0.5">{dateStats.numStudents}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">Số môn thi</p>
                      <p className="text-2xl font-extrabold text-purple-900 mt-0.5">{dateStats.numSubjects}</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phân bổ ca thi</Label>
                    {dateStats.timeSlots.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-10 border border-dashed rounded-lg bg-muted/10">
                        Không có ca hỗ trợ nào
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {dateStats.timeSlots.map(({ time, count }) => (
                          <div key={time} className="bg-muted/40 border rounded-lg p-2.5 flex flex-col items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                            <span className="text-xs font-bold text-foreground">{time}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{count} ca</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
