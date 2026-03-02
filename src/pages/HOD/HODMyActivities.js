import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Table, Badge, Toast, EmptyState, Modal, Tabs } from '../../components/UIComponents';
import { Activity, Plus, Eye, Award, Calendar, MapPin, Search, Users, CheckCircle, Clock, Shield, Briefcase, Building2, Trash2 } from 'lucide-react';

const HODMyActivities = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userData?.uid) fetchActivities();
  }, [userData]);

  const fetchActivities = async () => {
    try {
      // Fetch ALL activities under the same dean
      const q = query(
        collection(db, 'activities'),
        where('deanId', '==', userData?.deanId)
      );
      const snapshot = await getDocs(q);
      const activitiesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by createdAt descending
      activitiesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setActivities(activitiesList);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setToast({ message: 'Failed to fetch activities', type: 'error' });
    }
    setLoading(false);
  };

  const viewDetails = (activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const handleDelete = async (activityId, activityTitle) => {
    if (window.confirm(`Are you sure you want to delete "${activityTitle}"? This action cannot be undone.`)) {
      setDeleting(true);
      try {
        await deleteDoc(doc(db, 'activities', activityId));
        setToast({ message: 'Activity deleted successfully!', type: 'success' });
        // Remove from local state
        setActivities(prev => prev.filter(a => a.id !== activityId));
        // Close modal if the deleted activity was being viewed
        if (selectedActivity?.id === activityId) {
          setShowModal(false);
          setSelectedActivity(null);
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
        setToast({ message: 'Failed to delete activity', type: 'error' });
      }
      setDeleting(false);
    }
  };

  const getCreatorIcon = (activity) => {
    if (activity.createdBy === 'dean') return { icon: Shield, color: colors.primary, label: 'Dean' };
    if (activity.createdBy === 'hod') return { icon: Building2, color: '#f59e0b', label: 'HOD' };
    if (activity.createdBy === 'club') return { icon: Briefcase, color: colors.warning, label: 'Club' };
    return { icon: Activity, color: colors.textMuted, label: 'Unknown' };
  };



  const filteredActivities = activities.filter(a => {
    const matchesSearch = 
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.clubName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.hodName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'approved') return matchesSearch && a.status === 'approved';
    if (activeTab === 'pending') return matchesSearch && a.status === 'pending';
    return matchesSearch;
  });

  const tabs = [
    { id: 'all', label: 'All Activities', count: activities.length },
    { id: 'approved', label: 'Approved', icon: CheckCircle, count: activities.filter(a => a.status === 'approved').length },
    { id: 'pending', label: 'Pending', icon: Clock, count: activities.filter(a => a.status === 'pending').length },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>All Activities</h1>
          <p style={{ color: colors.textSecondary }}>View all activities in the system</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/hod/create-activity')}>Create Activity</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{activities.length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Activities</p>
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
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{activities.reduce((sum, a) => sum + (a.points || 0), 0)}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Points</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
        <input
          type="text"
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '500px', padding: '14px 16px 14px 48px', fontSize: '14px', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, outline: 'none' }}
        />
      </div>

      {/* Activities Table */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredActivities.length > 0 ? (
          <Table
            columns={[
              {
                header: 'Activity', render: (row) => (
                  <div>
                    <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{row.title}</p>
                    <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.description?.substring(0, 50)}...</p>
                  </div>
                )
              },
              { header: 'Category', render: (row) => <Badge variant="primary">{row.category || 'General'}</Badge> },
              {
                header: 'Created By', render: (row) => {
                  const creator = getCreatorIcon(row);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <creator.icon size={16} color={creator.color} />
                      <div>
                        <span style={{ color: colors.text, fontWeight: '500' }}>
                          {row.clubName || row.hodName || row.deanName || creator.label}
                        </span>
                        <p style={{ fontSize: '11px', color: colors.textMuted }}>{creator.label}</p>
                      </div>
                    </div>
                  );
                }
              },
              {
                header: 'Points', render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} color={colors.warning} />
                    <span style={{ fontWeight: '600', color: colors.warning }}>{row.points}</span>
                  </div>
                )
              },
              {
                header: 'Date', render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textSecondary }}>
                    <Calendar size={14} />
                    {row.date || 'TBD'}
                  </div>
                )
              },
              {
                header: 'Status', render: (row) => (
                  <Badge variant={row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'}>
                    {row.status === 'approved' ? '✓ Approved' : row.status === 'pending' ? '⏳ Pending' : row.status}
                  </Badge>
                )
              },
              {
                header: 'Actions', render: (row) => (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => viewDetails(row)} 
                      style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.primary, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
                    >
                      <Eye size={16} /> View
                    </button>
                    {row.status === 'approved' && (
                      <button 
                        onClick={() => navigate('/hod/allocate-points', { state: { activity: row } })} 
                        style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.secondary, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
                      >
                        <Award size={16} /> Points
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(row.id, row.title)}
                      disabled={deleting}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: 'none', 
                        borderRadius: '8px', 
                        padding: '8px 12px', 
                        cursor: deleting ? 'not-allowed' : 'pointer', 
                        color: colors.danger, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '13px', 
                        fontWeight: '500',
                        opacity: deleting ? 0.5 : 1
                      }}
                      title="Delete Activity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              },
            ]}
            data={filteredActivities}
          />
        ) : (
          <EmptyState
            icon={Activity}
            title="No activities found"
            description={searchTerm ? "Try adjusting your search" : "Create your first activity"}
            action={<Button icon={Plus} onClick={() => navigate('/hod/create-activity')}>Create Activity</Button>}
          />
        )}
      </Card>

      {/* Activity Details Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedActivity(null); }} title="Activity Details" size="large">
        {selectedActivity && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>{selectedActivity.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Badge variant="primary">{selectedActivity.category || 'General'}</Badge>
                <Badge variant="warning">{selectedActivity.points} Points</Badge>
                <Badge variant={selectedActivity.status === 'approved' ? 'success' : 'warning'}>
                  {selectedActivity.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                </Badge>
              </div>
            </div>

            <div style={{ background: colors.card, borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</h4>
              <p style={{ color: colors.text, lineHeight: '1.6' }}>{selectedActivity.description || 'No description provided'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: colors.card, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <Calendar size={20} color={colors.primary} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Date</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{selectedActivity.date || 'TBD'}</p>
              </div>
              <div style={{ background: colors.card, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <MapPin size={20} color={colors.primary} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Venue</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{selectedActivity.venue || 'TBD'}</p>
              </div>
              <div style={{ background: colors.card, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <Users size={20} color={colors.primary} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Max Participants</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{selectedActivity.maxParticipants || 'Unlimited'}</p>
              </div>
            </div>

            {/* Creator Info */}
            <div style={{ background: colors.card, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '8px' }}>Created By</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {(() => {
                  const creator = getCreatorIcon(selectedActivity);
                  return (
                    <>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${creator.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <creator.icon size={20} color={creator.color} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', color: colors.text }}>
                          {selectedActivity.clubName || selectedActivity.hodName || selectedActivity.deanName || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '13px', color: colors.textMuted }}>{creator.label}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {selectedActivity.status === 'approved' && (
                <Button 
                  fullWidth 
                  onClick={() => { setShowModal(false); navigate('/hod/allocate-points', { state: { activity: selectedActivity } }); }} 
                  icon={Award}
                >
                  Allocate Points for this Activity
                </Button>
              )}
              <Button 
                variant="danger"
                fullWidth 
                onClick={() => handleDelete(selectedActivity.id, selectedActivity.title)}
                disabled={deleting}
                icon={Trash2}
              >
                {deleting ? 'Deleting...' : 'Delete Activity'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HODMyActivities;