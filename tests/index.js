import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clockTime,
  dayVisits,
  japanDate,
  minutesBetween,
  recordVisit,
  reorder,
  reportCsv,
  reportText,
  revisitVisits,
  shiftDate,
  stayMinutes,
  summarize,
  travelCost,
  undoRecord,
  weekDates,
  workingMinutes,
} from "../src/lib/logic.ts";
import { createSeed, makeVisit } from "../src/lib/seed.ts";
import { isAppData } from "../src/lib/storage.ts";

const today = "2026-11-17";
const seed = () => createSeed(new Date(`${today}T12:00:00+09:00`));

test("順路を上下に移動し、元の配列と項目を保持する", () => {
  const original = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(
    reorder(original, 1, -1).map((item) => item.id),
    ["b", "a", "c"],
  );
  assert.deepEqual(
    reorder(original, 1, 1).map((item) => item.id),
    ["a", "c", "b"],
  );
  assert.deepEqual(
    original.map((item) => item.id),
    ["a", "b", "c"],
  );
  assert.equal(reorder(original, 1, -1)[0], original[1]);
});

test("順路の両端・空配列・範囲外は変更しない", () => {
  assert.deepEqual(reorder([1, 2], 0, -1), [1, 2]);
  assert.deepEqual(reorder([1, 2], 1, 1), [1, 2]);
  assert.deepEqual(reorder([1, 2], -1, 1), [1, 2]);
  assert.deepEqual(reorder([], 0, 1), []);
});

test("日本時間の日付境界と年・月をまたぐ相対日を扱う", () => {
  assert.equal(japanDate(new Date("2026-11-16T15:00:00Z")), today);
  assert.equal(japanDate(new Date("2026-11-16T14:59:59Z")), "2026-11-16");
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDate("2024-03-01", -1), "2024-02-29");
  assert.equal(clockTime("2026-11-17T01:23:00Z"), "10:23");
  assert.equal(clockTime(), "—");
});

test("滞在時間は到着〜完了。未完了・不正値・逆転は0分", () => {
  assert.equal(stayMinutes(seed().visits[0]), 25);
  assert.equal(stayMinutes(seed().visits[3]), 0);
  assert.equal(minutesBetween("2026-11-17T09:00:00Z", "2026-11-17T09:01:30Z"), 2);
  assert.equal(minutesBetween("invalid", "invalid"), 0);
  assert.equal(minutesBetween("2026-11-17T10:00:00Z", "2026-11-17T09:00:00Z"), 0);
});

test("稼働時間は訪問順によらず、最初の到着〜最後の完了", () => {
  const visits = dayVisits(seed(), today);
  assert.equal(workingMinutes(visits), 65);
  assert.equal(workingMinutes([...visits].reverse()), 65);
  assert.equal(workingMinutes([]), 0);
  assert.equal(workingMinutes([visits[3]]), 0);
});

test("稼働時間はUTCと日本時間が混在しても正しく集計する", () => {
  const base = seed().visits[0];
  assert.equal(
    workingMinutes([
      { ...base, arrivedAt: "2026-11-17T09:00:00+09:00", finishedAt: "2026-11-17T09:20:00+09:00" },
      { ...base, arrivedAt: "2026-11-17T01:00:00Z", finishedAt: "2026-11-17T01:30:00Z" },
    ]),
    90,
  );
});

test("交通費は車の区間単位四捨五入・公共交通の運賃・その他0円", () => {
  const visit = seed().visits[0];
  assert.equal(travelCost({ ...visit, mode: "車", distance: 2.1 }, 15), 32);
  assert.equal(travelCost({ ...visit, mode: "車", distance: 2.1 }, 20), 42);
  assert.equal(travelCost({ ...visit, mode: "電車・バス", fare: 240 }, 15), 240);
  assert.equal(travelCost({ ...visit, mode: "徒歩", fare: 240 }, 15), 0);
  assert.equal(travelCost({ ...visit, mode: "自転車", distance: 10 }, 15), 0);
  assert.equal(travelCost(visit, 0), 0);
});

test("到着・完了と取り消しで状態と時刻が復元される", () => {
  const visit = makeVisit(seed().places[0], today, "new");
  const arrived = recordVisit(visit, "到着中", "2026-11-17T01:00:00Z");
  const completed = recordVisit(arrived, "完了", "2026-11-17T01:30:00Z");
  assert.equal(stayMinutes(completed), 30);
  assert.equal(completed.status, "完了");
  assert.equal(visit.status, "未訪問");
  assert.deepEqual(undoRecord(completed), arrived);
  const undone = undoRecord(undoRecord(completed));
  assert.equal(undone.status, "未訪問");
  assert.equal(undone.arrivedAt, undefined);
  assert.equal(undone.finishedAt, undefined);
  assert.equal(undoRecord(visit), visit);
});

test("未到着からの完了・二重記録・到着前の完了を防ぐ", () => {
  const visit = makeVisit(seed().places[0], today, "new");
  assert.equal(recordVisit(visit, "完了", "2026-11-17T01:00:00Z"), visit);
  const arrived = recordVisit(visit, "到着中", "2026-11-17T01:00:00Z");
  assert.equal(recordVisit(arrived, "到着中", "2026-11-17T01:01:00Z"), arrived);
  assert.equal(recordVisit(arrived, "完了", "2026-11-17T00:59:00Z"), arrived);
});

