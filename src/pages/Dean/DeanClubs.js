import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Input, Modal, Table, Badge, Avatar, Toast, EmptyState, Select, Textarea } from '../../components/UIComponents';
import { Briefcase, Plus, Mail, Trash2, Edit, Search, Activity } from 'lucide-react';
const DeanClubs = () => {
  const { userData } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', description: '', category: '', coordinatorName: '' });
  useEffect(() => {
    if (userData?.uid) {
      console.log("[DeanClubs] Setting up real-time listeners");
      setupRealtimeListeners();
    }
  }, [userData]);
  const setupRealtimeListeners = () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'club'), where('deanId', '==', userData.uid));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const clubList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const clubsWithActivitiesCounts = await Promise.all(
          clubList.map(async (club) => {
            const activitiesQuery = query(collection(db, 'activities'), where('clubId', '==', club.id));
            const activitiesSnap = await getDocs(activitiesQuery);
            return { ...club, activitiesCount: activitiesSnap.size };
          })
        );
        setClubs(clubsWithActivitiesCounts);
        console.log("[DeanClubs] Real-time clubs updated:", clubsWithActivitiesCounts.length);
        setLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up listeners:', error);
      setToast({ message: 'Failed to fetch clubs', type: 'error' });
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedClub) {
        await updateDoc(doc(db, 'users', selectedClub.id), { name: formData.name, description: formData.description, category: formData.category, coordinatorName: formData.coordinatorName, updatedAt: new Date().toISOString() });
        setToast({ message: 'Club updated successfully! ', type: 'success' });
      } else {
        const emailQuery = query(collection(db, 'users'), where('email', '==', formData.email));
        const emailSnap = await getDocs(emailQuery);
        if (!emailSnap.empty) {
          setToast({ message: 'Email already exists', type: 'error' });
          return;
        }
        await addDoc(collection(db, 'users'), { ...formData, role: 'club', deanId: userData?.uid, deanName: userData?.name, createdAt: new Date().toISOString(), isActive: true, activitiesCount: 0, totalPointsAllocated: 0 });
        setToast({ message: 'Club created successfully! ', type: 'success' });
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving club:', error);
      setToast({ message: 'Failed to save club', type: 'error' });
    }
  };
  const handleEdit = (club) => {
    setSelectedClub(club);
    setFormData({ name: club.name, email: club.email, password: '', description: club.description || '', category: club.category || '', coordinatorName: club.coordinatorName || '' });
    setEditMode(true);
    setShowModal(true);
  };
  const handleDelete = async (clubId) => {
    if (window.confirm('Are you sure you want to delete this club?')) {
      try {
        await deleteDoc(doc(db, 'users', clubId));
        setToast({ message: 'Club deleted successfully!', type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to delete club', type: 'error' });
      }
    }
  };
  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', description: '', category: '', coordinatorName: '' });
    setEditMode(false);
    setSelectedClub(null);
  };
  const filteredClubs = clubs.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const categories = [
    { value: 'Technical', label: 'Technical' },
    { value: 'Cultural', label: 'Cultural' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Literary', label: 'Literary' },
    { value: 'Social', label: 'Social Service' },
    { value: 'Arts', label: 'Arts & Crafts' },
  ];
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Clubs Management</h1>
          <p style={{ color: colors.textSecondary }}>Manage all clubs and their activities</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>Add Club</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
  <Search
    size={18}
    style={{
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: colors.textMuted,
      pointerEvents: 'none'
    }}
  />
  <input
    type="text"
    placeholder="Search clubs..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    style={{
      width: '100%',
      height: '44px',
      paddingLeft: '46px',
      paddingRight: '14px',
      fontSize: '14px',
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      color: colors.text,
      outline: 'none',
      lineHeight: '44px'
    }}
  />
</div>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{clubs.length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Clubs</p>
            </div>
          </div>
        </Card>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{clubs.reduce((sum, c) => sum + (c.activitiesCount || 0), 0)}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Activities</p>
            </div>
          </div>
        </Card>
      </div>
      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredClubs.length > 0 ? (
          <Table columns={[{
            header: 'Club', render: (row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar name={row.name} size={40} />
                <div>
                  <p style={{ fontWeight: '600', color: colors.text }}>{row.name}</p>
                  <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.email}</p>
                </div>
              </div>
            )
          }, { header: 'Category', render: (row) => <Badge variant="warning">{row.category || 'General'}</Badge> }, { header: 'Coordinator', render: (row) => <span style={{ color: colors.textSecondary }}>{row.coordinatorName || 'Not assigned'}</span> }, { header: 'Activities', render: (row) => <Badge variant="primary">{row.activitiesCount || 0}</Badge> }, { header: 'Status', render: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> }, {
            header: 'Actions', render: (row) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(row)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.primary, display: 'flex' }}><Edit size={16} /></button>
                <button onClick={() => handleDelete(row.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.danger, display: 'flex' }}><Trash2 size={16} /></button>
              </div>
            )
          }]} data={filteredClubs} />
        ) : (
          <EmptyState icon={Briefcase} title="No clubs found" description="Start by adding your first club" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Add Club</Button>} />
        )}
      </Card>
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editMode ? 'Edit Club' : 'Add New Club'} size="medium">
        <form onSubmit={handleSubmit}>
          <Input label="Club Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter club name" required />
          <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email" icon={Mail} required disabled={editMode} />
          {!editMode && <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" required />}
          <Select label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} options={categories} placeholder="Select category" required />
          <Input label="Coordinator Name" value={formData.coordinatorName} onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })} placeholder="Enter coordinator name" />
          <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter club description" rows={3} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button type="submit" fullWidth>{editMode ? 'Update' : 'Create'} Club</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
          </div>
        </form>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
@keyframes fadeIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
`}</style>
    </div>
  );
};
export default DeanClubs;