import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { Group, Test, Question } from '../types';

export function TeacherPanel() {
  const [tab, setTab] = useState<'groups' | 'tests' | 'theory'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null); // тест для просмотра/редактирования
  const [testForm, setTestForm] = useState({ title: '', timeLimitMin: '', maxAttempts: '1' });
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [testGroupIds, setTestGroupIds] = useState<number[]>([]);
  const [genMode, setGenMode] = useState('random');
  const [theorySections, setTheorySections] = useState<any[]>([]);
  const [editingTheory, setEditingTheory] = useState<any | null>(null);

  useEffect(() => {
    loadGroups();
    loadTests();
    loadStudents();
    loadTheory();
  }, []);

  const loadGroups = async () => { const { data } = await api.get('/groups'); setGroups(data); };
  const loadTests = async () => { const { data } = await api.get('/tests'); setTests(data); };
  const loadStudents = async () => { const { data } = await api.get('/groups/students/all'); setStudents(data); };
  const loadTheory = async () => { const { data } = await api.get('/theory'); setTheorySections(data); };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    await api.post('/groups', { name: newGroupName });
    setNewGroupName('');
    loadGroups();
  };

  const loadMembers = async (gId: number) => {
    setSelectedGroup(gId);
    const { data } = await api.get(`/groups/${gId}/members`);
    setGroupMembers(data);
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

  const generateQuestion = async () => {
    const { data } = await api.post('/tests/generate-question', { mode: genMode });
    setTestQuestions(prev => [...prev, data]);
  };

  const createTest = async () => {
    if (!testForm.title || testQuestions.length === 0) return alert('Заполните название и добавьте вопросы');
    await api.post('/tests', {
      title: testForm.title,
      timeLimitMin: testForm.timeLimitMin ? parseInt(testForm.timeLimitMin) : null,
      maxAttempts: parseInt(testForm.maxAttempts) || 1,
      questions: testQuestions.map(q => ({ mode: q.mode, display: q.display, correct: q.correct, options: q.options })),
      groupIds: testGroupIds,
    });
    setShowTestForm(false);
    setTestQuestions([]);
    setTestGroupIds([]);
    setTestForm({ title: '', timeLimitMin: '', maxAttempts: '1' });
    loadTests();
  };

  const deleteTest = async (id: number) => {
    if (!confirm('Удалить тест?')) return;
    await api.delete(`/tests/${id}`);
    loadTests();
  };

  // Открыть тест для просмотра/редактирования
  const openTest = async (t: Test) => {
    try {
      const { data } = await api.get(`/tests/${t.id}`);
      setEditingTest(data);
    } catch {
      // если нет детального эндпоинта — открываем то что есть
      setEditingTest({ ...t, questions: [] });
    }
  };

  const saveTest = async () => {
    if (!editingTest) return;
    await api.put(`/tests/${editingTest.id}`, {
      title: editingTest.title,
      timeLimitMin: editingTest.time_limit_min,
      maxAttempts: editingTest.max_attempts,
      groupIds: editingTest.group_ids || [],
    });
    setEditingTest(null);
    loadTests();
  };

  const saveTheory = async () => {
    if (!editingTheory) return;
    await api.put(`/theory/${editingTheory.id}`, { title: editingTheory.title, content: editingTheory.content });
    setEditingTheory(null);
    loadTheory();
  };

  return (
    <div className="page-container">
      <div className="theory-hero">
        <h1>Панель преподавателя</h1>
        <p>Управление группами, тестами и теорией.</p>
      </div>

      <div className="mode-row">
        <button className={`mode-btn ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>Группы</button>
        <button className={`mode-btn ${tab === 'tests' ? 'active' : ''}`} onClick={() => setTab('tests')}>Тесты</button>
        <button className={`mode-btn ${tab === 'theory' ? 'active' : ''}`} onClick={() => setTab('theory')}>Теория</button>
      </div>

      {/* ═══ ГРУППЫ ═══ */}
      {tab === 'groups' && (
        <>
          <div className="section-card">
            <h2>Группы</h2>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="Название группы" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              <button className="btn-secondary" onClick={createGroup}>Создать</button>
            </div>
            {groups.map(g => (
              <div key={g.id} className="course-card" style={{ marginBottom: 8 }} onClick={() => loadMembers(g.id)}>
                <h3>{g.name}</h3>
                <p>{selectedGroup === g.id ? 'Выбрана ▾' : 'Нажмите для просмотра'}</p>
              </div>
            ))}
          </div>

          {selectedGroup && (
            <div className="section-card">
              <h2>Участники группы</h2>
              {groupMembers.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{m.full_name}</span>
                  <button className="btn-danger" onClick={() => removeMember(m.id)}>Убрать</button>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Добавить студента:</label>
                <select className="form-input" onChange={e => { if (e.target.value) addMember(parseInt(e.target.value)); e.target.value = ''; }}>
                  <option value="">Выберите студента...</option>
                  {students.filter(s => !groupMembers.some(m => m.id === s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ ТЕСТЫ ═══ */}
      {tab === 'tests' && (
        <>
          <div className="section-card">
            <h2>Мои тесты</h2>
            <button className="btn-secondary" onClick={() => setShowTestForm(true)} style={{ marginBottom: 16 }}>+ Создать тест</button>
            {tests.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <strong>{t.title}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {t.time_limit_min ? `⏱ ${t.time_limit_min} мин` : 'Без лимита'} · Попытки: {t.max_attempts}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-small" onClick={() => openTest(t)}>Открыть</button>
                  <button className="btn-danger" onClick={() => deleteTest(t.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>

          {/* Модалка создания теста */}
          {showTestForm && (
            <div className="modal-overlay" onClick={() => setShowTestForm(false)}>
              <div className="modal-card" style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                <h2>Создание теста</h2>
                <div className="form-group">
                  <label>Название</label>
                  <input className="form-input" value={testForm.title} onChange={e => setTestForm({...testForm, title: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Время (мин)</label>
                    <input className="form-input" type="number" value={testForm.timeLimitMin} onChange={e => setTestForm({...testForm, timeLimitMin: e.target.value})} placeholder="Без лимита" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Попытки</label>
                    <input className="form-input" type="number" value={testForm.maxAttempts} onChange={e => setTestForm({...testForm, maxAttempts: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Назначить группам</label>
                  {groups.map(g => (
                    <label key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', fontSize: 13 }}>
                      <input type="checkbox" checked={testGroupIds.includes(g.id)} onChange={e => {
                        setTestGroupIds(prev => e.target.checked ? [...prev, g.id] : prev.filter(id => id !== g.id));
                      }} />
                      {g.name}
                    </label>
                  ))}
                </div>
                <div className="form-group">
                  <label>Вопросы ({testQuestions.length})</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <select className="form-input" style={{ flex: 1 }} value={genMode} onChange={e => setGenMode(e.target.value)}>
                      <option value="random">Случайный</option>
                      <option value="hex-to-dec">16→10</option>
                      <option value="hex-to-oct">16→8</option>
                      <option value="hex-to-bin">16→2</option>
                      <option value="addition">Сложение</option>
                      <option value="subtraction">Вычитание</option>
                      <option value="multiplication">Умножение</option>
                    </select>
                    <button className="btn-secondary" onClick={generateQuestion}>Добавить</button>
                  </div>
                  {testQuestions.map((q, i) => (
                    <div key={i} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span><code style={{ fontFamily: 'var(--mono)' }}>{q.display}</code></span>
                      <button className="btn-danger" onClick={() => setTestQuestions(prev => prev.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="modal-actions">
                  <button className="btn-primary" style={{ flex: 1 }} onClick={createTest}>Создать тест</button>
                  <button className="btn-secondary" onClick={() => setShowTestForm(false)}>Отмена</button>
                </div>
              </div>
            </div>
          )}

          {/* Модалка просмотра/редактирования теста */}
          {editingTest && (
            <div className="modal-overlay" onClick={() => setEditingTest(null)}>
              <div className="modal-card" style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                <h2>Редактирование теста</h2>
                <div className="form-group">
                  <label>Название</label>
                  <input
                    className="form-input"
                    value={editingTest.title}
                    onChange={e => setEditingTest({ ...editingTest, title: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Время (мин)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={editingTest.time_limit_min ?? ''}
                      onChange={e => setEditingTest({ ...editingTest, time_limit_min: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Без лимита"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Попытки</label>
                    <input
                      className="form-input"
                      type="number"
                      value={editingTest.max_attempts ?? 1}
                      onChange={e => setEditingTest({ ...editingTest, max_attempts: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Назначить группам */}
                <div className="form-group">
                  <label>Группы</label>
                  {groups.map(g => (
                    <label key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={(editingTest.group_ids || []).includes(g.id)}
                        onChange={e => {
                          const ids = editingTest.group_ids || [];
                          setEditingTest({
                            ...editingTest,
                            group_ids: e.target.checked ? [...ids, g.id] : ids.filter((id: number) => id !== g.id),
                          });
                        }}
                      />
                      {g.name}
                    </label>
                  ))}
                </div>

                {/* Список вопросов (только просмотр) */}
                {editingTest.questions && editingTest.questions.length > 0 && (
                  <div className="form-group">
                    <label>Вопросы ({editingTest.questions.length})</label>
                    {editingTest.questions.map((q: any, i: number) => (
                      <div key={i} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span><code style={{ fontFamily: 'var(--mono)' }}>{q.display}</code></span>
                        <span style={{ color: 'var(--text2)', fontSize: 11 }}>{q.mode}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="modal-actions">
                  <button className="btn-primary" style={{ flex: 1 }} onClick={saveTest}>Сохранить</button>
                  <button className="btn-secondary" onClick={() => setEditingTest(null)}>Закрыть</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ ТЕОРИЯ ═══ */}
      {tab === 'theory' && (
        <div className="section-card">
          <h2>Редактирование теории</h2>
          {theorySections.map(s => (
            <div key={s.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              {editingTheory?.id === s.id ? (
                <>
                  <input className="form-input" value={editingTheory.title} onChange={e => setEditingTheory({...editingTheory, title: e.target.value})} style={{ marginBottom: 8 }} />
                  <textarea className="form-input" rows={4} value={editingTheory.content} onChange={e => setEditingTheory({...editingTheory, content: e.target.value})} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn-secondary" onClick={saveTheory}>Сохранить</button>
                    <button className="btn-small" onClick={() => setEditingTheory(null)}>Отмена</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{s.title}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.content.substring(0, 80)}...</div>
                  </div>
                  <button className="btn-small" onClick={() => setEditingTheory({ ...s })}>Ред.</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}