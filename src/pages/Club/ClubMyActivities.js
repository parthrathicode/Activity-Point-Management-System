import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Table, Badge, Toast, EmptyState, Tabs } from '../../components/UIComponents';
import { Activity, Plus, Trash2, Eye, Search, CheckCircle, Clock, XCircle, Award, Calendar } from 'lucide-react';

const ClubMyActivities = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [userData]);

  const fetchActivities = async () => {
    try {
      const q = query(
        collection(db, 'activities'),
        where('clubId', '==', userData?.uid)
      );
      const snapshot = await getDocs(q);
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching activities:', error);
      setToast({ message: 'Failed to fetch activities', type: 'error' });
    }
    setLoading(false);
  };

  const handleDelete = async (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await deleteDoc(doc(db, 'activities', activityId));
        setToast({ message: 'Activity deleted successfully!', type: 'success' });
        fetchActivities();
      } catch (error) {
        setToast({ message: 'Failed to delete activity', type: 'error' });
      }
    }
  };

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && a.status === activeTab;
  });

  const tabs = [
    { id: 'all', label: 'All', count: activities.length },
    { id: 'approved', label: 'Approved', icon: CheckCircle, count: activities.filter(a => a.status === 'approved').length },
    { id: 'pending', label: 'Pending', icon: Clock, count: activities.filter(a => a.status === 'pending').length },
    { id: 'rejected', label: 'Rejected', icon: XCircle, count: activities.filter(a => a.status === 'rejected').length },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>My Activities</h1>
          <p style={{ color: colors.textSecondary }}>View and manage all your proposed activities</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/club/propose-activity')}>Propose Event</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{activities.length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{activities.filter(a => a.status === 'approved').length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Approved</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{activities.filter(a => a.status === 'pending').length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Pending</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientRed, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{activities.filter(a => a.status === 'rejected').length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Rejected</p>
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
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredActivities.length > 0 ? (
          <Table
            columns={[
              { header: 'Activity', render: (row) => (
                <div>
                  <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{row.title}</p>
                  <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.description?.substring(0, 50)}...</p>
                </div>
              )},
              { header: 'Category', render: (row) => <Badge variant="primary">{row.category}</Badge> },
              { header: 'Points', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color={colors.warning} />
                  <span style={{ fontWeight: '600', color: colors.warning }}>{row.points}</span>
                </div>
              )},
              { header: 'Date', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textSecondary }}>
                  <Calendar size={14} />
                  {row.date || 'TBD'}
                </div>
              )},
              { header: 'Status', render: (row) => (
                <div>
                  <Badge variant={row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'}>
                    {row.status}
                  </Badge>
                  {row.status === 'rejected' && row.remarks && (
                    <div style={{ color: colors.danger, fontSize: '11px', marginTop: '6px', fontWeight: '500' }}>
                      Remarks: {row.remarks.substring(0, 30)}...
                    </div>
                  )}
                </div>
              )},
              { header: 'Actions', render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {row.status === 'approved' && (
                    <Button size="small" onClick={() => navigate('/club/allocate-points', { state: { activity: row } })}>
                      Allocate Points
                    </Button>
                  )}
                  {row.status === 'pending' && (
                    <button onClick={() => handleDelete(row.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.danger, display: 'flex' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )},
            ]}
            data={filteredActivities}
          />
        ) : (
          <EmptyState icon={Activity} title="No activities found" description="Start by proposing your first activity" action={<Button icon={Plus} onClick={() => navigate('/club/propose-activity')}>Propose Event</Button>} />
        )}
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ClubMyActivities;