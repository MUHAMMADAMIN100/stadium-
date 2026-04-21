import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Booking } from '../api';
import { addHours, formatDate, formatHour, isSameHour, startOfDay } from '../utils';

export default function TodayPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setBookings(await api.today());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const today = startOfDay(new Date());
  const now = new Date();

  const hours = Array.from({ length: 24 }, (_, i) => addHours(today, i));

  function slotBooking(hour: Date): Booking | undefined {
    return bookings.find((b) => isSameHour(new Date(b.startAt), hour));
  }

  function onSlotClick(hour: Date, busy: boolean, past: boolean) {
    if (busy || past) return;
    navigate(`/book?hour=${encodeURIComponent(hour.toISOString())}`);
  }

  return (
    <div className="card">
      <h2>Сегодня — {formatDate(today)}</h2>
      <div className="subtitle">Табло бронирований. Нажми на свободный час, чтобы забронировать.</div>

      {error && <div key={error} className="error">Ошибка: {error}</div>}

      {loading && bookings.length === 0 ? (
        <div className="today-grid">
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ '--i': i } as React.CSSProperties}
            />
          ))}
        </div>
      ) : (
        <div className="today-grid">
          {hours.map((h, i) => {
            const b = slotBooking(h);
            const past = h.getTime() + 60 * 60 * 1000 <= now.getTime();
            const busy = !!b;
            const cls = past && !busy ? 'past' : busy ? 'busy' : 'free';
            return (
              <div
                key={h.toISOString()}
                className={`slot ${cls}`}
                style={{ '--i': i } as React.CSSProperties}
                onClick={() => onSlotClick(h, busy, past)}
                role={!busy && !past ? 'button' : undefined}
              >
                <div className="slot-hour">
                  {formatHour(h)}–{formatHour(addHours(h, 1))}
                </div>
                <div className="slot-status">
                  {busy ? 'Занято' : past ? 'Прошло' : 'Свободно'}
                </div>
                {busy && b && <div className="slot-name">{b.customerName}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="legend">
        <span><span className="dot free" /> Свободно</span>
        <span><span className="dot busy" /> Занято</span>
        <span><span className="dot past" /> Прошло</span>
      </div>
    </div>
  );
}