test("不在の時刻を記録し、取り消しで再訪から除外する", () => {
  const visit = makeVisit(seed().places[0], today, "new");
  const absent = recordVisit(visit, "不在", "2026-11-17T01:00:00Z");
  assert.equal(absent.absentAt, "2026-11-17T01:00:00Z");
  assert.equal(revisitVisits([absent]).length, 1);
  assert.equal(revisitVisits([undoRecord(absent)]).length, 0);
});

test("シード記録の取り消しでも古い時刻を残さない", () => {
  const restored = undoRecord(seed().visits[3]);
  assert.equal(restored.status, "未訪問");
  assert.equal(restored.arrivedAt, undefined);
  assert.equal(undoRecord(seed().visits[2]).absentAt, undefined);
});

test("再訪は不在と完了した要再訪だけを抽出する", () => {
  const base = seed().visits[0];
  const visits = [
    { ...base, id: "1", status: "不在" },
    { ...base, id: "2", result: "要再訪" },
    { ...base, id: "3", result: "持ち帰り" },
    { ...base, id: "4", status: "到着中", result: "要再訪" },
  ];
  assert.deepEqual(
    revisitVisits(visits).map((visit) => visit.id),
    ["1", "2"],
  );
});

test("再訪として作った予定に元の日時や完了記録を引き継がない", () => {
  const source = seed().visits[0];
  const next = makeVisit(source, "2026-11-18", "followup");
  assert.equal(next.status, "未訪問");
  assert.equal(next.arrivedAt, undefined);
  assert.equal(next.finishedAt, undefined);
  assert.equal(next.resultMemo, "");
  assert.deepEqual(next.history, []);
});

test("日報集計の内訳・合計交通費を確認する", () => {
  assert.deepEqual(summarize(dayVisits(seed(), today), 15), {
    total: 6,
    complete: 2,
    absent: 1,
    revisit: 0,
    stay: 48,
    work: 65,
    cost: 347,
  });
  assert.deepEqual(summarize([], 15), {
    total: 0,
    complete: 0,
    absent: 0,
    revisit: 0,
    stay: 0,
    work: 0,
    cost: 0,
  });
});

test("日報テキストに時刻・状態・結果・所感と交通費を含む", () => {
  const data = seed();
  data.reflections[today] = "明日は交換部品を持参する。";
  const text = reportText(data, today);
  assert.match(text, /完了 2件 \/ 不在 1件/);
  assert.match(text, /稼働 65分 \/ 滞在 48分/);
  assert.match(text, /交通費 347円/);
  assert.match(text, /到着 09:00 \/ 完了 09:25/);
  assert.match(text, /不在 10:32/);
  assert.match(text, /明日は交換部品を持参する。/);
  assert.match(reportText(data, "2026-11-30"), /訪問予定 0件/);
});

test("CSVはBOM・引用符・改行に対応し数式の実行を抑止する", () => {
  const data = seed();
  data.visits[0].resultMemo = '確認,"備品"\n追加';
  data.reflections[today] = "=1+1";
  const csv = reportCsv(data, today);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"確認,""備品""\n追加"'));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"交通費合計(円)","347"'));
  assert.ok(csv.includes("\r\n"));
});

test("週の一覧は月〜日、日曜日も同じ週として扱う", () => {
  const days = weekDates(today);
  assert.equal(days[0], "2026-11-16");
  assert.equal(days[6], "2026-11-22");
  assert.deepEqual(weekDates("2026-11-22"), days);
});

test("シードは12マスタ・今日6件・過去5日・再訪2件で一意", () => {
  const data = seed();
  const visits = dayVisits(data, today);
  assert.equal(data.places.length, 12);
  assert.equal(visits.length, 6);
  assert.deepEqual(
    visits.map((visit) => visit.status),
    ["完了", "完了", "不在", "到着中", "未訪問", "未訪問"],
  );
  assert.equal(revisitVisits(data.visits).length, 2);
  assert.equal(new Set(data.visits.map((visit) => visit.id)).size, data.visits.length);
  const past = data.visits.filter((visit) => visit.date !== today);
  assert.equal(new Set(past.map((visit) => visit.date)).size, 5);
  assert.ok(past.every((visit) => visit.status === "完了"));
  assert.ok(data.places.every((place) => place.name.includes("（架空）")));
  assert.ok(data.visits.every((visit) => data.places.some((place) => place.id === visit.placeId)));
  assert.ok(
    data.visits.every(
      (visit) => !visit.finishedAt || Date.parse(visit.finishedAt) >= Date.parse(visit.arrivedAt),
    ),
  );
  assert.equal(isAppData(data), true);
  assert.equal(isAppData(JSON.parse(JSON.stringify(data))), true);
});

test("シードは指定日の相対日付になり、呼び出し間でデータを共有しない", () => {
  const january = createSeed(new Date("2027-01-01T12:00:00+09:00"));
  assert.equal(january.visits[0].date, "2027-01-01");
  assert.ok(january.visits.some((visit) => visit.date === "2026-12-27"));
  const data = seed();
  data.places[0].name = "変更";
  assert.notEqual(seed().places[0].name, "変更");
});

test("保存データの不正な形・時刻・負数・重複IDを拒否する", () => {
  assert.equal(isAppData(null), false);
  assert.equal(isAppData({ version: 2 }), false);
  assert.equal(isAppData({ ...seed(), rate: -1 }), false);
  assert.equal(
    isAppData({ ...seed(), visits: [{ ...seed().visits[0], arrivedAt: "bad" }] }),
    false,
  );
  assert.equal(isAppData({ ...seed(), visits: [{ ...seed().visits[0], distance: -2 }] }), false);
  assert.equal(isAppData({ ...seed(), visits: [seed().visits[0], seed().visits[0]] }), false);
});
