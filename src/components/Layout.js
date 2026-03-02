import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors, Avatar, Badge } from './UIComponents';
import { 
  Home, Users, Activity, CheckCircle, LogOut, 
  Award, FileText, Calendar, Shield, Menu, X,
  Bell, Settings, ChevronDown, Briefcase, BookOpen, Building2
} from 'lucide-react';

const Layout = ({ children }) => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Navigation items based on role
  const getNavItems = () => {
    const role = userData?.role;
    
    switch (role) {
      case 'dean':
        return [
          { path: '/dean', icon: Home, label: 'Dashboard' },
          { path: '/dean/counsellors', icon: Users, label: 'Counsellors' },
          { path: '/dean/hods', icon: Building2, label: 'HODs' },
          { path: '/dean/students', icon: BookOpen, label: 'Students' },
          { path: '/dean/clubs', icon: Briefcase, label: 'Clubs' },
          { path: '/dean/activities', icon: Activity, label: 'Events' },
          { path: '/dean/verify-activities', icon: CheckCircle, label: 'Verify Events' },
          { path: '/dean/verify-points', icon: Award, label: 'Verify Points' },
        ];
    case 'hod':
  return [
    { path: '/hod', icon: Home, label: 'Dashboard' },
    { path: '/hod/students', icon: Users, label: 'My Students' },
    { path: '/hod/propose-activity', icon: FileText, label: 'Create Event' },
    { path: '/hod/my-activities', icon: Activity, label: 'My Event' },
    { path: '/hod/allocate-points', icon: Award, label: 'Allocate Points' },
  ];
      case 'club':
        return [
          { path: '/club', icon: Home, label: 'Dashboard' },
          { path: '/club/propose-activity', icon: FileText, label: 'Propose Event' },
          { path: '/club/my-activities', icon: Activity, label: 'My Events' },
          { path: '/club/allocate-points', icon: Award, label: 'Allocate Points' },
        ];
      case 'counsellor':
        return [
          { path: '/counsellor', icon: Home, label: 'Dashboard' },
          { path: '/counsellor/students', icon: Users, label: 'My Students' },
          { path: '/counsellor/proposals', icon: FileText, label: 'Proposals' },
          { path: '/counsellor/activities', icon: Activity, label: 'Events' },
        ];
      case 'student':
        return [
          { path: '/student', icon: Home, label: 'Dashboard' },
          { path: '/student/activities', icon: Activity, label: 'Events' },
          { path: '/student/points', icon: Award, label: 'My Points' },
          { path: '/student/reports', icon: FileText, label: 'Reports' },
        ];
      default:
        return [{ path: '/', icon: Home, label: 'Dashboard' }];
    }
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    switch (userData?.role) {
      case 'dean': return 'Dean';
      case 'hod': return 'Head of Department';
      case 'club': return 'Club Admin';
      case 'hod': return 'HOD';
      case 'counsellor': return 'Student Counsellor';
      case 'student': return 'Student';
      default: return 'User';
    }
  };

  const getRoleBadgeVariant = () => {
    switch (userData?.role) {
      case 'dean': return 'primary';
      case 'hod': return 'warning';
      case 'club': return 'warning';
      case 'counsellor': return 'success';
      case 'student': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: colors.darker,
    }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '280px' : '80px',
        background: colors.dark,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
        }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
  width: '80px',
  height: '80px',
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: colors.card,
}}>
  <img 
    src="/images/rvce.jpg"
    alt="Logo"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    }}
  />
</div>

              <div>
                <h1 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: colors.text,
                  letterSpacing: '-0.5px',
                }}>
                  Events Points
                </h1>
                <p style={{
                  fontSize: '11px',
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  Management System
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{
          padding: '16px 12px',
          flex: 1,
          overflowY: 'auto',
        }}>
          {sidebarOpen && (
            <p style={{
              fontSize: '11px',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              padding: '8px 12px',
              marginBottom: '8px',
            }}>
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarOpen ? '14px 16px' : '14px',
                  marginBottom: '4px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? colors.gradient : 'transparent',
                  color: isActive ? '#fff' : colors.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none',
                }}
              >
                <item.icon size={20} />
                {sidebarOpen && (
                  <span style={{ 
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '14px',
                  }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div style={{
          padding: '16px',
          borderTop: `1px solid ${colors.border}`,
        }}>
          {sidebarOpen ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: colors.card,
              borderRadius: '12px',
            }}>
              <Avatar name={userData?.name || 'User'} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {userData?.name || 'User'}
                </p>
                <Badge variant={getRoleBadgeVariant()} size="small">
                  {getRoleLabel()}
                </Badge>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: colors.danger,
                  display: 'flex',
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                cursor: 'pointer',
                color: colors.danger,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '280px' : '80px',
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Top Header */}
        <header style={{
          background: colors.dark,
          borderBottom: `1px solid ${colors.border}`,
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: colors.text,
            }}>
              Welcome back, {userData?.name?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p style={{
              fontSize: '14px',
              color: colors.textSecondary,
              marginTop: '4px',
            }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '8px 16px 8px 8px',
                  cursor: 'pointer',
                }}
              >
                <Avatar name={userData?.name || 'User'} size={36} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.text,
                  }}>
                    {userData?.name || 'User'}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                  }}>
                    {userData?.email || ''}
                  </p>
                </div>
                <ChevronDown size={16} color={colors.textMuted} />
              </button>
              
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '8px',
                  minWidth: '200px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  zIndex: 1000,
                }}>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: 'none',
                      background: 'transparent',
                      color: colors.danger,
                      cursor: 'pointer',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{
          padding: '32px',
          minHeight: 'calc(100vh - 80px)',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;