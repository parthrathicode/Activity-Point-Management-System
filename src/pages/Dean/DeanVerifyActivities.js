import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Modal, Table, Badge, Avatar, Toast, EmptyState } from '../../components/UIComponents';
import { CheckCircle, XCircle, Clock, Activity, Eye, Award, Calendar, MapPin } from 'lucide-react';

const DeanVerifyActivities = () => {
  const { userData } = useAuth();
  const [pendingActivities, setPendingActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(false);

useEffect(() => {
  if (userData?.uid) fetchActivities();
}, [userData]);

const fetchActivities = async () => {
  if (!userData?.uid) {
    setLoading(false);
    return;
  }
  
  try {
    const q = query(
      collection(db, 'activities'),
      where('deanId', '==', userData.uid),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    setPendingActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error('Error fetching activities:', error);
    setToast({ message: 'Failed to fetch pending activities', type: 'error' });
  }
  setLoading(false);
};

const handleVerify = async (activityId, status) => {
  setProcessing(true);
  try {
    const batch = writeBatch(db);
    const activity = pendingActivities.find(a => a.id === activityId);

    // Update activity status
    const activityRef = doc(db, 'activities', activityId);
    batch.update(activityRef, {
      status: status,
      verifiedBy: userData?.uid,
      verifiedByName: userData?.name,
      verifiedAt: new Date().toISOString(),
    });

    // If approved, send directly to ALL students under this dean
    if (status === 'approved') {
      // Get ALL students under this dean
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('deanId', '==', userData.uid)
      );
      const studentsSnap = await getDocs(studentsQuery);

      console.log(`[DeanVerifyActivities] Sending activity to ${studentsSnap.size} students directly`);

      for (const studentDoc of studentsSnap.docs) {
        const studentData = studentDoc.data();
        const studentActivityRef = doc(collection(db, 'studentActivities'));
        batch.set(studentActivityRef, {
          activityId: activityId,
          activityTitle: activity.title,
          description: activity.description,
          category: activity.category,
          date: activity.date,
          venue: activity.venue,
          points: activity.points,
          maxParticipants: activity.maxParticipants || 0,
          // Student info
          studentId: studentDoc.id,
          studentEmail: studentData.email,
          studentName: studentData.name,
          // Source info (from club, verified by dean)
          fromName: activity.clubName || userData.name,
          fromId: activity.clubId || userData.uid,
          fromType: activity.clubId ? 'club' : 'dean',
          // Dean info
          allocatedBy: 'dean',
          allocatedByName: userData?.name,
          deanId: userData?.uid,
          deanName: userData?.name,
          // Counsellor info (for querying - use student's counsellor)
          counsellorId: studentData.counsellorId || null,
          counsellorName: studentData.counsellorName || null,
          // Status
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      
      setToast({ 
        message: `Activity approved and sent to ${studentsSnap.size} students directly!`, 
        type: 'success' 
      });
    } else {
      // Rejected
      await batch.commit();
      setToast({ 
        message: 'Activity rejected successfully!', 
        type: 'warning' 
      });
    }
    
    setShowModal(false);
    setSelectedActivity(null);
    fetchActivities();
  } catch (error) {
    console.error('Error verifying activity:', error);
    setToast({ message: 'Failed to verify activity', type: 'error' });
  }
  setProcessing(false);
};

const viewDetails = (activity) => {
  setSelectedActivity(activity);
  setShowModal(true);
};

return (
  <div style={{ animation: 'fadeIn 0.5s ease' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Verify Activities</h1>
        <p style={{ color: colors.textSecondary }}>Review and approve activities proposed by clubs (sent directly to all students)</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.1)', 
          padding: '12px 20px', 
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={20} color={colors.warning} />
          <span style={{ color: colors.warning, fontWeight: '600' }}>{pendingActivities.length} Pending</span>
        </div>
      </div>
    </div>

    <Card>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : pendingActivities.length > 0 ? (
        <Table
          columns={[
            { header: 'Activity', render: (row) => (
              <div>
                <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{row.title}</p>
                <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.description?.substring(0, 60)}...</p>
              </div>
            )},
            { header: 'Proposed By', render: (row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar name={row.clubName || 'Club'} size={32} />
                <span style={{ color: colors.textSecondary }}>{row.clubName || 'Unknown Club'}</span>
              </div>
            )},
            { header: 'Category', render: (row) => <Badge variant="primary">{row.category || 'General'}</Badge> },
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
            { header: 'Actions', render: (row) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => viewDetails(row)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.primary, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                  <Eye size={16} /> View
                </button>
                <button onClick={() => handleVerify(row.id, 'approved')} disabled={processing} style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.secondary, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                  <CheckCircle size={16} /> Approve
                </button>
                <button onClick={() => handleVerify(row.id, 'rejected')} disabled={processing} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.danger, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                  <XCircle size={16} /> Reject
                </button>
              </div>
            )},
          ]}
          data={pendingActivities}
        />
      ) : (
        <EmptyState 
          icon={CheckCircle} 
          title="All caught up!" 
          description="There are no pending activities to verify at the moment." 
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
            </div>
          </div>

          <div style={{ background: colors.card, borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</h4>
            <p style={{ color: colors.text, lineHeight: '1.6' }}>{selectedActivity.description || 'No description provided'}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: colors.card, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={18} color={colors.primary} />
                <span style={{ fontSize: '13px', color: colors.textSecondary }}>Date</span>
              </div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{selectedActivity.date || 'To be announced'}</p>
            </div>

            <div style={{ background: colors.card, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MapPin size={18} color={colors.primary} />
                <span style={{ fontSize: '13px', color: colors.textSecondary }}>Venue</span>
              </div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{selectedActivity.venue || 'To be announced'}</p>
            </div>
          </div>

          <div style={{ background: colors.card, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar name={selectedActivity.clubName || 'Club'} size={44} />
              <div>
                <p style={{ fontSize: '13px', color: colors.textSecondary }}>Proposed by</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{selectedActivity.clubName || 'Unknown Club'}</p>
              </div>
            </div>
          </div>

          {/* Info box about direct student allocation */}
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <p style={{ color: colors.primary, fontSize: '14px', textAlign: 'center' }}>
              ✨ Approving this activity will send it directly to <strong>all students</strong> under your management.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="success" fullWidth onClick={() => handleVerify(selectedActivity.id, 'approved')} icon={CheckCircle} loading={processing}>
              Approve & Send to Students
            </Button>
            <Button variant="danger" fullWidth onClick={() => handleVerify(selectedActivity.id, 'rejected')} icon={XCircle} loading={processing}>
              Reject Activity
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

export default DeanVerifyActivities;