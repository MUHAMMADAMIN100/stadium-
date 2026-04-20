import { useState } from 'react';
import { api } from '../api';

export default function CancelPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.cancel({ cancelCode: code.trim(), phone: phone.trim() });
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="card">
        <h2>✅ Бронирование отменено</h2>
        <div className="success">
          Ваша бронь успешно отменена. Владелец получил уведомление.
        </div>
        <div style={{ marginTop: 16 }}>
          <a className="btn" href="/">На главную</a>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Отменить бронирование</h2>
      <div className="subtitle">Введите номер телефона и 6-значный код, который вы получили при бронировании.</div>
      <form className="form" onSubmit={onSubmit}>
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
          Код отмены
          <input
            type="text"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="482931"
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn danger" type="submit" disabled={submitting}>
          {submitting ? 'Отмена…' : 'Отменить бронь'}
        </button>
      </form>
    </div>
  );
}
