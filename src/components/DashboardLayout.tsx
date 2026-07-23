import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppSidebar } from './AppSidebar';
import { SidebarContent } from './SidebarContent';
import { Menu, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 h-14 md:hidden">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GraduationCap className="w-5 h-5 text-primary shrink-0" />
              <span className="font-semibold text-sm truncate">Hỗ trợ thi</span>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <SheetContent
        side="left"
        className="w-[280px] sm:w-[320px] bg-sidebar p-0 text-sidebar-foreground border-r border-sidebar-border [&>button]:hidden"
      >
        <SidebarContent onNavClick={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
