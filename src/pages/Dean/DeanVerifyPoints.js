import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Modal, Table, Badge, Avatar, Toast, EmptyState, Textarea } from '../../components/UIComponents';
import { CheckCircle, XCircle, Clock, Award, Eye, Users, FileText, UserCheck, File, Download } from 'lucide-react';

const DeanVerifyPoints = () => {
  const { userData } = useAuth();
  const [pendingAllocations, setPendingAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [pendingRejectionAllocation, setPendingRejectionAllocation] = useState(null);

  useEffect(() => {
    if (userData?.uid) fetchAllocations();
  }, [userData]);

  const fetchAllocations = async () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }
    
    try {
      const q = query(
        collection(db, 'pointAllocations'),
        where('deanId', '==', userData.uid),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      setPendingAllocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching allocations:', error);
      setToast({ message: 'Failed to fetch pending allocations', type: 'error' });
    }
    setLoading(false);
  };

  const handleVerify = async (allocation, status) => {
    setProcessing(true);
    try {
      const batch = writeBatch(db);

      const allocationRef = doc(db, 'pointAllocations', allocation.id);
      batch.update(allocationRef, {
        status: status,
        verifiedBy: userData?.uid,
        verifiedByName: userData?.name,
        verifiedAt: new Date().toISOString(),
      });

      if (status === 'approved' && allocation.students) {
        for (const student of allocation.students) {
          const studentsQuery = query(
            collection(db, 'users'),
            where('email', '==', student.email)
          );
          const studentSnap = await getDocs(studentsQuery);
          
          if (!studentSnap.empty) {
            const studentDoc = studentSnap.docs[0];
            batch.update(doc(db, 'users', studentDoc.id), {
              points: increment(student.points || allocation.pointsPerStudent || 0),
              activitiesParticipated: increment(1),
            });

            const historyRef = doc(collection(db, 'pointHistory'));
            batch.set(historyRef, {
              studentId: studentDoc.id,
              studentEmail: student.email,
              studentName: student.name,
              activityId: allocation.activityId,
              activityTitle: allocation.activityTitle,
              points: student.points || allocation.pointsPerStudent || 0,
              role: student.role || 'Participant',
              clubId: allocation.clubId,
              clubName: allocation.clubName,
              allocatedAt: new Date().toISOString(),
              verifiedBy: userData?.uid,
              supportingPDFURL: allocation.supportingPDFURL,
              supportingPDFName: allocation.supportingPDFName,
            });
          }
        }
      }

      await batch.commit();
      
      setToast({ 
        message: `Points ${status === 'approved' ? 'approved and allocated' : 'rejected'} successfully!`, 
        type: status === 'approved' ? 'success' : 'warning' 
      });
      
      setShowModal(false);
      setSelectedAllocation(null);
      fetchAllocations();
    } catch (error) {
      console.error('Error verifying points:', error);
      setToast({ message: 'Failed to verify points: ' + error.message, type: 'error' });
    }
    setProcessing(false);
  };

  const viewDetails = (allocation) => {
    setSelectedAllocation(allocation);
    setShowModal(true);
  };

  const openRemarksModal = (allocation) => {
    setPendingRejectionAllocation(allocation);
    setRejectionRemarks('');
    setShowRemarksModal(true);
  };

  const handleRejectWithRemarks = async () => {
    if (!rejectionRemarks.trim()) {
      setToast({ message: 'Please provide remarks for rejection.', type: 'warning' });
      return;
    }

    setProcessing(true);
    try {
      const allocation = pendingRejectionAllocation;
      const batch = writeBatch(db);

      const allocationRef = doc(db, 'pointAllocations', allocation.id);
      batch.update(allocationRef, {
        status: 'rejected',
        remarks: rejectionRemarks,
        verifiedBy: userData?.uid,
        verifiedByName: userData?.name,
        verifiedAt: new Date().toISOString(),
      });

      await batch.commit();

      setToast({ message: '✗ Points allocation rejected with remarks', type: 'warning' });
      setShowRemarksModal(false);
      setPendingRejectionAllocation(null);
      setSelectedAllocation(null);
      setShowModal(false);
      setRejectionRemarks('');
      fetchAllocations();
    } catch (error) {
      console.error('Error processing rejection:', error);
      setToast({ message: 'Failed to process rejection', type: 'error' });
    }
    setProcessing(false);
  };

  const getTotalPoints = (allocation) => {
    if (allocation.students) {
      return allocation.students.reduce((sum, s) => sum + (s.points || allocation.pointsPerStudent || 0), 0);
    }
    return 0;
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

  // Get unique roles count
  const getRoleSummary = (allocation) => {
    if (!allocation.students) return {};
    const roleCounts = {};
    allocation.students.forEach(s => {
      const role = s.role || 'Participant';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    return roleCounts;
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Verify Point Allocations</h1>
          <p style={{ color: colors.textSecondary }}>Review and approve points submitted by clubs for students</p>
        </div>
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
          <span style={{ color: colors.warning, fontWeight: '600' }}>{pendingAllocations.length} Pending</span>
        </div>
      </div>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : pendingAllocations.length > 0 ? (
          <Table
            columns={[
              { header: 'Activity', render: (row) => (
                <div>
                  <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{row.activityTitle}</p>
                  <p style={{ fontSize: '13px', color: colors.textMuted }}>ID: {row.activityId?.substring(0, 8)}...</p>
                </div>
              )},
              { header: 'Club', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar name={row.clubName || 'Club'} size={32} />
                  <span style={{ color: colors.textSecondary }}>{row.clubName}</span>
                </div>
              )},
              { header: 'Students', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color={colors.primary} />
                  <span style={{ fontWeight: '600', color: colors.text }}>{row.students?.length || 0}</span>
                </div>
              )},
              { header: 'Roles', render: (row) => {
                const roleSummary = getRoleSummary(row);
                const roleEntries = Object.entries(roleSummary).slice(0, 2);
                return (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {roleEntries.map(([role, count]) => (
                      <Badge key={role} variant={getRoleBadgeVariant(role)} size="small">
                        {role}: {count}
                      </Badge>
                    ))}
                    {Object.keys(roleSummary).length > 2 && (
                      <Badge variant="neutral" size="small">+{Object.keys(roleSummary).length - 2} more</Badge>
                    )}
                  </div>
                );
              }},
              { header: 'Total Points', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color={colors.warning} />
                  <span style={{ fontWeight: '600', color: colors.warning }}>{getTotalPoints(row)}</span>
                </div>
              )},
              { header: 'Submitted', render: (row) => (
                <span style={{ color: colors.textSecondary, fontSize: '13px' }}>
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              )},
              { header: 'Actions', render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => viewDetails(row)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.primary, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                    <Eye size={16} /> View
                  </button>
                  <button onClick={() => handleVerify(row, 'approved')} disabled={processing} style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.secondary, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => openRemarksModal(row)} disabled={processing} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.danger, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )},
            ]}
            data={pendingAllocations}
          />
        ) : (
          <EmptyState icon={CheckCircle} title="All caught up!" description="There are no pending point allocations to verify." />
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedAllocation(null); }} title="Point Allocation Details" size="large">
        {selectedAllocation && (
          <div>
            <div style={{ marginBottom: '24px', padding: '20px', background: colors.card, borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>{selectedAllocation.activityTitle}</h3>
                  <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Submitted by {selectedAllocation.clubName}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '28px', fontWeight: '700', color: colors.warning }}>{getTotalPoints(selectedAllocation)}</p>
                  <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Points</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Badge variant="primary">{selectedAllocation.students?.length || 0} Students</Badge>
                <Badge variant="warning">{selectedAllocation.pointsPerStudent || 'Variable'} pts each</Badge>
              </div>
            </div>

            {/* Supporting PDF Section */}
            {selectedAllocation.supportingPDFURL && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <File size={24} color={colors.primary} />
                    <div>
                      <p style={{ fontWeight: '600', color: colors.text, marginBottom: '2px' }}>Supporting Document</p>
                      <p style={{ fontSize: '12px', color: colors.textMuted }}>{selectedAllocation.supportingPDFName}</p>
                    </div>
                  </div>
                  <a 
                    href={selectedAllocation.supportingPDFURL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: '#fff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={16} /> View PDF
                  </a>
                </div>
              </div>
            )}

            {/* Role Summary */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={16} /> Role Summary
              </h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(getRoleSummary(selectedAllocation)).map(([role, count]) => (
                  <div key={role} style={{
                    padding: '12px 16px',
                    background: colors.cardHover,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Badge variant={getRoleBadgeVariant(role)}>{role}</Badge>
                    <span style={{ fontWeight: '600', color: colors.text }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Student List</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '24px' }}>
              {selectedAllocation.students?.map((student, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: idx % 2 === 0 ? colors.card : 'transparent',
                  borderRadius: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={student.name || student.email} size={36} />
                    <div>
                      <p style={{ fontWeight: '500', color: colors.text }}>{student.name || 'Unknown'}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>{student.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Badge variant={getRoleBadgeVariant(student.role || 'Participant')}>
                      {student.role || 'Participant'}
                    </Badge>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} color={colors.warning} />
                      <span style={{ fontWeight: '600', color: colors.warning }}>{student.points || selectedAllocation.pointsPerStudent || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="success" fullWidth onClick={() => handleVerify(selectedAllocation, 'approved')} icon={CheckCircle} loading={processing}>
                Approve & Allocate Points
              </Button>
              <Button variant="danger" fullWidth onClick={() => openRemarksModal(selectedAllocation)} icon={XCircle} loading={processing}>
                Reject Allocation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Remarks Modal for Rejection */}
      <Modal
        isOpen={showRemarksModal}
        onClose={() => {
          setShowRemarksModal(false);
          setPendingRejectionAllocation(null);
          setRejectionRemarks('');
        }}
        title="Add Remarks for Rejection"
      >
        <div style={{ marginBottom: '20px' }}>
          <Textarea
            label="Remarks/Reason for Rejection"
            value={rejectionRemarks}
            onChange={e => setRejectionRemarks(e.target.value)}
            placeholder="Enter the reason for rejecting this point allocation..."
            rows={4}
            required
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="danger"
            fullWidth
            loading={processing}
            onClick={handleRejectWithRemarks}
            disabled={processing}
          >
            Reject & Save Remarks
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setShowRemarksModal(false);
              setPendingRejectionAllocation(null);
              setRejectionRemarks('');
            }}
            disabled={processing}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DeanVerifyPoints;