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
    login: "",
    role: "student",
    studentId: "",
    newPassword: "",
  });
  const [lastCreated, setLastCreated] = useState<{
    login: string;
    password: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalTests: number;
    avgSuccess: number | null;
  }>({ totalUsers: 0, totalTests: 0, avgSuccess: null });
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  const loadUsers = async () => {
    const { data } = await api.get("/users");
    setUsers(data);
    setStats((prev) => ({ ...prev, totalUsers: data.length }));
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch {
      // fallback — просто считаем пользователей
    }
  };

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditUser(null);
    setForm({ fullName: "", login: "", role: "student", studentId: "", newPassword: "" });
    setShowForm(true);
    setLastCreated(null);
  };

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setForm({
      fullName: u.full_name,
      login: u.login,
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

  const handleDelete = async (u: UserRow) => {
    setConfirmDelete(u);
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return;
    await api.delete(`/users/${confirmDelete.id}`);
    setConfirmDelete(null);
    loadUsers();
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Панель администратора</h1>
        <p>Управление пользователями: создание, редактирование, удаление.</p>
      </div>

      {/* Статистические карточки */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "var(--bg2)",
            borderRadius: 12,
            padding: "16px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              fontFamily: "var(--mono)",
              color: "var(--accent)",
            }}
          >
            {stats.totalUsers}
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
            Всего пользователей
          </div>
        </div>
        <div
          style={{
            background: "var(--bg2)",
            borderRadius: 12,
            padding: "16px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              fontFamily: "var(--mono)",
              color: "var(--accent)",
            }}
          >
            {stats.totalTests}
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
            Всего тестов создано
          </div>
        </div>
        <div
          style={{
            background: "var(--bg2)",
            borderRadius: 12,
            padding: "16px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              fontFamily: "var(--mono)",
              color:
                stats.avgSuccess === null
                  ? "var(--text2)"
                  : stats.avgSuccess >= 70
                  ? "var(--green)"
                  : stats.avgSuccess >= 40
                  ? "var(--yellow)"
                  : "var(--red)",
            }}
          >
            {stats.avgSuccess !== null ? `${stats.avgSuccess}%` : "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
            Средний % успешности
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>Пользователи</h2>

        {/* Кнопка + поиск + фильтр */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <button className="btn-secondary" onClick={openCreate}>
            + Создать пользователя
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: "var(--text2)" }}>
              🔍 Поиск
            </label>
            <input
              className="form-input"
              placeholder="Поиск по ФИО, логину"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "var(--text2)" }}>
              👥 Роль
            </label>
            <select
              className="form-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="admin">admin</option>
              <option value="student">student</option>
              <option value="teacher">teacher</option>
            </select>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Логин</th>
              <th>Роль</th>
              <th>Пароль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
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
                    onClick={() => handleDelete(u)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно подтверждения удаления */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h2>Подтверждение удаления</h2>
            <p style={{ marginBottom: 16, lineHeight: 1.6 }}>
              Вы уверены, что хотите удалить{" "}
              <strong>
                {confirmDelete.role === "student" ? "ученика" : confirmDelete.role === "teacher" ? "преподавателя" : "администратора"}{" "}
                {confirmDelete.full_name}
              </strong>
              ? Все его результаты также будут удалены.
            </p>
            <div className="modal-actions">
              <button
                className="btn-danger"
                style={{ flex: 1 }}
                onClick={confirmDeleteUser}
              >
                Удалить
              </button>
              <button
                className="btn-secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editUser ? "Редактирование пользователя" : "Новый пользователь"}</h2>

            <div className="form-group">
              <label>ФИО</label>
              <input
                className="form-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            {editUser && (
              <div className="form-group">
                <label>Логин</label>
                <input
                  className="form-input"
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  placeholder="Логин пользователя"
                />
              </div>
            )}

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