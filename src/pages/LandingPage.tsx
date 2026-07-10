import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, UserPlus, LogIn } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-secondary/40 to-background">
      <Card className="w-full max-w-md border-0 shadow-xl shadow-foreground/5">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exam Support</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hệ thống đăng ký hỗ trợ thi cử
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Button asChild className="w-full h-12 text-base gap-2">
              <Link to="/register">
                <UserPlus className="w-5 h-5" />
                Khách đăng ký
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 text-base gap-2">
              <Link to="/login">
                <LogIn className="w-5 h-5" />
                Đăng nhập
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
