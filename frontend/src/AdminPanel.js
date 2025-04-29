import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Schedule from './components/Schedule';
import Analysis from './components/Analysis';
import Employees from './components/Employees';
import "./styles/AdminPanel.css"
import { AuthContext } from './context/AuthContext';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('schedule');
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const renderContent = () => {
    switch (activeTab) {
      case 'schedule':
        return <Schedule />;
      case 'analysis':
        return <Analysis />;
      case 'employees':
        return <Employees />;
      default:
        return <Schedule />;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  }

  return (
    <>
      <button
        className="logout-button"
        onClick={handleLogout}
      >
        Выйти
      </button>

      <div className="app-container">
        <div className="admin-panel">
          <h1>Панель администратора</h1>
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="content-container">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}


export default AdminPanel;
