import { Injectable, Logger } from '@nestjs/common';

type BookingPayload = {
  customerName: string;
  phone: string;
  startAt: Date;
  endAt: Date;
  cancelCode?: string;
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token = process.env.TELEGRAM_BOT_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;

  private formatDateTime(date: Date): { date: string; time: string } {
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      date: `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`,
      time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    };
  }

  private async send(text: string): Promise<void> {
    if (!this.token || !this.chatId) {
      this.logger.warn('Telegram is not configured — skipping notification');
      return;
    }
    try {
      const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'HTML',
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Telegram API error: ${res.status} ${body}`);
      }
    } catch (err) {
      this.logger.error('Failed to send Telegram message', err as Error);
    }
  }

  async notifyNewBooking(b: BookingPayload): Promise<void> {
    const start = this.formatDateTime(b.startAt);
    const end = this.formatDateTime(b.endAt);
    const lines = [
      '🟢 <b>Новое бронирование!</b>',
      `👤 Имя: ${b.customerName}`,
      `📞 Телефон: ${b.phone}`,
      `📅 Дата: ${start.date}`,
      `🕐 Время: ${start.time} — ${end.time}`,
    ];
    if (b.cancelCode) lines.push(`🔑 Код отмены: <code>${b.cancelCode}</code>`);
    await this.send(lines.join('\n'));
  }

  async notifyCancellation(b: BookingPayload): Promise<void> {
    const start = this.formatDateTime(b.startAt);
    const end = this.formatDateTime(b.endAt);
    const text = [
      '🔴 <b>Отмена бронирования!</b>',
      `👤 Имя: ${b.customerName}`,
      `📞 Телефон: ${b.phone}`,
      `📅 Дата: ${start.date}`,
      `🕐 Время: ${start.time} — ${end.time}`,
    ].join('\n');
    await this.send(text);
  }
}
