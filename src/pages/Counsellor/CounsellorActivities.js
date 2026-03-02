import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Table, Badge, Toast, EmptyState, Tabs } from '../../components/UIComponents';
import { Activity, Award, Calendar, CheckCircle, Clock, Search } from 'lucide-react';

const CounsellorActivities = () => {
  const { userData } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (userData?. uid) fetchActivities();
  }, [userData]);

  const fetchActivities = async () => {
    try {
      // Fetch activities allocated by THIS counsellor to their students
      // ✅ FIXED: Query studentActivities collection instead
      const q = query(
        collection(db, 'studentActivities'),
        where('counsellorId', '==', userData.uid),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ... doc.data() })));
    } catch (error) {
      console.error('Error fetching activities:', error);
      setToast({ message: 'Failed to fetch activities', type: 'error' });
    }
    setLoading(false);
  };

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.activityTitle?. toLowerCase().includes(searchTerm. toLowerCase()) ||
      a.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'upcoming') {
      const activityDate = new Date(a. date);
      return matchesSearch && activityDate >= new Date();
    }
    if (activeTab === 'past') {
      const activityDate = new Date(a.date);
      return matchesSearch && activityDate < new Date();
    }
    return matchesSearch;
  });

  const tabs = [
    { id: 'all', label: 'All Activities', count: activities.length },
    { id: 'upcoming', label: 'Upcoming', icon: Clock, count: activities.filter(a => new Date(a.date) >= new Date()).length },
    { id: 'past', label: 'Completed', icon: CheckCircle, count: activities.filter(a => new Date(a. date) < new Date()).length },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>
          Allocated Activities
        </h1>
        <p style={{ color: colors.textSecondary }}>
          Activities you've allocated to your students
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems:  'center', justifyContent:  'center' }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
                {activities.length}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Activities</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems:  'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
                {activities.filter(a => new Date(a.date) >= new Date()).length}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Upcoming</p>
            </div>
          </div>
        </Card>

      
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
        <input
          type="text"
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '14px 16px 14px 48px', fontSize: '14px', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, outline: 'none' }}
        />
      </div>

      <Card>
        {loading ?  (
          <div style={{ display: 'flex', alignItems:  'center', justifyContent:  'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredActivities.length > 0 ? (
          <Table
            columns={[
              { 
                header: 'Activity', 
                render: (row) => (
                  <div>
                    <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
                      {row.activityTitle}
                    </p>
                    <p style={{ fontSize: '13px', color: colors.textMuted }}>
                      {row.description?. substring(0, 60)}...
                    </p>
                  </div>
                )
              },
              { 
                header: 'Category', 
                render: (row) => <Badge variant="primary">{row.category}</Badge> 
              },
              { 
                header: 'Points', 
                render: (row) => (
                  <div style={{ display: 'flex', alignItems:  'center', gap: '6px' }}>
                    <Award size={16} color={colors.warning} />
                    <span style={{ fontWeight: '600', color: colors.warning }}>{row.points}</span>
                  </div>
                )
              },
              { 
                header: 'Date', 
                render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textSecondary }}>
                    <Calendar size={14} />
                    {row.date || 'TBD'}
                  </div>
                )
              },
              { 
                header: 'Venue', 
                render: (row) => <span style={{ color: colors.textSecondary }}>{row.venue || 'TBD'}</span> 
              },
              { 
                header: 'Status', 
                render: (row) => <Badge variant="success">Active ✓</Badge> 
              },
            ]}
            data={filteredActivities}
          />
        ) : (
          <EmptyState 
            icon={Activity} 
            title="No activities allocated yet" 
            description="Allocate activities to your students from the Proposals page." 
          />
        )}
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform:  translateY(20px); } to { opacity: 1; transform:  translateY(0); } } @keyframes spin { to { transform:  rotate(360deg); } }`}</style>
    </div>
  );
};

export default CounsellorActivities;