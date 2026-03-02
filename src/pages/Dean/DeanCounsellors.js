import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Input, Modal, Table, Badge, Avatar, Toast, EmptyState, Select } from '../../components/UIComponents';
import { Users, Plus, Mail, Phone, Trash2, Edit, Search } from 'lucide-react';
const DeanCounsellors = () => {
  const { userData } = useAuth();
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCounsellor, setSelectedCounsellor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', department: '' });
  useEffect(() => {
    if (userData?.uid) {
      console.log("[DeanCounsellors] Setting up real-time listeners");
      setupRealtimeListeners();
    }
  }, [userData]);
  const setupRealtimeListeners = () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'counsellor'), where('deanId', '==', userData.uid));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const counsellorList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const counsellorsWithCounts = await Promise.all(
          counsellorList.map(async (counsellor) => {
            const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('counsellorId', '==', counsellor.id));
            const studentsSnap = await getDocs(studentsQuery);
            return { ...counsellor, studentsCount: studentsSnap.size };
          })
        );
        setCounsellors(counsellorsWithCounts);
        console.log("[DeanCounsellors] Real-time counsellors updated:", counsellorsWithCounts.length);
        setLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up listeners: ', error);
      setToast({ message: 'Failed to fetch counsellors', type: 'error' });
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedCounsellor) {
        await updateDoc(doc(db, 'users', selectedCounsellor.id), { name: formData.name, phone: formData.phone, department: formData.department, updatedAt: new Date().toISOString() });
        setToast({ message: 'Counsellor updated successfully! ', type: 'success' });
      } else {
        const emailQuery = query(collection(db, 'users'), where('email', '==', formData.email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          setToast({ message: 'Email already exists', type: 'error' });
          return;
        }
        await addDoc(collection(db, 'users'), { ...formData, role: 'counsellor', deanId: userData?.uid, deanName: userData?.name, createdAt: new Date().toISOString(), isActive: true, studentsCount: 0 });
        setToast({ message: 'Counsellor created successfully!', type: 'success' });
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving counsellor:', error);
      setToast({ message: 'Failed to save counsellor', type: 'error' });
    }
  };
  const handleEdit = (counsellor) => {
    setSelectedCounsellor(counsellor);
    setFormData({ name: counsellor.name, email: counsellor.email, password: '', phone: counsellor.phone || '', department: counsellor.department || '' });
    setEditMode(true);
    setShowModal(true);
  };
  const handleDelete = async (counsellorId) => {
    if (window.confirm('Are you sure you want to delete this counsellor?')) {
      try {
        await deleteDoc(doc(db, 'users', counsellorId));
        setToast({ message: 'Counsellor deleted successfully!', type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to delete counsellor', type: 'error' });
      }
    }
  };
  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', department: '' });
    setEditMode(false);
    setSelectedCounsellor(null);
  };
  const filteredCounsellors = counsellors.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const departments = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Civil', label: 'Civil' },
    { value: 'Business', label: 'Business Administration' },
  ];
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Student Counsellors</h1>
          <p style={{ color: colors.textSecondary }}>Manage counsellors who guide and support students</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>Add Counsellor</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
  <Search
    size={18}
    style={{
      position:'absolute',
      left:'16px',
      top:'50%',
      transform:'translateY(-50%)',
      color:colors.textMuted,
      pointerEvents:'none'
    }}
  />
  <input
    type="text"
    placeholder="Search counsellors..."
    value={searchTerm}
    onChange={(e)=>setSearchTerm(e.target.value)}
    style={{
      width:'100%',
      height:'44px',
      paddingLeft:'46px',
      paddingRight:'14px',
      fontSize:'14px',
      background:colors.card,
      border:`1px solid ${colors.border}`,
      borderRadius:'12px',
      color:colors.text,
      outline:'none',
      lineHeight:'44px'
    }}
  />
</div>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{counsellors.length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Counsellors</p>
            </div>
          </div>
        </Card>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{counsellors.filter(c => c.isActive).length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Active</p>
            </div>
          </div>
        </Card>
      </div>
      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredCounsellors.length > 0 ? (
          <Table columns={[{
            header: 'Counsellor', render: (row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar name={row.name} size={40} />
                <div>
                  <p style={{ fontWeight: '600', color: colors.text }}>{row.name}</p>
                  <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.email}</p>
                </div>
              </div>
            )
          }, { header: 'Department', render: (row) => <span style={{ color: colors.textSecondary }}>{row.department || 'Not assigned'}</span> }, { header: 'Phone', render: (row) => <span style={{ color: colors.textSecondary }}>{row.phone || 'N/A'}</span> }, { header: 'Students', render: (row) => <Badge variant="primary">{row.studentsCount || 0} students</Badge> }, { header: 'Status', render: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> }, {
            header: 'Actions', render: (row) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(row)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.primary, display: 'flex' }}><Edit size={16} /></button>
                <button onClick={() => handleDelete(row.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.danger, display: 'flex' }}><Trash2 size={16} /></button>
              </div>
            )
          }]} data={filteredCounsellors} />
        ) : (
          <EmptyState icon={Users} title="No counsellors found" description="Start by adding your first counsellor" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Add Counsellor</Button>} />
        )}
      </Card>
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editMode ? 'Edit Counsellor' : 'Add New Counsellor'} size="medium">
        <form onSubmit={handleSubmit}>
          <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter full name" required />
          <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email" icon={Mail} required disabled={editMode} />
          {!editMode && <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" required />}
          <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone" icon={Phone} />
          <Select label="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} options={departments} placeholder="Select department" />
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button type="submit" fullWidth>{editMode ? 'Update' : 'Create'} Counsellor</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
          </div>
        </form>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
@keyframes fadeIn{from{opacity: 0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
`}</style>
    </div>
  );
};
export default DeanCounsellors;