import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  colors, Button, Input, Card, Toast 
} from '../components/UIComponents';
import { Mail, Lock, Shield, Users, BookOpen, Briefcase, Building2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { setUserData, logout } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setToast({ message: 'Please enter email and password', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // ✅ CRITICAL:   Clear all storage before login to prevent cache issues
      localStorage.clear();
      sessionStorage.clear();
      console.log("[Login] Cleared all storage before login");

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email. trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setToast({ message:   'Invalid email or password', type: 'error' });
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData. password !== password) {
        setToast({ message: 'Invalid email or password', type: 'error' });
        setLoading(false);
        return;
      }

      if (userData.isActive === false) {
        setToast({ message: 'Your account has been deactivated.  Please contact administrator.', type: 'error' });
        setLoading(false);
        return;
      }

      // ✅ Add the UID from Firestore document
      const userDataWithUid = {
        ...userData,
        uid: userDoc.id,
      };

      console.log("[Login] Login successful for:", userDataWithUid.email);
      console.log("[Login] User role:", userDataWithUid.role);
      
      // ✅ Save to auth context (which saves to localStorage)
      setUserData(userDataWithUid);
      
      setToast({ message: 'Login successful!  ', type: 'success' });
      
      // ✅ Small delay to ensure state updates
      setTimeout(() => {
        console.log("[Login] Redirecting to:", `/${userDataWithUid.role}`);
        navigate(`/${userDataWithUid.role}`, { replace: true });
      }, 500);

    } catch (error) {
      console.error('Login error:', error);
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' });
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.darker} 0%, ${colors.dark} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Responsive Logo Banner - Centered and Responsive */}
      <div style={{
        width: '100%',
        maxWidth: '90vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '40px',
        zIndex: 10,
      }}>
        <img 
          src="/images/mainpage.jpg" 
          alt="Activity Points Logo"
          style={{
            height: 'auto',
            width: '100%',
            maxWidth: '400px',
            minWidth: '200px',
            objectFit: 'contain',
            filter: 'drop-shadow(0px 6px 14px rgba(0,0,0,0.2))',
          }}
        />
      </div>

      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-200px',
        right: '-200px',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-200px',
        left: '-200px',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%)',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '1100px',
        display: 'grid',
        gridTemplateColumns:  'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '60px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
        padding: '0 20px',
      }}>
        {/* Left side - Branding */}
        <div style={{
          animation: 'fadeIn 0.6s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}>
            
            <div>
              <h1 style={{
                fontSize: 'clamp(24px, 5vw, 32px)',
                fontWeight: '800',
                color: colors.text,
                letterSpacing: '-1px',
              }}>
                Activity Points
              </h1>
              <p style={{
                fontSize: 'clamp(12px, 2vw, 14px)',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}>
                Management System
              </p>
            </div>
          </div>

          <h2 style={{
            fontSize: 'clamp(32px, 8vw, 48px)',
            fontWeight: '800',
            color: colors.text,
            lineHeight: '1.2',
            marginBottom: '24px',
          }}>
            Manage Student
            <br />
            <span style={{
              background: colors.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Activities & Points
            </span>
          </h2>

          <p style={{
            fontSize: 'clamp(16px, 3vw, 18px)',
            color: colors. textSecondary,
            lineHeight: '1.6',
            marginBottom: '48px',
          }}>
            A comprehensive platform for deans, clubs, counsellors, and students 
            to manage and track campus activities, proposals, and achievement points.
          </p>

          {/* Role cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}>
            {[
              { icon: Shield, label: 'Dean', desc: 'Manage & Verify', color: colors.primary },
              { icon: Building2, label: 'HOD', desc: 'Dept. Activities', color: '#f59e0b' },
              { icon:  Briefcase, label: 'Club', desc: 'Propose Events', color: colors.warning },
              { icon: Users, label: 'Counsellor', desc: 'Guide Students', color: colors.secondary },
              { icon: BookOpen, label: 'Student', desc: 'Track Progress', color: '#ec4899' },
            ]. map((role, idx) => (
              <div key={idx} style={{
                background: colors.card,
                borderRadius: '16px',
                padding: '20px',
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                animation: `fadeIn 0.6s ease ${0.1 * idx}s both`,
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${role.color}20`,
                  display: 'flex',
                  alignItems:  'center',
                  justifyContent: 'center',
                  color: role.color,
                }}>
                  <role.icon size={24} />
                </div>
                <div>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: colors. text,
                  }}>
                    {role. label}
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: colors.textMuted,
                  }}>
                    {role. desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Login Form */}
        <div style={{
          animation: 'fadeIn 0.6s ease 0.2s both',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Card style={{
            background: colors.dark,
            border: `1px solid ${colors.border}`,
            borderRadius: '24px',
            padding: '48px',
            width: '100%',
            maxWidth: '400px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{
                fontSize: 'clamp(24px, 5vw, 28px)',
                fontWeight: '700',
                color: colors.text,
                marginBottom: '8px',
              }}>
                Welcome Back
              </h3>
              <p style={{
                fontSize: 'clamp(13px, 2vw, 15px)',
                color: colors. textSecondary,
              }}>
                Sign in to continue to your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                icon={Mail}
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                icon={Lock}
                required
              />

              <Button
                type="submit"
                fullWidth
                size="large"
                loading={loading}
                style={{ marginTop: '24px' }}
              >
                Sign In
              </Button>
            </form>

            <p style={{
              marginTop: '24px',
              textAlign:  'center',
              fontSize:  '14px',
              color:  colors.textMuted,
            }}>
              Contact your administrator if you don't have an account
            </p>
          </Card>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          div[style*="gridTemplateColumns:  'repeat(auto-fit"] {
            grid-template-columns: 1fr ! important;
            gap: 40px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;