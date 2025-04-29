import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeHomePage from './pages/EmployeeHomePage';
import ScanPage from './pages/ScanPage';
import AppleLogin from './pages/Login';
import withAuth from './WithAuth/WithAuth';
import AdminPanel from './AdminPanel';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={<AppleLogin />} />

        {/* Защищенные маршруты */}
        <Route path="/" element={<ProtectedRoute><Navigate to="/employee-home" replace /></ProtectedRoute>} />
        <Route path="/employee-home" element={<ProtectedRoute><EmployeeHomePage /></ProtectedRoute>} />

        {/* Маршрут для страницы сканирования QR-кода */}
        <Route path="/scan/:action/:shiftId/:employeeId/:timestamp/:location" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />

        {/* Маршрут по умолчанию (404) */}
        <Route path="*" element={<Navigate to="/" replace />} />

        <Route path="/admin" element={<ProtectedAdminDashboard />} />

      </Routes>
    </Router>

  );
};

const ProtectedAdminDashboard = withAuth(AdminPanel, ['admin']);

export default App;
