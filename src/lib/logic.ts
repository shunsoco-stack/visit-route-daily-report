import type { AppData, RecordState, Visit } from "./types.ts";

export function japanDate(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(now);
}

export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00+09:00`);
  value.setUTCDate(value.getUTCDate() + days);
  return japanDate(value);
}

export function clockTime(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

export function dayVisits(data: AppData, date: string): Visit[] {
  return data.visits.filter((visit) => visit.date === date);
}

export function reorder<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction;
  const copy = [...items];
  if (index < 0 || index >= items.length || next < 0 || next >= items.length) return copy;
  [copy[index], copy[next]] = [copy[next], copy[index]];
  return copy;
}

export function minutesBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const minutes = (Date.parse(end) - Date.parse(start)) / 60_000;
  return Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
}

export function stayMinutes(visit: Visit): number {
  return minutesBetween(visit.arrivedAt, visit.finishedAt);
}

export function workingMinutes(visits: Visit[]): number {
  const arrivals = visits.flatMap((visit) => (visit.arrivedAt ? [visit.arrivedAt] : []));
  const finishes = visits.flatMap((visit) => (visit.finishedAt ? [visit.finishedAt] : []));
  const chronological = (a: string, b: string) => Date.parse(a) - Date.parse(b);
  return minutesBetween(arrivals.sort(chronological)[0], finishes.sort(chronological).at(-1));
}

export function travelCost(visit: Visit, rate: number): number {
  if (visit.mode === "車") return Math.round(visit.distance * rate);
  if (visit.mode === "電車・バス") return visit.fare;
  return 0;
}

export function revisitVisits(visits: Visit[]): Visit[] {
  return visits.filter(
    (visit) => visit.status === "不在" || (visit.status === "完了" && visit.result === "要再訪"),
  );
}

export function summarize(visits: Visit[], rate: number) {
  return {
    total: visits.length,
    complete: visits.filter((visit) => visit.status === "完了").length,
    absent: visits.filter((visit) => visit.status === "不在").length,
    revisit: visits.filter((visit) => visit.status === "完了" && visit.result === "要再訪").length,
    stay: visits.reduce((sum, visit) => sum + stayMinutes(visit), 0),
    work: workingMinutes(visits),
    cost: visits.reduce((sum, visit) => sum + travelCost(visit, rate), 0),
  };
}

export function recordVisit(visit: Visit, action: "到着中" | "完了" | "不在", now: string): Visit {
  const valid =
    (visit.status === "未訪問" && action !== "完了") ||
    (visit.status === "到着中" && action !== "到着中");
  if (!valid) return visit;
  if (visit.arrivedAt && Date.parse(now) < Date.parse(visit.arrivedAt)) return visit;
  const previous: RecordState = {
    status: visit.status,
    arrivedAt: visit.arrivedAt,
    finishedAt: visit.finishedAt,
    absentAt: visit.absentAt,
    result: visit.result,
    resultMemo: visit.resultMemo,
  };
  return {
    ...visit,
    status: action,
    arrivedAt: action === "到着中" ? now : visit.arrivedAt,
    finishedAt: action === "完了" ? now : undefined,
    absentAt: action === "不在" ? now : undefined,
    history: [...visit.history, previous],
  };
}

export function undoRecord(visit: Visit): Visit {
  const previous = visit.history.at(-1);
  if (!previous) return visit;
  return {
    ...visit,
    ...previous,
    arrivedAt: previous.arrivedAt,
    finishedAt: previous.finishedAt,
    absentAt: previous.absentAt,
    history: visit.history.slice(0, -1),
  };
}

export function reportText(data: AppData, date: string): string {
  const visits = dayVisits(data, date);
  const summary = summarize(visits, data.rate);
  return [
    `訪問・巡回ルート日報 / ${date}（日本時間）`,
    `訪問予定 ${summary.total}件 / 完了 ${summary.complete}件 / 不在 ${summary.absent}件`,
    `完了のうち要再訪 ${summary.revisit}件`,
    `稼働 ${summary.work}分 / 滞在 ${summary.stay}分`,
    `交通費 ${summary.cost}円（車 ${data.rate}円/km）`,
    "",
    ...visits.map((visit, index) =>
      [
        `${index + 1}. ${visit.name} / ${visit.purpose} / ${visit.status}`,
        `到着 ${clockTime(visit.arrivedAt)} / 完了 ${clockTime(visit.finishedAt)}`,
        `不在 ${clockTime(visit.absentAt)} / 滞在 ${stayMinutes(visit)}分`,
        `結果 ${visit.status === "完了" ? visit.result : "—"} / ${visit.resultMemo}`,
        `移動 ${visit.mode} / ${travelCost(visit, data.rate)}円`,
      ].join("\n"),
    ),
    "",
    `所感: ${data.reflections[date] || "記入なし"}`,
    "デモ用の架空データです。",
  ].join("\n");
}

function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function reportCsv(data: AppData, date: string): string {
  const visits = dayVisits(data, date);
  const summary = summarize(visits, data.rate);
  const rows: (string | number)[][] = [
    [
      "日付",
      "順番",
      "訪問先",
      "用件",
      "状態",
      "到着",
      "完了",
      "不在",
      "滞在(分)",
      "結果",
      "結果メモ",
      "移動手段",
      "距離(km)",
      "運賃(円)",
      "交通費(円)",
    ],
    ...visits.map((visit, index) => [
      date,
      index + 1,
      visit.name,
      visit.purpose,
      visit.status,
      clockTime(visit.arrivedAt),
      clockTime(visit.finishedAt),
      clockTime(visit.absentAt),
      stayMinutes(visit),
      visit.status === "完了" ? visit.result : "",
      visit.resultMemo,
      visit.mode,
      visit.distance,
      visit.fare,
      travelCost(visit, data.rate),
    ]),
    [],
    ["合計件数", summary.total, "完了", summary.complete, "不在", summary.absent],
    ["完了のうち要再訪", summary.revisit, "稼働(分)", summary.work, "滞在(分)", summary.stay],
    ["交通費合計(円)", summary.cost, "車単価(円/km)", data.rate],
    ["所感", data.reflections[date] || ""],
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function weekDates(date: string): string[] {
  const weekday = new Date(`${date}T12:00:00+09:00`).getUTCDay();
  const monday = shiftDate(date, -(weekday === 0 ? 6 : weekday - 1));
  return Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));
}
