// client/src/App.tsx

import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Theory }       from './pages/Theory';
import { Tables }       from './pages/Tables';
import { Arithmetic }   from './pages/Arithmetic';
import { Instructions } from './pages/Instructions';
import { Trainer }      from './pages/Trainer';
import { Stats }        from './pages/Stats';
import type { HistoryItem } from './types';
import './App.css';

function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const addAttempt = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev]);
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="navbar">
          <span className="nav-logo">ТРЕНАЖЁР <span>16СС</span></span>
          <div className="nav-links">
            {[
              { to: '/',             label: 'Теория'     },
              { to: '/tables',       label: 'Таблицы'    },
              { to: '/arithmetic',   label: 'Арифметика' },
              { to: '/instructions', label: 'Инструкция' },
              { to: '/trainer',      label: 'Тренажёр'   },
              { to: '/stats',        label: 'Статистика' },
            ].map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/"             element={<Theory />} />
            <Route path="/tables"       element={<Tables />} />
            <Route path="/arithmetic"   element={<Arithmetic />} />
            <Route path="/instructions" element={<Instructions />} />
            <Route path="/trainer"      element={<Trainer onAttempt={addAttempt} />} />
            <Route path="/stats"        element={<Stats history={history} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;