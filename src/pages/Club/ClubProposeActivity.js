import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Input, Select, Textarea, Toast } from '../../components/UIComponents';
import { FileText, Calendar, MapPin, Award, Users, Send } from 'lucide-react';

const ClubProposeActivity = () => {
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
    requirements: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'activities'), {
        ...formData,
        points: parseInt(formData.points),
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        clubId: userData?.uid,
        clubName: userData?.name,
        deanId: userData?.deanId,
        createdBy: 'club',
        status: 'pending', // Needs dean approval
        createdAt: new Date().toISOString(),
        participantsCount: 0,
      });

      setToast({ message: 'Event proposed successfully! Waiting for Dean approval.', type: 'success' });
      
      setTimeout(() => {
        navigate('/club/my-activities');
      }, 1500);

    } catch (error) {
      console.error('Error proposing Event:', error);
      setToast({ message: 'Failed to propose Event', type: 'error' });
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
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Propose New Event</h1>
        <p style={{ color: colors.textSecondary }}>Submit an activity proposal for Dean approval</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <Card>
          <form onSubmit={handleSubmit}>
            <Input
              label="Activity Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter a descriptive title for the activity"
              icon={FileText}
              required
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a detailed description of the activity, its objectives, and expected outcomes"
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
              placeholder="Enter max participants (0 for unlimited)"
              icon={Users}
            />

            <Textarea
              label="Name and Contact of Coordinators of Event"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="Any specific requirements or prerequisites for participants"
              rows={2}
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button type="submit" fullWidth loading={loading} icon={Send}>
                Submit Proposal
              </Button>
              <Button type="button" variant="secondary" fullWidth onClick={() => navigate('/club')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        <div>
          <Card style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Proposal Guidelines</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                'Provide a clear and descriptive title',
                'Include detailed objectives and outcomes',
                'Set appropriate points based on effort',
                'Specify date and venue if known',
                'List any requirements for participants',
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

          <Card style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>Approval Process</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { step: '1', text: 'Submit proposal', desc: 'Fill and submit the form' },
                { step: '2', text: 'Dean Review', desc: 'Dean reviews the proposal' },
                { step: '3', text: 'Approval/Rejection', desc: 'Get notified of decision' },
                { step: '4', text: 'Activity Live', desc: 'If approved, activity goes live' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: colors.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <p style={{ fontWeight: '500', color: colors.text, fontSize: '14px' }}>{item.text}</p>
                    <p style={{ fontSize: '12px', color: colors.textMuted }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default ClubProposeActivity;