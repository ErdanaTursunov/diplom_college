import React, { useState, useEffect, useContext, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { QRCodeCanvas } from 'qrcode.react';
import { BellIcon, CheckIcon } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../styles/EmployeeHomePage.css';
import axios from "axios";
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const EmployeeHomePage = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState(null);
  const [shiftStatus, setShiftStatus] = useState('pending');
  const [timeElapsed, setTimeElapsed] = useState('00:00:00');
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [qrCodeValue, setQrCodeValue] = useState('');
  const { logout } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userData?.id;
  const navigate = useNavigate();
  const location = useLocation();

  // Состояния для уведомлений
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationPanelRef = useRef(null);

  // Форматирование данных смены
  const formatShiftData = (shift) => {
    return {
      id: shift.id,
      userId: shift.userId,
      date: shift.date,
      status: shift.status || 'pending',
      startTime: shift.scheduledStartTime?.substring(0, 5) || '00:00',
      endTime: shift.scheduledEndTime?.substring(0, 5) || '00:00',
      actualStart: shift.checkInTime,
      actualEnd: shift.checkOutTime,
      checkInTime: shift.checkInTime,
      checkOutTime: shift.checkOutTime,
      duration: calculateDuration(shift.scheduledStartTime, shift.scheduledEndTime),
      location: shift.location || 'Офис' // Default location if not provided
    };
  };

  // Расчет продолжительности смены
  const calculateDuration = (start, end) => {
    if (!start || !end) return '0ч';

    const startParts = start.split(':').map(Number);
    const endParts = end.split(':').map(Number);

    let hours = endParts[0] - startParts[0];
    let minutes = endParts[1] - startParts[1];

    if (minutes < 0) {
      hours--;
      minutes += 60;
    }

    return minutes > 0 ? `${hours}ч ${minutes}м` : `${hours}ч`;
  };

  // Функция загрузки смен
  const fetchShifts = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/attendance/my-attendance`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Format the server response to match our expected format
      const formattedShifts = response.data.map(formatShiftData);
      setShifts(formattedShifts);

      // Find active or finishing shift
      const active = formattedShifts.find(shift =>
        shift.status === 'active' ||
        shift.status === 'finishing' ||
        shift.status === 'upcoming'
      );

      if (active) {
        setActiveShift(active);

        if (active.status === 'finishing') {
          // Shift needs to be checked out
          setShiftStatus('finishing');
          generateQrCodeForShift(active, 'end');
        } else if (active.checkInTime) {
          // Shift has been checked in
          setShiftStatus('started');
        } else {
          // Shift is upcoming or active but not checked in
          setShiftStatus('pending');
          generateQrCodeForShift(active, 'start');
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Ошибка при получении расписания:', error);
      setLoading(false);
    }
  };
  // Функция загрузки уведомлений
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await axios.get(
        `http://localhost:4000/api/notifications`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setNotifications(response.data.data);
        const unread = response.data.data.filter(notification => !notification.isRead).length;
        setUnreadCount(unread);
      }
      setNotificationsLoading(false);
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
      setNotificationsLoading(false);
    }
  };

  // Функция для отметки уведомления как прочитанного
  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(
        `http://localhost:4000/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Обновляем состояние уведомлений локально
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Обновляем счетчик непрочитанных
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Ошибка при отметке уведомления как прочитанного:', error);
    }
  };

  // Переключатель отображения панели уведомлений
  const toggleNotificationsPanel = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  // Закрытие панели уведомлений по клику вне её области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target) &&
        !event.target.closest('.notifications-button')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Загрузка начальных данных
  useEffect(() => {
    fetchShifts();
    fetchNotifications(); // Загружаем уведомления при монтировании
  }, [token, location.pathname]);

  // Управление таймерами
  useEffect(() => {
    if (!activeShift) return;

    // Функция для расчета времени до окончания смены
    const calculateTimeLeft = () => {
      try {
        const now = new Date();
        // Получаем дату окончания смены из activeShift
        const [hoursEnd, minutesEnd] = activeShift.endTime.split(':').map(Number);

        // Создаем дату окончания смены
        const endDate = new Date(activeShift.date);
        endDate.setHours(hoursEnd, minutesEnd, 0, 0);

        // Если текущее время уже после окончания смены
        if (now > endDate) {
          if (shiftStatus !== 'finishing' && shiftStatus !== 'completed') {
            setShiftStatus('finishing');
            generateQrCodeForShift(activeShift, 'end');
          }
          return '00:00:00';
        }

        // Расчет разницы
        const difference = endDate - now;

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error('Error calculating time left:', error);
        return '00:00:00';
      }
    };

    // Функция для расчета времени, прошедшего с начала смены
    const calculateTimeElapsed = () => {
      try {
        const now = new Date();

        // Получаем время начала смены из activeShift
        const [hoursStart, minutesStart] = activeShift.startTime.split(':').map(Number);

        // Создаем дату начала смены
        const startDate = new Date(activeShift.date);
        startDate.setHours(hoursStart, minutesStart, 0, 0);

        // Если смена еще не началась
        if (now < startDate) {
          return '00:00:00';
        }

        // Расчет разницы
        const difference = now - startDate;

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error('Error calculating elapsed time:', error);
        return '00:00:00';
      }
    };

    const updateTimers = () => {
      setTimeLeft(calculateTimeLeft());
      setTimeElapsed(calculateTimeElapsed());
    };

    // Initial update
    updateTimers();

    // Set interval for updates
    const timer = setInterval(updateTimers, 1000);

    return () => clearInterval(timer);
  }, [activeShift, shiftStatus]);

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  // Форматирование даты и времени для уведомлений
  const formatNotificationDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();

    // Если уведомление от сегодняшнего дня, отображаем только время
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    // Если уведомление от вчерашнего дня
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Для остальных случаев - полная дата
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Обработчик выхода
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Генерация QR-кода для начала/окончания смены
  const generateQrCodeForShift = (shift, action) => {
    const timestamp = new Date().getTime();

    // Создаем URL для сканирования вместо JSON-объекта
    const scanUrl = `${window.location.origin}/scan/${action}/${shift.id}/${userId}/${timestamp}/${encodeURIComponent(shift.location || 'Office')}`;

    setQrCodeValue(scanUrl);
  };

  // Компонент секции QR-кода
  const QrCodeSection = () => (
    <div className="qr-section">
      <div className="qr-code-container">
        <div className="qr-code">
          <QRCodeCanvas
            value={qrCodeValue}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="qr-instructions">
          {shiftStatus === 'pending'
            ? 'Отсканируйте QR-код для начала смены'
            : 'Отсканируйте QR-код для завершения смены'}
        </p>

        {/* Кнопка для тестирования (в реальном приложении можно убрать) */}
        <button
          className="test-scan-button"
          onClick={() => window.open(qrCodeValue, '_blank')}
        >
          Имитировать сканирование QR-кода
        </button>
      </div>
    </div>
  );

  // Компонент секции таймера
  const TimerSection = () => (
    <div className="timer-section">
      <div className="timer-container">
        <div className="timer-progress">
          <div className="time-elapsed">
            <p className="timer-label">Прошло времени</p>
            <div className="time-value">{timeElapsed}</div>
          </div>
          <div className="time-divider"></div>
          <div className="time-remaining">
            <p className="timer-label">Осталось до конца</p>
            <div className="time-value">{timeLeft}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Получение инициалов пользователя для аватара
  const getUserInitials = () => {
    const name = userData?.name || '';
    if (!name) return 'НП'; // Default initials

    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Компонент панели уведомлений
  const NotificationsPanel = () => (
    <div
      className={`notifications-panel ${showNotifications ? 'active' : ''}`}
      ref={notificationPanelRef}
    >
      <div className="notifications-header">
        <h3>Уведомления</h3>
        {unreadCount > 0 && (
          <button
            className="mark-all-read-button"
            onClick={() => {
              notifications.forEach(notification => {
                if (!notification.isRead) {
                  markNotificationAsRead(notification.id);
                }
              });
            }}
          >
            Прочитать все
          </button>
        )}
      </div>
      <div className="notifications-list">
        {notificationsLoading ? (
          <div className="notifications-loading">
            <div className="spinner"></div>
            <p>Загрузка уведомлений...</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => {
                if (!notification.isRead) {
                  markNotificationAsRead(notification.id);
                }
              }}
            >
              <div className="notification-icon-container">
                <div className={`notification-icon ${notification.type}`}>
                  {notification.type === 'schedule' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {!notification.isRead && <div className="notification-unread-dot"></div>}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4 className="notification-title">{notification.title}</h4>
                  <span className="notification-time">{formatNotificationDate(notification.createdAt)}</span>
                </div>
                <p className="notification-message">{notification.message}</p>
              </div>
              {!notification.isRead && (
                <button
                  className="notification-mark-read"
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationAsRead(notification.id);
                  }}
                >
                  <CheckIcon size={16} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <p>У вас нет новых уведомлений</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="employee-shifts-page">
      <header className="shifts-header">
        <div className="header-content">
          <h1>Мои смены</h1>
          <div className="user-profile">
            <button
              className="notifications-button"
              onClick={toggleNotificationsPanel}
            >
              <BellIcon size={20} />
              {unreadCount > 0 && (
                <span className="notifications-badge">{unreadCount}</span>
              )}
            </button>
            <div className="user-avatar">{getUserInitials()}</div>
            <button onClick={handleLogout} className="logout-button">Выход</button>
          </div>
        </div>
      </header>

      <NotificationsPanel />

      <main className="shifts-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Загрузка данных...</p>
          </div>
        ) : shifts.length > 0 ? (
          <>
            <div className="shifts-section">
              <h2 className="section-title">Ваши смены</h2>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                className="shifts-slider"
              >
                {shifts.map(shift => (
                  <SwiperSlide key={shift.id}>
                    <div className={`shift-card ${shift.status}`}>
                      <div className="shift-date">{formatDate(shift.date)}</div>
                      <div className="shift-time">
                        <span className="time-range">{shift.startTime} - {shift.endTime}</span>
                        <span className={`shift-status-badge ${shift.status}`}>
                          {shift.status === 'active' ? 'активна' :
                            shift.status === 'pending' ? 'ожидает' :
                              shift.status === 'completed' ? 'завершена' :
                                shift.status === 'finishing' ? 'завершается' :
                                  shift.status === 'missed' ? 'пропущена' :
                                    shift.status === 'upcoming' ? 'скоро начнется' : shift.status}
                        </span>
                      </div>
                      <div className="shift-details">
                        <div className="detail">
                          <span>Длительность: {shift.duration}</span>
                        </div>
                        <div className="detail">
                          <span>Локация: {shift.location}</span>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {activeShift && (
              <>
                {(shiftStatus === 'started' || shiftStatus === 'active') ? (
                  <TimerSection />
                ) : (
                  <QrCodeSection />
                )}
              </>
            )}
          </>
        ) : (
          <div className="no-shifts">
            <p>На данный момент у вас нет запланированных смен</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeHomePage;