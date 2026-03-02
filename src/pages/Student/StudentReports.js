import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { colors, Card, Button, Badge, Toast, EmptyState } from '../../components/UIComponents';
import { Download, FileText, Award, Activity } from 'lucide-react';
import jsPDF from 'jspdf';

// Professional PDF Generation Function - No Colors, Standard Layout
export const generateStudentReportPDF = (studentData, pointHistory, counsellorName, deanName, signatures) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize. getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // ===== HEADER =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RV COLLEGE OF ENGINEERING', pageWidth / 2, yPosition, { align: 'center' });
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
    ['Email:', studentData.email, 'Department:', studentData.department],
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
  doc.text(`Total Points:  ${studentData.points || 0}`, margin, yPosition);
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
    activity: 50,
    role: 25,
    org: 35,
    date: 20,
    points: 15,
  };

  const headerX = [margin, margin + colWidths.sno, margin + colWidths. sno + colWidths.activity, margin + colWidths.sno + colWidths.activity + colWidths.role, margin + colWidths.sno + colWidths.activity + colWidths. role + colWidths.org, margin + colWidths.sno + colWidths.activity + colWidths.role + colWidths. org + colWidths.date];

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

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const rowHeight = 5;
  const maxRowsPerPage = Math.floor((pageHeight - yPosition - 40) / rowHeight);

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
      doc.text('S. No', headerX[0] + 1, yPosition + 4);
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
    doc.text((item.activityTitle || 'Unknown').substring(0, 35), headerX[1] + 1, yPosition + 3);
    doc.text((item. role || 'Participant').substring(0, 15), headerX[2] + 1, yPosition + 3);
    doc.text((item. clubName || 'N/A').substring(0, 20), headerX[3] + 1, yPosition + 3);
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

// ----- LEFT INFO -----
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

// ===== SIGNATURE GRID =====
const gridY = footerY + 14;
const colWidth = 45;
const imgWidth = 26;
const imgHeight = 10;
const textGap = 4;

// Column centers
const col1X = margin + colWidth / 2;
const col2X = pageWidth / 2;
const col3X = pageWidth - margin - colWidth / 2;

// Helper function
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

  // Signature line
  doc.line(
    centerX - imgWidth / 2,
    gridY + imgHeight + 2,
    centerX + imgWidth / 2,
    gridY + imgHeight + 2
  );

  // Role
  doc.setFontSize(7);
  doc.text(role, centerX, gridY + imgHeight + 2 + textGap + 4, {
    align: 'center',
  });

  // Name
  doc.text(name, centerX, gridY + imgHeight + 2 + textGap + 9, {
    align: 'center',
  });
};

// Draw columns
drawSignatureColumn(
  col1X,
  signatures?.counsellor,
  'Counsellor',
  counsellorName || 'N/A'
);

drawSignatureColumn(
  col2X,
  signatures?.dean,
  'Dean',
  deanName || 'N/A'
);

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





