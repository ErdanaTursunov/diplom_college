import React from 'react';
import '../styles/Navigation.css';

function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'schedule', label: 'График' },
    { id: 'analysis', label: 'Анализ' },
    { id: 'employees', label: 'Работники' }
  ];

  return (
    <nav className="navigation">
      <ul>
        {tabs.map(tab => (
          <li 
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;