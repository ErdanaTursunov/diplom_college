import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/ScanPage.css';

const ScanPage = () => {
  const { action, shiftId, employeeId, timestamp, location } = useParams();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Обработка запроса...');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const processAttendance = async () => {
      try {
        const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}`;
        
        if (action === 'start') {
          // Регистрация начала смены
          await axios.post(
            `${apiUrl}/api/attendance/check-in`,
            { userId: employeeId },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );
          setStatus('success');
          setMessage('Начало смены успешно зарегистрировано!');
        } 
        else if (action === 'end') {
          // Регистрация окончания смены
          await axios.post(
            `${apiUrl}/api/attendance/check-out`,
            { userId: employeeId },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );
          setStatus('success');
          setMessage('Окончание смены успешно зарегистрировано!');
        }
        else {
          setStatus('error');
          setMessage('Неизвестное действие. Пожалуйста, сканируйте корректный QR-код.');
        }
      } catch (error) {
        console.error('Ошибка при обработке сканирования:', error);
        setStatus('error');
        setMessage('Произошла ошибка при регистрации. Попробуйте еще раз.');
      }
    };

    // Небольшая задержка для лучшего UX
    const timer = setTimeout(() => {
      processAttendance();
    }, 1000);

    return () => clearTimeout(timer);
  }, [action, employeeId, token]);

  const handleRedirect = () => {
    navigate('/employee-home');
  };

  return (
    <div className="scan-page">
      <div className={`scan-result ${status}`}>
        <div className="status-icon">
          {status === 'processing' && <div className="spinner"></div>}
          {status === 'success' && <div className="success-icon">✓</div>}
          {status === 'error' && <div className="error-icon">✗</div>}
        </div>
        <h2>{message}</h2>
        {(status === 'success' || status === 'error') && (
          <button className="return-button" onClick={handleRedirect}>
            Вернуться на главную
          </button>
        )}
      </div>
    </div>
  );
};

export default ScanPage;