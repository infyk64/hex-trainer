import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { TheorySection } from '../types/index';

// Статические разделы (таблицы/арифметика) остаются как ссылки
const NAV_EXTRAS = [
  { id: 'tables', label: '→ Таблицы' },
  { id: 'arithmetic', label: '→ Арифметика' },
];

export function Theory() {
  const [sections, setSections] = useState<TheorySection[]>([]);
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/theory').then(({ data }) => {
      setSections(data);
      if (data.length > 0) setActive(data[0].slug);
    }).finally(() => setLoading(false));
  }, []);

  const scrollTo = (slug: string) => {
    if (slug === 'tables') { window.location.href = '/tables'; return; }
    if (slug === 'arithmetic') { window.location.href = '/arithmetic'; return; }
    setActive(slug);
    document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ color: 'var(--text2)' }}>Загрузка теории...</p>
      </div>
    );
  }

  return (
    <div className="theory-layout">
      <div className="theory-sidebar">
        <div className="theory-sidebar-card">
          {sections.map(s => (
            <div
              key={s.slug}
              className={`sidebar-link ${active === s.slug ? 'active' : ''}`}
              onClick={() => scrollTo(s.slug)}
            >
              {s.title}
            </div>
          ))}
          {NAV_EXTRAS.map(s => (
            <div
              key={s.id}
              className="sidebar-link"
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="theory-main">
        {sections.map((s) => (
          <div key={s.id} id={s.slug} className="section-card">
            <h2>{s.title}</h2>
            <div
              style={{ lineHeight: 1.8, color: 'var(--text1)' }}
              dangerouslySetInnerHTML={{ __html: s.content }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}