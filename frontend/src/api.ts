const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export type Booking = {
  id: string;
  customerName: string;
  startAt: string;
  endAt: string;
};

export type CreatedBooking = Booking & { cancelCode: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) {
        message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  today: () => request<Booking[]>('/bookings/today'),
  week: () => request<Booking[]>('/bookings/week'),
  range: (fromIso: string, toIso: string) =>
    request<Booking[]>(`/bookings/range?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`),
  create: (payload: { customerName: string; phone: string; startAt: string }) =>
    request<CreatedBooking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancel: (payload: { cancelCode: string; phone: string }) =>
    request<{ ok: true }>('/bookings/cancel', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