const StudentReports = () => {
  const { userData } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (userData?. uid && userData?.email) {
      fetchReportData();
    } else {
      setLoading(false);
    }
  }, [userData]);

  const fetchReportData = async () => {
    if (!userData?.uid || !userData?. email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const userRef = query(collection(db, 'users'), where('email', '==', userData.email));
      const userSnap = await getDocs(userRef);

      if (userSnap.empty) {
        setLoading(false);
        return;
      }

      const freshUserData = { ...userSnap.docs[0]. data(), uid: userSnap.docs[0].id };

      let pointHistory = [];
      try {
        const historyQuery = query(
          collection(db, 'pointHistory'),
          where('studentEmail', '==', userData.email),
          orderBy('allocatedAt', 'desc')
        );
        const historySnap = await getDocs(historyQuery);
        pointHistory = historySnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            activityTitle: data.activityTitle || 'Unknown Activity',
            role: data.role || 'Participant',
            clubName: data.clubName || 'N/A',
            points: data.points || 0,
            date: data.allocatedAt
              ? new Date(data.allocatedAt. toDate ?  data.allocatedAt.toDate() : data.allocatedAt).toLocaleDateString()
              : 'N/A',
          };
        });
      } catch (error) {
        pointHistory = [];
      }

      setReportData({
        studentInfo: {
          name: freshUserData. name || 'N/A',
          email: freshUserData.email || 'N/A',
          rollNumber: freshUserData.rollNumber || 'N/A',
          department: freshUserData.department || 'N/A',
          year: freshUserData.year || 'N/A',
          counsellorName: freshUserData.counsellorName || 'N/A',
          deanName: freshUserData. deanName || 'N/A',
          points: freshUserData.points || 0,
          activitiesParticipated: freshUserData. activitiesParticipated || pointHistory.length,
        },
        pointHistory,
      });
    } catch (error) {
      setToast({ message: 'Failed to load report data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

const handleDownloadPDF = () => {
  if (!reportData || !userData) {
    setToast({ message: 'No report data available', type: 'error' });
    return;
  }

  setDownloading(true);

  try {
    const signatures = {
      counsellor: userData.signatureCounsellor || '/images/sign1.jpeg',
      dean: userData.signatureDean || '/images/sign1.jpeg',
      principal: '/images/sign1.jpeg',
    };

    const doc = generateStudentReportPDF(
      reportData.studentInfo,
      reportData.pointHistory,
      reportData.studentInfo.counsellorName,
      reportData.studentInfo.deanName,
      signatures
    );

    doc.save(
      `Student_Report_${reportData.studentInfo.rollNumber}_${new Date()
        .toISOString()
        .split('T')[0]}.pdf`
    );

    setToast({ message: '✓ PDF Report downloaded!', type: 'success' });
  } catch (error) {
    console.error('PDF generation error:', error);
    setToast({ message: 'Failed to generate PDF', type: 'error' });
  }

  setDownloading(false);
};


  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
        <p style={{ color: colors.textSecondary }}>Loading report...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (! reportData) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '32px' }}>Academic Report</h1>
        <EmptyState icon={FileText} title="No report available" description="Unable to load report data." />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Academic Report</h1>
          <p style={{ color: colors.textSecondary }}>Your performance overview</p>
        </div>
        <Button icon={Download} onClick={handleDownloadPDF} loading={downloading}>Download PDF</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradient, display: 'flex', alignItems:  'center', justifyContent:  'center' }}>
              <Award size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{reportData.studentInfo.points}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>Total Points</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems:  'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: colors.gradientGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{reportData.studentInfo.activitiesParticipated}</p>
              <p style={{ fontSize:  '13px', color: colors. textMuted }}>Activities</p>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '20px' }}>Student Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['Name', reportData.studentInfo.name],
              ['Email', reportData. studentInfo.email],
              ['Roll Number', reportData.studentInfo.rollNumber],
              ['Department', reportData.studentInfo.department],
              ['Year', `Year ${reportData.studentInfo. year}`],
              ['Counsellor', reportData.studentInfo.counsellorName],
            ].map(([label, value], idx) => (
              <div key={idx} style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '15px', fontWeight: '500', color: colors.text }}>{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '20px' }}>Recent Activities</h3>
          {reportData.pointHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reportData.pointHistory.slice(0, 6).map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: colors.cardHover }}>
                  <div>
                    <p style={{ fontSize:  '13px', fontWeight: '500', color: colors.text }}>{p.activityTitle}</p>
                    <p style={{ fontSize: '11px', color: colors.textMuted }}>{p.date}</p>
                  </div>
                  <Badge variant="success">+{p.points}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color:  colors.textMuted, fontSize: '14px' }}>No activities yet</p>
          )}
        </Card>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: toast.type === 'success' ? colors.secondary : colors.danger, color: 'white', padding: '16px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', zIndex: 1000 }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default StudentReports;