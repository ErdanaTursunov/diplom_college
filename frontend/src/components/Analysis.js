import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Analysis.css";

function Analysis() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState("");

  useEffect(() => {
    fetchAttendanceStats();
  }, []);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/attendance/stats`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAttendanceData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Ошибка при получении статистики:", err);
      setError("Не удалось загрузить данные статистики");
      setLoading(false);
    }
  };

  // Получаем уникальные должности из данных сотрудников
  const positions = attendanceData
    ? [...new Set(attendanceData.stats.byEmployee.map((emp) => emp.position))]
    : [];

  // Фильтруем сотрудников по выбранной должности
  const filteredEmployees = !attendanceData
    ? []
    : position
      ? attendanceData.stats.byEmployee.filter(
          (emp) => emp.position === position,
        )
      : attendanceData.stats.byEmployee;

  // Расчет процента посещаемости для шкалы прогресса
  const calculateAttendanceRate = (employee) => {
    if (employee.total === 0) return 0;
    // Вычисляем процент "хороших" посещений (вовремя)
    return (employee.onTime / employee.total) * 100;
  };

  // Получение цвета шкалы в зависимости от процента посещаемости
  const getBarColor = (rate) => {
    if (rate >= 80) return "#32d74b"; // Зеленый - отлично
    if (rate >= 60) return "#5ac8fa"; // Голубой - хорошо
    if (rate >= 40) return "#ff9f0a"; // Оранжевый - средне
    return "#ff453a"; // Красный - плохо
  };

  return (
    <div className="analysis">
      <div className="filter-section">
        <label>Фильтр по должности:</label>
        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          <option value="">Все должности</option>
          {positions.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      <div className="hours-report">
        <h2>
          Отчет по посещаемости ({attendanceData?.period.start} -{" "}
          {attendanceData?.period.end})
        </h2>

        {loading ? (
          <div className="loading">
            <p>Загрузка данных...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="summary-stats">
              <div className="stat-card">
                <span className="stat-title">Всего смен</span>
                <span className="stat-value">{attendanceData.stats.total}</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Вовремя</span>
                <span className="stat-value">
                  {attendanceData.stats.onTime}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Опоздания</span>
                <span className="stat-value">{attendanceData.stats.late}</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Пропущено</span>
                <span className="stat-value">
                  {attendanceData.stats.missed}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Ранний уход</span>
                <span className="stat-value">
                  {attendanceData.stats.earlyLeave}
                </span>
              </div>
            </div>

            <h3 className="section-subtitle">Статистика по сотрудникам</h3>
            <div className="employees-list">
              {filteredEmployees.map((employee) => {
                const attendanceRate = calculateAttendanceRate(employee);
                const barColor = getBarColor(attendanceRate);

                return (
                  <div key={employee.id} className="employee-card">
                    <div className="employee-info">
                      <h3>{employee.name}</h3>
                      <p className="profession">{employee.position}</p>
                    </div>
                    <div className="attendance-metrics">
                      <div className="metric">
                        <span className="metric-label">Всего:</span>
                        <span className="metric-value">{employee.total}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Вовремя:</span>
                        <span className="metric-value">{employee.onTime}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Опоздания:</span>
                        <span className="metric-value">{employee.late}</span>
                      </div>
                    </div>
                    <div className="hours-container">
                      <div
                        className="hours-bar"
                        style={{
                          width: `${Math.min(100 * (employee.onTime / Math.max(1, employee.total)), 100)}%`,
                          background: barColor,
                        }}
                      ></div>
                      <span className="hours-count">
                        {Math.round(attendanceRate)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredEmployees.length === 0 && (
              <div className="no-data">
                <p>Нет данных для отображения</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Analysis;
