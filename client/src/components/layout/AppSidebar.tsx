import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  ClipboardCheck,
  BarChart3,
  GraduationCap,
  MessageSquare,
  Building2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const getNavItems = (role: string) => {
  const items = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['faculty', 'hod', 'committee', 'admin'] },
    {
      icon: FileText,
      label: 'FPMS Form',
      roles: ['faculty'],
      isDropdown: true,
      dropdownId: 'FPMS Form',
      children: [
        { title: 'Teaching & Learning', href: '/fpms/teaching' },
        { title: 'Research & Consultancy', href: '/fpms/research' },
        { title: 'Professional Development', href: '/fpms/professional' },
        { title: 'Student Development', href: '/fpms/student' },
        { title: 'Institutional Development', href: '/fpms/institutional' },
      ],
    },
    {
      icon: FileText,
      label: 'FPMS Form',
      roles: ['hod'],
      isDropdown: true,
      dropdownId: 'HOD FPMS Form', 
      children: [
        { title: 'Teaching & Learning', href: '/fpms/hod-teaching' },
      ],
    },
    {
      icon: Building2,
      label: 'FPMS-KPA Form',
      roles: ['hod'],
      isDropdown: true,
      dropdownId: 'FPMS-KPA Form', 
      children: [
        { title: 'Academic Leadership & Curriculum Governance', href: '/fpms/hodb-teaching' },
      ],
    },
    { icon: MessageSquare, label: 'My Submissions', href: '/submissions', roles: ['faculty', 'hod'] },
    { icon: ClipboardCheck, label: 'Appeals', href: '/appeals', roles: ['faculty'] },
    { icon: ClipboardCheck, label: 'Review Hod Submissions', href: '/hod-review', roles: ['admin'] },
    { icon: ClipboardCheck, label: 'Review Submissions', href: '/review', roles: ['hod', 'committee'] },
    { icon: BarChart3, label: 'Reports', href: '/reports', roles: ['committee'] },
    { icon: Users, label: 'Faculty List', href: '/faculty', roles: ['hod'] },
    { icon: Building2, label: 'Departments', href: '/departments', roles: ['admin'] },
    { icon: MessageSquare, label: 'College', href: '/college', roles: ['committee'] },
    { icon: ClipboardCheck, label: 'Add Administrator', href: '/add', roles: ['committee'] },
    { icon: Settings, label: 'Settings', href: '/settings', roles: ['committee'] },
  ];

  return items.filter((item) => item.roles.includes(role));
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  useEffect(() => {
    const isInFpmsSection = location.pathname.startsWith('/fpms/');
    if (isInFpmsSection) {
     
      if (user?.role === 'faculty' && expandedDropdown !== 'FPMS Form') {
        setExpandedDropdown('FPMS Form');
      } else if (user?.role === 'hod') {
        if (location.pathname.startsWith('/fpms/hod-')) {
          setExpandedDropdown('HOD FPMS Form');
        } else if (location.pathname.startsWith('/fpms/hodb-')) {
          setExpandedDropdown('FPMS-KPA Form');
        }
      }
    } else {
      setExpandedDropdown(null);
    }
  }, [location.pathname, user?.role]);

  if (!user) return null;

  const navItems = getNavItems(user.role);

  const toggleDropdown = (dropdownId: string) => {
    setExpandedDropdown((current) => (current === dropdownId ? null : dropdownId));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayName = user.name || user.email;
  const avatarInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">FPMS</h1>
            <p className="text-xs text-sidebar-foreground/60">Performance System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            
            const dropdownId = item.dropdownId || item.label;

            if (item.isDropdown) {
              const isOpen = expandedDropdown === dropdownId;

              const isAnyChildActive =
                item.children?.some((child) => location.pathname.startsWith(child.href)) ?? false;

              return (
                <div key={dropdownId} className="space-y-1">
                  <button
                    onClick={() => toggleDropdown(dropdownId)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isAnyChildActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {isOpen && item.children && (
                    <div className="ml-8 space-y-1">
                      {item.children.map((child) => {
                        const isActive = location.pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              isActive
                                ? 'bg-sidebar-primary/50 text-sidebar-primary-foreground'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                            )}
                          >
                            <span>{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-medium">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}