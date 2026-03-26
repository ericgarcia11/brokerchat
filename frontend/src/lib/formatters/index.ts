import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = parseISO(dateStr);
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = parseISO(dateStr);
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = parseISO(dateStr);
  return format(date, "HH:mm", { locale: ptBR });
}

export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = parseISO(dateStr);
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function formatMessageDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 13 && clean.startsWith("55")) {
    const ddd = clean.slice(2, 4);
    const part1 = clean.slice(4, 9);
    const part2 = clean.slice(9, 13);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }
  return phone;
}

export function truncate(text: string | null | undefined, maxLen: number = 50): string {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}
