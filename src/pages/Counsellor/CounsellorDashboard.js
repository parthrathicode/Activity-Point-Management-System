import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, StatCard, Button, Badge, Avatar, EmptyState } from '../../components/UIComponents';
import { Users, Activity, Award, Clock, Plus, ArrowRight, TrendingUp, FileText, CheckCircle } from 'lucide-react';

const CounsellorDashboard = () => {
  const { userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPoints: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
  });
  const [students, setStudents] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userData?.uid) {
      setLoading(false);
      setError("User data not available");
      return;
    }
    fetchDashboardData();
  }, [userData, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('counsellorId', '==', userData.uid)
      );
      const studentsSnap = await getDocs(studentsQuery);
      const studentsData = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsData);

      const pendingQuery = query(
        collection(db, 'studentActivitySubmissions'),
        where('counsellorId', '==', userData.uid),
        where('status', '==', 'pending')
      );
      const pendingSnap = await getDocs(pendingQuery);
      setPendingSubmissions(pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const approvedQuery = query(
        collection(db, 'studentActivitySubmissions'),
        where('counsellorId', '==', userData.uid),
        where('status', '==', 'approved')
      );
      const approvedSnap = await getDocs(approvedQuery);

      const totalPoints = studentsData.reduce((sum, s) => sum + (s.points || 0), 0);

      setStats({
        totalStudents: studentsData.length,
        totalPoints: totalPoints,
        pendingSubmissions: pendingSnap.size,
        approvedSubmissions: approvedSnap.size,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const topStudents = [...students].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5);

  const quickActions = [
    { label: 'Add Student', icon: Plus, path: '/counsellor/students', color: colors.primary },
    { label: 'Review Submissions', icon: FileText, path: '/counsellor/proposals', color: colors.warning },
    { label: 'View Activities', icon: Activity, path: '/counsellor/activities', color: colors.secondary },
  ];

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: colors.textSecondary }}>Authenticating...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: colors.danger }}>
          <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Error Loading Dashboard</p>
          <p style={{ color: colors.textSecondary, marginBottom: '16px' }}>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="My Students" value={stats.totalStudents} icon={Users} color="primary" />
        <StatCard title="Total Points" value={stats.totalPoints} icon={Award} color="success" />
        <StatCard title="Pending Reviews" value={stats.pendingSubmissions} icon={Clock} color="warning" />
        <StatCard title="Approved" value={stats.approvedSubmissions} icon={CheckCircle} color="danger" />
      </div>

      {stats.pendingSubmissions > 0 && (
        <Card style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: colors.gradientOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={28} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Pending Student Submissions</h3>
                <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
                  You have <strong style={{ color: colors.warning }}>{stats.pendingSubmissions}</strong> activity submissions waiting for approval
                </p>
              </div>
            </div>
            <Button variant="warning" onClick={() => navigate('/counsellor/proposals')}>Review Submissions</Button>
          </div>
        </Card>
      )}

      {pendingSubmissions.length > 0 && (
        <Card title="Recent Pending Submissions" icon={Clock} style={{ marginBottom: '32px' }}>
          <div>
            {pendingSubmissions.slice(0, 5).map((submission, idx) => (
              <div key={submission.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '12px',
                background: colors.cardHover,
                marginBottom: idx < Math.min(4, pendingSubmissions.length - 1) ? '12px' : '0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Avatar name={submission.studentName} size={44} />
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{submission.title}</p>
                    <p style={{ fontSize: '13px', color: colors.textMuted }}>by {submission.studentName} • {submission.studentRollNumber}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Badge variant="primary">{submission.category}</Badge>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                    <Award size={14} color={colors.warning} />
                    <span style={{ fontWeight: '600', color: colors.warning }}>{submission.points} pts</span>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="secondary" fullWidth style={{ marginTop: '16px' }} onClick={() => navigate('/counsellor/proposals')}>View All Submissions</Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <Card title="Top Students by Points" icon={Award}>
          {topStudents.length > 0 ? (
            <div>
              {topStudents.map((student, idx) => (
                <div key={student.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '12px',
                  background: colors.cardHover,
                  marginBottom: idx < topStudents.length - 1 ? '12px' : '0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: idx === 0 ? colors.gradient : idx === 1 ? colors.gradientGreen : idx === 2 ? colors.gradientOrange : colors.card,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '14px',
                    }}>
                      {idx + 1}
                    </div>
                    <Avatar name={student.name} size={40} />
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '2px' }}>{student.name}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>{student.rollNumber || student.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={18} color={colors.warning} />
                    <span style={{ fontSize: '18px', fontWeight: '700', color: colors.warning }}>{student.points || 0}</span>
                  </div>
                </div>
              ))}
              <Button variant="secondary" fullWidth style={{ marginTop: '16px' }} onClick={() => navigate('/counsellor/students')}>View All Students</Button>
            </div>
          ) : (
            <EmptyState icon={Users} title="No students yet" description="Add students to see their rankings" action={<Button icon={Plus} onClick={() => navigate('/counsellor/students')}>Add Student</Button>} />
          )}
        </Card>

        <div>
          <Card title="Quick Actions" icon={TrendingUp} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '12px',
                    background: colors.cardHover,
                    border: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: `${action.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: action.color,
                    }}>
                      <action.icon size={20} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: colors.text }}>{action.label}</span>
                  </div>
                  <ArrowRight size={18} color={colors.textMuted} />
                </button>
              ))}
            </div>
          </Card>

          <Card style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>📊</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>Student Performance</h3>
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
                Average points per student: <strong style={{ color: colors.primary }}>{stats.totalStudents > 0 ? Math.round(stats.totalPoints / stats.totalStudents) : 0}</strong>
              </p>
            </div>
          </Card>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default CounsellorDashboard;