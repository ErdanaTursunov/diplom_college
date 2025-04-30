import React, { useEffect, useState } from "react";
import "../styles/Schedule.css";
import axios from "axios";

function Schedule() {
  const [profession, setProfession] = useState("");
  const [shifts, setShifts] = useState([]);
  const [editingShift, setEditingShift] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeShifts, setEmployeeShifts] = useState([]);

  const [currentShift, setCurrentShift] = useState({
    employee: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const professions = ["Бариста", "Повар", "Официант", "Менеджер", "Кассир"];

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Ошибка при загрузке сотрудников");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Ошибка:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployeeShifts = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/schedules/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Ошибка при получении смен");
      }

      const data = await response.json();
      setEmployeeShifts(data);
    } catch (error) {
      console.error("Ошибка при загрузке смен сотрудника:", error);
    }
  };

  const token = localStorage.getItem("token");

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/schedules/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      alert("Смена успешно удалена");

      setEmployeeShifts((prevShifts) =>
        prevShifts.filter((shift) => shift.id !== id),
      );
    } catch (error) {
      alert("Произошла ошибка при удалении");
    }
  };

  const handleEdit = (shift) => {
    setEditingShift(shift.id);
    setCurrentShift({
      employee: shift.userId.toString(),
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "employee") {
      fetchEmployeeShifts(value);
    }

    setCurrentShift((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentShift({
      ...currentShift,
      [name]: value,
    });
  };

  const filteredEmployees = profession
    ? employees.filter((emp) => emp.position === profession)
    : employees;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = parseInt(currentShift.employee);
    const newDate = {
      date: currentShift.date,
      startTime: currentShift.startTime,
      endTime: currentShift.endTime,
    };

    try {
      const token = localStorage.getItem("token");

      if (editingShift !== null) {
        // Обновляем существующую смену через PUT запрос
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/schedules`,
          {
            userId,
            dates: [newDate],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status !== 200) {
          throw new Error("Ошибка при обновлении смены");
        }

        alert("Смена успешно обновлена");
      } else {
        // Создаем новую смену через POST запрос
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/schedules`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId,
              dates: [newDate],
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Ошибка при создании смены");
        }
      }

      // сбрасываем форму и режим редактирования
      setCurrentShift({
        employee: "",
        date: "",
        startTime: "",
        endTime: "",
      });
      setEditingShift(null);

      // обновляем список смен для выбранного работника
      fetchEmployeeShifts(userId);
    } catch (error) {
      console.error("Ошибка при отправке смены:", error);
      alert(
        editingShift !== null
          ? "Ошибка при обновлении смены"
          : "Ошибка при создании смены",
      );
    }
  };

  const cancelEdit = () => {
    setEditingShift(null);
    setCurrentShift({
      employee: "",
      date: "",
      startTime: "",
      endTime: "",
    });
  };

  return (
    <div className="schedule">
      <div className="filter-section">
        <label>Фильтр по профессии:</label>
        <select
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
        >
          <option value="">Все профессии</option>
          {professions.map((prof) => (
            <option key={prof} value={prof}>
              {prof}
            </option>
          ))}
        </select>
      </div>

      <div className="shift-form">
        <h2>
          {editingShift !== null
            ? "Редактировать смену"
            : "Создать новую смену"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Работник:</label>
            <select
              name="employee"
              value={currentShift.employee}
              onChange={handleUserInputChange}
              required
              disabled={editingShift !== null}
            >
              <option value="">Выберите работника</option>
              {filteredEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.position})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Дата:</label>
            <input
              type="date"
              name="date"
              value={currentShift.date}
              onChange={handleInputChange}
              required
              disabled={editingShift !== null}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Время начала:</label>
              <input
                type="time"
                name="startTime"
                value={currentShift.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Время окончания:</label>
              <input
                type="time"
                name="endTime"
                value={currentShift.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="submit-button">
              {editingShift !== null ? "Сохранить изменения" : "Создать смену"}
            </button>

            {editingShift !== null && (
              <button
                type="button"
                className="cancel-button"
                onClick={cancelEdit}
              >
                Отменить
              </button>
            )}
          </div>
        </form>
      </div>

      {employeeShifts.length > 0 && (
        <div className="employee-shifts-list">
          <h3>Смены выбранного работника</h3>
          <ul>
            {employeeShifts.map((shift) => (
              <li key={shift.id} className="employee-shift">
                <div>
                  <strong>Дата:</strong> {shift.date}
                </div>
                <div>
                  <strong>Время:</strong> {shift.startTime} - {shift.endTime}
                </div>
                <div>
                  <strong>Статус:</strong> {shift.status}
                </div>
                <div>
                  <strong>Локация:</strong> {shift.location}
                </div>
                {shift.actualStart && (
                  <div>
                    <strong>Факт. начало:</strong> {shift.actualStart}
                  </div>
                )}
                {shift.actualEnd && (
                  <div>
                    <strong>Факт. конец:</strong> {shift.actualEnd}
                  </div>
                )}
                <div>
                  <strong>Длительность:</strong> {shift.duration}
                </div>
                <div className="shift-actions">
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(shift)}
                  >
                    Изменить
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(shift.id)}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Schedule;
