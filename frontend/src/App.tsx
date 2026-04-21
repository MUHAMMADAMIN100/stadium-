import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import TodayPage from './pages/TodayPage';
import WeekPage from './pages/WeekPage';
import BookingPage from './pages/BookingPage';
import CancelPage from './pages/CancelPage';

export default function App() {
  const location = useLocation();

  return (
    <div className="app">
      <nav className="navbar">
        <h1>🏟️ Стадион</h1>
        <div className="nav-links">
          <NavLink to="/" end>Сегодня</NavLink>
          <NavLink to="/week">На неделю</NavLink>
          <NavLink to="/book">Забронировать</NavLink>
          <NavLink to="/cancel">Отменить</NavLink>
        </div>
      </nav>

      <div key={location.pathname} className="page-transition">
        <Routes location={location}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/cancel" element={<CancelPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
