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
interface TestResultAttempt {
  id: number;
  student_id: number;
  full_name: string;
  score: number;
  total: number;
  started_at: string;
  finished_at: string | null;
}

interface StudentAnalytics {
  studentId: number;
  fullName: string;
  attempts: TestResultAttempt[];
  avgPercent: number;
  trendSlope: number;
  trendLabel: string;
  trendEquation: string;
  successProbability: number;
  riskClass: string;
}

function toPercent(score: number, total: number): number {
  if (total <= 0) return 0;
  return (score / total) * 100;
}

function getLinearRegression(points: number[]): { slope: number; intercept: number } {
  if (points.length === 0) return { slope: 0, intercept: 0 };
  if (points.length === 1) return { slope: 0, intercept: points[0] };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < points.length; i++) {
    const x = i + 1;
    const y = points[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const n = points.length;
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: points[0] };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function getTrendLabel(slope: number): string {
  if (slope > 2) return "Рост";
  if (slope < -2) return "Снижение";
  return "Стабильно";
}

function bucketByPercent(percent: number): "low" | "mid" | "high" {
  if (percent < 50) return "low";
  if (percent < 75) return "mid";
  return "high";
}

function trendDirection(slope: number): "down" | "stable" | "up" {
  if (slope > 2) return "up";
  if (slope < -2) return "down";
  return "stable";
}

export function TeacherPanel() {
  const [tab, setTab] = useState<
    "groups" | "tests" | "questions" | "theory" | "analytics"
  >("groups");

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
  const [analyticsTestId, setAnalyticsTestId] = useState<number | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsStudents, setAnalyticsStudents] = useState<StudentAnalytics[]>(
    [],
  );

  const buildStudentAnalytics = (attemptsRaw: TestResultAttempt[]) => {
    const finished = attemptsRaw.filter((a) => a.finished_at);
    const byStudent = new Map<number, TestResultAttempt[]>();

    for (const item of finished) {
      const list = byStudent.get(item.student_id) ?? [];
      list.push(item);
      byStudent.set(item.student_id, list);
    }

    for (const arr of byStudent.values()) {
      arr.sort((a, b) => +new Date(a.started_at) - +new Date(b.started_at));
    }

    const trainData: {
      scoreBucket: "low" | "mid" | "high";
      trend: "down" | "stable" | "up";
      labelSuccess: boolean;
    }[] = [];

    for (const arr of byStudent.values()) {
      for (let i = 0; i < arr.length - 1; i++) {
        const currentPct = toPercent(arr[i].score, arr[i].total);
        const prevPct = i > 0 ? toPercent(arr[i - 1].score, arr[i - 1].total) : currentPct;
        const delta = currentPct - prevPct;
        const nextPct = toPercent(arr[i + 1].score, arr[i + 1].total);

        trainData.push({
          scoreBucket: bucketByPercent(currentPct),
          trend: delta > 2 ? "up" : delta < -2 ? "down" : "stable",
          labelSuccess: nextPct >= 70,
        });
      }
    }

    const totalExamples = trainData.length;
    const successExamples = trainData.filter((d) => d.labelSuccess).length;
    const failExamples = totalExamples - successExamples;

    const priorSuccess = (successExamples + 1) / (totalExamples + 2);
    const priorFail = (failExamples + 1) / (totalExamples + 2);

    const scoreBuckets: ("low" | "mid" | "high")[] = ["low", "mid", "high"];
    const trendBuckets: ("down" | "stable" | "up")[] = ["down", "stable", "up"];

    const condProb = {
      scoreBucketGivenSuccess: (bucket: "low" | "mid" | "high") => {
        const c = trainData.filter(
          (d) => d.labelSuccess && d.scoreBucket === bucket,
        ).length;
        return (c + 1) / (successExamples + scoreBuckets.length);
      },
      scoreBucketGivenFail: (bucket: "low" | "mid" | "high") => {
        const c = trainData.filter(
          (d) => !d.labelSuccess && d.scoreBucket === bucket,
        ).length;
        return (c + 1) / (failExamples + scoreBuckets.length);
      },
      trendGivenSuccess: (t: "down" | "stable" | "up") => {
        const c = trainData.filter((d) => d.labelSuccess && d.trend === t).length;
        return (c + 1) / (successExamples + trendBuckets.length);
      },
      trendGivenFail: (t: "down" | "stable" | "up") => {
        const c = trainData.filter((d) => !d.labelSuccess && d.trend === t).length;
        return (c + 1) / (failExamples + trendBuckets.length);
      },
    };

    const result: StudentAnalytics[] = [];

    for (const [studentId, arr] of byStudent.entries()) {
      const percents = arr.map((a) => toPercent(a.score, a.total));
      const avgPercent =
        percents.length > 0
          ? percents.reduce((sum, p) => sum + p, 0) / percents.length
          : 0;
      const { slope, intercept } = getLinearRegression(percents);
      const scoreBucket = bucketByPercent(percents[percents.length - 1] ?? 0);
      const studentTrend = trendDirection(slope);

      let successProbability = 0.5;
      if (totalExamples > 0) {
        const pSuccess =
          priorSuccess *
          condProb.scoreBucketGivenSuccess(scoreBucket) *
          condProb.trendGivenSuccess(studentTrend);
        const pFail =
          priorFail *
          condProb.scoreBucketGivenFail(scoreBucket) *
          condProb.trendGivenFail(studentTrend);
        successProbability = pSuccess / (pSuccess + pFail);
      }

      let riskClass = "Зона внимания";
      if (successProbability >= 0.7) riskClass = "Высокая вероятность успеха";
      else if (successProbability <= 0.4) riskClass = "Риск снижения";

      result.push({
        studentId,
        fullName: arr[0].full_name,
        attempts: arr,
        avgPercent,
        trendSlope: slope,
        trendLabel: getTrendLabel(slope),
        trendEquation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
        successProbability,
        riskClass,
      });
    }

    result.sort((a, b) => b.avgPercent - a.avgPercent);
    setAnalyticsStudents(result);
  };

  const loadAnalytics = async (testId: number) => {
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get(`/tests/${testId}/results`);
      buildStudentAnalytics(data as TestResultAttempt[]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

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
        <button
          className={`mode-btn ${tab === "analytics" ? "active" : ""}`}
          onClick={() => setTab("analytics")}
        >
          Аналитика
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

      {/* АНАЛИТИКА */}
      {tab === "analytics" && (
        <div className="section-card">
          <h2>Аналитика по тестам</h2>
          <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 10 }}>
            Линия тренда: линейная регрессия по процентам попыток. Классификация:
            наивный Байес (апостериорная вероятность успеха).
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <select
              className="form-input"
              value={analyticsTestId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (!id) {
                  setAnalyticsTestId(null);
                  setAnalyticsStudents([]);
                  return;
                }
                setAnalyticsTestId(id);
                loadAnalytics(id);
              }}
            >
              <option value="">Выберите тест...</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {analyticsLoading && (
            <div style={{ color: "var(--text2)", fontSize: 13 }}>Загрузка...</div>
          )}

          {!analyticsLoading && analyticsTestId && analyticsStudents.length === 0 && (
            <div style={{ color: "var(--text2)", fontSize: 13 }}>
              Нет завершенных попыток для анализа.
            </div>
          )}

          {!analyticsLoading &&
            analyticsStudents.map((student) => (
              <div
                key={student.studentId}
                style={{
                  borderBottom: "1px solid var(--border)",
                  padding: "12px 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: 6,
                  }}
                >
                  <strong>{student.fullName}</strong>
                  <span
                    style={{
                      background:
                        student.successProbability >= 0.7
                          ? "rgba(16,185,129,0.1)"
                          : student.successProbability <= 0.4
                            ? "rgba(239,68,68,0.1)"
                            : "rgba(245,158,11,0.12)",
                      color:
                        student.successProbability >= 0.7
                          ? "var(--green)"
                          : student.successProbability <= 0.4
                            ? "var(--red)"
                            : "var(--yellow)",
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {student.riskClass}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ background: "var(--bg2)", borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      Средний результат
                    </div>
                    <div style={{ fontWeight: 700, fontFamily: "var(--mono)" }}>
                      {student.avgPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ background: "var(--bg2)", borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      Линия тренда
                    </div>
                    <div style={{ fontWeight: 700, fontFamily: "var(--mono)" }}>
                      {student.trendLabel} ({student.trendSlope.toFixed(2)})
                    </div>
                  </div>
                  <div style={{ background: "var(--bg2)", borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      P(успех | признаки)
                    </div>
                    <div style={{ fontWeight: 700, fontFamily: "var(--mono)" }}>
                      {(student.successProbability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>
                  Регрессия: <code>{student.trendEquation}</code>
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>
                  Попыток: {student.attempts.length}
                </div>
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
