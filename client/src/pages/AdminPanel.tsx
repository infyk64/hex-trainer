import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { UserRow } from "../types";

const ROLE_OPTIONS = [
  { value: "student", label: "Студент" },
  { value: "teacher", label: "Преподаватель" },
  { value: "admin", label: "Администратор" },
];

export function AdminPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    role: "student",
    studentId: "",
    newPassword: "",
  });
  const [lastCreated, setLastCreated] = useState<{
    login: string;
    password: string;
  } | null>(null);

  const loadUsers = async () => {
    const { data } = await api.get("/users");
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ fullName: "", role: "student", studentId: "", newPassword: "" });
    setShowForm(true);
    setLastCreated(null);
  };

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setForm({
      fullName: u.full_name,
      role: u.role,
      studentId: u.student_id || "",
      newPassword: "",
    });
    setShowForm(true);
    setLastCreated(null);
  };

  const handleSave = async () => {
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
      } else {
        const { data } = await api.post("/users", form);
        if (data.generatedPassword) {
          setLastCreated({
            login: data.login,
            password: data.generatedPassword,
          });
        }
      }
      await loadUsers();
      setShowForm(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Ошибка");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить пользователя?")) return;
    await api.delete(`/users/${id}`);
    loadUsers();
  };

  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Панель администратора</h1>
        <p>Управление пользователями: создание, редактирование, удаление.</p>
      </div>

      <div className="section-card">
        <h2>Пользователи</h2>
        <div style={{ marginBottom: 16 }}>
          <button className="btn-secondary" onClick={openCreate}>
            + Создать пользователя
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Логин</th>
              <th>Роль</th>
              <th>Пароль</th>
              <th>Ном. студ.</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                  {u.login}
                </td>
                <td>
                  <span className={`role-badge ${u.role}`}>{u.role}</span>
                </td>
                <td
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: "var(--accent)",
                  }}
                >
                  {(u as any).plain_password || "***"}
                </td>
                <td>{u.student_id || "—"}</td>
                <td>
                  <button
                    className="btn-small"
                    onClick={() => openEdit(u)}
                    style={{ marginRight: 6 }}
                  >
                    Ред.
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(u.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editUser ? "Редактирование" : "Новый пользователь"}</h2>

            <div className="form-group">
              <label>ФИО</label>
              <input
                className="form-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Роль</label>
              <select
                className="form-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {form.role === "student" && (
              <div className="form-group">
                <label>Номер студенческого (= пароль)</label>
                <input
                  className="form-input"
                  value={form.studentId}
                  onChange={(e) =>
                    setForm({ ...form, studentId: e.target.value })
                  }
                  placeholder="Если пустой — сгенерируется"
                />
              </div>
            )}
            {editUser && (
              <div className="form-group">
                <label>Новый пароль (оставьте пустым, чтобы не менять)</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                />
              </div>
            )}

            {lastCreated && (
              <div
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid var(--green)",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                <strong>Пользователь создан!</strong>
                <br />
                Логин:{" "}
                <code style={{ fontFamily: "var(--mono)" }}>
                  {lastCreated.login}
                </code>
                <br />
                Пароль:{" "}
                <code
                  style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}
                >
                  {lastCreated.password}
                </code>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleSave}
              >
                {editUser ? "Сохранить" : "Создать"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
