import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type Booking, type CreatedBooking } from '../api';
import { addDays, addHours, formatDate, formatHour, isSameHour, pad, startOfDay, weekdayRu } from '../utils';

export default function BookingPage() {
  const [params] = useSearchParams();
  const preselectIso = params.get('hour');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedIso, setSelectedIso] = useState(preselectIso ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreatedBooking | null>(null);

  useEffect(() => {
    api.week().then(setBookings).catch((err) => setError((err as Error).message));
  }, []);

  const slots = useMemo(() => {
    const today = startOfDay(new Date());
    const now = new Date();
    const bookedSet = new Set(bookings.map((b) => new Date(b.startAt).toISOString()));
    const list: { iso: string; label: string; disabled: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(today, d);
      for (let h = 0; h < 24; h++) {
        const slot = addHours(day, h);
        const iso = slot.toISOString();
        const past = slot.getTime() + 60 * 60 * 1000 <= now.getTime();
        const busy = bookedSet.has(iso) ||
          bookings.some((b) => isSameHour(new Date(b.startAt), slot));
        const label = `${weekdayRu(day)} ${formatDate(day).slice(0, 5)} — ${formatHour(slot)}–${pad((h + 1) % 24)}:00`;
        list.push({
          iso,
          label: `${label}${busy ? ' (занято)' : past ? ' (прошло)' : ''}`,
          disabled: busy || past,
        });
      }
    }
    return list;
  }, [bookings]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedIso) {
      setError('Выберите время');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.create({
        customerName: name.trim(),
        phone: phone.trim(),
        startAt: selectedIso,
      });
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const start = new Date(result.startAt);
    const end = new Date(result.endAt);
    return (
      <div className="card card-success">
        <h2>✅ Бронирование подтверждено!</h2>
        <div className="success">
          <div><b>Имя:</b> {result.customerName}</div>
          <div><b>Дата:</b> {formatDate(start)}</div>
          <div><b>Время:</b> {formatHour(start)} — {formatHour(end)}</div>
          <div style={{ marginTop: 12 }}>
            <div>🔑 <b>Код отмены</b> (сохраните его):</div>
            <div className="code">{result.cancelCode}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Вместе с номером телефона этот код нужен для отмены брони.
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn secondary"
            onClick={() => {
              setResult(null);
              setName('');
              setPhone('');
              setSelectedIso('');
              api.week().then(setBookings).catch(() => undefined);
            }}
          >
            Забронировать ещё
          </button>
          <a className="btn" href="/">На главную</a>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Забронировать стадион</h2>
      <div className="subtitle">Заполните имя, телефон и выберите свободный час.</div>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Имя
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Иван"
          />
        </label>
        <label>
          Телефон
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
          />
        </label>
        <label>
          Время
          <select
            required
            value={selectedIso}
            onChange={(e) => setSelectedIso(e.target.value)}
          >
            <option value="">— выберите время —</option>
            {slots.map((s) => (
              <option key={s.iso} value={s.iso} disabled={s.disabled}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {error && <div key={error} className="error">{error}</div>}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? <><span className="spinner" />Отправка…</> : 'Забронировать'}
        </button>
      </form>
    </div>
  );
}
