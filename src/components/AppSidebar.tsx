import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  KeyRound,
  Upload,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  LogOut,
  Lock,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import ChangePasswordDialog from './ChangePasswordDialog';

const navItems = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Registrations', path: '/registrations', icon: ClipboardList },
  { title: 'Exam Sessions', path: '/sessions', icon: Calendar },
  { title: 'Subjects', path: '/subjects', icon: BookOpen },
  { title: 'Keys', path: '/keys', icon: KeyRound },
  { title: 'Import Data', path: '/import', icon: Upload },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <aside
        className={cn(
          'h-screen sticky top-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
            <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-semibold text-sidebar-accent-foreground truncate">
                Exam Support
              </h1>
              <p className="text-xs text-sidebar-foreground truncate">Management System</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border py-2 px-2 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground">
            <User className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{admin?.username}</span>}
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <Lock className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Change Password</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
        >
          <ChevronLeft
            className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </aside>

      <ChangePasswordDialog open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </>
  );
}
