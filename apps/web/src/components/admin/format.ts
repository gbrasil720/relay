const dateTimeZone = "America/Sao_Paulo";

function parts(date: Date | string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: dateTimeZone,
    ...options,
  }).formatToParts(new Date(date));
}

function part(
  date: Date | string,
  type: Intl.DateTimeFormatPartTypes,
  options: Intl.DateTimeFormatOptions,
) {
  const value = parts(date, options).find((p) => p.type === type)?.value ?? "";
  return value.replace(".", "");
}

/** "30 out" */
export function shortDate(date: Date | string) {
  return `${part(date, "day", { day: "numeric" })} ${part(date, "month", { month: "short" })}`;
}

/** "10:42" */
export function clock(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: dateTimeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** "sex 7 nov" */
export function batchDate(date: Date | string) {
  const weekday = part(date, "weekday", { weekday: "short" });
  return `${weekday} ${shortDate(date)}`;
}

/** "sáb · 1 nov · 10:42" */
export function headerNow(now = new Date()) {
  const weekday = part(now, "weekday", { weekday: "short" });
  return `${weekday} · ${shortDate(now)} · ${clock(now)}`;
}

/** "1.284" */
export function count(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/** "55%", or "—" when there is nothing to divide by. */
export function percent(part: number, total: number) {
  return total ? `${Math.round((part / total) * 100)}%` : "—";
}
