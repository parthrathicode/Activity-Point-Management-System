import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Table, Badge, Toast, EmptyState, Modal, Button, Input, Select, Textarea, Tabs } from '../../components/UIComponents';
import { Activity, Award, Calendar, MapPin, Search, Clock, Users, Briefcase, Plus, CheckCircle, XCircle, FileText, MessageCircle } from 'lucide-react';

const StudentActivities = () => {
  const { userData } = useAuth();
  const [activities, setActivities] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkToShow, setRemarkToShow] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    points: '',
    date: '',
    venue: '',
    proof: '',
  });

  useEffect(() => {
    if (userData?. uid) {
      fetchActivities();
      fetchMySubmissions();
    }
  }, [userData]);

  const fetchActivities = async () => {
    try {
      let allActivities = [];

      const studentIdQuery = query(
        collection(db, 'studentActivities'),
        where('studentId', '==', userData. uid),
        where('status', '==', 'active')
      );
      const studentIdSnap = await getDocs(studentIdQuery);
      studentIdSnap.docs.forEach(doc => {
        allActivities.push({ id: doc.id, ...doc.data() });
      });

      if (userData.email) {
        const emailQuery = query(
          collection(db, 'studentActivities'),
          where('studentEmail', '==', userData.email),
          where('status', '==', 'active')
        );
        const emailSnap = await getDocs(emailQuery);
        emailSnap.docs.forEach(doc => {
          if (! allActivities.find(a => a.id === doc.id)) {
            allActivities.push({ id: doc. id, ...doc.data() });
          }
        });
      }

      if (userData.counsellorId) {
        const counsellorQuery = query(
          collection(db, 'studentActivities'),
          where('counsellorId', '==', userData. counsellorId),
          where('status', '==', 'active')
        );
        const counsellorSnap = await getDocs(counsellorQuery);
        counsellorSnap.docs.forEach(doc => {
          if (!allActivities.find(a => a. id === doc.id)) {
            allActivities.push({ id: doc.id, ...doc. data() });
          }
        });
      }

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setToast({ message: 'Failed to fetch activities', type: 'error' });
    }
    setLoading(false);
  };

  const fetchMySubmissions = async () => {
    try {
      const q = query(
        collection(db, 'studentActivitySubmissions'),
        where('studentId', '==', userData.uid)
      );
      const snapshot = await getDocs(q);
      setMySubmissions(snapshot.docs. map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleSubmitActivity = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'studentActivitySubmissions'), {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        points: parseInt(formData.points),
        date: formData.date,
        venue: formData.venue,
        proof: formData.proof,
        studentId: userData. uid,
        studentEmail: userData.email,
        studentName: userData.name,
        studentRollNumber: userData.rollNumber,
        counsellorId: userData.counsellorId,
        counsellorName: userData.counsellorName,
        deanId: userData.deanId,
        deanName: userData. deanName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      setToast({ message:  'Activity submitted for approval! ', type: 'success' });
      setShowSubmitModal(false);
      resetForm();
      fetchMySubmissions();
    } catch (error) {
      console.error('Error submitting activity:', error);
      setToast({ message: 'Failed to submit activity', type: 'error' });
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category:  '',
      points: '',
      date: '',
      venue: '',
      proof: '',
    });
  };

  const filteredActivities = activities.filter(a =>
    a.activityTitle?. toLowerCase().includes(searchTerm. toLowerCase()) ||
    a.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubmissions = mySubmissions.filter(s =>
    s.title?. toLowerCase().includes(searchTerm. toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewDetails = (activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const openRemarkModal = (remark) => {
    setRemarkToShow(remark);
    setShowRemarkModal(true);
  };

  const categories = [
    { value: 'Workshop', label: 'Workshop' },
    { value: 'Seminar', label: 'Seminar' },
    { value:  'Competition', label: 'Competition' },
    { value: 'Cultural', label: 'Cultural Event' },
    { value: 'Sports', label: 'Sports Event' },
    { value: 'Social', label: 'Social Service' },
    { value: 'Technical', label: 'Technical Event' },
    { value: 'Hackathon', label: 'Hackathon' },
    { value: 'Certification', label: 'Certification' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Project', label: 'Project' },
    { value: 'Other', label: 'Other' },
  ];

  const tabs = [
    { id: 'available', label: 'Available Activities', icon: Activity, count: activities.length },
    { id: 'my-submissions', label: 'My Submissions', icon: FileText, count: mySubmissions. length },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': 
        return <Badge variant="warning">⏳ Pending</Badge>;
      case 'approved': 
        return <Badge variant="success">✓ Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">✗ Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>
            Activities
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Browse activities or submit your own to earn points
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowSubmitModal(true)}>
          Submit Activity
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap:  '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems:  'center', justifyContent:  'center' }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
                {activities.length}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Available</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background:  colors.gradientOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
                {mySubmissions.filter(s => s.status === 'pending').length}
              </p>
              <p style={{ fontSize: '13px', color:  colors.textMuted }}>Pending</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems:  'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
                {mySubmissions.filter(s => s.status === 'approved').length}
              </p>
              <p style={{ fontSize:  '13px', color: colors. textMuted }}>Approved</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height:  '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors. text }}>
                {mySubmissions.filter(s => s.status === 'approved').reduce((sum, s) => sum + (s.points || 0), 0)}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Points Earned</p>
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
          style={{ width: '100%', maxWidth: '500px', padding: '14px 16px 14px 48px', fontSize: '14px', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, outline: 'none' }}
        />
      </div>

      {activeTab === 'available' ?  (
        /* Available Activities Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <Card key={activity.id} style={{ cursor: 'pointer' }} onClick={() => viewDetails(activity)}>
                <div style={{
                  height: '120px',
                  background: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.primaryLight}40 100%)`,
                  borderRadius: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:  'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <Activity size={48} color={colors.primary} />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: colors.gradient,
                    padding: '6px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <Award size={14} color="#fff" />
                    <span style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>
                      {activity.points} pts
                    </span>
                  </div>
                </div>

                <Badge variant="primary" size="small" style={{ marginBottom: '12px' }}>
                  {activity.category}
                </Badge>

                <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>
                  {activity.activityTitle}
                </h3>

                <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '16px', lineHeight: '1.5' }}>
                  {activity.description?. substring(0, 80)}... 
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap:  '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textSecondary, fontSize: '13px' }}>
                    <Calendar size={14} />
                    {activity.date || 'Date TBD'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textSecondary, fontSize: '13px' }}>
                    <MapPin size={14} />
                    {activity.venue || 'Venue TBD'}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                icon={Activity}
                title="No activities available yet"
                description="Submit your own activities to earn points!"
                action={<Button icon={Plus} onClick={() => setShowSubmitModal(true)}>Submit Activity</Button>}
              />
            </div>
          )}
        </div>
      ) : (
        /* My Submissions Table */
        <Card>
          {mySubmissions.length > 0 ? (
            <Table
              columns={[
                {
                  header: 'Activity',
                  render: (row) => (
                    <div>
                      <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{row.title}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.description?. substring(0, 50)}...</p>
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
                      {row. date || 'N/A'}
                    </div>
                  )
                },
                {
                  header:  'Status',
                  render: (row) => (
                    <div>
                      {getStatusBadge(row.status)}
                      {row.status === 'rejected' && row.remarks && (
                        <div style={{ marginTop: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRemarkModal(row.remarks);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: colors.danger,
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight:  '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e. target.style.background = 'rgba(239, 68, 68, 0.1)';
                            }}
                          >
                            <MessageCircle size={12} />
                            View Remark
                          </button>
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  header: 'Submitted',
                  render: (row) => (
                    <span style={{ color: colors.textMuted, fontSize: '13px' }}>
                      {row. createdAt ?  new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  )
                },
              ]}
              data={filteredSubmissions}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No submissions yet"
              description="Submit your activities to earn points!"
              action={<Button icon={Plus} onClick={() => setShowSubmitModal(true)}>Submit Activity</Button>}
            />
          )}
        </Card>
      )}

      {/* Activity Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedActivity(null); }}
        title="Activity Details"
        size="large"
      >
        {selectedActivity && (
          <div>
            <div style={{
              height: '150px',
              background: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.primaryLight}40 100%)`,
              borderRadius: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <Activity size={64} color={colors.primary} />
              <div style={{
                position:  'absolute',
                bottom: '-20px',
                left: '24px',
                background: colors.gradient,
                padding: '12px 24px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              }}>
                <Award size={20} color="#fff" />
                <span style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>
                  {selectedActivity.points} Points
                </span>
              </div>
            </div>

            <div style={{ marginTop: '32px', marginBottom: '24px' }}>
              <Badge variant="primary" style={{ marginBottom: '12px' }}>
                {selectedActivity.category}
              </Badge>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>
                {selectedActivity.activityTitle}
              </h2>
              <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
                Published by {selectedActivity. deanName || "Dean's Office"}
              </p>
            </div>

            <div style={{ background: colors.card, borderRadius: '16px', padding:  '24px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Description
              </h4>
              <p style={{ color: colors. text, lineHeight: '1.7', fontSize: '15px' }}>
                {selectedActivity. description || 'No description provided'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns:  '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: colors.card, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <Calendar size={24} color={colors.primary} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Date</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>
                  {selectedActivity.date || 'TBD'}
                </p>
              </div>
              <div style={{ background: colors.card, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <MapPin size={24} color={colors.primary} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Venue</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>
                  {selectedActivity.venue || 'TBD'}
                </p>
              </div>
              <div style={{ background: colors.card, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <Users size={24} color={colors. primary} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Status</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.secondary }}>
                  ✓ Available
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p style={{ color: colors.secondary, fontWeight: '500', fontSize: '15px' }}>
                ✨ Participate in this activity to earn <strong>{selectedActivity.points} points</strong>! 
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Submit Activity Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => { setShowSubmitModal(false); resetForm(); }}
        title="Submit Your Activity"
        size="large"
      >
        <form onSubmit={handleSubmitActivity}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <p style={{ color: colors.primary, fontSize: '14px', textAlign: 'center' }}>
              📝 Submit activities you've participated in.  Your counsellor will review and approve them.
            </p>
          </div>

          <Input
            label="Activity Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e. target.value })}
            placeholder="e.g., Tech Hackathon 2024"
            required
            disabled={submitting}
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the activity and your participation..."
            rows={3}
            required
            disabled={submitting}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ... formData, category: e.target.value })}
              options={categories}
              placeholder="Select category"
              required
              disabled={submitting}
            />
            <Input
              label="Points Requested"
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              placeholder="Enter points"
              required
              disabled={submitting}
              min="1"
              max="100"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns:  '1fr 1fr', gap: '16px' }}>
            <Input
              label="Date of Activity"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              disabled={submitting}
            />
            <Input
              label="Venue/Location"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="Enter venue"
              disabled={submitting}
            />
          </div>
          <Input
            label="Proof/Certificate Link (Optional)"
            value={formData.proof}
            onChange={(e) => setFormData({ ...formData, proof: e.target. value })}
            placeholder="Link to certificate, photo, or other proof"
            disabled={submitting}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button
              type="submit"
              fullWidth
              loading={submitting}
              disabled={submitting}
            >
              Submit for Approval
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => { setShowSubmitModal(false); resetForm(); }}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remark Modal */}
      <Modal
        isOpen={showRemarkModal}
        onClose={() => setShowRemarkModal(false)}
        title="Rejection Remark"
        size="small"
      >
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.05)', 
          padding: '16px', 
          borderRadius: '12px', 
          border: `1px solid rgba(239, 68, 68, 0.2)`,
          marginBottom: '20px'
        }}>
          <p style={{ color: colors. danger, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            {remarkToShow}
          </p>
        </div>
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={() => setShowRemarkModal(false)}
        >
          Close
        </Button>
      </Modal>

      {toast && <Toast message={toast. message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default StudentActivities;