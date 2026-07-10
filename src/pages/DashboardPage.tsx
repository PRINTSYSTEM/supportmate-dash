import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Calendar, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface Stats {
  totalRegistrations: number;
  sessionsToday: number;
  pending: number;
  completed: number;
  chartData: { subject: string; students: number }[];
}

export default function DashboardPage() {
  const [term, setTerm] = useState('');
  const [examType, setExamType] = useState('all');

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data),
  });

  const summaryCards = [
    { title: 'Total Registrations', value: stats?.totalRegistrations ?? 0, icon: ClipboardList, color: 'text-primary' },
    { title: 'Sessions Today', value: stats?.sessionsToday ?? 0, icon: Calendar, color: 'text-accent' },
    { title: 'Pending Supports', value: stats?.pending ?? 0, icon: Clock, color: 'text-[hsl(25,95%,53%)]' },
    { title: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'text-[hsl(142,71%,45%)]' },
  ];

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
            <p className="text-sm text-muted-foreground">Overview of exam support activities</p>
          </div>
          <div className="flex gap-2">
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="w-36 bg-card"><SelectValue placeholder="All terms" /></SelectTrigger>
              <SelectContent>
                {(terms as any[]).map(t => (
                  <SelectItem key={t._id} value={t.termId}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="w-28 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PE">PE</SelectItem>
                <SelectItem value="FE">FE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <Card className="shadow-sm border-0 shadow-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg">Students per Exam Session</CardTitle>
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
                          `${value} students`,
                          props.payload.subject,
                        ]}
                      />
                      <Bar dataKey="students" fill="hsl(210 100% 45%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
