import React, { useState } from 'react';
import '../styles/Analysis.css';

function Analysis() {
  const [profession, setProfession] = useState('');
  
  const professions = ['Бариста', 'Повар', 'Официант', 'Менеджер', 'Кассир'];
  
  const employeeData = [
    { id: 1, name: 'Иван Петров', profession: 'Бариста', hoursWorked: 42 },
    { id: 2, name: 'Анна Смирнова', profession: 'Повар', hoursWorked: 38 },
    { id: 3, name: 'Петр Иванов', profession: 'Официант', hoursWorked: 35 },
    { id: 4, name: 'Елена Соколова', profession: 'Бариста', hoursWorked: 40 },
    { id: 5, name: 'Алексей Козлов', profession: 'Менеджер', hoursWorked: 45 },
    { id: 6, name: 'Мария Морозова', profession: 'Кассир', hoursWorked: 32 },
    { id: 7, name: 'Дмитрий Волков', profession: 'Повар', hoursWorked: 36 },
    { id: 8, name: 'Светлана Новикова', profession: 'Официант', hoursWorked: 30 }
  ];
  
  const filteredEmployees = profession
    ? employeeData.filter(emp => emp.profession === profession)
    : employeeData;
    
  return (
    <div className="analysis">
      <div className="filter-section">
        <label>Фильтр по профессии:</label>
        <select 
          value={profession} 
          onChange={(e) => setProfession(e.target.value)}
        >
          <option value="">Все профессии</option>
          {professions.map(prof => (
            <option key={prof} value={prof}>{prof}</option>
          ))}
        </select>
      </div>
      
      <div className="hours-report">
        <h2>Отчет по отработанным часам</h2>
        
        <div className="employees-list">
          {filteredEmployees.map(employee => (
            <div key={employee.id} className="employee-card">
              <div className="employee-info">
                <h3>{employee.name}</h3>
                <p className="profession">{employee.profession}</p>
              </div>
              <div className="hours-container">
                <div className="hours-bar" style={{ width: `${(employee.hoursWorked / 50) * 100}%` }}></div>
                <span className="hours-count">{employee.hoursWorked} ч</span>
              </div>
            </div>
          ))}
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="no-data">
            <p>Нет данных для отображения</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analysis;