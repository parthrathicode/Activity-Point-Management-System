import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, StatCard, Button, Badge, Avatar, EmptyState } from '../../components/UIComponents';
import { Activity, Award, Star, TrendingUp, Calendar, Clock, ArrowRight, Trophy, Target, Zap, CheckCircle } from 'lucide-react';
const StudentDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalPoints: 0, activitiesParticipated: 0, rank: 0, totalStudents: 0, presentDays: 0, attendanceMarked: 0, attendancePercentage: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  const [availableActivities, setAvailableActivities] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (userData?.uid && userData?.email) {
      console.log("[StudentDashboard] Setting up real-time listeners for:", userData.email);
      setupRealtimeListeners();
    } else {
      console.log("[StudentDashboard] Missing user data");
      setLoading(false);
    }
  }, [userData]);
  const setupRealtimeListeners = () => {
    if (!userData?.uid || !userData?.email) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const unsubscribers = [];
      const userQ = query(collection(db, 'users'), where('email', '==', userData.email));
      const unsubUser = onSnapshot(userQ, (userSnap) => {
        if (userSnap.empty) {
          console.log("[StudentDashboard] User not found");
          setLoading(false);
          return;
        }
        const freshUserData = { ...userSnap.docs[0].data(), uid: userSnap.docs[0].id };
        console.log("[StudentDashboard] Real-time user data:", { points: freshUserData.points, presentDays: freshUserData.presentDays, attendanceMarked: freshUserData.attendanceMarked });
        const historyQ = query(collection(db, 'pointHistory'), where('studentEmail', '==', userData.email), orderBy('allocatedAt', 'desc'), limit(5));
        const unsubHistory = onSnapshot(historyQ, (historySnap) => {
          const history = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPointHistory(history);
          console.log("[StudentDashboard] Real-time point history updated:", history.length);
        });
        unsubscribers.push(unsubHistory);
        const attendanceQ = query(collection(db, 'attendance'), where('studentEmail', '==', userData.email));
        const unsubAttendance = onSnapshot(attendanceQ, (attendanceSnap) => {
          const attendanceData = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => {
            const dateA = a.date?.toDate?.() || new Date(a.date);
            const dateB = b.date?.toDate?.() || new Date(b.date);
            return dateB - dateA;
          }).slice(0, 7);
          setRecentAttendance(attendanceData);
          console.log("[StudentDashboard] Real-time attendance updated:", attendanceData.length);
        });
        unsubscribers.push(unsubAttendance);
        const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'), where('deanId', '==', userData.deanId));
        const unsubStudents = onSnapshot(studentsQ, (studentsSnap) => {
          const allStudents = studentsSnap.docs.map(doc => doc.data());
          const sortedStudents = allStudents.sort((a, b) => (b.points || 0) - (a.points || 0));
          const rank = sortedStudents.findIndex(s => s.email === userData.email) + 1;
          const totalPoints = freshUserData.points || 0;
          const activitiesCount = freshUserData.activitiesParticipated || pointHistory.length;
          const presentDays = freshUserData.presentDays || 0;
          const attendanceMarked = freshUserData.attendanceMarked || 0;
          const attendancePercentage = attendanceMarked > 0 ? Math.round((presentDays / attendanceMarked) * 100) : 0;
          setStats({ totalPoints, activitiesParticipated: activitiesCount, rank: rank || 1, totalStudents: allStudents.length, presentDays, attendanceMarked, attendancePercentage });
          console.log("[StudentDashboard] Real-time stats updated");
        });
        unsubscribers.push(unsubStudents);
        if (userData.counsellorId) {
          const activitiesQ = query(collection(db, 'studentActivities'), where('counsellorId', '==', userData.counsellorId), where('status', '==', 'active'));
          const unsubActivities = onSnapshot(activitiesQ, (activitiesSnap) => {
            const activities = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 5);
            setAvailableActivities(activities);
            console.log("[StudentDashboard] Real-time activities updated:", activities.length);
          });
          unsubscribers.push(unsubActivities);
        }
        setLoading(false);
      });
      unsubscribers.push(unsubUser);
      return () => {
        console.log("[StudentDashboard] Cleaning up listeners");
        unsubscribers.forEach(unsub => unsub());
      };
    } catch (error) {
      console.error('[StudentDashboard] Critical error: ', error);
      setLoading(false);
    }
  };
  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: Trophy, color: '#ffd700', label: 'Gold' };
    if (rank === 2) return { icon: Trophy, color: '#c0c0c0', label: 'Silver' };
    if (rank === 3) return { icon: Trophy, color: '#cd7f32', label: 'Bronze' };
    return { icon: Star, color: colors.primary, label: `#${rank}` };
  };
  const getAttendanceStatus = (percentage) => {
    if (percentage >= 85) return { variant: 'success', label: 'Excellent', emoji: '🌟' };
    if (percentage >= 75) return { variant: 'warning', label: 'Good', emoji: '👍' };
    if (percentage >= 60) return { variant: 'danger', label: 'Fair', emoji: '⚠️' };
    return { variant: 'danger', label: 'Poor', emoji: '❌' };
  };
  const rankBadge = getRankBadge(stats.rank);
  const attendanceStatus = getAttendanceStatus(stats.attendancePercentage);
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
        <p style={{ color: colors.textSecondary }}>Loading dashboard...</p>
      </div>
    );
  }
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <Card style={{ background: colors.gradient, marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30px', right: '100px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Avatar name={userData?.name || 'Student'} size={80} />
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Welcome back, {userData?.name?.split(' ')[0]}!  🎉</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>{userData?.rollNumber}•{userData?.department}•Year {userData?.year}</p>
            </div>
          </div>
         
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Total Points" value={stats.totalPoints} icon={Award} color="primary" />
        <StatCard title="Activities" value={stats.activitiesParticipated} icon={Activity} color="success" />
        {/* <StatCard title="Current Rank" value={`#${stats.rank}`} icon={Trophy} color="warning" />
        <StatCard title="Attendance" value={`${stats.attendancePercentage}%`} icon={Calendar} color={attendanceStatus.variant === 'success' ? 'success' : attendanceStatus.variant === 'warning' ? 'warning' : 'danger'} /> */}
      </div>
      {/* {stats.attendancePercentage > 0 && stats.attendancePercentage < 75 && (
        <Card style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.danger, marginBottom: '4px' }}>Low Attendance Alert</h3>
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Your current attendance is {stats.attendancePercentage}%.  Please ensure regular attendance to maintain good academic standing.</p>
          </div>
        </Card>
      )} */}
      {/* <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ background: `linear-gradient(135deg, ${attendanceStatus.variant === 'success' ? 'rgba(16, 185, 129, 0.1)' : attendanceStatus.variant === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'} 0%, ${attendanceStatus.variant === 'success' ? 'rgba(5, 150, 105, 0.05)' : attendanceStatus.variant === 'warning' ? 'rgba(217, 119, 6, 0.05)' : 'rgba(220, 38, 38, 0.05)'} 100%)`, border: `1px solid ${attendanceStatus.variant === 'success' ? 'rgba(16, 185, 129, 0.3)' : attendanceStatus.variant === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>Attendance Overview</h3>
              <p style={{ color: colors.textSecondary, fontSize: '14px' }}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', marginBottom: '4px' }}>{attendanceStatus.emoji}</div>
              <Badge variant={attendanceStatus.variant}>{attendanceStatus.label}</Badge>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: colors.cardHover, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Present Days</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: colors.secondary }}>{stats.presentDays}</p>
            </div>
            <div style={{ background: colors.cardHover, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Total Marked</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: colors.text }}>{stats.attendanceMarked}</p>
            </div>
          </div>
          {stats.attendanceMarked > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: colors.textMuted }}>Attendance Rate</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>{stats.attendancePercentage}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.attendancePercentage}%`, background: attendanceStatus.variant === 'success' ? colors.secondary : attendanceStatus.variant === 'warning' ? colors.warning : colors.danger, transition: 'width 0.3s ease', borderRadius: '4px' }} />
              </div>
            </div>
          )}
        </Card>
        <Card title="Recent Attendance" icon={CheckCircle}>
          {recentAttendance.length > 0 ? (
            <div>
              {recentAttendance.slice(0, 5).map((record, idx) => (
                <div key={record.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', background: idx % 2 === 0 ? colors.cardHover : 'transparent', marginBottom: idx < Math.min(4, recentAttendance.length - 1) ? '8px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={16} color={colors.textMuted} />
                    <div>
                      <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {record.date ? (() => {
                          try {
                            const dateObj = record.date.toDate ? record.date.toDate() : new Date(record.date);
                            return dateObj.toLocaleDateString();
                          } catch {
                            return 'Invalid date';
                          }
                        })() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={record.status === 'present' ? 'success' : 'danger'}>
                    {record.status === 'present' ? '✓ Present' : '✗ Absent'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle} title="No attendance records" description="Your counsellor hasn't marked attendance yet. " />
          )}
        </Card>
      </div> */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card title="Recent Points History" icon={TrendingUp}>
          {pointHistory.length > 0 ? (
            <div>
              {pointHistory.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: colors.cardHover, marginBottom: idx < pointHistory.length - 1 ? '12px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={22} color={colors.secondary} />
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{item.activityTitle}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>
                        {item.clubName}•{item.allocatedAt ? (() => {
                          try {
                            const dateObj = item.allocatedAt.toDate ? item.allocatedAt.toDate() : new Date(item.allocatedAt);
                            return dateObj.toLocaleDateString();
                          } catch {
                            return 'N/A';
                          }
                        })() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '20px' }}>
                    <Award size={16} color={colors.secondary} />
                    <span style={{ fontSize: '16px', fontWeight: '700', color: colors.secondary }}>+{item.points}</span>
                  </div>
                </div>
              ))}
              <Button variant="secondary" fullWidth style={{ marginTop: '16px' }} onClick={() => navigate('/student/points')}>View All Points History</Button>
            </div>
          ) : (
            <EmptyState icon={Award} title="No points yet" description="Participate in activities to earn points!" action={<Button onClick={() => navigate('/student/activities')}>Browse Activities</Button>} />
          )}
        </Card>
        <Card title="Available Activities" icon={Activity}>
          {availableActivities.length > 0 ? (
            <div>
              {availableActivities.map((activity, idx) => (
                <div key={activity.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: colors.cardHover, marginBottom: idx < availableActivities.length - 1 ? '12px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={22} color={colors.primary} />
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{activity.activityTitle}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge variant="primary" size="small">{activity.category}</Badge>
                        <span style={{ fontSize: '12px', color: colors.textMuted }}><Calendar size={12} style={{ marginRight: '4px' }} />{activity.date || 'TBD'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 16px', borderRadius: '20px' }}>
                    <Award size={16} color={colors.warning} />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: colors.warning }}>{activity.points} pts</span>
                  </div>
                </div>
              ))}
              <Button variant="secondary" fullWidth style={{ marginTop: '16px' }} onClick={() => navigate('/student/activities')}>View All Activities</Button>
            </div>
          ) : (
            <EmptyState icon={Activity} title="No activities available" description="Your counsellor will allocate activities soon! " />
          )}
        </Card>
      </div>
      <Card style={{ marginTop: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 95, 70, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>🚀</div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Keep Going!</h3>
              <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
                {stats.rank <= 3 ? "You're in the top 3!  Keep up the excellent work!" : `You're ${stats.rank - 3} positions away from the top 3. Participate in more activities to climb up! `}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/student/activities')} icon={ArrowRight}>Find Activities</Button>
        </div>
      </Card>
      <style>{`
@keyframes fadeIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
`}</style>
    </div>
  );
};
export default StudentDashboard;