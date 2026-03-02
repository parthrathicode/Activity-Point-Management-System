import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Table, Badge, Avatar, Toast, EmptyState, Modal, Select } from '../../components/UIComponents';
import { Users, Search, Award, Activity, Eye, TrendingUp, Download } from 'lucide-react';

const HODStudents = () => {
  const { userData } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [studentActivities, setStudentActivities] = useState([]);
  const [studentPointHistory, setStudentPointHistory] = useState([]);

  useEffect(() => {
    if (userData?.uid) {
      setupRealtimeListeners();
    }
  }, [userData]);

  const setupRealtimeListeners = () => {
    if (!userData?.uid || !userData?.deanId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch ALL students under the same dean
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('deanId', '==', userData.deanId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by points descending
        studentList.sort((a, b) => (b.points || 0) - (a.points || 0));
        setStudents(studentList);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };

  const viewStudentDetails = async (student) => {
    setSelectedStudent(student);
    setShowModal(true);

    try {
      // Fetch student's activities
      const activitiesQuery = query(
        collection(db, 'studentActivities'),
        where('studentId', '==', student.id)
      );
      const activitiesSnap = await getDocs(activitiesQuery);
      setStudentActivities(activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch student's point history
      const historyQuery = query(
        collection(db, 'pointHistory'),
        where('studentId', '==', student.id)
      );
      const historySnap = await getDocs(historyQuery);
      const history = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date
      history.sort((a, b) => new Date(b.allocatedAt) - new Date(a.allocatedAt));
      setStudentPointHistory(history);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  // Get unique departments and years for filters
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
  const years = [...new Set(students.map(s => s.year).filter(Boolean))].sort();

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || s.department === filterDepartment;
    const matchesYear = !filterYear || s.year === filterYear;
    return matchesSearch && matchesDepartment && matchesYear;
  });

  const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
  const avgPoints = students.length > 0 ? Math.round(totalPoints / students.length) : 0;

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Roll Number', 'Department', 'Year', 'Points', 'Activities', 'Counsellor'];
    const rows = filteredStudents.map(s => [
      s.name || '',
      s.email || '',
      s.rollNumber || '',
      s.department || '',
      s.year || '',
      s.points || 0,
      s.activitiesParticipated || 0,
      s.counsellorName || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_students_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    setToast({ message: 'Students exported successfully!', type: 'success' });
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>All Students</h1>
          <p style={{ color: colors.textSecondary }}>View and manage all students in the system</p>
        </div>
        <Button icon={Download} variant="secondary" onClick={exportToCSV}>
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{students.length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Students</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{students.filter(s => s.isActive !== false).length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Active Students</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{totalPoints}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Points</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{avgPoints}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Avg Points</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
          <input
            type="text"
            placeholder="Search by name, email, or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '14px 16px 14px 48px', fontSize: '14px', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, outline: 'none' }}
          />
        </div>
        <Select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          options={departments.map(d => ({ value: d, label: d }))}
          placeholder="All Departments"
        />
        <Select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          options={years.map(y => ({ value: y, label: `Year ${y}` }))}
          placeholder="All Years"
        />
      </div>

      {/* Students Table */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredStudents.length > 0 ? (
          <Table
            columns={[
              { header: 'Rank', render: (row, idx) => (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : colors.cardHover,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: idx < 3 ? '#000' : colors.text,
                  fontWeight: '600',
                  fontSize: '14px',
                }}>
                  {idx + 1}
                </div>
              )},
              {
                header: 'Student', render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={row.name} size={40} />
                    <div>
                      <p style={{ fontWeight: '600', color: colors.text }}>{row.name}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.email}</p>
                    </div>
                  </div>
                )
              },
              { header: 'Roll Number', render: (row) => <span style={{ color: colors.textSecondary, fontFamily: 'monospace' }}>{row.rollNumber || 'N/A'}</span> },
              { header: 'Department', render: (row) => <Badge variant="primary">{row.department || 'N/A'}</Badge> },
              { header: 'Year', render: (row) => <span style={{ color: colors.textSecondary }}>Year {row.year || 'N/A'}</span> },
              {
                header: 'Points', render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} color={colors.warning} />
                    <span style={{ fontWeight: '600', color: colors.warning }}>{row.points || 0}</span>
                  </div>
                )
              },
              { header: 'Activities', render: (row) => <Badge variant="success">{row.activitiesParticipated || 0}</Badge> },
              { header: 'Counsellor', render: (row) => <span style={{ fontSize: '13px', color: colors.textMuted }}>{row.counsellorName || 'N/A'}</span> },
              {
                header: 'Actions', render: (row) => (
                  <button
                    onClick={() => viewStudentDetails(row)}
                    style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: colors.primary, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
                  >
                    <Eye size={16} /> View
                  </button>
                )
              },
            ]}
            data={filteredStudents}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No students found"
            description={searchTerm || filterDepartment || filterYear ? "Try adjusting your filters" : "No students in the system yet"}
          />
        )}
      </Card>

      {/* Student Details Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedStudent(null); }} title="Student Details" size="large">
        {selectedStudent && (
          <div>
            {/* Student Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', padding: '20px', background: colors.card, borderRadius: '16px' }}>
              <Avatar name={selectedStudent.name} size={80} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>{selectedStudent.name}</h3>
                <p style={{ color: colors.textSecondary, marginBottom: '12px' }}>{selectedStudent.email}</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Badge variant="primary">{selectedStudent.department || 'N/A'}</Badge>
                  <Badge variant="secondary">Year {selectedStudent.year || 'N/A'}</Badge>
                  <Badge variant="warning">{selectedStudent.rollNumber || 'N/A'}</Badge>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '36px', fontWeight: '700', color: colors.warning }}>{selectedStudent.points || 0}</p>
                <p style={{ fontSize: '14px', color: colors.textMuted }}>Total Points</p>
              </div>
            </div>

            {/* Additional Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: colors.cardHover, borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Counsellor</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{selectedStudent.counsellorName || 'Not Assigned'}</p>
              </div>
              <div style={{ background: colors.cardHover, borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>HOD</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{selectedStudent.hodName || 'Not Assigned'}</p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: colors.cardHover, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <Activity size={24} color={colors.primary} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{studentActivities.length}</p>
                <p style={{ fontSize: '13px', color: colors.textMuted }}>Activities</p>
              </div>
              <div style={{ background: colors.cardHover, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <Award size={24} color={colors.warning} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{selectedStudent.points || 0}</p>
                <p style={{ fontSize: '13px', color: colors.textMuted }}>Points</p>
              </div>
              <div style={{ background: colors.cardHover, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <TrendingUp size={24} color={colors.secondary} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{studentPointHistory.length}</p>
                <p style={{ fontSize: '13px', color: colors.textMuted }}>Point Entries</p>
              </div>
            </div>

            {/* Point History */}
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Point History</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {studentPointHistory.length > 0 ? (
                studentPointHistory.map((item, idx) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: idx % 2 === 0 ? colors.cardHover : 'transparent',
                    borderRadius: '8px',
                  }}>
                    <div>
                      <p style={{ fontWeight: '500', color: colors.text }}>{item.activityTitle}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>
                        {item.clubName || item.hodName || 'Unknown'} • {item.allocatedAt ? new Date(item.allocatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                      <Award size={14} color={colors.secondary} />
                      <span style={{ fontWeight: '600', color: colors.secondary }}>+{item.points}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: colors.textMuted, textAlign: 'center', padding: '20px' }}>No point history yet</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HODStudents;