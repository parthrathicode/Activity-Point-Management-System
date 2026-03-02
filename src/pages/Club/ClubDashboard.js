import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, StatCard, Button, Badge, EmptyState } from '../../components/UIComponents';
import { Activity, Award, Clock, CheckCircle, XCircle, Plus, FileText, ArrowRight, TrendingUp } from 'lucide-react';

const ClubDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalActivities: 0,
    approvedActivities: 0,
    pendingActivities: 0,
    rejectedActivities: 0,
    totalPointsAllocated: 0,
    pendingPoints: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userData]);

  const fetchDashboardData = async () => {
    try {
      const clubId = userData?.uid;

      // Fetch all activities by this club
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('clubId', '==', clubId)
      );
      const activitiesSnap = await getDocs(activitiesQuery);
      const activities = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch point allocations
      const pointsQuery = query(
        collection(db, 'pointAllocations'),
        where('clubId', '==', clubId)
      );
      const pointsSnap = await getDocs(pointsQuery);
      const points = pointsSnap.docs.map(doc => doc.data());

      const approvedPoints = points.filter(p => p.status === 'approved');
      const totalAllocated = approvedPoints.reduce((sum, p) => {
        const studentPoints = p.students?.reduce((s, student) => s + (student.points || p.pointsPerStudent || 0), 0) || 0;
        return sum + studentPoints;
      }, 0);

      setStats({
        totalActivities: activities.length,
        approvedActivities: activities.filter(a => a.status === 'approved').length,
        pendingActivities: activities.filter(a => a.status === 'pending').length,
        rejectedActivities: activities.filter(a => a.status === 'rejected').length,
        totalPointsAllocated: totalAllocated,
        pendingPoints: points.filter(p => p.status === 'pending').length,
      });

      // Get recent activities
      setRecentActivities(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const quickActions = [
    { label: 'Propose Events', icon: Plus, path: '/club/propose-activity', color: colors.primary },
    { label: 'My Activities', icon: Activity, path: '/club/my-activities', color: colors.secondary },
    { label: 'Allocate Points', icon: Award, path: '/club/allocate-points', color: colors.warning },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Total Activities" value={stats.totalActivities} icon={Activity} color="primary" />
        <StatCard title="Approved" value={stats.approvedActivities} icon={CheckCircle} color="success" />
        <StatCard title="Pending Approval" value={stats.pendingActivities} icon={Clock} color="warning" />
        <StatCard title="Points Allocated" value={stats.totalPointsAllocated} icon={Award} color="danger" />
      </div>

      {stats.pendingActivities > 0 && (
        <Card style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: colors.gradientOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={28} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Pending Approvals</h3>
                <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
                  You have <strong style={{ color: colors.warning }}>{stats.pendingActivities}</strong> activities waiting for dean approval
                </p>
              </div>
            </div>
            <Button variant="warning" onClick={() => navigate('/club/my-activities')}>View Status</Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <Card title="Recent Activities" icon={Activity}>
          {recentActivities.length > 0 ? (
            <div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: activity.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 
                                 activity.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {activity.status === 'approved' ? <CheckCircle size={20} color={colors.secondary} /> :
                       activity.status === 'pending' ? <Clock size={20} color={colors.warning} /> :
                       <XCircle size={20} color={colors.danger} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{activity.title}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>{activity.category} • {activity.points} points</p>
                      {activity.status === 'rejected' && activity.remarks && (
                        <div style={{ color: colors.danger, fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
                          Remarks: {activity.remarks.substring(0, 40)}...
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={activity.status === 'approved' ? 'success' : activity.status === 'pending' ? 'warning' : 'danger'}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Activity} title="No activities yet" description="Start by proposing your first activity" action={<Button icon={Plus} onClick={() => navigate('/club/propose-activity')}>Propose Event</Button>} />
          )}
        </Card>

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
                  <span style={{ fontSize: '14px', fontWeight: '500', color: colors.text }}>{action.label}</span>
                </div>
                <ArrowRight size={18} color={colors.textMuted} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default ClubDashboard;