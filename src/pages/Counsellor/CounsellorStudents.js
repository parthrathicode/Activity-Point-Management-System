import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Input, Modal, Table, Badge, Avatar, Toast, EmptyState, Select } from '../../components/UIComponents';
import { Users, Plus, Mail, Trash2, Edit, Search, Award, BookOpen, Download } from 'lucide-react';
import jsPDF from 'jspdf';

// Professional PDF Generation Function - Monochrome with Role, Pagination, and Signature Support
const generateStudentReportPDF = (
  studentData,
  pointHistory,
  counsellorName,
  deanName,
  signatures
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // ===== HEADER =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EVENT POINTS MANAGEMENT REPORT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Activity Points Management System', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Line separator
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  // ===== STUDENT INFORMATION SECTION =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT INFORMATION', margin, yPosition);
  yPosition += 6;

  const infoData = [
    ['Name:', studentData.name, 'Roll Number:', studentData.rollNumber],
    ['Email:', studentData. email, 'Department:', studentData.department],
    ['Year:', `Year ${studentData.year}`, 'Counsellor:', counsellorName],
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  infoData.forEach(([label1, value1, label2, value2]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label1, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value1 || 'N/A'), margin + 35, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.text(label2, pageWidth / 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value2 || 'N/A'), pageWidth / 2 + 35, yPosition);

    yPosition += 5;
  });

  yPosition += 4;

  // ===== STATISTICS SECTION =====
  doc. setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Points:   ${studentData.points || 0}`, margin, yPosition);
  doc.text(`Activities Participated: ${studentData.activitiesParticipated || pointHistory.length || 0}`, pageWidth / 2, yPosition);
  yPosition += 8;

  // Line separator
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  // ===== POINTS HISTORY TABLE =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('POINTS HISTORY', margin, yPosition);
  yPosition += 8;

  // Table header
  const colWidths = {
    sno: 8,
    activity: 48,
    role: 22,
    org: 32,
    date: 18,
    points: 14,
  };

  const headerX = [
    margin,
    margin + colWidths.sno,
    margin + colWidths.sno + colWidths.activity,
    margin + colWidths. sno + colWidths.activity + colWidths.role,
    margin + colWidths.sno + colWidths.activity + colWidths.role + colWidths.org,
    margin + colWidths.sno + colWidths.activity + colWidths.role + colWidths.org + colWidths. date,
  ];

  doc.setFillColor(200, 200, 200);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('S.No', headerX[0] + 1, yPosition + 4);
  doc.text('Activity Title', headerX[1] + 1, yPosition + 4);
  doc.text('Role', headerX[2] + 1, yPosition + 4);
  doc.text('Organization', headerX[3] + 1, yPosition + 4);
  doc.text('Date', headerX[4] + 1, yPosition + 4);
  doc.text('Points', headerX[5] + 1, yPosition + 4);

  yPosition += 7;

  // Table rows with pagination
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const rowHeight = 5;
  const maxRowsPerPage = Math.floor((pageHeight - yPosition - 50) / rowHeight);

  let rowCount = 0;
  const tableWidth = pageWidth - 2 * margin;

  pointHistory.forEach((item, idx) => {
    // Check if we need a new page
    if (rowCount >= maxRowsPerPage && idx < pointHistory.length) {
      // Add footer to current page
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${doc.internal.pages. length - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Add new page
      doc.addPage();
      yPosition = margin;

      // Repeat header on new page
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('S.No', headerX[0] + 1, yPosition + 4);
      doc.text('Activity Title', headerX[1] + 1, yPosition + 4);
      doc.text('Role', headerX[2] + 1, yPosition + 4);
      doc.text('Organization', headerX[3] + 1, yPosition + 4);
      doc.text('Date', headerX[4] + 1, yPosition + 4);
      doc.text('Points', headerX[5] + 1, yPosition + 4);

      yPosition += 7;
      rowCount = 0;
    }

    // Alternate row colors
    if (idx % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition - 1, tableWidth, rowHeight, 'F');
    }

    // Row borders
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPosition + rowHeight - 1, pageWidth - margin, yPosition + rowHeight - 1);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Data
    doc.text(String(idx + 1), headerX[0] + 1, yPosition + 3);
    doc.text((item.activityTitle || 'Unknown').substring(0, 32), headerX[1] + 1, yPosition + 3);
    doc.text((item.role || 'Participant').substring(0, 15), headerX[2] + 1, yPosition + 3);
    doc.text((item. clubName || 'N/A').substring(0, 18), headerX[3] + 1, yPosition + 3);
    doc.text(item.date || 'N/A', headerX[4] + 1, yPosition + 3);
    doc.setFont('helvetica', 'bold');
    doc.text(`+${item.points || 0}`, headerX[5] + 1, yPosition + 3);

    yPosition += rowHeight;
    rowCount++;
  });

  // If no data, show message
  if (pointHistory.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('No activity records found', pageWidth / 2, yPosition + 3, { align: 'center' });
    yPosition += rowHeight;
  }

// ===== FOOTER SECTION =====
const MIN_FOOTER_Y = pageHeight - 55;
const footerY = Math.max(yPosition + 25, MIN_FOOTER_Y);

// Separator
doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.5);
doc.line(margin, footerY, pageWidth - margin, footerY);

// Report generated info (left)
doc.setFontSize(8);
doc.setFont('helvetica', 'normal');
doc.text('Report Generated:', margin, footerY + 8);
doc.text(
  new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  margin,
  footerY + 13
);

// ===== SIGNATURE GRID (3 COLUMN SYSTEM) =====
const gridY = footerY + 14;
const imgWidth = 26;
const imgHeight = 10;

// Column centers
const col1X = margin + 45 / 2;
const col2X = pageWidth / 2;
const col3X = pageWidth - margin - 45 / 2;

// Helper
const drawSignatureColumn = (centerX, image, role, name) => {
  if (image) {
    doc.addImage(
      image,
      'PNG',
      centerX - imgWidth / 2,
      gridY,
      imgWidth,
      imgHeight
    );
  }

  // Line
  doc.line(
    centerX - imgWidth / 2,
    gridY + imgHeight + 2,
    centerX + imgWidth / 2,
    gridY + imgHeight + 2
  );

  // Role
  doc.setFontSize(7);
  doc.text(role, centerX, gridY + imgHeight + 8, { align: 'center' });

  // Name
  doc.text(name, centerX, gridY + imgHeight + 13, { align: 'center' });
};

// Counsellor
drawSignatureColumn(
  col1X,
  signatures?.counsellor,
  'Counsellor',
  counsellorName || 'N/A'
);

// Dean
drawSignatureColumn(
  col2X,
  signatures?.dean,
  'Dean',
  deanName || 'N/A'
);

// Principal
drawSignatureColumn(
  col3X,
  signatures?.principal,
  'Principal',
  'Authorized Authority'
);

// Bottom note
doc.setFontSize(6);
doc.text(
  'This is a computer-generated document.',
  pageWidth / 2,
  pageHeight - 5,
  { align: 'center' }
);

  return doc;
};

const CounsellorStudents = () => {
  const { userData, loading:  authLoading } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    department: '',
    year: '',
  });

  useEffect(() => {
    if (!authLoading && userData?.uid) {
      fetchStudents();
    }
  }, [userData, authLoading]);

  const fetchStudents = async () => {
    if (! userData?.uid) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('counsellorId', '==', userData.uid)
      );
      const snapshot = await getDocs(q);
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      setToast({ message: 'Failed to fetch students', type: 'error' });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && selectedStudent) {
        await updateDoc(doc(db, 'users', selectedStudent.id), {
          name: formData.name,
          rollNumber: formData.rollNumber,
          department: formData.department,
          year: formData. year,
          updatedAt: new Date().toISOString(),
        });
        setToast({ message: 'Student updated! ', type: 'success' });
      } else {
        const emailQuery = query(collection(db, 'users'), where('email', '==', formData.email));
        const emailSnap = await getDocs(emailQuery);
        
        if (! emailSnap.empty) {
          setToast({ message: 'Email already exists', type: 'error' });
          return;
        }

        await addDoc(collection(db, 'users'), {
          ...formData,
          role: 'student',
          counsellorId: userData.uid,
          counsellorName: userData.name,
          deanId: userData.deanId || '',
          deanName: userData.deanName || '',
          createdAt: new Date().toISOString(),
          isActive: true,
          points: 0,
          activitiesParticipated:  0,
        });
        setToast({ message: 'Student created!', type: 'success' });
      }

      setShowModal(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      setToast({ message: 'Failed to save student', type: 'error' });
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student. name,
      email: student. email,
      password: '',
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      year: student. year || '',
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Delete this student?')) {
      try {
        await deleteDoc(doc(db, 'users', studentId));
        setToast({ message: 'Student deleted! ', type: 'success' });
        fetchStudents();
      } catch (error) {
        setToast({ message: 'Failed to delete', type: 'error' });
      }
    }
  };

  const handleDownloadReport = async (student) => {
    setDownloadingReport(student.id);
    
    try {
      let pointHistory = [];
      try {
        const historyQuery = query(
          collection(db, 'pointHistory'),
          where('studentEmail', '==', student.email),
          orderBy('allocatedAt', 'desc')
        );
        const historySnap = await getDocs(historyQuery);
        pointHistory = historySnap.docs.map(doc => {
          const data = doc.data();
          return {
            activityTitle: data.activityTitle || 'Unknown Activity',
            role: data.role || 'Participant',
            clubName: data.clubName || 'N/A',
            points: data.points || 0,
            date: data.allocatedAt 
              ? new Date(data. allocatedAt. toDate ?  data.allocatedAt.toDate() : data.allocatedAt).toLocaleDateString() 
              : 'N/A',
          };
        });
      } catch (error) {
        pointHistory = [];
      }

      const studentData = {
        name: student.name || 'N/A',
        email: student.email || 'N/A',
        rollNumber: student.rollNumber || 'N/A',
        department:  student.department || 'N/A',
        year: student. year || 'N/A',
        points: student.points || 0,
        activitiesParticipated: student.activitiesParticipated || pointHistory.length,
      };

      // Get signature image from userData if available
const signatures = {
  counsellor: userData.signatureCounsellor || '/images/sign1.jpeg',
  dean: userData.signatureDean || '/images/sign1.jpeg',
  principal: '/images/sign1.jpeg',
};

const pdfDoc = generateStudentReportPDF(
  studentData,
  pointHistory,
  userData.name || 'Counsellor',
  userData.deanName || 'Dean',
  signatures
);

      pdfDoc.save(`Report_${student.rollNumber || student.name}_${new Date().toISOString().split('T')[0]}.pdf`);

      setToast({ message: `✓ Report downloaded for ${student. name}! `, type: 'success' });
    } catch (error) {
      console.error('PDF generation error:', error);
      setToast({ message: 'Failed to generate report', type: 'error' });
    }
    
    setDownloadingReport(null);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password:  '', rollNumber: '', department: '', year: '' });
    setEditMode(false);
    setSelectedStudent(null);
  };

  const filteredStudents = students.filter(s => 
    s.name?. toLowerCase().includes(searchTerm. toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const departments = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Civil', label: 'Civil' },
    { value: 'Business', label: 'Business Administration' },
  ];

  const years = [
    { value: '1', label: '1st Year' },
    { value:  '2', label: '2nd Year' },
    { value:  '3', label: '3rd Year' },
    { value:  '4', label: '4th Year' },
  ];

  const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>My Students</h1>
          <p style={{ color: colors.textSecondary }}>Manage your students</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>Add Student</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems:  'center', justifyContent:  'center' }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{students.length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Students</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display:  'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius:  '12px', background: colors. gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{totalPoints}</p>
              <p style={{ fontSize: '13px', color:  colors.textMuted }}>Total Points</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems:  'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight:  '700', color: colors.text }}>{students.filter(s => (s.activitiesParticipated || 0) > 0).length}</p>
              <p style={{ fontSize: '13px', color:  colors.textMuted }}>Active</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height:  '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{students.length > 0 ? Math.round(totalPoints / students.length) : 0}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Avg Points</p>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search size={20} style={{ position:  'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding:  '14px 16px 14px 48px', fontSize: '14px', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, outline: 'none' }}
        />
      </div>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredStudents.length > 0 ? (
          <Table
            columns={[
              { header: 'Student', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap:  '12px' }}>
                  <Avatar name={row.name} size={40} />
                  <div>
                    <p style={{ fontWeight: '600', color: colors.text }}>{row.name}</p>
                    <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.email}</p>
                  </div>
                </div>
              )},
              { header: 'USN', render: (row) => <span style={{ color: colors.textSecondary, fontFamily: 'monospace' }}>{row.rollNumber || 'N/A'}</span> },
              { header: 'Dept', render: (row) => <span style={{ color: colors.textSecondary }}>{row.department || 'N/A'}</span> },
              { header: 'Year', render: (row) => <Badge variant="neutral">Y{row.year || '? '}</Badge> },
              { header: 'Points', render:  (row) => (
                <div style={{ display:  'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color={colors.warning} />
                  <span style={{ fontWeight: '600', color: colors.warning }}>{row.points || 0}</span>
                </div>
              )},
              { header: 'Actions', render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleDownloadReport(row)} 
                    disabled={downloadingReport === row.id}
                    title="Download Report"
                    style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: downloadingReport === row.id ? 'wait' : 'pointer', color: colors.secondary, display: 'flex', opacity: downloadingReport === row.id ? 0.5 : 1 }}
                  >
                    {downloadingReport === row.id ?  (
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(16, 185, 129, 0.3)', borderTopColor: colors.secondary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                  <button onClick={() => handleEdit(row)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.primary, display: 'flex' }}><Edit size={16} /></button>
                  <button onClick={() => handleDelete(row.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.danger, display: 'flex' }}><Trash2 size={16} /></button>
                </div>
              )},
            ]}
            data={filteredStudents}
          />
        ) : (
          <EmptyState icon={Users} title="No students" description="Add your first student" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Add Student</Button>} />
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editMode ? 'Edit Student' :  'Add Student'} size="medium">
        <form onSubmit={handleSubmit}>
          <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e. target.value })} placeholder="Enter name" required />
          <Input label="Email" type="email" value={formData. email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email" icon={Mail} required disabled={editMode} />
          {! editMode && <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Password" required />}
          <Input label="Roll Number" value={formData.rollNumber} onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} placeholder="Roll number" required />
          <Select label="Department" value={formData. department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} options={departments} placeholder="Select department" required />
          <Select label="Year" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} options={years} placeholder="Select year" required />
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button type="submit" fullWidth>{editMode ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast. message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CounsellorStudents;