import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, storage } from '../../config/firebase';
import { collection, query, where, getDocs, writeBatch, doc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import Papa from 'papaparse';
import { colors, Card, Button, Select, Toast, EmptyState, Table, Badge, Avatar, Input } from '../../components/UIComponents';
import { Award, Upload, Send, Users, FileText, Trash2, Download, CheckCircle, File, X } from 'lucide-react';

const HODAllocatePoints = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(location.state?.activity || null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [pointsPerStudent, setPointsPerStudent] = useState('');
  const [supportingPDF, setSupportingPDF] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Role options for dropdown
  const roleOptions = [
    { value: 'Participant', label: 'Participant' },
    { value: 'Organizer', label: 'Organizer' },
    { value: 'Volunteer', label: 'Volunteer' },
    { value: 'Coordinator', label: 'Coordinator' },
    { value: 'Team Lead', label: 'Team Lead' },
    { value: 'Winner', label: 'Winner' },
    { value: 'Runner-up', label: 'Runner-up' },
    { value: 'Mentor', label: 'Mentor' },
    { value: 'Speaker', label: 'Speaker' },
    { value: 'Judge', label: 'Judge' },
    { value: 'Other', label: 'Other' },
  ];

  useEffect(() => {
    fetchActivities();
  }, [userData]);

  const fetchActivities = async () => {
    try {
      const q = query(
        collection(db, 'activities'),
        where('deanId', '==', userData?. deanId),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);
      setActivities(snapshot.docs.map(doc => ({ id: doc. id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching activities:', error);
      setToast({ message: 'Failed to fetch activities', type: 'error' });
    }
    setLoading(false);
  };

  const handleCSVFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('CSV File selected:', file.name, 'Size:', file.size);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        console.log('CSV Parse Results:', results);

        if (! results.data || results.data.length === 0) {
          setToast({ message: 'CSV file is empty', type: 'error' });
          return;
        }

        console.log('First row keys:', Object.keys(results.data[0]));
        console.log('First row data:', results.data[0]);

        const parsedStudents = results.data
          .map((row, idx) => {
            const email = (row.email || row.Email || row. EMAIL || row['Email Address'] || row['email address'] || '').trim();
            const name = (row.name || row.Name || row.NAME || row.student_name || row['Student Name'] || '').trim();
            const rollNumber = (row. rollNumber || row.roll_number || row.RollNumber || row. roll || row['Roll Number'] || '').trim();
            const pointsValue = row.points || row.Points || row. POINTS || pointsPerStudent || selectedActivity?.points || 0;
            const role = (row.role || row.Role || row.ROLE || 'Participant').trim();

            console.log(`Row ${idx}:`, { email, name, rollNumber, pointsValue, role });

            return {
              id: idx,
              email,
              name,
              rollNumber,
              points: parseInt(pointsValue) || 0,
              role,
            };
          })
          .filter(s => s.email && s.email !== '');

        console.log('Parsed students:', parsedStudents);

        if (parsedStudents.length === 0) {
          setToast({
            message: 'No valid student data found. Make sure CSV has "email" column with data.  Check console for details.',
            type: 'error'
          });
          return;
        }

        setStudents(parsedStudents);
        setToast({ message: `${parsedStudents.length} students loaded successfully!`, type: 'success' });
      },
      error:  (error) => {
        console.error('CSV parsing error:', error);
        setToast({ message: `Failed to parse CSV file: ${error.message}`, type: 'error' });
      }
    });

    event.target.value = '';
  };

  const handlePDFFileUpload = (event) => {
    const file = event. target.files?.[0];
    if (!file) return;

    console.log('PDF File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setToast({ message: 'Please upload a PDF file', type: 'error' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'PDF file size should be less than 10MB', type: 'error' });
      return;
    }

    setSupportingPDF(file);
    setToast({ message: `PDF "${file.name}" selected`, type: 'success' });
    event.target.value = '';
  };

  const removePDF = () => {
    setSupportingPDF(null);
  };

  const handleRemoveStudent = (studentId) => {
    setStudents(students.filter(s => s.id !== studentId));
  };

  const handlePointsChange = (studentId, newPoints) => {
    setStudents(students.map(s =>
      s.id === studentId ? { ...s, points: parseInt(newPoints) || 0 } : s
    ));
  };

  const handleRoleChange = (studentId, newRole) => {
    setStudents(students.map(s =>
      s.id === studentId ?  { ...s, role: newRole } : s
    ));
  };

  const handleSubmit = async () => {
    if (!selectedActivity) {
      setToast({ message: 'Please select an activity', type: 'error' });
      return;
    }

    if (students. length === 0) {
      setToast({ message: 'Please add students', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      let pdfURL = null;
      let pdfName = null;

      // Upload PDF if selected
      if (supportingPDF) {
        setUploading(true);
        console.log('Starting PDF upload.. .');

        try {
          const timestamp = Date.now();
          const pdfRef = ref(storage, `pointAllocations/${userData?.uid}/${timestamp}_${supportingPDF.name}`);

          console.log('PDF ref path:', pdfRef.fullPath);

          const uploadResult = await uploadBytes(pdfRef, supportingPDF);
          console.log('Upload successful:', uploadResult);

          pdfURL = await getDownloadURL(pdfRef);
          pdfName = supportingPDF.name;

          console.log('PDF URL:', pdfURL);
          setToast({ message: 'PDF uploaded successfully', type: 'success' });
        } catch (uploadError) {
          console.error('PDF upload error:', uploadError);
          setToast({ message: `Failed to upload PDF: ${uploadError.message}`, type: 'error' });
          setUploading(false);
          setSubmitting(false);
          return;
        }

        setUploading(false);
      }

      const batch = writeBatch(db);
      let successCount = 0;

      for (const student of students) {
        const studentsQuery = query(
          collection(db, 'users'),
          where('email', '==', student.email. toLowerCase().trim())
        );
        const studentSnap = await getDocs(studentsQuery);

        if (!studentSnap.empty) {
          const studentDoc = studentSnap.docs[0];
          const studentData = studentDoc.data();

          // Update student's points directly
          batch.update(doc(db, 'users', studentDoc.id), {
            points: increment(student.points || 0),
            activitiesParticipated: increment(1),
          });

          // Create point history with role
          const historyRef = doc(collection(db, 'pointHistory'));
          batch.set(historyRef, {
            studentId: studentDoc. id,
            studentEmail: student.email,
            studentName: student.name || studentData.name,
            activityId: selectedActivity.id,
            activityTitle: selectedActivity.title,
            points: student.points || 0,
            role: student.role || 'Participant',
            // HOD info
            hodId: userData?.uid,
            hodName: userData?.name,
            allocatedByHodId: userData?.uid,
            allocatedByHodName: userData?. name,
            allocatedBy: 'hod',
            allocatedAt: new Date().toISOString(),
            status: 'approved',
            supportingPDFURL: pdfURL,
            supportingPDFName: pdfName,
          });

          successCount++;
        }
      }

      await batch.commit();

      setToast({
        message: `Points allocated to ${successCount} students! `,
        type: 'success'
      });

      setTimeout(() => {
        navigate('/hod');
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setToast({ message: `Failed to allocate points: ${error.message}`, type: 'error' });
    }
    setSubmitting(false);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['email', 'name', 'rollNumber', 'points', 'role'],
      ['student1@example.com', 'John Doe', 'CS001', '10', 'Organizer'],
      ['student2@example.com', 'Jane Smith', 'CS002', '10', 'Volunteer'],
      ['student3@example.com', 'Bob Wilson', 'CS003', '5', 'Participant'],
    ];
    const csv = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'student_points_template.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Allocate Points</h1>
        <p style={{ color: colors.textSecondary }}>Allocate points directly to students (no approval needed)</p>
      </div>

      {/* Direct Allocation Info */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '24px' }}>
        <div style={{ display:  'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: colors.gradientGreen, display: 'flex', alignItems:  'center', justifyContent:  'center' }}>
            <CheckCircle size={28} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.secondary, marginBottom: '4px' }}>Direct Allocation</h3>
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
              Points are allocated <strong>immediately</strong> without any approval process.
            </p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Card title="Select Activity" icon={FileText}>
          <Select
            label="Activity (All Approved Activities)"
            value={selectedActivity?. id || ''}
            onChange={(e) => {
              const activity = activities.find(a => a.id === e.target.value);
              setSelectedActivity(activity);
              if (activity?. points) setPointsPerStudent(activity.points. toString());
            }}
            options={activities.map(a => ({ value: a.id, label: `${a.title} (${a.points} pts)` }))}
            placeholder="Select an activity"
            required
          />

          {selectedActivity && (
            <div style={{ marginTop: '16px', padding: '16px', background:  colors.cardHover, borderRadius: '12px' }}>
              <p style={{ fontWeight: '600', color: colors.text, marginBottom: '8px' }}>{selectedActivity.title}</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Badge variant="primary">{selectedActivity.category}</Badge>
                <Badge variant="warning">{selectedActivity.points} pts</Badge>
                <Badge variant="neutral">{selectedActivity.clubName || selectedActivity.hodName || selectedActivity. deanName || 'Unknown'}</Badge>
              </div>
            </div>
          )}
        </Card>

        <Card title="Points Configuration" icon={Award}>
          <Input
            label="Points Per Student"
            type="number"
            value={pointsPerStudent}
            onChange={(e) => setPointsPerStudent(e. target.value)}
            placeholder="Default points"
          />
          <p style={{ fontSize: '13px', color: colors.textMuted, marginTop: '-12px' }}>
            Individual points can be edited in the list below
          </p>
        </Card>
      </div>

      <Card title="Upload Student List" icon={Upload} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <Button variant="secondary" icon={Download} onClick={downloadSampleCSV}>
            Download Sample CSV
          </Button>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight:  '500', color: colors.text }}>
            Upload CSV File *
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVFileUpload}
            style={{
              width: '100%',
              padding: '12px',
              border: `2px dashed ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: colors.card,
              color: colors.text,
              fontSize: '14px',
            }}
          />
          <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '8px' }}>
            CSV must contain:  email, name, rollNumber, points, role
          </p>
        </div>

        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
          <p style={{ fontSize: '14px', color: colors.text, fontWeight: '500', marginBottom: '8px' }}>CSV Format:</p>
          <ul style={{ fontSize: '13px', color: colors.textSecondary, paddingLeft: '20px', margin: 0 }}>
            <li><strong>email</strong> column is required</li>
            <li>Optional: name, rollNumber, points, <strong>role</strong></li>
            <li>Role options: Participant, Organizer, Volunteer, Coordinator, Team Lead, Winner, etc.</li>
          </ul>
        </div>
      </Card>

      <Card title="Supporting Documentation" icon={File} style={{ marginBottom: '24px' }}>
        <div>
          <label style={{ display:  'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: colors.text }}>
            Upload PDF (Optional)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handlePDFFileUpload}
            style={{
              width: '100%',
              padding: '12px',
              border: `2px dashed ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: colors.card,
              color: colors.text,
              fontSize: '14px',
            }}
          />
          <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '8px' }}>
            PDF with supporting documents (attendance, certificates, etc.) - Max 10MB
          </p>
        </div>

        {supportingPDF && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: colors.cardHover,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: `1px solid ${colors.border}`
          }}>
            <div style={{ display: 'flex', alignItems:  'center', gap: '12px' }}>
              <File size={20} color={colors.primary} />
              <div>
                <p style={{ fontWeight: '500', color: colors.text, fontSize: '14px' }}>{supportingPDF.name}</p>
                <p style={{ fontSize: '12px', color: colors.textMuted }}>
                  {(supportingPDF.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removePDF}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                color: colors.danger,
                display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </Card>

      {students.length > 0 && (
        <Card title={`Students (${students.length})`} icon={Users}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: colors.cardHover,
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>Total Points</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: colors.warning }}>{totalPoints}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap:  '8px' }}>
              <Users size={20} color={colors.primary} />
              <span style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{students.length} Students</span>
            </div>
          </div>

          <Table
            columns={[
              {
                header: 'Student', render: (row) => (
                  <div style={{ display: 'flex', alignItems:  'center', gap: '12px' }}>
                    <Avatar name={row.name || row.email} size={36} />
                    <div>
                      <p style={{ fontWeight: '500', color:  colors.text }}>{row.name || 'Unknown'}</p>
                      <p style={{ fontSize: '13px', color: colors.textMuted }}>{row.email}</p>
                    </div>
                  </div>
                )
              },
              { header: 'Roll Number', render: (row) => <span style={{ color: colors.textSecondary, fontFamily: 'monospace' }}>{row.rollNumber || 'N/A'}</span> },
              {
                header: 'Role', render: (row) => (
                  <select
                    value={row.role || 'Participant'}
                    onChange={(e) => handleRoleChange(row.id, e.target.value)}
                    style={{
                      padding:  '8px 12px',
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.text,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {roleOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )
              },
              {
                header: 'Points', render: (row) => (
                  <input
                    type="number"
                    value={row.points}
                    onChange={(e) => handlePointsChange(row.id, e.target.value)}
                    style={{
                      width: '80px',
                      padding: '8px 12px',
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.warning,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  />
                )
              },
              {
                header: 'Action', render: (row) => (
                  <button
                    onClick={() => handleRemoveStudent(row.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      color: colors. danger,
                      display: 'flex',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )
              },
            ]}
            data={students}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button
              fullWidth
              loading={submitting || uploading}
              icon={Send}
              onClick={handleSubmit}
              disabled={submitting || uploading}
            >
              {uploading ? 'Uploading PDF...' : 'Allocate Points Now'}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setStudents([])}>
              Clear List
            </Button>
          </div>
        </Card>
      )}

      {toast && <Toast message={toast. message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default HODAllocatePoints;