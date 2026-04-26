import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, subscribeBookings, type Booking } from '../api';
import { addDays, addHours, formatDate, isSameHour, pad, startOfDay, weekdayRu } from '../utils';

export default function WeekPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setBookings(await api.week());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    const unsubscribe = subscribeBookings((event) => {
      setBookings((prev) => {
        if (event.type === 'created') {
          if (prev.some((b) => b.id === event.booking.id)) return prev;
          return [...prev, event.booking].sort(
            (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
          );
        }
        return prev.filter((b) => b.id !== event.booking.id);
      });
    });
    return () => {
      clearInterval(id);
      unsubscribe();
    };
  }, []);

  const today = startOfDay(new Date());
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  function slotBooking(day: Date, hour: number): Booking | undefined {
    const slot = addHours(day, hour);
    return bookings.find((b) => isSameHour(new Date(b.startAt), slot));
  }

  function onCellClick(day: Date, hour: number, busy: boolean, past: boolean) {
    if (busy || past) return;
    const slot = addHours(day, hour);
    navigate(`/book?hour=${encodeURIComponent(slot.toISOString())}`);
  }

  return (
    <div className="card">
      <h2>Расписание на неделю</h2>
      <div className="subtitle">Бронирования на 7 дней. Кликни на свободную ячейку, чтобы забронировать.</div>

      {error && <div key={error} className="error">Ошибка: {error}</div>}

      {loading && bookings.length === 0 ? (
        <div className="week-scroll">
          <div className="week-grid">
            <div />
            {Array.from({ length: 7 }, (_, col) => (
              <div key={col} className="week-head skeleton-cell" style={{ height: 40 }} />
            ))}
            {hours.map((h) => (
              <Fragment key={`skel-row-${h}`}>
                <div className="week-hour-label">{pad(h)}:00</div>
                {Array.from({ length: 7 }, (_, col) => (
                  <div key={col} className="skeleton-cell" />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className="week-scroll">
          <div className="week-grid">
            <div />
            {days.map((d, col) => {
              const isToday = d.getTime() === today.getTime();
              return (
                <div
                  key={d.toISOString()}
                  className={`week-head ${isToday ? 'today' : ''}`}
                  style={{ '--col': col } as React.CSSProperties}
                >
                  <div>{weekdayRu(d)}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{formatDate(d).slice(0, 5)}</div>
                </div>
              );
            })}

            {hours.map((h) => (
              <Fragment key={`row-${h}`}>
                <div className="week-hour-label">{pad(h)}:00</div>
                {days.map((d) => {
                  const b = slotBooking(d, h);
                  const slotEnd = addHours(d, h + 1);
                  const past = slotEnd.getTime() <= now.getTime();
                  const busy = !!b;
                  const cls = past && !busy ? 'past' : busy ? 'busy' : 'free';
                  return (
                    <div
                      key={`${d.toISOString()}-${h}`}
                      className={`week-cell ${cls}`}
                      onClick={() => onCellClick(d, h, busy, past)}
                      title={busy ? `Занято: ${b!.customerName}` : past ? 'Прошло' : 'Свободно'}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
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
