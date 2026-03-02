import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Input, Modal, Table, Badge, Avatar, Toast, EmptyState, Select } from '../../components/UIComponents';
import { Building2, Plus, Mail, Phone, Trash2, Edit, Search, Users } from 'lucide-react';

const DeanHODs = () => {
  const { userData } = useAuth();
  const [hods, setHODs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedHOD, setSelectedHOD] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', department: '' });

  useEffect(() => {
    if (userData?.uid) {
      setupRealtimeListeners();
    }
  }, [userData]);

  const setupRealtimeListeners = () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'hod'), where('deanId', '==', userData.uid));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const hodList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get student count for each HOD
        const hodsWithCounts = await Promise.all(
          hodList.map(async (hod) => {
            const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('hodId', '==', hod.id));
            const studentsSnap = await getDocs(studentsQuery);
            return { ...hod, studentsCount: studentsSnap.size };
          })
        );
        
        setHODs(hodsWithCounts);
        setLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up listeners:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedHOD) {
        await updateDoc(doc(db, 'users', selectedHOD.id), {
          name: formData.name,
          phone: formData.phone,
          department: formData.department,
          updatedAt: new Date().toISOString()
        });
        setToast({ message: 'HOD updated successfully!', type: 'success' });
      } else {
        const emailQuery = query(collection(db, 'users'), where('email', '==', formData.email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          setToast({ message: 'Email already exists', type: 'error' });
          return;
        }
        await addDoc(collection(db, 'users'), {
          ...formData,
          role: 'hod',
          deanId: userData?.uid,
          deanName: userData?.name,
          createdAt: new Date().toISOString(),
          isActive: true,
          studentsCount: 0
        });
        setToast({ message: 'HOD created successfully!', type: 'success' });
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving HOD:', error);
      setToast({ message: 'Failed to save HOD', type: 'error' });
    }
  };

  const handleEdit = (hod) => {
    setSelectedHOD(hod);
    setFormData({
      name: hod.name,
      email: hod.email,
      password: '',
      phone: hod.phone || '',
      department: hod.department || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (hodId) => {
    if (window.confirm('Are you sure you want to delete this HOD?')) {
      try {
        await deleteDoc(doc(db, 'users', hodId));
        setToast({ message: 'HOD deleted successfully!', type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to delete HOD', type: 'error' });
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', department: '' });
    setEditMode(false);
    setSelectedHOD(null);
  };

  const filteredHODs = hods.filter(h =>
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const departments = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Civil', label: 'Civil' },
    { value: 'Business', label: 'Business Administration' },
    { value: 'Information Technology', label: 'Information Technology' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>HOD Management</h1>
          <p style={{ color: colors.textSecondary }}>Manage Heads of Departments who can create activities and allocate points directly</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>Add HOD</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search HODs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', height: '44px', paddingLeft: '46px', paddingRight: '14px', fontSize: '14px', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, outline: 'none' }}
          />
        </div>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{hods.length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total HODs</p>
            </div>
          </div>
        </Card>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{hods.reduce((sum, h) => sum + (h.studentsCount || 0), 0)}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Students</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredHODs.length > 0 ? (
          <Table
            columns={[
              {
                header: 'HOD', render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={row.name} size={40} />
                    <div>
                      <p style={{ fontWeight: '600', color: colors.text }}>{row.name}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.email}</p>
                    </div>
                  </div>
                )
              },
              { header: 'Department', render: (row) => <Badge variant="warning">{row.department || 'Not assigned'}</Badge> },
              { header: 'Phone', render: (row) => <span style={{ color: colors.textSecondary }}>{row.phone || 'N/A'}</span> },
              { header: 'Students', render: (row) => <Badge variant="primary">{row.studentsCount || 0} students</Badge> },
              { header: 'Status', render: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
              {
                header: 'Actions', render: (row) => (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(row)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.primary, display: 'flex' }}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(row.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.danger, display: 'flex' }}><Trash2 size={16} /></button>
                  </div>
                )
              }
            ]}
            data={filteredHODs}
          />
        ) : (
          <EmptyState icon={Building2} title="No HODs found" description="Start by adding your first HOD" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Add HOD</Button>} />
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editMode ? 'Edit HOD' : 'Add New HOD'} size="medium">
        <form onSubmit={handleSubmit}>
          <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter full name" required />
          <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email" icon={Mail} required disabled={editMode} />
          {!editMode && <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" required />}
          <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone" icon={Phone} />
          <Select label="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} options={departments} placeholder="Select department" />
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button type="submit" fullWidth>{editMode ? 'Update' : 'Create'} HOD</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
};

export default DeanHODs;