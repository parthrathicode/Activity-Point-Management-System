import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import Papa from 'papaparse';
import { colors, Card, Button, Input, Modal, Table, Badge, Avatar, Toast, EmptyState, Select, FileUpload } from '../../components/UIComponents';
import { Users, Plus, Mail, Trash2, Edit, Search, BookOpen, Award, AlertCircle, Upload, Download, CheckCircle, XCircle, Eye } from 'lucide-react';

const DeanStudents = () => {
  const { userData } = useAuth();
  const [students, setStudents] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [hods, setHODs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  
  // Point allocation state
  const [showPointModal, setShowPointModal] = useState(false);
  const [pointAllocation, setPointAllocation] = useState({ studentId: '', studentName: '', studentEmail: '', points: '', reason: '' });
  const [allocatingPoints, setAllocatingPoints] = useState(false);
  
  // CSV Upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvStudents, setCsvStudents] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current:  0, total: 0, success: 0, failed: 0 });
  
  // View student modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [studentPointHistory, setStudentPointHistory] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    department: '',
    counsellorId: '',
    counsellorName: '',
    hodId:  '',
    hodName: '',
    year: '',
  });

  useEffect(() => {
    if (userData?. uid) fetchData();
  }, [userData]);

  const fetchData = async () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }

    try {
      // Fetch students
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('deanId', '==', userData.uid)
      );
      const studentsSnap = await getDocs(studentsQuery);
      const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by points descending
      studentsList.sort((a, b) => (b.points || 0) - (a.points || 0));
      setStudents(studentsList);

      // Fetch counsellors
      const counsellorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'counsellor'),
        where('deanId', '==', userData.uid)
      );
      const counsellorsSnap = await getDocs(counsellorsQuery);
      setCounsellors(counsellorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch HODs
      const hodsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'hod'),
        where('deanId', '==', userData.uid)
      );
      const hodsSnap = await getDocs(hodsQuery);
      setHODs(hodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'Failed to fetch data', type: 'error' });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.counsellorId) {
      setToast({ message: 'Please assign a counsellor! ', type: 'error' });
      return;
    }

    try {
      const selectedCounsellor = counsellors. find(c => c.id === formData.counsellorId);
      const selectedHOD = hods.find(h => h.id === formData. hodId);

      if (editMode && selectedStudent) {
        await updateDoc(doc(db, 'users', selectedStudent.id), {
          name: formData.name,
          rollNumber: formData.rollNumber,
          department: formData.department,
          counsellorId: formData.counsellorId,
          counsellorName: selectedCounsellor?. name || '',
          hodId: formData. hodId || null,
          hodName: selectedHOD?.name || null,
          year: formData. year,
          updatedAt: new Date().toISOString(),
        });
        setToast({ message: 'Student updated successfully! ', type: 'success' });
      } else {
        const emailQuery = query(collection(db, 'users'), where('email', '==', formData.email. toLowerCase().trim()));
        const emailSnap = await getDocs(emailQuery);

        if (! emailSnap.empty) {
          setToast({ message: 'Email already exists', type: 'error' });
          return;
        }

        await addDoc(collection(db, 'users'), {
          name: formData.name,
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          rollNumber: formData.rollNumber,
          department: formData.department,
          year: formData.year,
          role: 'student',
          deanId: userData?. uid,
          deanName: userData?.name,
          counsellorId: formData. counsellorId,
          counsellorName: selectedCounsellor?.name || '',
          hodId: formData.hodId || null,
          hodName: selectedHOD?.name || null,
          createdAt: new Date().toISOString(),
          isActive: true,
          points: 0,
          activitiesParticipated: 0,
        });
        setToast({ message: 'Student created successfully!', type: 'success' });
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving student:', error);
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
      counsellorId:  student.counsellorId || '',
      counsellorName: student.counsellorName || '',
      hodId: student.hodId || '',
      hodName: student.hodName || '',
      year: student. year || '',
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteDoc(doc(db, 'users', studentId));
        setToast({ message: 'Student deleted successfully!', type: 'success' });
        fetchData();
      } catch (error) {
        setToast({ message: 'Failed to delete student', type: 'error' });
      }
    }
  };

  const handleViewStudent = async (student) => {
    setViewStudent(student);
    setShowViewModal(true);

    try {
      const historyQuery = query(
        collection(db, 'pointHistory'),
        where('studentId', '==', student.id)
      );
      const historySnap = await getDocs(historyQuery);
      const history = historySnap.docs. map(doc => ({ id: doc.id, ...doc.data() }));
      history.sort((a, b) => new Date(b.allocatedAt) - new Date(a.allocatedAt));
      setStudentPointHistory(history);
    } catch (error) {
      console.error('Error fetching point history:', error);
    }
  };

  // ==================== POINT ALLOCATION ====================
  const openPointAllocationModal = (student) => {
    setPointAllocation({
      studentId:  student.id,
      studentName: student.name,
      studentEmail: student.email,
      points: '',
      reason: ''
    });
    setShowPointModal(true);
  };

  const handleAllocatePoints = async (e) => {
    e.preventDefault();

    if (!pointAllocation.points || isNaN(parseInt(pointAllocation.points))) {
      setToast({ message:  'Please enter a valid number of points', type: 'error' });
      return;
    }

    setAllocatingPoints(true);
    try {
      const pointsToAdd = parseInt(pointAllocation.points);
      const batch = writeBatch(db);

      const studentRef = doc(db, 'users', pointAllocation.studentId);
      batch.update(studentRef, {
        points: increment(pointsToAdd),
        updatedAt: new Date().toISOString(),
      });

      const historyRef = doc(collection(db, 'pointHistory'));
      batch.set(historyRef, {
        studentId:  pointAllocation.studentId,
        studentEmail: pointAllocation.studentEmail,
        studentName: pointAllocation.studentName,
        points: pointsToAdd,
        activityId: 'DEAN_DIRECT',
        activityTitle: pointAllocation.reason || 'Direct Dean Allocation',
        clubId: '',
        clubName: 'Dean',
        allocatedAt: new Date().toISOString(),
        verifiedBy: userData. uid,
        verifiedByName: userData.name,
      });

      await batch.commit();

      setToast({ message: `✓ ${pointsToAdd} points allocated successfully! `, type: 'success' });
      setShowPointModal(false);
      setPointAllocation({ studentId: '', studentName: '', studentEmail: '', points: '', reason: '' });
      fetchData();
    } catch (error) {
      console.error('Error allocating points:', error);
      setToast({ message: 'Failed to allocate points', type: 'error' });
    }
    setAllocatingPoints(false);
  };

  // ==================== CSV BULK UPLOAD ====================
  const handleCSVUpload = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedStudents = results.data.map((row, idx) => {
          // Find counsellor by name
          const counsellor = counsellors.find(c => 
            c.name?. toLowerCase() === (row.counsellorName || row.counsellor || row. Counsellor || '')?. toLowerCase()
          );
          
          // Find HOD by name
          const hod = hods. find(h => 
            h.name?.toLowerCase() === (row.hodName || row.hod || row.HOD || '')?.toLowerCase()
          );

          return {
            id: idx,
            name: row.name || row.Name || row.NAME || row.student_name || row['Student Name'] || '',
            email: (row.email || row.Email || row.EMAIL || row['Email Address'] || '').toLowerCase().trim(),
            password: row.password || row.Password || row.PASSWORD || '',
            rollNumber: row.rollNumber || row.roll_number || row.RollNumber || row['Roll Number'] || row.roll || '',
            department: row.department || row.Department || row.DEPARTMENT || '',
            year: row.year || row.Year || row.YEAR || '',
            counsellorName: row.counsellorName || row.counsellor || row.Counsellor || '',
            counsellorId: counsellor?. id || '',
            hodName: row.hodName || row.hod || row.HOD || '',
            hodId: hod?.id || '',
            valid: true,
            error: '',
          };
        }).filter(s => s.email);

        // Validate records
        const emailSet = new Set();
        const validatedStudents = parsedStudents.map(student => {
          // Validate email
          if (!student.email) {
            return { ...student, valid: false, error: 'Missing email' };
          }
          if (!student.email.includes('@')) {
            return { ... student, valid: false, error:  'Invalid email format' };
          }
          if (emailSet.has(student.email)) {
            return { ...student, valid: false, error: 'Duplicate email in CSV' };
          }
          emailSet.add(student.email);
          
          // Check if email already exists in current students
          if (students.find(s => s.email === student.email)) {
            return { ...student, valid: false, error: 'Email already exists' };
          }

          // Validate required fields
          if (!student.name) {
            return { ...student, valid: false, error: 'Missing name' };
          }
          if (!student.password) {
            return { ...student, valid: false, error: 'Missing password' };
          }
          if (!student.rollNumber) {
            return { ...student, valid: false, error: 'Missing roll number' };
          }
          if (!student.department) {
            return { ...student, valid: false, error: 'Missing department' };
          }
          if (!student.year) {
            return { ...student, valid: false, error: 'Missing year' };
          }
          if (!student.counsellorName) {
            return { ...student, valid: false, error: 'Missing counsellor name' };
          }
          if (!student.counsellorId) {
            return { ...student, valid: false, error: 'Counsellor not found' };
          }

          if (student.hodName && ! student.hodId) {
            return { ...student, valid: false, error: 'HOD not found' };
          }
          
          return student;
        });

        if (validatedStudents.length === 0) {
          setToast({ message: 'No valid student data found in CSV', type: 'error' });
          return;
        }

        setCsvStudents(validatedStudents);
        setToast({ message: `${validatedStudents.filter(s => s.valid).length} valid students loaded from CSV`, type: 'success' });
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setToast({ message: 'Failed to parse CSV file', type: 'error' });
      }
    });
  };

  const handleBulkUpload = async () => {
    const validStudents = csvStudents.filter(s => s.valid);
    if (validStudents.length === 0) {
      setToast({ message: 'No valid students to upload', type: 'error' });
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: validStudents.length, success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    // Process in batches of 450 (Firestore limit)
    const batchSize = 450;
    for (let i = 0; i < validStudents.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchStudents = validStudents. slice(i, i + batchSize);

      for (const student of batchStudents) {
        try {
          // Check if email already exists
          const emailQuery = query(collection(db, 'users'), where('email', '==', student. email));
          const emailSnap = await getDocs(emailQuery);

          if (! emailSnap.empty) {
            failedCount++;
            setUploadProgress(prev => ({ ...prev, current: prev.current + 1, failed: failedCount }));
            continue;
          }

          const newStudentRef = doc(collection(db, 'users'));
          batch.set(newStudentRef, {
            name: student.name,
            email: student.email,
            password: student.password,
            rollNumber: student.rollNumber,
            department: student. department,
            year: student. year,
            role: 'student',
            deanId: userData?.uid,
            deanName: userData?.name,
            counsellorId: student.counsellorId,
            counsellorName: student. counsellorName,
            hodId: student.hodId || null,
            hodName: student.hodName || null,
            createdAt: new Date().toISOString(),
            isActive:  true,
            points: 0,
            activitiesParticipated: 0,
          });

          successCount++;
        } catch (error) {
          console.error('Error processing student:', student.email, error);
          failedCount++;
        }

        setUploadProgress(prev => ({
          ...prev,
          current: prev.current + 1,
          success: successCount,
          failed:  failedCount
        }));
      }

      try {
        await batch.commit();
      } catch (error) {
        console.error('Batch commit error:', error);
      }
    }

    setUploading(false);
    setToast({
      message: `Upload complete! ${successCount} added, ${failedCount} failed`,
      type: successCount > 0 ? 'success' : 'error'
    });

    if (successCount > 0) {
      setShowBulkModal(false);
      setCsvStudents([]);
      fetchData();
    }
  };

  const removeCsvStudent = (studentId) => {
    setCsvStudents(csvStudents. filter(s => s.id !== studentId));
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['name', 'email', 'password', 'rollNumber', 'department', 'year', 'counsellorName', 'hodName'],
      ['John Doe', 'john@example.com', 'password123', 'CS001', 'Computer Science', '1', 'Dr.  Rajesh Kumar', ''],
      ['Jane Smith', 'jane@example.com', 'password456', 'CS002', 'Computer Science', '1', 'Dr. Rajesh Kumar', 'Dr. Priya Singh'],
      ['Bob Wilson', 'bob@example.com', 'password789', 'EC001', 'Electronics', '2', 'Dr. Amit Sharma', 'Dr. Vikram Desai'],
    ];

    const csv = sampleData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type:  'text/csv' });
    const url = window.URL. createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    setToast({ message: 'Sample CSV downloaded! ', type: 'success' });
  };

  const exportStudentsCSV = () => {
    const headers = ['Name', 'Email', 'Password', 'Roll Number', 'Department', 'Year', 'Counsellor', 'HOD', 'Points', 'Activities'];
    const rows = students.map(s => [
      s.name || '',
      s.email || '',
      s.password || '',
      s.rollNumber || '',
      s.department || '',
      s.year || '',
      s.counsellorName || '',
      s.hodName || '',
      s.points || 0,
      s.activitiesParticipated || 0
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_students_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    setToast({ message: 'Students exported successfully!', type: 'success' });
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', password: '', rollNumber:  '',
      department: '', counsellorId: '', counsellorName: '',
      hodId: '', hodName: '', year: ''
    });
    setEditMode(false);
    setSelectedStudent(null);
  };

  const filteredStudents = students.filter(s =>
    s.name?. toLowerCase().includes(searchTerm. toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const departments = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Information Technology', label: 'Information Technology' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Civil', label: 'Civil' },
    { value: 'Business', label: 'Business Administration' },
  ];

  const years = [
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' },
  ];

  const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Students Management</h1>
          <p style={{ color: colors.textSecondary }}>Manage and track all students under your supervision</p>
        </div>
        <div style={{ display:  'flex', gap: '12px' }}>
          <Button variant="secondary" icon={Download} onClick={exportStudentsCSV}>
            Export CSV
          </Button>
          <Button variant="secondary" icon={Upload} onClick={() => setShowBulkModal(true)} disabled={counsellors.length === 0}>
            Bulk Upload
          </Button>
          <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }} disabled={counsellors.length === 0}>
            Add Student
          </Button>
        </div>
      </div>

      {counsellors.length === 0 && (
        <Card style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px'
        }}>
          <AlertCircle size={24} color={colors.danger} />
          <div>
            <p style={{ color: colors.danger, fontWeight: '600' }}>No Counsellors Available</p>
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Please add counsellors first before adding students. </p>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems:  'center', justifyContent:  'center' }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{students.length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Students</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems:  'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{totalPoints}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Points</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display:  'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius:  '12px', background: colors. gradientOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color:  colors.text }}>{students.filter(s => s.activitiesParticipated > 0).length}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Active Participants</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width:  '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{Math.round(totalPoints / Math.max(students.length, 1))}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Avg Points</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
        <input
          type="text"
          placeholder="Search students by name, email, roll number, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '500px', padding: '14px 16px 14px 48px', fontSize: '14px', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', color: colors.text, outline: 'none' }}
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
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : colors.cardHover,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: idx < 3 ? '#000' : colors.text,
                  fontWeight: '600',
                  fontSize: '12px',
                }}>
                  {idx + 1}
                </div>
              )},
              { header: 'Student', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar name={row.name} size={40} />
                  <div>
                    <p style={{ fontWeight: '600', color: colors.text }}>{row.name}</p>
                    <p style={{ fontSize:  '13px', color: colors. textMuted }}>{row.email}</p>
                  </div>
                </div>
              )},
              { header: 'USN', render: (row) => <span style={{ color: colors.textSecondary, fontFamily: 'monospace' }}>{row.rollNumber || 'N/A'}</span> },
              { header: 'Department', render: (row) => <Badge variant="primary">{row.department || 'N/A'}</Badge> },
              { header: 'Year', render: (row) => <Badge variant="neutral">Year {row.year || 'N/A'}</Badge> },
              { header: 'Counsellor', render:  (row) => <span style={{ color: colors.textSecondary, fontSize: '13px' }}>{row.counsellorName || 'N/A'}</span> },
              { header: 'HOD', render: (row) => <span style={{ color:  colors.textSecondary, fontSize: '13px' }}>{row.hodName || 'N/A'}</span> },
              { header: 'Points', render: (row) => (
                <div style={{ display:  'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color={colors.warning} />
                  <span style={{ fontWeight: '600', color: colors.warning }}>{row.points || 0}</span>
                </div>
              )},
              { header: 'Actions', render: (row) => (
                <div style={{ display:  'flex', gap: '6px' }}>
                  <button onClick={() => handleViewStudent(row)} title="View Details" style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.primary, display: 'flex' }}>
                    <Eye size={16} />
                  </button>
                  <button onClick={() => openPointAllocationModal(row)} title="Allocate Points" style={{ background: 'rgba(245, 158, 11, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.warning, display: 'flex' }}>
                    <Award size={16} />
                  </button>
                  <button onClick={() => handleEdit(row)} title="Edit" style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.secondary, display: 'flex' }}>
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(row. id)} title="Delete" style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: colors.danger, display: 'flex' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )},
            ]}
            data={filteredStudents}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No students found"
            description="Start by adding your first student or use bulk upload"
            action={
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button icon={Plus} onClick={() => setShowModal(true)} disabled={counsellors.length === 0}>Add Student</Button>
                <Button variant="secondary" icon={Upload} onClick={() => setShowBulkModal(true)} disabled={counsellors.length === 0}>Bulk Upload</Button>
              </div>
            }
          />
        )}
      </Card>

      {/* Add/Edit Student Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editMode ? 'Edit Student' : 'Add New Student'} size="medium">
        <form onSubmit={handleSubmit}>
          <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e. target.value })} placeholder="Enter full name" required />
          <Input label="Email Address" type="email" value={formData. email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email" icon={Mail} required disabled={editMode} />
          {! editMode && <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" required />}
          <Input label="Roll Number" value={formData. rollNumber} onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} placeholder="Enter roll number" required />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap:  '16px' }}>
            <Select label="Department" value={formData. department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} options={departments} placeholder="Select department" required />
            <Select label="Year" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} options={years} placeholder="Select year" required />
          </div>

          <Select
            label="Assign Counsellor *"
            value={formData. counsellorId}
            onChange={(e) => {
              const counsellor = counsellors.find(c => c.id === e.target.value);
              setFormData({ ...formData, counsellorId: e.target.value, counsellorName: counsellor?. name || '' });
            }}
            options={counsellors. map(c => ({ value: c.id, label: c.name }))}
            placeholder="Select counsellor"
            required
          />

          <Select
            label="Assign HOD (Optional)"
            value={formData. hodId}
            onChange={(e) => {
              const hod = hods.find(h => h. id === e.target.value);
              setFormData({ ...formData, hodId: e.target.value, hodName: hod?.name || '' });
            }}
            options={hods.map(h => ({ value: h. id, label: `${h.name} (${h.department || 'No Dept'})` }))}
            placeholder="Select HOD"
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button type="submit" fullWidth>{editMode ? 'Update' : 'Create'} Student</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Point Allocation Modal */}
      <Modal isOpen={showPointModal} onClose={() => { setShowPointModal(false); setPointAllocation({ studentId: '', studentName: '', studentEmail: '', points: '', reason: '' }); }} title="Allocate Points" size="small">
        <form onSubmit={handleAllocatePoints}>
          <div style={{ marginBottom: '16px', padding: '16px', background: colors.cardHover, borderRadius: '12px' }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary }}>Student: </p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: colors.text }}>{pointAllocation.studentName}</p>
          </div>
          <Input
            label="Points to Add"
            type="number"
            value={pointAllocation.points}
            onChange={(e) => setPointAllocation({ ...pointAllocation, points: e.target.value })}
            placeholder="Enter points"
            required
            min="1"
          />
          <Input
            label="Reason (Optional)"
            value={pointAllocation.reason}
            onChange={(e) => setPointAllocation({ ...pointAllocation, reason: e.target.value })}
            placeholder="e.g., Academic Excellence, Participation..."
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button type="submit" fullWidth loading={allocatingPoints}>Allocate Points</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => { setShowPointModal(false); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* View Student Modal */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setViewStudent(null); }} title="Student Details" size="large">
        {viewStudent && (
          <div>
            <div style={{ display:  'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', padding: '20px', background: colors.card, borderRadius: '16px' }}>
              <Avatar name={viewStudent.name} size={80} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>{viewStudent.name}</h3>
                <p style={{ color: colors.textSecondary, marginBottom: '12px' }}>{viewStudent.email}</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Badge variant="primary">{viewStudent.department || 'N/A'}</Badge>
                  <Badge variant="secondary">Year {viewStudent.year || 'N/A'}</Badge>
                  <Badge variant="warning">{viewStudent.rollNumber || 'N/A'}</Badge>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '36px', fontWeight: '700', color: colors.warning }}>{viewStudent.points || 0}</p>
                <p style={{ fontSize: '14px', color: colors.textMuted }}>Total Points</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap:  '16px', marginBottom: '24px' }}>
              <div style={{ background: colors.cardHover, borderRadius: '12px', padding:  '16px' }}>
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>Counsellor</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{viewStudent.counsellorName || 'Not Assigned'}</p>
              </div>
              <div style={{ background: colors.cardHover, borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px' }}>HOD</p>
                <p style={{ fontSize: '16px', fontWeight:  '600', color: colors.text }}>{viewStudent.hodName || 'Not Assigned'}</p>
              </div>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Point History ({studentPointHistory.length})</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {studentPointHistory.length > 0 ? (
                studentPointHistory.map((item, idx) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: idx % 2 === 0 ?  colors.cardHover : 'transparent',
                    borderRadius: '8px',
                  }}>
                    <div>
                      <p style={{ fontWeight: '500', color: colors.text }}>{item.activityTitle}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>
                        {item.clubName || 'Unknown'} • {item.allocatedAt ? new Date(item.allocatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap:  '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius:  '20px' }}>
                      <Award size={14} color={colors.secondary} />
                      <span style={{ fontWeight: '600', color: colors.secondary }}>+{item.points}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: colors.textMuted, textAlign: 'center', padding: '20px' }}>No point history yet</p>
              )}
            </div>

            <div style={{ marginTop: '24px' }}>
              <Button fullWidth icon={Award} onClick={() => { setShowViewModal(false); openPointAllocationModal(viewStudent); }}>
                Allocate Points
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal isOpen={showBulkModal} onClose={() => { if (! uploading) { setShowBulkModal(false); setCsvStudents([]); } }} title="Bulk Upload Students" size="large">
        <div>
          {/* Upload Info */}
          <Card style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Upload size={24} color={colors.primary} />
              <div>
                <p style={{ fontWeight: '600', color: colors.text }}>Upload CSV File</p>
                <p style={{ fontSize: '13px', color: colors.textSecondary }}>Upload a CSV file with all student details to add multiple students at once</p>
              </div>
            </div>
          </Card>

          {csvStudents.length === 0 ? (
            <>
              <div style={{ display:  'flex', gap: '16px', marginBottom: '24px' }}>
                <Button variant="secondary" icon={Download} onClick={downloadSampleCSV}>
                  Download Sample CSV
                </Button>
              </div>

              <FileUpload
                onFileSelect={handleCSVUpload}
                accept=".csv"
                label="Upload CSV file with student data"
              />

              <div style={{ marginTop:  '16px', padding: '16px', background: colors.cardHover, borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: colors.text, fontWeight: '500', marginBottom: '12px' }}>CSV Format Requirements:</p>
                <ul style={{ fontSize: '13px', color: colors.textSecondary, paddingLeft: '20px', margin: 0 }}>
                  <li><strong>name</strong> - Required (Student's full name)</li>
                  <li><strong>email</strong> - Required (must be unique)</li>
                  <li><strong>password</strong> - Required (Student login password)</li>
                  <li><strong>rollNumber</strong> - Required (Roll number / Student ID)</li>
                  <li><strong>department</strong> - Required (Department name)</li>
                  <li><strong>year</strong> - Required (Year of study)</li>
                  <li><strong>counsellorName</strong> - Required (Counsellor's full name - must match existing counsellor)</li>
                  <li><strong>hodName</strong> - Optional (HOD's full name - must match existing HOD, leave blank if not applicable)</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* CSV Preview */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>
                    Preview ({csvStudents.length} students)
                  </h4>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Badge variant="success">
                      <CheckCircle size={14} style={{ marginRight: '4px' }} />
                      {csvStudents.filter(s => s.valid).length} Valid
                    </Badge>
                    <Badge variant="danger">
                      <XCircle size={14} style={{ marginRight: '4px' }} />
                      {csvStudents.filter(s => !s. valid).length} Invalid
                    </Badge>
                  </div>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table
                    columns={[
                      { header: 'Status', render: (row) => (
                        row.valid ? (
                          <CheckCircle size={18} color={colors.secondary} />
                        ) : (
                          <XCircle size={18} color={colors.danger} />
                        )
                      )},
                      { header: 'Name', render: (row) => <span style={{ color: colors.text, fontSize: '13px' }}>{row.name || '-'}</span> },
                      { header: 'Email', render: (row) => <span style={{ color: colors.textSecondary, fontSize: '12px' }}>{row.email}</span> },
                      { header: 'USN', render: (row) => <span style={{ color: colors.textMuted, fontFamily: 'monospace', fontSize: '12px' }}>{row.rollNumber || '-'}</span> },
                      { header: 'Dept', render: (row) => <span style={{ color: colors. textMuted, fontSize: '12px' }}>{row.department || '-'}</span> },
                      { header: 'Year', render:  (row) => <span style={{ color: colors.textMuted, fontSize: '12px' }}>{row.year || '-'}</span> },
                      { header:  'Counsellor', render: (row) => <span style={{ color: colors.textMuted, fontSize: '12px' }}>{row.counsellorName || '-'}</span> },
                      { header: 'Error', render: (row) => row.error ?  <span style={{ color: colors.danger, fontSize: '12px' }}>{row.error}</span> : <span style={{ color: colors.secondary, fontSize: '12px' }}>✓</span> },
                      { header: '', render: (row) => (
                        <button
                          onClick={() => removeCsvStudent(row.id)}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: colors.danger, display: 'flex' }}
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      )},
                    ]}
                    data={csvStudents}
                  />
                </div>
              </Card>

              {/* Upload Progress */}
              {uploading && (
                <Card style={{ marginTop: '24px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '14px', color: colors.text, marginBottom: '8px' }}>
                      Uploading... {uploadProgress. current} / {uploadProgress.total}
                    </p>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(uploadProgress.current / uploadProgress. total) * 100}%`,
                        background: colors.gradient,
                        transition: 'width 0.3s ease',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <span style={{ color: colors.secondary }}>✓ Success:  {uploadProgress.success}</span>
                    <span style={{ color: colors.danger }}>✗ Failed: {uploadProgress.failed}</span>
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap:  '12px', marginTop: '24px' }}>
                <Button
                  fullWidth
                  icon={Upload}
                  onClick={handleBulkUpload}
                  loading={uploading}
                  disabled={uploading || csvStudents.filter(s => s.valid).length === 0}
                >
                  Upload {csvStudents.filter(s => s.valid).length} Students
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => { setCsvStudents([]); }}
                  disabled={uploading}
                >
                  Clear & Re-upload
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {toast && <Toast message={toast. message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DeanStudents;