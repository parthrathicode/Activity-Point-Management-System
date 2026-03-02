import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Table, Badge, Toast, EmptyState, Avatar } from '../../components/UIComponents';
import { Award, TrendingUp, Trophy, Target, Zap, Calendar, Star, Users } from 'lucide-react';
const StudentPoints = () => {
    const { userData } = useAuth();
    const [pointHistory, setPointHistory] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentUserData, setCurrentUserData] = useState({ points: 0, activitiesParticipated: 0 });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (userData?.email && userData?.deanId) {
            console.log("[StudentPoints] Setting up real-time listeners");
            setupRealtimeListeners();
        }
    }, [userData]);
    const setupRealtimeListeners = () => {
        const unsubscribers = [];
        try {
            const userQ = query(collection(db, 'users'), where('email', '==', userData.email));
            const unsubUser = onSnapshot(userQ, (userSnap) => {
                if (!userSnap.empty) {
                    const freshUserData = userSnap.docs[0].data();
                    setCurrentUserData({ points: freshUserData.points || 0, activitiesParticipated: freshUserData.activitiesParticipated || 0 });
                    console.log("[StudentPoints] Real-time user data updated:", { points: freshUserData.points });
                }
            });
            unsubscribers.push(unsubUser);
            const historyQ = query(collection(db, 'pointHistory'), where('studentEmail', '==', userData.email), orderBy('allocatedAt', 'desc'));
            const unsubHistory = onSnapshot(historyQ, (historySnap) => {
                setPointHistory(historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                console.log("[StudentPoints] Real-time point history updated:", historySnap.docs.length);
            });
            unsubscribers.push(unsubHistory);
            const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'), where('deanId', '==', userData.deanId));
            const unsubStudents = onSnapshot(studentsQ, (studentsSnap) => {
                const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const sorted = students.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10);
                setLeaderboard(sorted);
                console.log("[StudentPoints] Real-time leaderboard updated:", sorted.length);
                setLoading(false);
            });
            unsubscribers.push(unsubStudents);
        } catch (error) {
            console.error('Error setting up listeners:', error);
            setToast({ message: 'Failed to load data', type: 'error' });
            setLoading(false);
        }
        return () => {
            console.log("[StudentPoints] Cleaning up listeners");
            unsubscribers.forEach(unsub => unsub());
        };
    };
    const totalPoints = currentUserData.points;
    const activitiesCount = currentUserData.activitiesParticipated || pointHistory.length;
    const currentRank = leaderboard.findIndex(s => s.email === userData?.email) + 1;
    const getRankStyle = (rank) => {
        if (rank === 1) return { bg: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)', color: '#000' };
        if (rank === 2) return { bg: 'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)', color: '#000' };
        if (rank === 3) return { bg: 'linear-gradient(135deg, #cd7f32 0%, #a66324 100%)', color: '#fff' };
        return { bg: colors.card, color: colors.text };
    };

      const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'Organizer': return 'primary';
      case 'Volunteer': return 'success';
      case 'Winner': return 'warning';
      case 'Runner-up': return 'warning';
      case 'Coordinator': return 'primary';
      case 'Team Lead': return 'primary';
      case 'Mentor': return 'success';
      case 'Speaker': return 'success';
      case 'Judge': return 'primary';
      default: return 'neutral';
    }
  };
    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>My Points & Leaderboard</h1>
                <p style={{ color: colors.textSecondary }}>Track your points and see how you rank among other students</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <Card style={{ padding: '24px', background: colors.gradient, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                    <Award size={32} color="#fff" style={{ marginBottom: '16px' }} />
                    <p style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{totalPoints}</p>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Total Points</p>
                </Card>
                <Card style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={28} color="#fff" />
                        </div>
                        <div>
                            <p style={{ fontSize: '28px', fontWeight: '700', color: colors.text }}>{activitiesCount}</p>
                            <p style={{ fontSize: '13px', color: colors.textMuted }}>Activities</p>
                        </div>
                    </div>
                </Card>
                
                <Card style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target size={28} color="#fff" />
                        </div>
                        <div>
                            <p style={{ fontSize: '28px', fontWeight: '700', color: colors.text }}>{activitiesCount > 0 ? Math.round(totalPoints / activitiesCount) : 0}</p>
                            <p style={{ fontSize: '13px', color: colors.textMuted }}>Avg Points</p>
                        </div>
                    </div>
                </Card>
            </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Card title="Points History" icon={TrendingUp}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : pointHistory.length > 0 ? (
            <Table columns={[
              {
                header: 'Activity', render: (row) => (
                  <div>
                    <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{row.activityTitle}</p>
                    <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.clubName}</p>
                  </div>
                )
              },
              {
                header: 'Role', render: (row) => (
                  <Badge variant={getRoleBadgeVariant(row.role || 'Participant')}>
                    {row.role || 'Participant'}
                  </Badge>
                )
              },
              {
                header: 'Date', render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textSecondary }}>
                    <Calendar size={14} />
                    {row.allocatedAt ? new Date(row.allocatedAt).toLocaleDateString() : 'N/A'}
                  </div>
                )
              },
              {
                header: 'Points', render: (row) => (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                    <Award size={14} color={colors.secondary} />
                    <span style={{ fontWeight: '700', color: colors.secondary }}>+{row.points}</span>
                  </div>
                )
              }
            ]} data={pointHistory} />
          ) : (
            <EmptyState icon={Award} title="No points history" description="Participate in activities to earn points!" />
          )}
        </Card>
               
            </div>
            {/* <Card title="Achievement Progress" icon={Star} style={{ marginTop: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                    {[
                        { name: 'First Steps', desc: 'Earn 10 points', target: 10, icon: '🌱' },
                        { name: 'Rising Star', desc: 'Earn 50 points', target: 50, icon: '⭐' },
                        { name: 'Achiever', desc: 'Earn 100 points', target: 100, icon: '🏆' },
                        { name: 'Champion', desc: 'Earn 250 points', target: 250, icon: '👑' },
                        { name: 'Legend', desc: 'Earn 500 points', target: 500, icon: '🔥' },
                    ].map((badge, idx) => {
                        const progress = Math.min((totalPoints / badge.target) * 100, 100);
                        const achieved = totalPoints >= badge.target;
                        return (
                            <div key={idx} style={{ background: achieved ? 'rgba(16, 185, 129, 0.1)' : colors.card, borderRadius: '16px', padding: '20px', textAlign: 'center', border: achieved ? '2px solid rgba(16, 185, 129, 0.3)' : `1px solid ${colors.border}`, opacity: achieved ? 1 : 0.7 }}>
                                <div style={{ fontSize: '36px', marginBottom: '12px', filter: achieved ? 'none' : 'grayscale(100%)' }}>{badge.icon}</div>
                                <p style={{ fontWeight: '600', color: achieved ? colors.secondary : colors.text, marginBottom: '4px', fontSize: '14px' }}>{badge.name}</p>
                                <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '12px' }}>{badge.desc}</p>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${progress}%`, background: achieved ? colors.gradientGreen : colors.gradient, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                </div>
                                <p style={{ fontSize: '11px', color: colors.textMuted, marginTop: '8px' }}>
                                    {achieved ? '✓ Achieved!' : `${totalPoints}/${badge.target} pts`}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </Card> */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <style>{`
@keyframes fadeIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform: translateY(0);}}
@keyframes spin{to{transform: rotate(360deg);}}
`}</style>
        </div>
    );
};
export default StudentPoints;