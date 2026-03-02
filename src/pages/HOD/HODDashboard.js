import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, StatCard, Button, Badge, Avatar, Table, EmptyState } from '../../components/UIComponents';
import { Users, Activity, Award, CheckCircle, Clock, TrendingUp, ArrowRight, FileText, Building2, Briefcase } from 'lucide-react';

const HODDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalActivities: 0,
    totalClubs: 0,
    totalPointsAllocated: 0,
    pendingActivities: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.uid) fetchDashboardData();
  }, [userData]);

  const fetchDashboardData = async () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }

    try {
      // Fetch ALL students under same dean
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('deanId', '==', userData.deanId)
      );
      const studentsSnap = await getDocs(studentsQuery);
      const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by points for top students
      const sortedStudents = [...studentsList].sort((a, b) => (b.points || 0) - (a.points || 0));
      setTopStudents(sortedStudents.slice(0, 5));

      // Fetch ALL activities under same dean
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('deanId', '==', userData.deanId)
      );
      const activitiesSnap = await getDocs(activitiesQuery);
      const activitiesList = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch ALL clubs under same dean
      const clubsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'club'),
        where('deanId', '==', userData.deanId)
      );
      const clubsSnap = await getDocs(clubsQuery);

      // Fetch recent activities
      const recentQuery = query(
        collection(db, 'activities'),
        where('deanId', '==', userData.deanId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentSnap = await getDocs(recentQuery);
      setRecentActivities(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Calculate total points
      const totalPoints = studentsList.reduce((sum, s) => sum + (s.points || 0), 0);

      setStats({
        totalStudents: studentsSnap.size,
        totalActivities: activitiesSnap.size,
        totalClubs: clubsSnap.size,
        totalPointsAllocated: totalPoints,
        pendingActivities: activitiesList.filter(a => a.status === 'pending').length,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const quickActions = [
    { label: 'All Students', icon: Users, path: '/hod/students', color: colors.primary },
    { label: 'Create Activity', icon: Activity, path: '/hod/create-activity', color: colors.secondary },
    { label: 'All Activities', icon: FileText, path: '/hod/activities', color: colors.warning },
    { label: 'Allocate Points', icon: Award, path: '/hod/allocate-points', color: '#ec4899' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Welcome Card */}
      <Card style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={32} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
              Welcome, {userData?.name?.split(' ')[0]}!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              {userData?.department || 'HOD'} • Full access to all students & activities
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="primary" />
        <StatCard title="Total Activities" value={stats.totalActivities} icon={Activity} color="success" />
        <StatCard title="Active Clubs" value={stats.totalClubs} icon={Briefcase} color="warning" />
        <StatCard title="Total Points" value={stats.totalPointsAllocated} icon={Award} color="danger" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Recent Activities */}
        <Card title="Recent Activities" icon={Activity}>
          {recentActivities.length > 0 ? (
            <div style={{ marginTop: '8px' }}>
              {recentActivities.map((activity, idx) => (
                <div key={activity.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '12px',
                  background: colors.cardHover,
                  marginBottom: idx < recentActivities.length - 1 ? '12px' : '0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.warning,
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
                        {activity.title}
                      </p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>
                        {activity.clubName || activity.hodName || activity.deanName || 'Unknown'} • {activity.points || 0} points
                      </p>
                    </div>
                  </div>
                  <Badge variant={activity.status === 'approved' ? 'success' : activity.status === 'pending' ? 'warning' : 'danger'}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
              <Button variant="secondary" fullWidth style={{ marginTop: '16px' }} onClick={() => navigate('/hod/activities')}>
                View All Activities
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No activities yet"
              description="Create your first activity for students."
              action={<Button onClick={() => navigate('/hod/create-activity')}>Create Activity</Button>}
            />
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" icon={TrendingUp}>
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
                  <span style={{ fontSize: '14px', fontWeight: '500', color: colors.text }}>
                    {action.label}
                  </span>
                </div>
                <ArrowRight size={18} color={colors.textMuted} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Students */}
      <Card title="Top Performing Students" icon={Award}>
        {topStudents.length > 0 ? (
          <Table
            columns={[
              
              {
                header: 'Student', render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={row.name} size={40} />
                    <div>
                      <p style={{ fontWeight: '600', color: colors.text }}>{row.name}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.email}</p>
                    </div>
                  </div>
                )
              },
              { header: 'Roll Number', render: (row) => <span style={{ color: colors.textSecondary, fontFamily: 'monospace' }}>{row.rollNumber || 'N/A'}</span> },
              { header: 'Department', render: (row) => <Badge variant="primary">{row.department || 'N/A'}</Badge> },
              {
                header: 'Points', render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} color={colors.warning} />
                    <span style={{ fontWeight: '600', color: colors.warning }}>{row.points || 0}</span>
                  </div>
                )
              },
              { header: 'Activities', render: (row) => <Badge variant="success">{row.activitiesParticipated || 0}</Badge> },
            ]}
            data={topStudents}
          />
        ) : (
          <EmptyState icon={Users} title="No students yet" description="Students will appear here once added." />
        )}
        <Button variant="secondary" fullWidth style={{ marginTop: '16px' }} onClick={() => navigate('/hod/students')}>
          View All Students
        </Button>
      </Card>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default HODDashboard;