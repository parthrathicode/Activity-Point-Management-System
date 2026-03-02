import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';

// Dean Pages
import DeanDashboard from './pages/Dean/DeanDashboard';
import DeanCounsellors from './pages/Dean/DeanCounsellors';
import DeanStudents from './pages/Dean/DeanStudents';
import DeanClubs from './pages/Dean/DeanClubs';
import DeanActivities from './pages/Dean/DeanActivities';
import DeanVerifyActivities from './pages/Dean/DeanVerifyActivities';
import DeanVerifyPoints from './pages/Dean/DeanVerifyPoints';



// import CounsellorAttendance from './pages/Counsellor/CounsellorAttendance';
// import DeanStudentAttendance from './pages/Dean/DeanStudentAttendance';
import StudentReports from './pages/Student/StudentReports';

// Club Pages
import ClubDashboard from './pages/Club/ClubDashboard';
import ClubProposeActivity from './pages/Club/ClubProposeActivity';
import ClubMyActivities from './pages/Club/ClubMyActivities';
import ClubAllocatePoints from './pages/Club/ClubAllocatePoints';

// Counsellor Pages
import CounsellorDashboard from './pages/Counsellor/CounsellorDashboard';
import CounsellorStudents from './pages/Counsellor/CounsellorStudents';
import CounsellorProposals from './pages/Counsellor/CounsellorProposals';
import CounsellorActivities from './pages/Counsellor/CounsellorActivities';

// Student Pages
import StudentDashboard from './pages/Student/StudentDashboard';
import StudentActivities from './pages/Student/StudentActivities';
import StudentPoints from './pages/Student/StudentPoints';


// HOD Pages
import HODDashboard from './pages/HOD/HODDashboard';
import HODStudents from './pages/HOD/HODStudents';
import HODProposeActivity from './pages/HOD/HODProposeActivity';
import HODMyActivities from './pages/HOD/HODMyActivities';
import HODAllocatePoints from './pages/HOD/HODAllocatePoints';
import DeanHODs from './pages/Dean/DeanHODs';

// Loading Component
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '3px solid rgba(99, 102, 241, 0.2)',
      borderTopColor: '#6366f1',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userData, loading } = useAuth();
  const location = useLocation();

  // Still loading from localStorage
  if (loading) {
    return <LoadingScreen />;
  }

  // Check if user is logged in
  if (!userData || ! userData.uid) {
    console.log("[ProtectedRoute] No userData, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    console.log("[ProtectedRoute] User role not allowed, redirecting to home");
    return <Navigate to={`/${userData.role}`} replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { userData, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (userData && userData.uid) {
    console.log("[PublicRoute] User already logged in, redirecting to home");
    return <Navigate to={`/${userData.role}`} replace />;
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />

      {/* Dean Routes */}
      <Route path="/dean" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <DeanDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dean/counsellors" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <DeanCounsellors />
        </ProtectedRoute>
      } />
      <Route path="/dean/students" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <DeanStudents />
        </ProtectedRoute>
      } />
      <Route path="/dean/clubs" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <DeanClubs />
        </ProtectedRoute>
      } />
      <Route path="/dean/activities" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <DeanActivities />
        </ProtectedRoute>
      } />
      <Route path="/dean/verify-activities" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <DeanVerifyActivities />
        </ProtectedRoute>
      } />
      <Route path="/dean/verify-points" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <DeanVerifyPoints />
        </ProtectedRoute>
      } />


<Route path="/dean/hods" element={
  <ProtectedRoute allowedRoles={['dean']}>
    <DeanHODs />
  </ProtectedRoute>
} />


{/* HOD Routes */}
<Route path="/hod" element={
  <ProtectedRoute allowedRoles={['hod']}>
    <HODDashboard />
  </ProtectedRoute>
} />
<Route path="/hod/students" element={
  <ProtectedRoute allowedRoles={['hod']}>
    <HODStudents />
  </ProtectedRoute>
} />
<Route path="/hod/propose-activity" element={
  <ProtectedRoute allowedRoles={['hod']}>
    <HODProposeActivity />
  </ProtectedRoute>
} />
<Route path="/hod/my-activities" element={
  <ProtectedRoute allowedRoles={['hod']}>
    <HODMyActivities />
  </ProtectedRoute>
} />
<Route path="/hod/allocate-points" element={
  <ProtectedRoute allowedRoles={['hod']}>
    <HODAllocatePoints />
  </ProtectedRoute>
} />

      {/* Club Routes */}
      <Route path="/club" element={
        <ProtectedRoute allowedRoles={['club']}>
          <ClubDashboard />
        </ProtectedRoute>
      } />
      <Route path="/club/propose-activity" element={
        <ProtectedRoute allowedRoles={['club']}>
          <ClubProposeActivity />
        </ProtectedRoute>
      } />
      <Route path="/club/my-activities" element={
        <ProtectedRoute allowedRoles={['club']}>
          <ClubMyActivities />
        </ProtectedRoute>
      } />
      <Route path="/club/allocate-points" element={
        <ProtectedRoute allowedRoles={['club']}>
          <ClubAllocatePoints />
        </ProtectedRoute>
      } />

      {/* Counsellor Routes */}
      <Route path="/counsellor" element={
        <ProtectedRoute allowedRoles={['counsellor']}>
          <CounsellorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/counsellor/students" element={
        <ProtectedRoute allowedRoles={['counsellor']}>
          <CounsellorStudents />
        </ProtectedRoute>
      } />
      <Route path="/counsellor/proposals" element={
        <ProtectedRoute allowedRoles={['counsellor']}>
          <CounsellorProposals />
        </ProtectedRoute>
      } />
      <Route path="/counsellor/activities" element={
        <ProtectedRoute allowedRoles={['counsellor']}>
          <CounsellorActivities />
        </ProtectedRoute>
      } />




      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/activities" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentActivities />
        </ProtectedRoute>
      } />
      <Route path="/student/points" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentPoints />
        </ProtectedRoute>
      } />


{/* <Route path="/counsellor/attendance" element={
  <ProtectedRoute allowedRoles={['counsellor']}>
    <CounsellorAttendance />
  </ProtectedRoute>
} /> */}

{/* <Route path="/dean/attendance" element={
  <ProtectedRoute allowedRoles={['dean']}>
    <DeanStudentAttendance />
  </ProtectedRoute>
} /> */}

<Route path="/student/reports" element={
  <ProtectedRoute allowedRoles={['student']}>
    <StudentReports />
  </ProtectedRoute>
}/>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;