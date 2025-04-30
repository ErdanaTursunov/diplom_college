import React, { useEffect, useState } from "react";
import "../styles/Employees.css";
import axios from "axios";

function Employees() {
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "user",
    position: "",
  });

  const positions = ["Бариста", "Повар", "Официант", "Менеджер", "Кассир"];
  const roles = ["user", "admin"];

  // Вынесенная функция для загрузки сотрудников
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

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEmployees((provData) => provData.filter((user) => user.id !== id));
    } catch (error) {
      alert("Произошло ошибка при удаления пользователя");
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const newEmployee = { ...formData };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newEmployee),
        },
      );

      if (!response.ok) {
        throw new Error("Ошибка при регистрации сотрудника");
      }

      await fetchEmployees(); // Обновляем список после регистрации

      // Сброс формы
      setFormData({
        fullName: "",
        email: "",
        password: "",
        role: "user",
        position: "",
      });
    } catch (error) {
      console.error("Ошибка:", error);
    }
  };

  return (
    <div className="employees">
      <div className="employees-form">
        <h2>Добавить нового сотрудника</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Полное имя:</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label>Пароль:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Минимум 6 символов"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Роль:</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role === "user" ? "Пользователь" : "Администратор"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Должность:</label>
              <select
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите должность</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit">Добавить сотрудника</button>
        </form>
      </div>

      <div className="employees-list">
        <h2>Список сотрудников</h2>
        <div className="employees-table">
          <div className="table-header">
            <div className="table-cell">Имя</div>
            <div className="table-cell">Email</div>
            <div className="table-cell">Должность</div>
            <div className="table-cell">Роль</div>
          </div>

          {employees.map((employee) => (
            <div className="table-row" key={employee.id}>
              <div className="table-cell">{employee.fullName}</div>
              <div className="table-cell">{employee.email}</div>
              <div className="table-cell">{employee.position}</div>
              <div className="table-cell">
                <span className={`role-badge ${employee.role}`}>
                  {employee.role === "user" ? "Пользователь" : "Администратор"}
                </span>
              </div>
              <button onClick={() => handleDelete(employee.id)}>х</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Employees;
