import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { 
  colors, Card, StatCard, Button, Badge, Avatar, Table, EmptyState 
} from '../../components/UIComponents';
import { 
  Users, Activity, Award, CheckCircle, Clock, TrendingUp, 
  ArrowRight, FileText, Briefcase 
} from 'lucide-react';

const DeanDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCounsellors: 0,
    totalClubs: 0,
    pendingActivities: 0,
    pendingPoints: 0,
    totalActivities: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
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
    const deanId = userData.uid;

      // Fetch students count
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('deanId', '==', deanId)
      );
      const studentsSnap = await getDocs(studentsQuery);

      // Fetch counsellors count
      const counsellorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'counsellor'),
        where('deanId', '==', deanId)
      );
      const counsellorsSnap = await getDocs(counsellorsQuery);

      // Fetch clubs count
      const clubsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'club'),
        where('deanId', '==', deanId)
      );
      const clubsSnap = await getDocs(clubsQuery);

      // Fetch pending activities
      const pendingActivitiesQuery = query(
        collection(db, 'activities'),
        where('deanId', '==', deanId),
        where('status', '==', 'pending')
      );
      const pendingActivitiesSnap = await getDocs(pendingActivitiesQuery);

      // Fetch pending point allocations
      const pendingPointsQuery = query(
        collection(db, 'pointAllocations'),
        where('deanId', '==', deanId),
        where('status', '==', 'pending')
      );
      const pendingPointsSnap = await getDocs(pendingPointsQuery);

      // Fetch all activities
      const allActivitiesQuery = query(
        collection(db, 'activities'),
        where('deanId', '==', deanId)
      );
      const allActivitiesSnap = await getDocs(allActivitiesQuery);

      // Fetch recent activities
      const recentQuery = query(
        collection(db, 'activities'),
        where('deanId', '==', deanId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentSnap = await getDocs(recentQuery);
      const recentData = recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Combine pending items
      const pendingData = [
        ...pendingActivitiesSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          type: 'activity' 
        })),
        ...pendingPointsSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          type: 'points' 
        })),
      ].slice(0, 5);

      setStats({
        totalStudents: studentsSnap.size,
        totalCounsellors: counsellorsSnap.size,
        totalClubs: clubsSnap.size,
        pendingActivities: pendingActivitiesSnap.size,
        pendingPoints: pendingPointsSnap.size,
        totalActivities: allActivitiesSnap.size,
      });

      setRecentActivities(recentData);
      setPendingItems(pendingData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const quickActions = [
    { 
      label: 'Add Counsellor', 
      icon: Users, 
      path: '/dean/counsellors',
      color: colors.primary 
    },
    { 
      label: 'Add Student', 
      icon: Award, 
      path: '/dean/students',
      color: colors.secondary 
    },
    { 
      label: 'Create Events', 
      icon: Activity, 
      path: '/dean/activities',
      color: colors.warning 
    },
    { 
      label: 'Verify Pending', 
      icon: CheckCircle, 
      path: '/dean/verify-activities',
      color: '#ec4899' 
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        marginBottom: '32px',
      }}>
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="primary"
          trend={12}
        />
        <StatCard
          title="Counsellors"
          value={stats.totalCounsellors}
          icon={Users}
          color="success"
        />
        <StatCard
          title="Active Clubs"
          value={stats.totalClubs}
          icon={Briefcase}
          color="warning"
        />
        <StatCard
          title="Total Events"
          value={stats.totalActivities}
          icon={Activity}
          color="danger"
        />
      </div>

      {/* Pending Items Alert */}
      {(stats.pendingActivities > 0 || stats.pendingPoints > 0) && (
        <Card style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: '32px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: colors.gradientOrange,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Clock size={28} color="#fff" />
              </div>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: '4px',
                }}>
                  Pending Approvals
                </h3>
                <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
                  You have <strong style={{ color: colors.warning }}>{stats.pendingActivities}</strong> activities and{' '}
                  <strong style={{ color: colors.warning }}>{stats.pendingPoints}</strong> point allocations waiting for verification
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button 
                variant="warning" 
                onClick={() => navigate('/dean/verify-activities')}
              >
                Review Activities
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/dean/verify-points')}
              >
                Review Points
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '32px',
      }}>
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
                      background: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.primary,
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: colors.text,
                        marginBottom: '4px',
                      }}>
                        {activity.title}
                      </p>
                      <p style={{
                        fontSize: '13px',
                        color: colors.textMuted,
                      }}>
                        {activity.clubName || 'Unknown Club'} • {activity.points || 0} points
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    activity.status === 'approved' ? 'success' :
                    activity.status === 'pending' ? 'warning' : 'danger'
                  }>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No activities yet"
              description="Activities will appear here once clubs start proposing them."
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
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.text,
                  }}>
                    {action.label}
                  </span>
                </div>
                <ArrowRight size={18} color={colors.textMuted} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Pending Items Table */}
      {pendingItems.length > 0 && (
        <Card title="Items Awaiting Your Approval" icon={Clock}>
          <Table
            columns={[
              { header: 'Type', render: (row) => (
                <Badge variant={row.type === 'activity' ? 'primary' : 'success'}>
                  {row.type === 'activity' ? 'Activity' : 'Points'}
                </Badge>
              )},
              { header: 'Title/Description', render: (row) => (
                <span style={{ color: colors.text, fontWeight: '500' }}>
                  {row.title || row.activityTitle || 'N/A'}
                </span>
              )},
              { header: 'Submitted By', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar name={row.clubName || 'Club'} size={28} />
                  <span>{row.clubName || 'Unknown'}</span>
                </div>
              )},
              { header: 'Date', render: (row) => (
                <span style={{ color: colors.textMuted }}>
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              )},
              { header: 'Action', render: (row) => (
                <Button 
                  size="small" 
                  onClick={() => navigate(row.type === 'activity' ? '/dean/verify-activities' : '/dean/verify-points')}
                >
                  Review
                </Button>
              )},
            ]}
            data={pendingItems}
          />
        </Card>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DeanDashboard;