import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Input, Modal, Table, Badge, Toast, EmptyState, Select, Textarea, Tabs } from '../../components/UIComponents';
import { Activity, Plus, Trash2, Edit, Search, Calendar, Award, Clock, CheckCircle, Shield, Briefcase, Building2, File, Download, Eye } from 'lucide-react';

const DeanActivities = () => {
  const { userData } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pointAllocationPDFs, setPointAllocationPDFs] = useState({});
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    points: '',
    date: '',
    venue: '',
    maxParticipants: '',
  });

  useEffect(() => {
    if (userData?. uid) {
      fetchActivities();
    }
  }, [userData]);

  const fetchActivities = async () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }
    
    try {
      const q = query(
        collection(db, 'activities'),
        where('deanId', '==', userData.uid)
      );
      const snapshot = await getDocs(q);
      const activitiesData = snapshot.docs. map(doc => ({ id: doc.id, ... doc.data() }));
      setActivities(activitiesData);
      
      // Fetch point allocations for each activity to get PDFs
      await fetchPointAllocationPDFs(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setToast({ message: 'Failed to fetch activities', type: 'error' });
    }
    setLoading(false);
  };

  const fetchPointAllocationPDFs = async (activitiesData) => {
    try {
      const pdfsByActivity = {};
      
      for (const activity of activitiesData) {
        // Query point allocations for this activity that have PDFs
        const q = query(
          collection(db, 'pointAllocations'),
          where('activityId', '==', activity.id),
          where('status', '==', 'approved')
        );
        const snapshot = await getDocs(q);
        
        const pdfsList = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data. supportingPDFURL) {
            pdfsList. push({
              id: doc.id,
              name: data.supportingPDFName,
              url: data.supportingPDFURL,
              clubName: data.clubName,
              submittedBy: data.allocatedBy === 'club' ? 'Club' : 'HOD',
              createdAt: data.createdAt,
              studentCount: data.students?. length || 0,
              totalPoints: data.students?.reduce((sum, s) => sum + (s.points || data.pointsPerStudent || 0), 0) || 0
            });
          }
        });
        
        if (pdfsList.length > 0) {
          pdfsByActivity[activity.id] = pdfsList;
        }
      }
      
      setPointAllocationPDFs(pdfsByActivity);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editMode && selectedActivity) {
        // EDIT EXISTING ACTIVITY
        await updateDoc(doc(db, 'activities', selectedActivity.id), {
          title: formData.title,
          description: formData. description,
          category: formData.category,
          points: parseInt(formData.points),
          maxParticipants: parseInt(formData.maxParticipants) || 0,
          date:  formData.date,
          venue: formData.venue,
          updatedAt: new Date().toISOString(),
        });
        setToast({ message: 'Activity updated successfully! ', type: 'success' });
      } else {
        // CREATE NEW ACTIVITY - AUTOMATICALLY APPROVED & SENT DIRECTLY TO ALL STUDENTS
        const newActivityRef = doc(collection(db, 'activities'));
        const batch = writeBatch(db);
        
        // Step 1: Create activity document (Status: approved)
        batch.set(newActivityRef, {
          title: formData.title,
          description: formData. description,
          category: formData.category,
          points: parseInt(formData.points),
          maxParticipants: parseInt(formData.maxParticipants) || 0,
          date: formData.date,
          venue: formData.venue,
          deanId: userData?. uid,
          deanName: userData?.name,
          createdBy: 'dean',
          createdByName: userData?.name,
          createdAt: new Date().toISOString(),
          status: 'approved',
          participantsCount: 0,
        });

        // Step 2: Get ALL students under this dean and create studentActivities for each
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('deanId', '==', userData.uid)
        );
        const studentsSnap = await getDocs(studentsQuery);

        console.log(`[DeanActivities] Found ${studentsSnap.size} students under dean`);

        for (const studentDoc of studentsSnap.docs) {
          const studentData = studentDoc.data();
          const studentActivityRef = doc(collection(db, 'studentActivities'));
          batch.set(studentActivityRef, {
            activityId: newActivityRef.id,
            activityTitle: formData.title,
            description: formData.description,
            category: formData.category,
            date: formData.date,
            venue: formData.venue,
            points: parseInt(formData.points),
            maxParticipants:  parseInt(formData.maxParticipants) || 0,
            // Student info
            studentId: studentDoc.id,
            studentEmail: studentData.email,
            studentName: studentData.name,
            // Dean info (allocated by dean directly)
            allocatedBy: 'dean',
            allocatedByName: userData?. name,
            deanId: userData?.uid,
            deanName: userData?.name,
            // Counsellor info (for querying purposes - use student's counsellor)
            counsellorId: studentData.counsellorId || null,
            counsellorName:  studentData.counsellorName || null,
            // Status
            status: 'active',
            createdAt: new Date().toISOString(),
          });
        }

        await batch.commit();
        setToast({ 
          message: `Activity created and sent to ${studentsSnap. size} students directly! `, 
          type: 'success' 
        });
      }

      setShowModal(false);
      resetForm();
      fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      setToast({ 
        message: error.message || 'Failed to save activity', 
        type: 'error' 
      });
    }
    setSubmitting(false);
  };

  const handleEdit = (activity) => {
    setSelectedActivity(activity);
    setFormData({
      title: activity. title,
      description: activity. description || '',
      category: activity.category || '',
      points: activity. points?. toString() || '',
      date: activity.date || '',
      venue: activity.venue || '',
      maxParticipants: activity. maxParticipants?. toString() || '',
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (activityId, activityTitle) => {
    if (window.confirm(`Are you sure you want to delete "${activityTitle}"?  This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'activities', activityId));
        setToast({ message: 'Activity deleted successfully!', type:  'success' });
        fetchActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
        setToast({ message: 'Failed to delete activity', type: 'error' });
      }
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: '', 
      description: '', 
      category: '', 
      points: '', 
      date: '', 
      venue: '', 
      maxParticipants: '' 
    });
    setEditMode(false);
    setSelectedActivity(null);
  };

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.title?. toLowerCase().includes(searchTerm. toLowerCase()) ||
      a.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && a.status === activeTab;
  });

  const categories = [
    { value: 'Workshop', label: 'Workshop' },
    { value: 'Seminar', label: 'Seminar' },
    { value:  'Competition', label: 'Competition' },
    { value: 'Cultural', label: 'Cultural Event' },
    { value: 'Sports', label: 'Sports Event' },
    { value: 'Social', label: 'Social Service' },
    { value: 'Technical', label: 'Technical Event' },
  ];

  const tabs = [
    { id: 'all', label: 'All Activities', count: activities.length },
    { 
      id: 'approved', 
      label: 'Published', 
      icon: CheckCircle, 
      count:  activities.filter(a => a. status === 'approved').length 
    },
  ];

  // Helper function to get creator info
  const getCreatorInfo = (activity) => {
    if (activity.createdBy === 'dean') {
      return { icon: Shield, color: colors.primary, label: 'Dean', name: activity.deanName || 'Dean' };
    }
    if (activity.createdBy === 'hod') {
      return { icon: Building2, color: '#f59e0b', label: 'HOD', name: activity.hodName || 'HOD' };
    }
    if (activity.createdBy === 'club') {
      return { icon:  Briefcase, color: colors.warning, label: 'Club', name: activity.clubName || 'Club' };
    }
    return { icon: Activity, color: colors.textMuted, label: 'Unknown', name: 'Unknown' };
  };

  const openPDFModal = (pdfList) => {
    setSelectedPDF(pdfList);
    setShowPDFModal(true);
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>
            Activities Management
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Create and manage campus activities (sent directly to all students)
          </p>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => { resetForm(); setShowModal(true); }}
          disabled={submitting}
        >
          Create Activity
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color:  colors.text }}>
                {activities.filter(a => a. status === 'approved').length}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Published</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display:  'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius:  '12px', background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
                {activities.reduce((sum, a) => sum + (a.points || 0), 0)}
              </p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Points Available</p>
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

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
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
                      {row.title}
                    </p>
                    <p style={{ fontSize: '13px', color: colors.textMuted }}>
                      {row.description?. substring(0, 50)}...
                    </p>
                  </div>
                )
              },
              { 
                header: 'Category', 
                render: (row) => <Badge variant="primary">{row.category || 'General'}</Badge> 
              },
              { 
                header: 'Created By', 
                render: (row) => {
                  const creator = getCreatorInfo(row);
                  return (
                    <div style={{ display: 'flex', alignItems:  'center', gap: '8px' }}>
                      <creator.icon size={16} color={creator.color} />
                      <div>
                        <span style={{ color: colors.text, fontWeight: '500' }}>
                          {creator.name}
                        </span>
                        <p style={{ fontSize: '11px', color: colors.textMuted }}>{creator.label}</p>
                      </div>
                    </div>
                  );
                }
              },
              { 
                header: 'Points', 
                render: (row) => (
                  <div style={{ display: 'flex', alignItems:  'center', gap: '6px' }}>
                    <Award size={16} color={colors. warning} />
                    <span style={{ fontWeight: '600', color: colors.warning }}>
                      {row. points}
                    </span>
                  </div>
                )
              },
              { 
                header: 'Date', 
                render: (row) => (
                  <div style={{ display: 'flex', alignItems:  'center', gap: '6px', color: colors.textSecondary }}>
                    <Calendar size={14} />
                    {row.date || 'TBD'}
                  </div>
                )
              },
              { 
                header: 'Supporting PDFs',
                render: (row) => {
                  const pdfs = pointAllocationPDFs[row. id];
                  if (! pdfs || pdfs.length === 0) {
                    return <span style={{ color: colors.textMuted, fontSize: '12px' }}>-</span>;
                  }
                  return (
                    <button
                      onClick={() => openPDFModal(pdfs)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: colors.primary,
                        border: 'none',
                        borderRadius:  '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <File size={14} /> {pdfs.length} PDF{pdfs.length > 1 ? 's' : ''}
                    </button>
                  );
                }
              },
              { 
                header:  'Status', 
                render: (row) => (
                  <Badge variant="success">Published ✓</Badge>
                )
              },
              { 
                header: 'Actions', 
                render: (row) => (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleEdit(row)} 
                      disabled={submitting}
                      style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: submitting ? 'not-allowed' : 'pointer', color: colors.primary, display: 'flex', opacity: submitting ? 0.5 : 1 }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(row.id, row.title)}
                      disabled={submitting}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: submitting ? 'not-allowed' : 'pointer', color: colors.danger, display: 'flex', opacity: submitting ? 0.5 : 1 }}
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
            description="Create your first activity" 
            action={<Button icon={Plus} onClick={() => setShowModal(true)} disabled={submitting}>Create Activity</Button>} 
          />
        )}
      </Card>

      <Modal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); resetForm(); }} 
        title={editMode ? 'Edit Activity' : 'Create New Activity'} 
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <Input 
            label="Activity Title" 
            value={formData. title} 
            onChange={(e) => setFormData({ ...formData, title: e.target. value })} 
            placeholder="Enter activity title" 
            required 
            disabled={submitting}
          />
          <Textarea 
            label="Description" 
            value={formData. description} 
            onChange={(e) => setFormData({ ...formData, description: e.target. value })} 
            placeholder="Enter activity description" 
            rows={3}
            disabled={submitting}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap:  '16px' }}>
            <Select 
              label="Category" 
              value={formData.category} 
              onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
              options={categories} 
              placeholder="Select category" 
              required
              disabled={submitting}
            />
            <Input 
              label="Points" 
              type="number" 
              value={formData.points} 
              onChange={(e) => setFormData({ ...formData, points: e.target.value })} 
              placeholder="Enter points" 
              required
              disabled={submitting}
              min="1"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input 
              label="Date" 
              type="date" 
              value={formData.date} 
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={submitting}
            />
            <Input 
              label="Venue" 
              value={formData.venue} 
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })} 
              placeholder="Enter venue"
              disabled={submitting}
            />
          </div>
          <Input 
            label="Max Participants" 
            type="number" 
            value={formData. maxParticipants} 
            onChange={(e) => setFormData({ ...formData, maxParticipants: e.target. value })} 
            placeholder="Enter max participants (0 for unlimited)"
            disabled={submitting}
            min="0"
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button 
              type="submit" 
              fullWidth
              loading={submitting}
              disabled={submitting}
            >
              {editMode ? 'Update' : 'Create'} Activity
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              fullWidth 
              onClick={() => { setShowModal(false); resetForm(); }}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* PDF List Modal */}
      <Modal 
        isOpen={showPDFModal} 
        onClose={() => { setShowPDFModal(false); setSelectedPDF(null); }} 
        title="Supporting PDFs for Activity" 
        size="large"
      >
        {selectedPDF && selectedPDF.length > 0 && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedPDF.map((pdf, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '16px',
                    background: colors.cardHover,
                    borderRadius: '12px',
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div style={{ display:  'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems:  'center', gap: '12px', flex: 1 }}>
                      <File size={24} color={colors.primary} />
                      <div>
                        <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
                          {pdf.name}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: colors.textMuted }}>
                          <span>Submitted by: <strong>{pdf.clubName}</strong> ({pdf.submittedBy})</span>
                          <span>Date: <strong>{new Date(pdf.createdAt).toLocaleDateString()}</strong></span>
                        </div>
                      </div>
                    </div>
                    <a 
                      href={pdf. url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        background: colors.primary,
                        color: '#fff',
                        borderRadius:  '8px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Download size={16} /> View
                    </a>
                  </div>
                  
                  <div style={{ display:  'flex', gap: '16px', fontSize: '13px', color: colors.textSecondary, paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
                    <Badge variant="primary">{pdf.studentCount} Students</Badge>
                    <Badge variant="warning">{pdf.totalPoints} Total Points</Badge>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="secondary" 
              fullWidth 
              onClick={() => { setShowPDFModal(false); setSelectedPDF(null); }}
              style={{ marginTop: '24px' }}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast. message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity:  1; transform: translateY(0); } 
        } 
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};

export default DeanActivities;