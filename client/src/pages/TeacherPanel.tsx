import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import type { Group, Test, Question } from "../types";

interface Student {
  id: number;
  full_name: string;
}
interface TheorySection {
  id: number;
  slug: string;
  title: string;
  content: string;
  sort_order: number;
}
interface BankQuestion {
  id: number;
  mode: string;
  display: string;
  correct: string;
  options: AnswerOpt[];
}
interface AnswerOpt {
  id: number;
  label: string;
  isCorrect?: boolean;
}
interface EditingTest extends Test {
  group_ids?: number[];
  questions?: (Question & { mode: string })[];
}

export function TeacherPanel() {
  const [tab, setTab] = useState<"groups" | "tests" | "questions" | "theory">(
    "groups",
  );

  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [groupMembers, setGroupMembers] = useState<Student[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  const [tests, setTests] = useState<Test[]>([]);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingTest, setEditingTest] = useState<EditingTest | null>(null);
  const [testForm, setTestForm] = useState({
    title: "",
    timeLimitMin: "",
    maxAttempts: "1",
  });
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [testGroupIds, setTestGroupIds] = useState<number[]>([]);
  const [genMode, setGenMode] = useState("random");

  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(
    null,
  );
  const [qForm, setQForm] = useState({
    display: "",
    correct: "",
    mode: "hex-to-dec",
    options: ["", "", "", ""],
  });

  const [theorySections, setTheorySections] = useState<TheorySection[]>([]);
  const [editingTheory, setEditingTheory] = useState<TheorySection | null>(
    null,
  );
  const [showAddTheory, setShowAddTheory] = useState(false);
  const [theoryForm, setTheoryForm] = useState({
    slug: "",
    title: "",
    content: "",
    sortOrder: "",
  });
  const [showMdInstructions, setShowMdInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGroups = async () => {
    const { data } = await api.get("/groups");
    setGroups(data as Group[]);
  };
  const loadTests = async () => {
    const { data } = await api.get("/tests");
    setTests(data as Test[]);
  };
  const loadStudents = async () => {
    const { data } = await api.get("/groups/students/all");
    setStudents(data as Student[]);
  };
  const loadTheory = async () => {
    const { data } = await api.get("/theory");
    setTheorySections(data as TheorySection[]);
  };
  const loadBankQuestions = async () => {
    try {
      const { data } = await api.get("/questions");
      setBankQuestions(data as BankQuestion[]);
    } catch {
      /* not yet */
    }
  };

  useEffect(() => {
    loadGroups();
    loadTests();
    loadStudents();
    loadTheory();
    loadBankQuestions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    await api.post("/groups", { name: newGroupName });
    setNewGroupName("");
    loadGroups();
  };

  const loadMembers = async (gId: number) => {
    setSelectedGroup(gId);
    const { data } = await api.get(`/groups/${gId}/members`);
    setGroupMembers(data as Student[]);
  };

  const addMember = async (studentId: number) => {
    if (!selectedGroup) return;
    await api.post(`/groups/${selectedGroup}/members`, { studentId });
    loadMembers(selectedGroup);
  };

  const removeMember = async (studentId: number) => {
    if (!selectedGroup) return;
    await api.delete(`/groups/${selectedGroup}/members/${studentId}`);
    loadMembers(selectedGroup);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase()),
  );

  const generateQuestion = async () => {
    const { data } = await api.post("/tests/generate-question", {
      mode: genMode,
    });
    setTestQuestions((prev) => [...prev, data as Question]);
  };

  const createTest = async () => {
    if (!testForm.title || testQuestions.length === 0)
      return alert("Заполните название и добавьте вопросы");
    await api.post("/tests", {
      title: testForm.title,
      timeLimitMin: testForm.timeLimitMin
        ? parseInt(testForm.timeLimitMin)
        : null,
      maxAttempts: parseInt(testForm.maxAttempts) || 1,
      questions: testQuestions.map((q) => ({
        mode: q.mode,
        display: q.display,
        correct: q.correct,
        options: q.options,
      })),
      groupIds: testGroupIds,
    });
    setShowTestForm(false);
    setTestQuestions([]);
    setTestGroupIds([]);
    setTestForm({ title: "", timeLimitMin: "", maxAttempts: "1" });
    loadTests();
  };

  const deleteTest = async (id: number) => {
    if (!confirm("Удалить тест?")) return;
    await api.delete(`/tests/${id}`);
    loadTests();
  };

  const openTest = async (t: Test) => {
    try {
      const { data } = await api.get(`/tests/${t.id}`);
      setEditingTest(data as EditingTest);
    } catch {
      setEditingTest({ ...t, questions: [] });
    }
  };

  const saveTest = async () => {
    if (!editingTest) return;
    await api.put(`/tests/${editingTest.id}`, {
      title: editingTest.title,
      timeLimitMin: editingTest.time_limit_min,
      maxAttempts: editingTest.max_attempts,
      groupIds: editingTest.group_ids ?? [],
    });
    setEditingTest(null);
    loadTests();
  };

  const saveQuestion = async () => {
    const options: AnswerOpt[] =
      qForm.mode !== "open"
        ? qForm.options
            .filter((o) => o.trim())
            .map((o, i) => ({
              id: i + 1,
              label: o,
              isCorrect: o === qForm.correct,
            }))
        : [];
    const payload = {
      display: qForm.display,
      correct: qForm.correct,
      mode: qForm.mode,
      options,
    };
    if (editingQuestion) {
      await api.put(`/questions/${editingQuestion.id}`, payload);
    } else {
      await api.post("/questions", payload);
    }
    setShowAddQuestion(false);
    setEditingQuestion(null);
    setQForm({
      display: "",
      correct: "",
      mode: "hex-to-dec",
      options: ["", "", "", ""],
    });
    loadBankQuestions();
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm("Удалить вопрос?")) return;
    await api.delete(`/questions/${id}`);
    loadBankQuestions();
  };

  const openEditQuestion = (q: BankQuestion) => {
    setEditingQuestion(q);
    const opts = q.options.map((o) => o.label);
    while (opts.length < 4) opts.push("");
    setQForm({
      display: q.display,
      correct: q.correct,
      mode: q.mode,
      options: opts,
    });
    setShowAddQuestion(true);
  };

  const filteredBankQuestions = bankQuestions.filter(
    (q) =>
      q.display?.toLowerCase().includes(bankSearch.toLowerCase()) ||
      q.mode?.toLowerCase().includes(bankSearch.toLowerCase()),
  );

  const saveTheory = async () => {
    if (!editingTheory) return;
    await api.put(`/theory/${editingTheory.id}`, {
      title: editingTheory.title,
      content: editingTheory.content,
    });
    setEditingTheory(null);
    loadTheory();
  };

  const deleteTheory = async (id: number) => {
    if (!confirm("Удалить раздел теории? Это действие необратимо.")) return;
    await api.delete(`/theory/${id}`);
    loadTheory();
  };

  // Генерация slug: транслитерация кириллицы + латиница
  const toSlug = (text: string): string => {
    const map: Record<string, string> = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "yo",
      ж: "zh",
      з: "z",
      и: "i",
      й: "j",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "kh",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
    };
    return text
      .toLowerCase()
      .split("")
      .map((c) => map[c] ?? c)
      .join("")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const addTheory = async () => {
    if (!theoryForm.title || !theoryForm.content)
      return alert("Заполните заголовок и содержимое");
    // Если slug не заполнен вручную — генерируем автоматически
    const slug =
      theoryForm.slug.trim() ||
      toSlug(theoryForm.title) ||
      `section-${Date.now()}`;
    await api.post("/theory", {
      slug,
      title: theoryForm.title,
      content: theoryForm.content,
      sortOrder: theoryForm.sortOrder ? parseInt(theoryForm.sortOrder) : 99,
    });
    setShowAddTheory(false);
    setTheoryForm({ slug: "", title: "", content: "", sortOrder: "" });
    loadTheory();
  };

  const handleMdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? "";
      let title = "";
      for (const line of text.split("\n")) {
        const match = line.match(/^#\s+(.+)/);
        if (match) {
          title = match[1].trim();
          break;
        }
      }
      // slug генерируется с транслитерацией, пользователь может исправить
      const slug = toSlug(title) || `section-${Date.now()}`;
      setTheoryForm({ slug, title, content: text, sortOrder: "" });
      setShowAddTheory(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const MODE_LABELS: Record<string, string> = {
    "hex-to-dec": "16СС→10",
    "hex-to-oct": "16СС→8",
    "hex-to-bin": "16СС→2",
    addition: "Сложение",
    subtraction: "Вычитание",
    multiplication: "Умножение",
    random: "Случайный",
    open: "Открытый",
  };

  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Панель преподавателя</h1>
        <p>Управление группами, тестами и теорией.</p>
      </div>

      <div className="mode-row">
        <button
          className={`mode-btn ${tab === "groups" ? "active" : ""}`}
          onClick={() => setTab("groups")}
        >
          Группы
        </button>
        <button
          className={`mode-btn ${tab === "tests" ? "active" : ""}`}
          onClick={() => setTab("tests")}
        >
          Тесты
        </button>
        <button
          className={`mode-btn ${tab === "questions" ? "active" : ""}`}
          onClick={() => setTab("questions")}
        >
          База вопросов
        </button>
        <button
          className={`mode-btn ${tab === "theory" ? "active" : ""}`}
          onClick={() => setTab("theory")}
        >
          Теория
        </button>
      </div>

      {/* ГРУППЫ */}
      {tab === "groups" && (
        <>
          <div className="section-card">
            <h2>Группы</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Название группы"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <button className="btn-secondary" onClick={createGroup}>
                Создать
              </button>
            </div>
            <input
              className="form-input"
              placeholder="🔍 Поиск по названию группы..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            {filteredGroups.length === 0 && (
              <div style={{ color: "var(--text2)", fontSize: 13 }}>
                Группы не найдены
              </div>
            )}
            {filteredGroups.map((g) => (
              <div
                key={g.id}
                className="course-card"
                style={{ marginBottom: 8 }}
                onClick={() => loadMembers(g.id)}
              >
                <h3>{g.name}</h3>
                <p>
                  {selectedGroup === g.id
                    ? "Выбрана ▾"
                    : "Нажмите для просмотра"}
                </p>
              </div>
            ))}
          </div>
          {selectedGroup && (
            <div className="section-card">
              <h2>
                Участники — {groups.find((g) => g.id === selectedGroup)?.name}
              </h2>
              {groupMembers.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span>{m.full_name}</span>
                  <button
                    className="btn-danger"
                    onClick={() => removeMember(m.id)}
                  >
                    Убрать
                  </button>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--text2)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Добавить студента:
                </label>
                <select
                  className="form-input"
                  onChange={(e) => {
                    if (e.target.value) addMember(parseInt(e.target.value));
                    e.target.value = "";
                  }}
                >
                  <option value="">Выберите студента...</option>
                  {students
                    .filter((s) => !groupMembers.some((m) => m.id === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* ТЕСТЫ */}
      {tab === "tests" && (
        <>
          <div className="section-card">
            <h2>Мои тесты</h2>
            <button
              className="btn-secondary"
              onClick={() => setShowTestForm(true)}
              style={{ marginBottom: 16 }}
            >
              + Создать тест
            </button>
            {tests.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <strong>{t.title}</strong>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>
                    {t.time_limit_min
                      ? `⏱ ${t.time_limit_min} мин`
                      : "Без лимита"}{" "}
                    · Попытки: {t.max_attempts}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-small" onClick={() => openTest(t)}>
                    Открыть
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => deleteTest(t.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showTestForm && (
            <div
              className="modal-overlay"
              onClick={() => setShowTestForm(false)}
            >
              <div
                className="modal-card"
                style={{ maxWidth: 660, maxHeight: "90vh", overflow: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Создание теста</h2>
                <div className="form-group">
                  <label>Название</label>
                  <input
                    className="form-input"
                    value={testForm.title}
                    onChange={(e) =>
                      setTestForm({ ...testForm, title: e.target.value })
                    }
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Время (мин)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={testForm.timeLimitMin}
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          timeLimitMin: e.target.value,
                        })
                      }
                      placeholder="Без лимита"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Попытки</label>
                    <input
                      className="form-input"
                      type="number"
                      value={testForm.maxAttempts}
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          maxAttempts: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Назначить группам</label>
                  {groups.map((g) => (
                    <label
                      key={g.id}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        padding: "4px 0",
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={testGroupIds.includes(g.id)}
                        onChange={(e) =>
                          setTestGroupIds((prev) =>
                            e.target.checked
                              ? [...prev, g.id]
                              : prev.filter((id) => id !== g.id),
                          )
                        }
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
                <div className="form-group">
                  <label>Вопросы ({testQuestions.length})</label>
                  <div
                    style={{
                      background: "var(--bg2)",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text2)",
                        marginBottom: 6,
                      }}
                    >
                      Сгенерировать:
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        className="form-input"
                        style={{ flex: 1 }}
                        value={genMode}
                        onChange={(e) => setGenMode(e.target.value)}
                      >
                        <option value="random">Случайный</option>
                        <option value="hex-to-dec">16СС→10</option>
                        <option value="hex-to-oct">16СС→8</option>
                        <option value="hex-to-bin">16СС→2</option>
                        <option value="addition">Сложение</option>
                        <option value="subtraction">Вычитание</option>
                        <option value="multiplication">Умножение</option>
                      </select>
                      <button
                        className="btn-secondary"
                        onClick={generateQuestion}
                      >
                        Добавить
                      </button>
                    </div>
                  </div>
                  {bankQuestions.length > 0 && (
                    <div
                      style={{
                        background: "var(--bg2)",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text2)",
                          marginBottom: 6,
                        }}
                      >
                        Из базы вопросов:
                      </div>
                      <div style={{ maxHeight: 140, overflow: "auto" }}>
                        {bankQuestions.map((q) => (
                          <div
                            key={q.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "3px 0",
                              borderBottom: "1px solid var(--border)",
                              fontSize: 13,
                            }}
                          >
                            <span>
                              <code style={{ fontFamily: "var(--mono)" }}>
                                {q.display}
                              </code>{" "}
                              <span
                                style={{ color: "var(--text2)", fontSize: 11 }}
                              >
                                ({MODE_LABELS[q.mode] ?? q.mode})
                              </span>
                            </span>
                            <button
                              className="btn-small"
                              onClick={() =>
                                setTestQuestions((prev) => [
                                  ...prev,
                                  { ...q, options: q.options },
                                ])
                              }
                            >
                              +
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {testQuestions.map((q, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 13,
                        padding: "6px 0",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        <code style={{ fontFamily: "var(--mono)" }}>
                          {q.display}
                        </code>
                        {(!q.options || q.options.length === 0) && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 11,
                              background: "rgba(99,102,241,0.15)",
                              color: "var(--accent)",
                              borderRadius: 4,
                              padding: "1px 5px",
                            }}
                          >
                            открытый
                          </span>
                        )}
                      </span>
                      <button
                        className="btn-danger"
                        onClick={() =>
                          setTestQuestions((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="modal-actions">
                  <button
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={createTest}
                  >
                    Создать тест
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowTestForm(false)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {editingTest && (
            <div className="modal-overlay" onClick={() => setEditingTest(null)}>
              <div
                className="modal-card"
                style={{ maxWidth: 600, maxHeight: "90vh", overflow: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Редактирование теста</h2>
                <div className="form-group">
                  <label>Название</label>
                  <input
                    className="form-input"
                    value={editingTest.title}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, title: e.target.value })
                    }
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Время (мин)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={editingTest.time_limit_min ?? ""}
                      onChange={(e) =>
                        setEditingTest({
                          ...editingTest,
                          time_limit_min: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      placeholder="Без лимита"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Попытки</label>
                    <input
                      className="form-input"
                      type="number"
                      value={editingTest.max_attempts ?? 1}
                      onChange={(e) =>
                        setEditingTest({
                          ...editingTest,
                          max_attempts: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Группы</label>
                  {groups.map((g) => (
                    <label
                      key={g.id}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        padding: "4px 0",
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={(editingTest.group_ids ?? []).includes(g.id)}
                        onChange={(e) => {
                          const ids = editingTest.group_ids ?? [];
                          setEditingTest({
                            ...editingTest,
                            group_ids: e.target.checked
                              ? [...ids, g.id]
                              : ids.filter((id) => id !== g.id),
                          });
                        }}
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
                {(editingTest.questions?.length ?? 0) > 0 && (
                  <div className="form-group">
                    <label>Вопросы ({editingTest.questions?.length})</label>
                    {editingTest.questions?.map((q, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 13,
                          padding: "6px 0",
                          borderBottom: "1px solid var(--border)",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          <code style={{ fontFamily: "var(--mono)" }}>
                            {q.display}
                          </code>
                          {(!q.options || q.options.length === 0) && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 11,
                                background: "rgba(99,102,241,0.15)",
                                color: "var(--accent)",
                                borderRadius: 4,
                                padding: "1px 5px",
                              }}
                            >
                              открытый
                            </span>
                          )}
                        </span>
                        <span style={{ color: "var(--text2)", fontSize: 11 }}>
                          {MODE_LABELS[q.mode] ?? q.mode}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="modal-actions">
                  <button
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={saveTest}
                  >
                    Сохранить
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setEditingTest(null)}
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* БАЗА ВОПРОСОВ */}
      {tab === "questions" && (
        <div className="section-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0 }}>База вопросов</h2>
            <button
              className="btn-secondary"
              onClick={() => {
                setEditingQuestion(null);
                setQForm({
                  display: "",
                  correct: "",
                  mode: "hex-to-dec",
                  options: ["", "", "", ""],
                });
                setShowAddQuestion(true);
              }}
            >
              + Добавить
            </button>
          </div>
          <input
            className="form-input"
            placeholder="🔍 Поиск по вопросу или типу..."
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {filteredBankQuestions.length === 0 && (
            <div
              style={{
                color: "var(--text2)",
                fontSize: 13,
                padding: "16px 0",
                textAlign: "center",
              }}
            >
              {bankQuestions.length === 0
                ? "База пуста. Добавьте первый вопрос!"
                : "Не найдено"}
            </div>
          )}
          {filteredBankQuestions.map((q) => (
            <div
              key={q.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <code style={{ fontFamily: "var(--mono)", fontSize: 14 }}>
                  {q.display}
                </code>
                <div
                  style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}
                >
                  {MODE_LABELS[q.mode] ?? q.mode} · Ответ:{" "}
                  <strong>{q.correct}</strong>
                  {(!q.options || q.options.length === 0) && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: "rgba(99,102,241,0.15)",
                        color: "var(--accent)",
                        borderRadius: 4,
                        padding: "1px 5px",
                      }}
                    >
                      открытый
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn-small"
                  onClick={() => openEditQuestion(q)}
                >
                  Изменить
                </button>
                <button
                  className="btn-danger"
                  onClick={() => deleteQuestion(q.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddQuestion && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddQuestion(false)}
        >
          <div
            className="modal-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingQuestion ? "Редактировать вопрос" : "Новый вопрос"}</h2>
            <div className="form-group">
              <label>Тип</label>
              <select
                className="form-input"
                value={qForm.mode}
                onChange={(e) => setQForm({ ...qForm, mode: e.target.value })}
              >
                <option value="hex-to-dec">16СС→10</option>
                <option value="hex-to-oct">16СС→8</option>
                <option value="hex-to-bin">16СС→2</option>
                <option value="addition">Сложение</option>
                <option value="subtraction">Вычитание</option>
                <option value="multiplication">Умножение</option>
                <option value="open">Открытый (студент вводит ответ)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Текст вопроса</label>
              <input
                className="form-input"
                placeholder="Например: 1A(16) в 10 сс — это:"
                value={qForm.display}
                onChange={(e) =>
                  setQForm({ ...qForm, display: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Правильный ответ</label>
              <input
                className="form-input"
                placeholder="Например: 26"
                value={qForm.correct}
                onChange={(e) =>
                  setQForm({ ...qForm, correct: e.target.value })
                }
              />
            </div>
            {qForm.mode !== "open" && (
              <div className="form-group">
                <label>Варианты ответа</label>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text2)",
                    marginBottom: 6,
                  }}
                >
                  Оставьте пустыми — вопрос станет открытым
                </div>
                {qForm.options.map((opt, i) => (
                  <input
                    key={i}
                    className="form-input"
                    style={{ marginBottom: 6 }}
                    placeholder={`Вариант ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const opts = [...qForm.options];
                      opts[i] = e.target.value;
                      setQForm({ ...qForm, options: opts });
                    }}
                  />
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveQuestion}
              >
                {editingQuestion ? "Сохранить" : "Добавить"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowAddQuestion(false);
                  setEditingQuestion(null);
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ТЕОРИЯ */}
      {tab === "theory" && (
        <div className="section-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h2 style={{ margin: 0 }}>Редактирование теории</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn-small"
                onClick={() => setShowMdInstructions((v) => !v)}
              >
                {showMdInstructions
                  ? "Скрыть инструкцию"
                  : "📄 Инструкция по .md"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                ⬆ Загрузить .md
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md"
                style={{ display: "none" }}
                onChange={handleMdUpload}
              />
              <button
                className="btn-secondary"
                onClick={() => {
                  setTheoryForm({
                    slug: "",
                    title: "",
                    content: "",
                    sortOrder: "",
                  });
                  setShowAddTheory(true);
                }}
              >
                + Добавить раздел
              </button>
            </div>
          </div>

          {showMdInstructions && (
            <div
              style={{
                background: "var(--bg2)",
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <strong>Формат .md файла:</strong>
              <pre
                style={{
                  background: "var(--bg)",
                  borderRadius: 6,
                  padding: 10,
                  marginTop: 8,
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  overflowX: "auto",
                }}
              >{`# Название раздела\n\nТекст в формате Markdown.\n\n## Подзаголовок\n\n- Пункт списка\n\n\`\`\`\nПример кода\n\`\`\``}</pre>
              <div style={{ marginTop: 8, color: "var(--text2)" }}>
                Первый заголовок <code># Header1</code> становится названием.
                Slug генерируется автоматически.
              </div>
            </div>
          )}

          {theorySections.map((s) => (
            <div
              key={s.id}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {editingTheory?.id === s.id ? (
                <>
                  <input
                    className="form-input"
                    value={editingTheory.title}
                    onChange={(e) =>
                      setEditingTheory({
                        ...editingTheory,
                        title: e.target.value,
                      })
                    }
                    style={{ marginBottom: 8 }}
                  />
                  <textarea
                    className="form-input"
                    rows={6}
                    value={editingTheory.content}
                    onChange={(e) =>
                      setEditingTheory({
                        ...editingTheory,
                        content: e.target.value,
                      })
                    }
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="btn-secondary" onClick={saveTheory}>
                      Сохранить
                    </button>
                    <button
                      className="btn-small"
                      onClick={() => setEditingTheory(null)}
                    >
                      Отмена
                    </button>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                    <strong>{s.title}</strong>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text2)",
                        marginTop: 2,
                      }}
                    >
                      {s.content.substring(0, 100)}...
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      className="btn-small"
                      onClick={() => setEditingTheory({ ...s })}
                    >
                      Ред.
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => deleteTheory(s.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddTheory && (
        <div className="modal-overlay" onClick={() => setShowAddTheory(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 580 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Новый раздел теории</h2>
            <div className="form-group">
              <label>Slug (латиница и дефис)</label>
              <input
                className="form-input"
                placeholder="hex-to-dec"
                value={theoryForm.slug}
                onChange={(e) =>
                  setTheoryForm({ ...theoryForm, slug: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Заголовок</label>
              <input
                className="form-input"
                placeholder="Название раздела"
                value={theoryForm.title}
                onChange={(e) =>
                  setTheoryForm({ ...theoryForm, title: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Содержимое (Markdown)</label>
              <textarea
                className="form-input"
                rows={8}
                value={theoryForm.content}
                onChange={(e) =>
                  setTheoryForm({ ...theoryForm, content: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Порядок сортировки</label>
              <input
                className="form-input"
                type="number"
                placeholder="99"
                value={theoryForm.sortOrder}
                onChange={(e) =>
                  setTheoryForm({ ...theoryForm, sortOrder: e.target.value })
                }
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={addTheory}
              >
                Сохранить
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowAddTheory(false)}
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
