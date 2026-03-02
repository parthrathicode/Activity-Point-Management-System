import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Modal, Table, Badge, Avatar, Toast, EmptyState, Tabs, Textarea } from '../../components/UIComponents';
import { CheckCircle, XCircle, Clock, FileText, Eye, Award, Calendar, MapPin, User, Link } from 'lucide-react';

const CounsellorProposals = () => {
  const { userData, loading:  authLoading } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [pendingRejectionSubmission, setPendingRejectionSubmission] = useState(null);

  useEffect(() => {
    if (! authLoading && userData?. uid) {
      fetchSubmissions();
    }
  }, [userData, authLoading]);

  const fetchSubmissions = async () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'studentActivitySubmissions'),
        where('counsellorId', '==', userData.uid)
      );
      const snapshot = await getDocs(q);
      setSubmissions(snapshot.docs.map(doc => ({ id: doc. id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setToast({ message: 'Failed to fetch student submissions', type: 'error' });
    }
    setLoading(false);
  };

  const handleApprove = async (submission) => {
    setProcessing(true);
    try {
      const batch = writeBatch(db);

      const submissionRef = doc(db, 'studentActivitySubmissions', submission.id);
      batch.update(submissionRef, {
        status: 'approved',
        reviewedBy: userData.uid,
        reviewedByName: userData.name,
        reviewedAt: new Date().toISOString(),
      });

      const studentRef = doc(db, 'users', submission.studentId);
      batch.update(studentRef, {
        points: increment(submission.points),
        activitiesParticipated: increment(1),
      });

      const pointHistoryRef = doc(collection(db, 'pointHistory'));
      batch.set(pointHistoryRef, {
        studentId: submission.studentId,
        studentEmail: submission.studentEmail,
        studentName: submission.studentName,
        activityTitle: submission.title,
        activityId: submission.id,
        points: submission.points,
        category: submission.category,
        allocatedBy: userData.uid,
        allocatedByName: userData.name,
        allocatedByRole: 'counsellor',
        clubName: 'Student Submission',
        allocatedAt: new Date().toISOString(),
      });

      await batch.commit();

      setToast({
        message: `✓ Activity approved!  ${submission.points} points added to ${submission.studentName}`,
        type: 'success'
      });

      setShowModal(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error) {
      console.error('Error approving submission:', error);
      setToast({ message: 'Failed to approve submission', type: 'error' });
    }
    setProcessing(false);
  };

  const openRemarksModal = (submission) => {
    setPendingRejectionSubmission(submission);
    setRejectionRemarks('');
    setShowRemarksModal(true);
  };

  const handleRejectWithRemarks = async () => {
    if (!rejectionRemarks.trim()) {
      setToast({ message:  'Please provide remarks for rejection. ', type: 'warning' });
      return;
    }

    setProcessing(true);
    try {
      const submission = pendingRejectionSubmission;
      const batch = writeBatch(db);

      const submissionRef = doc(db, 'studentActivitySubmissions', submission.id);
      batch.update(submissionRef, {
        status: 'rejected',
        remarks: rejectionRemarks,
        reviewedBy: userData.uid,
        reviewedByName: userData.name,
        reviewedAt: new Date().toISOString(),
      });

      await batch.commit();

      setToast({ message: '✗ Activity rejected with remarks', type: 'warning' });
      setShowRemarksModal(false);
      setPendingRejectionSubmission(null);
      setSelectedSubmission(null);
      setShowModal(false);
      setRejectionRemarks('');
      fetchSubmissions();
    } catch (error) {
      console.error('Error processing rejection:', error);
      setToast({ message: 'Failed to process rejection', type: 'error' });
    }
    setProcessing(false);
  };

  const viewDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowModal(true);
  };

  const filteredSubmissions = submissions.filter(s => {
    if (activeTab === 'all') return true;
    return s.status === activeTab;
  });

  const tabs = [
    { id: 'pending', label: 'Pending Review', icon: Clock, count: submissions.filter(s => s.status === 'pending').length },
    { id: 'approved', label:  'Approved', icon: CheckCircle, count: submissions.filter(s => s.status === 'approved').length },
    { id: 'rejected', label:  'Rejected', icon: XCircle, count: submissions.filter(s => s.status === 'rejected').length },
    { id: 'all', label: 'All', count: submissions.length },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>
            Student Activity Approvals
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Review and approve activities submitted by your students
          </p>
        </div>
        {submissions.filter(s => s.status === 'pending').length > 0 && (
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
            <span style={{ color: colors.warning, fontWeight: '600' }}>
              {submissions. filter(s => s.status === 'pending').length} Pending
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientOrange, display: 'flex', alignItems:  'center', justifyContent:  'center' }}>
              <Clock size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
                {submissions.filter(s => s. status === 'pending').length}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Pending Review</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display:  'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius:  '12px', background: colors. gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors. text }}>
                {submissions. filter(s => s.status === 'approved').length}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Approved</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background:  'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
                {submissions.filter(s => s.status === 'rejected').length}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Rejected</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width:  '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
                {submissions.filter(s => s.status === 'approved').reduce((sum, s) => sum + (s.points || 0), 0)}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Points Awarded</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <Card>
        {loading ?  (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <Table
            columns={[
              {
                header: 'Student',
                render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={row.studentName} size={40} />
                    <div>
                      <p style={{ fontWeight: '600', color: colors.text, marginBottom: '2px' }}>{row.studentName}</p>
                      <p style={{ fontSize: '12px', color: colors.textMuted }}>{row.studentRollNumber}</p>
                    </div>
                  </div>
                )
              },
              {
                header: 'Activity',
                render: (row) => (
                  <div>
                    <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
                      {row.title}
                    </p>
                    <p style={{ fontSize:  '13px', color: colors.textMuted }}>
                      {row.description?. substring(0, 40)}...
                    </p>
                  </div>
                )
              },
              {
                header: 'Category',
                render: (row) => <Badge variant="primary">{row.category || 'General'}</Badge>
              },
              {
                header: 'Points',
                render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap:  '6px' }}>
                    <Award size={16} color={colors. warning} />
                    <span style={{ fontWeight: '600', color: colors.warning }}>
                      {row.points || 0}
                    </span>
                  </div>
                )
              },
              {
                header: 'Date',
                render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap:  '6px', color: colors.textSecondary }}>
                    <Calendar size={14} />
                    {row.date || 'N/A'}
                  </div>
                )
              },
              {
                header: 'Status',
                render: (row) => (
                  <div>
                    <Badge variant={
                      row.status === 'approved' ? 'success' : 
                        row.status === 'pending' ? 'warning' :  'danger'
                    }>
                      {row.status === 'pending' ? '⏳ Pending' : 
                        row.status === 'approved' ? '✓ Approved' :  '✗ Rejected'}
                    </Badge>
                    {row.status === 'rejected' && row.remarks && (
                      <div style={{ color: colors.danger, fontSize: '11px', marginTop: '6px', fontWeight: '500' }}>
                        Remarks: {row.remarks. substring(0, 30)}...
                      </div>
                    )}
                  </div>
                )
              },
              {
                header: 'Actions',
                render: (row) => (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => viewDetails(row)}
                      style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.primary, display: 'flex', alignItems:  'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
                    >
                      <Eye size={16} /> View
                    </button>
                    {row.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(row)}
                          disabled={processing}
                          style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.secondary, display: 'flex', alignItems: 'center', gap:  '6px', fontSize: '13px', fontWeight: '500', opacity: processing ? 0.5 : 1 }}
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button
                          onClick={() => openRemarksModal(row)}
                          disabled={processing}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.danger, display: 'flex', alignItems: 'center', gap:  '6px', fontSize: '13px', fontWeight: '500', opacity: processing ? 0.5 : 1 }}
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                )
              },
            ]}
            data={filteredSubmissions}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="No submissions found"
            description={activeTab === 'pending' ? "No pending activities to review." : "No activities in this category. "}
          />
        )}
      </Card>

      {/* Activity Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedSubmission(null); }}
        title="Activity Submission Details"
        size="large"
      >
        {selectedSubmission && (
          <div>
            {/* Student Info */}
            <div style={{ background: colors.card, borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems:  'center', gap: '16px' }}>
              <Avatar name={selectedSubmission.studentName} size={56} />
              <div>
                <p style={{ fontSize: '18px', fontWeight:  '600', color: colors.text, marginBottom: '4px' }}>
                  {selectedSubmission.studentName}
                </p>
                <p style={{ fontSize: '14px', color: colors.textMuted }}>
                  {selectedSubmission.studentRollNumber} • {selectedSubmission.studentEmail}
                </p>
              </div>
            </div>

            {/* Activity Details */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>
                {selectedSubmission. title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Badge variant="primary">{selectedSubmission.category || 'General'}</Badge>
                <Badge variant="warning">{selectedSubmission.points || 0} Points Requested</Badge>
              </div>
            </div>

            <div style={{ background: colors.card, borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Description
              </h4>
              <p style={{ color: colors.text, lineHeight: '1.6' }}>
                {selectedSubmission.description || 'No description provided'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap:  '16px', marginBottom: '20px' }}>
              <div style={{ background: colors.card, borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar size={18} color={colors.primary} />
                  <span style={{ fontSize: '13px', color: colors.textSecondary }}>Date of Activity</span>
                </div>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>
                  {selectedSubmission.date || 'Not specified'}
                </p>
              </div>

              <div style={{ background: colors.card, borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MapPin size={18} color={colors.primary} />
                  <span style={{ fontSize: '13px', color: colors.textSecondary }}>Venue</span>
                </div>
                <p style={{ fontSize:  '16px', fontWeight: '600', color: colors.text }}>
                  {selectedSubmission.venue || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Proof Link */}
            {selectedSubmission.proof && (
              <div style={{ background: colors.card, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Link size={18} color={colors.primary} />
                  <span style={{ fontSize: '13px', color: colors.textSecondary }}>Proof/Certificate</span>
                </div>
                <a
                  href={selectedSubmission.proof}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.primary, textDecoration: 'underline', wordBreak: 'break-all' }}
                >
                  {selectedSubmission.proof}
                </a>
              </div>
            )}

            {/* Submission Info */}
            <div style={{ background: colors.card, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>
                Submitted on: {selectedSubmission.createdAt ?  new Date(selectedSubmission.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>

            {/* Status Messages */}
            {selectedSubmission.status === 'pending' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  variant="success"
                  fullWidth
                  onClick={() => handleApprove(selectedSubmission)}
                  icon={CheckCircle}
                  loading={processing}
                >
                  Approve & Award {selectedSubmission.points} Points
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => openRemarksModal(selectedSubmission)}
                  icon={XCircle}
                  loading={processing}
                >
                  Reject Submission
                </Button>
              </div>
            )}

            {selectedSubmission.status === 'approved' && (
              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ color: colors.secondary, fontWeight: '500' }}>
                  ✓ This activity was approved and {selectedSubmission.points} points were awarded
                </p>
                {selectedSubmission.reviewedByName && (
                  <p style={{ color: colors.textMuted, fontSize: '13px', marginTop: '8px' }}>
                    Reviewed by {selectedSubmission.reviewedByName} on {selectedSubmission.reviewedAt ? new Date(selectedSubmission.reviewedAt).toLocaleDateString() : 'N/A'}
                  </p>
                )}
              </div>
            )}

            {selectedSubmission.status === 'rejected' && (
              <div style={{ padding: '16px', background:  'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                <p style={{ color: colors.danger, fontWeight: '500', marginBottom: '12px' }}>
                  ✗ This activity submission was rejected
                </p>
                {selectedSubmission.remarks && (
                  <div style={{ background: colors.card, padding: '12px', borderRadius: '8px', marginBottom: '12px', borderLeft: `3px solid ${colors.danger}` }}>
                    <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '4px' }}>Reason for rejection: </p>
                    <p style={{ color: colors.text, fontSize: '14px' }}>{selectedSubmission. remarks}</p>
                  </div>
                )}
                {selectedSubmission.reviewedByName && (
                  <p style={{ color: colors.textMuted, fontSize: '13px' }}>
                    Reviewed by {selectedSubmission.reviewedByName} on {selectedSubmission. reviewedAt ? new Date(selectedSubmission.reviewedAt).toLocaleDateString() : 'N/A'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Remarks Modal for Rejection */}
      <Modal
        isOpen={showRemarksModal}
        onClose={() => {
          setShowRemarksModal(false);
          setPendingRejectionSubmission(null);
          setRejectionRemarks('');
        }}
        title="Add Remarks for Rejection"
      >
        <div style={{ marginBottom: '20px' }}>
          <Textarea
            label="Remarks/Reason for Rejection"
            value={rejectionRemarks}
            onChange={e => setRejectionRemarks(e.target.value)}
            placeholder="Enter the reason for rejecting this submission..."
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
              setPendingRejectionSubmission(null);
              setRejectionRemarks('');
            }}
            disabled={processing}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        } 
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};

export default CounsellorProposals;