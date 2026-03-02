import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Input, Select, Textarea, Toast } from '../../components/UIComponents';
import { FileText, Calendar, MapPin, Award, Users, Send, CheckCircle } from 'lucide-react';

const HODProposeActivity = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    points: '',
    date: '',
    venue: '',
    maxParticipants: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const batch = writeBatch(db);

      // Create activity with status 'approved' directly
      const newActivityRef = doc(collection(db, 'activities'));
      batch.set(newActivityRef, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        points: parseInt(formData.points),
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        date: formData.date,
        venue: formData.venue,
        // HOD info
        hodId: userData?.uid,
        hodName: userData?.name,
        deanId: userData?.deanId,
        deanName: userData?.deanName,
        createdBy: 'hod',
        createdByName: userData?.name,
        // Directly approved
        status: 'approved',
        createdAt: new Date().toISOString(),
        participantsCount: 0,
      });

      // Get ALL students under the same dean and send activity to them
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('deanId', '==', userData.deanId)
      );
      const studentsSnap = await getDocs(studentsQuery);

      console.log(`[HODCreateActivity] Sending activity to ${studentsSnap.size} students`);

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
          maxParticipants: parseInt(formData.maxParticipants) || 0,
          // Student info
          studentId: studentDoc.id,
          studentEmail: studentData.email,
          studentName: studentData.name,
          // HOD info
          hodId: userData?.uid,
          hodName: userData?.name,
          fromId: userData?.uid,
          fromName: userData?.name,
          fromType: 'hod',
          allocatedBy: 'hod',
          allocatedByName: userData?.name,
          // Dean info
          deanId: userData?.deanId,
          deanName: userData?.deanName,
          // Counsellor info
          counsellorId: studentData.counsellorId || null,
          counsellorName: studentData.counsellorName || null,
          // Status
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      }

      await batch.commit();

      setToast({
        message: `Activity created and sent to ${studentsSnap.size} students!`,
        type: 'success'
      });

      setTimeout(() => {
        navigate('/hod/activities');
      }, 1500);

    } catch (error) {
      console.error('Error creating activity:', error);
      setToast({ message: 'Failed to create activity', type: 'error' });
    }
    setLoading(false);
  };

  const categories = [
    { value: 'Workshop', label: 'Workshop' },
    { value: 'Seminar', label: 'Seminar' },
    { value: 'Competition', label: 'Competition' },
    { value: 'Cultural', label: 'Cultural Event' },
    { value: 'Sports', label: 'Sports Event' },
    { value: 'Social', label: 'Social Service' },
    { value: 'Technical', label: 'Technical Event' },
    { value: 'Hackathon', label: 'Hackathon' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Create New Activity</h1>
        <p style={{ color: colors.textSecondary }}>Create an activity - it will be sent to all students directly</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <Card>
          <form onSubmit={handleSubmit}>
            <Input
              label="Activity Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter a descriptive title"
              icon={FileText}
              required
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a detailed description"
              rows={4}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={categories}
                placeholder="Select category"
                required
              />
              <Input
                label="Points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                placeholder="Points for participation"
                icon={Award}
                required
                min="1"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                icon={Calendar}
              />
              <Input
                label="Venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Enter venue"
                icon={MapPin}
              />
            </div>

            <Input
              label="Max Participants"
              type="number"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
              placeholder="0 for unlimited"
              icon={Users}
              min="0"
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button type="submit" fullWidth loading={loading} icon={Send}>
                Create & Send to All Students
              </Button>
              <Button type="button" variant="secondary" fullWidth onClick={() => navigate('/hod/activities')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        <div>
          {/* Direct Approval Info */}
          <Card style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.secondary }}>Direct Approval</h3>
                <p style={{ fontSize: '13px', color: colors.textSecondary }}>No verification needed</p>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: colors.text, lineHeight: '1.6' }}>
              Your activities are <strong>automatically approved</strong> and sent directly to <strong>all students</strong> in the system.
            </p>
          </Card>

          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Guidelines</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                'Provide a clear and descriptive title',
                'Include detailed objectives',
                'Set appropriate points based on effort',
                'Specify date and venue if known',
              ].map((item, idx) => (
                <li key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '12px',
                  color: colors.textSecondary,
                  fontSize: '14px',
                }}>
                  <span style={{ color: colors.primary, fontWeight: '600' }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default HODProposeActivity;