import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { registrations, examSessions } from '@/data/sampleData';
import { ClipboardList, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const summaryCards = [
  { title: 'Total Registrations', value: registrations.length, icon: ClipboardList, color: 'text-primary' },
  { title: 'Sessions Today', value: 2, icon: Calendar, color: 'text-accent' },
  { title: 'Pending Supports', value: registrations.filter(r => r.processStatus === 'pending').length, icon: Clock, color: 'text-[hsl(25,95%,53%)]' },
  { title: 'Completed', value: registrations.filter(r => r.processStatus === 'done').length, icon: CheckCircle2, color: 'text-[hsl(142,71%,45%)]' },
];

const chartData = examSessions.map(s => ({
  name: `${s.date.slice(5)} ${s.startTime}`,
  students: s.studentCount,
  subject: s.subjectId,
}));

export default function DashboardPage() {
  const [term, setTerm] = useState('Spring26');
  const [examType, setExamType] = useState('all');

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
              <SelectTrigger className="w-36 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Spring26">Spring 26</SelectItem>
                <SelectItem value="Summer26">Summer 26</SelectItem>
                <SelectItem value="Fall26">Fall 26</SelectItem>
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
      </div>
    </DashboardLayout>
  );
}
