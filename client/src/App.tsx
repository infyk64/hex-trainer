import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { Theory } from "./pages/Theory";
import { Tables } from "./pages/Tables";
import { Arithmetic } from "./pages/Arithmetic";
import { Instructions } from "./pages/Instructions";
import { Trainer } from "./pages/Trainer";
import { Stats } from "./pages/Stats";
import { AdminPanel } from "./pages/AdminPanel";
import { TeacherPanel } from "./pages/TeacherPanel";
import { StudentPanel } from "./pages/StudentPanel";
import { TestTake } from "./pages/TestTake";
import type { HistoryItem } from "./types";
import { api } from "./api/client";
import "./App.css";

const ROLE_LABELS: Record<string, string> = {
  admin: "Админ",
  teacher: "Преподаватель",
  student: "Студент",
};

function App() {
  const { user, logout, loading } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [newTestsCount, setNewTestsCount] = useState(0);

  const addAttempt = (item: HistoryItem) => {
    setHistory((prev) => [item, ...prev]);
  };

  useEffect(() => {
    if (user?.role === "student") {
      api
        .get("/tests")
        .then((res) => {
          setNewTestsCount(res.data.length);
        })
        .catch(() => {});
    }
  }, [user]);

  if (loading)
    return (
      <div className="login-page">
        <p>Загрузка...</p>
      </div>
    );
  if (!user) return <LoginPage />;

  const navLinks = [
    { to: "/theory", label: "Теория" },
    { to: "/tables", label: "Таблицы" },
    { to: "/arithmetic", label: "Арифметика" },
    { to: "/instructions", label: "Инструкция" },
    { to: "/trainer", label: "Тренажёр" },
    { to: "/stats", label: "Статистика" },
  ];

  if (user.role === "admin")
    navLinks.unshift({ to: "/admin", label: "⚙ Панель админа" });
  if (user.role === "teacher")
    navLinks.unshift({ to: "/teacher", label: "📋 Панель преподавателя" });
  if (user.role === "student")
    navLinks.unshift({ to: "/student", label: "📚 Мои курсы" });

  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="navbar">
          <NavLink
            to="/theory"
            className="nav-logo"
            style={{ textDecoration: "none" }}
          >
            ТРЕНАЖЁР <span>16СС</span>
          </NavLink>
          <div className="nav-links">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="nav-right">
            <div className="nav-right">
              {user.role === "student" && newTestsCount > 0 && (
                <NavLink
                  to="/student"
                  className="btn-small"
                  style={{ position: "relative", textDecoration: "none" }}
                >
                  🔔 Тесты
                  <span className="notif-dot" />
                  <span
                    style={{
                      marginLeft: 4,
                      fontWeight: 700,
                      color: "var(--accent)",
                    }}
                  >
                    {newTestsCount}
                  </span>
                </NavLink>
              )}
            </div>
            <div className="nav-user">
              <span>{user.fullName}</span>
              <span className="nav-role">{ROLE_LABELS[user.role]}</span>
            </div>
            <button
              className="btn-small"
              onClick={() => setShowChangePassword(true)}
            >
              Сменить пароль
            </button>
            <button className="btn-logout" onClick={logout}>
              Выйти
            </button>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/theory" />} />
            <Route path="/theory" element={<Theory />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/arithmetic" element={<Arithmetic />} />
            <Route path="/instructions" element={<Instructions />} />
            <Route
              path="/trainer"
              element={<Trainer onAttempt={addAttempt} />}
            />
            <Route path="/stats" element={<Stats history={history} />} />
            {user.role === "admin" && (
              <Route path="/admin" element={<AdminPanel />} />
            )}
            {user.role === "teacher" && (
              <Route path="/teacher" element={<TeacherPanel />} />
            )}
            {user.role === "student" && (
              <>
                <Route path="/student" element={<StudentPanel />} />
                <Route path="/test/:testId" element={<TestTake />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/theory" />} />
          </Routes>
        </main>

        {showChangePassword && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowChangePassword(false);
              setPwMsg("");
            }}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>Смена пароля</h2>
              {pwMsg && (
                <div
                  className="form-error"
                  style={
                    pwMsg === "Пароль изменён"
                      ? {
                          background: "rgba(16,185,129,0.08)",
                          borderColor: "var(--green)",
                          color: "var(--green)",
                        }
                      : undefined
                  }
                >
                  {pwMsg}
                </div>
              )}
              <div className="form-group">
                <label>Текущий пароль</label>
                <input
                  className="form-input"
                  type="password"
                  value={pwForm.oldPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, oldPassword: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Новый пароль</label>
                <input
                  className="form-input"
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, newPassword: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={async () => {
                    try {
                      await api.post("/auth/change-password", pwForm);
                      setPwMsg("Пароль изменён");
                      setPwForm({ oldPassword: "", newPassword: "" });
                    } catch (err: any) {
                      setPwMsg(err.response?.data?.error || "Ошибка");
                    }
                  }}
                >
                  Сохранить
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPwMsg("");
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
