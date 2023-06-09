import fetch from "node-fetch";

const feriados = new Map<number, Set<string>>();

export async function isHoliday(date: Date) {
  const year = date.getFullYear();
  const [dateStr] = date.toISOString().split("T");

  let holidays: Set<string> | undefined = feriados.get(year);

  if (!holidays) {
    holidays = await fetchHolidays(year);
    feriados.set(year, holidays);
  }

  return holidays.has(dateStr);
}

async function fetchHolidays(year: number): Promise<Set<string>> {
  const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
  const holidays = await response.json();

  if (!Array.isArray(holidays)) {
    throw new Error(`Erro ao buscar feriados para o ano ${year}`);
  }

  return new Set(holidays.map((holiday: any) => holiday.date));
}
