import { japanDate, shiftDate } from "./logic.ts";
import type { AppData, Place, RecordState, Visit } from "./types.ts";

export const emptyRecord: RecordState = {
  status: "未訪問",
  result: "対応済み",
  resultMemo: "",
};

const places: Place[] = [
  {
    id: "p1",
    name: "サンプル薬局 みなと町店（架空）",
    area: "みなとエリア",
    address: "青凪市みなと町",
    purpose: "定期巡回",
    memo: "裏口の呼び鈴から。備品の在庫を確認。",
  },
  {
    id: "p2",
    name: "ひかり商店（架空）",
    area: "みなとエリア",
    address: "青凪市ひかり町",
    purpose: "納品",
    memo: "カタログと補充品をお渡しする。",
  },
  {
    id: "p3",
    name: "こもれび会館（架空）",
    area: "中央エリア",
    address: "青凪市こもれび町",
    purpose: "点検",
    memo: "入口横の設備盤を点検。",
  },
  {
    id: "p4",
    name: "あおばテラス（架空）",
    area: "中央エリア",
    address: "青凪市あおば町",
    purpose: "定期巡回",
    memo: "共用部の照明と掲示板を確認。",
  },
  {
    id: "p5",
    name: "つむぎ工房（架空）",
    area: "丘の手エリア",
    address: "青凪市つむぎ町",
    purpose: "商談",
    memo: "新しいプランの資料を持参。",
  },
  {
    id: "p6",
    name: "はるかぜビル（架空）",
    area: "丘の手エリア",
    address: "青凪市はるかぜ町",
    purpose: "検針",
    memo: "共用部のメーターを確認。",
  },
  {
    id: "p7",
    name: "しずく文具店（架空）",
    area: "中央エリア",
    address: "青凪市しずく町",
    purpose: "納品",
    memo: "午後の訪問を希望。",
  },
  {
    id: "p8",
    name: "なないろ交流室（架空）",
    area: "みなとエリア",
    address: "青凪市なないろ町",
    purpose: "点検",
    memo: "受付で点検内容を説明する。",
  },
  {
    id: "p9",
    name: "ふたば倉庫（架空）",
    area: "丘の手エリア",
    address: "青凪市ふたば町",
    purpose: "定期巡回",
    memo: "外周の状態を確認。",
  },
  {
    id: "p10",
    name: "ゆうなぎ書房（架空）",
    area: "みなとエリア",
    address: "青凪市ゆうなぎ町",
    purpose: "商談",
    memo: "展示用品の入替えを相談。",
  },
  {
    id: "p11",
    name: "ほしあかりハウス（架空）",
    area: "中央エリア",
    address: "青凪市ほしあかり町",
    purpose: "検針",
    memo: "メーター室は建物の北側。",
  },
  {
    id: "p12",
    name: "いろはサービス室（架空）",
    area: "丘の手エリア",
    address: "青凪市いろは町",
    purpose: "点検",
    memo: "交換部品の状態を確認。",
  },
];

export function makeVisit(place: Place, date: string, id: string): Visit {
  return {
    name: place.name,
    area: place.area,
    address: place.address,
    purpose: place.purpose,
    memo: place.memo,
    ...emptyRecord,
    id,
    placeId: place.id,
    date,
    time: "09:00",
    mode: "徒歩",
    distance: 0,
    fare: 0,
    history: [],
  };
}

export function createSeed(now = new Date()): AppData {
  const today = japanDate(now);
  const stamp = (date: string, time: string) => `${date}T${time}:00+09:00`;
  const first = makeVisit(places[0], today, "today-1");
  const second = makeVisit(places[1], today, "today-2");
  const third = makeVisit(places[2], today, "today-3");
  const fourth = makeVisit(places[3], today, "today-4");
  const fifth = makeVisit(places[4], today, "today-5");
  const sixth = makeVisit(places[5], today, "today-6");
  const visits: Visit[] = [
    {
      ...first,
      status: "完了",
      arrivedAt: stamp(today, "09:00"),
      finishedAt: stamp(today, "09:25"),
      resultMemo: "在庫と陳列を確認。異常なし。",
      mode: "車",
      distance: 3.2,
      history: [
        emptyRecord,
        { ...emptyRecord, status: "到着中", arrivedAt: stamp(today, "09:00") },
      ],
    },
    {
      ...second,
      time: "09:45",
      status: "完了",
      arrivedAt: stamp(today, "09:42"),
      finishedAt: stamp(today, "10:05"),
      resultMemo: "補充品とカタログをお渡しした。",
      distance: 0.4,
      history: [
        emptyRecord,
        { ...emptyRecord, status: "到着中", arrivedAt: stamp(today, "09:42") },
      ],
    },
    {
      ...third,
      time: "10:30",
      status: "不在",
      absentAt: stamp(today, "10:32"),
      resultMemo: "休館のため、別日に再訪する。",
      mode: "車",
      distance: 2.1,
      history: [emptyRecord],
    },
    {
      ...fourth,
      time: "11:00",
      status: "到着中",
      arrivedAt: stamp(today, "10:58"),
      mode: "車",
      distance: 1.8,
      history: [emptyRecord],
    },
    { ...fifth, time: "13:00", mode: "電車・バス", fare: 240 },
    { ...sixth, time: "14:00", mode: "徒歩", distance: 0.8 },
  ];

  // 日ごとの訪問先・時刻・結果は個別に定義した架空の記録。
  const past = [
    { days: -1, place: 6, start: "09:10", end: "09:35", km: 2.8, memo: "納品数を確認。" },
    { days: -1, place: 7, start: "10:00", end: "10:40", km: 1.2, memo: "交換部品を手配し再訪。" },
    { days: -2, place: 8, start: "09:00", end: "09:30", km: 4.5, memo: "外周に異常なし。" },
    { days: -2, place: 9, start: "11:00", end: "11:45", km: 2.3, memo: "入替え案を説明した。" },
    { days: -3, place: 10, start: "09:15", end: "09:30", km: 3.6, memo: "検針記録を確認。" },
    { days: -3, place: 11, start: "10:10", end: "10:50", km: 1.5, memo: "交換部品の動作良好。" },
    { days: -4, place: 0, start: "09:00", end: "09:20", km: 3.2, memo: "補充が必要な備品を確認。" },
    { days: -4, place: 4, start: "13:00", end: "13:40", km: 4.1, memo: "次回の相談内容を整理。" },
    { days: -5, place: 2, start: "09:30", end: "10:00", km: 2.7, memo: "設備盤の表示に異常なし。" },
    { days: -5, place: 5, start: "11:00", end: "11:20", km: 3.4, memo: "検針を完了した。" },
  ];
  past.forEach((entry, index) => {
    const date = shiftDate(today, entry.days);
    visits.push({
      ...makeVisit(places[entry.place], date, `past-${index}`),
      time: entry.start,
      status: "完了",
      arrivedAt: stamp(date, entry.start),
      finishedAt: stamp(date, entry.end),
      result: index === 1 ? "要再訪" : "対応済み",
      resultMemo: entry.memo,
      mode: "車",
      distance: entry.km,
      history: [emptyRecord],
    });
  });
  return {
    version: 1,
    places: places.map((place) => ({ ...place })),
    visits,
    reflections: {
      [shiftDate(today, -1)]: "交換部品を準備し、再訪日を調整する。",
      [shiftDate(today, -2)]: "予定どおりに巡回できた。",
      [shiftDate(today, -3)]: "点検と検針を完了。次回も同じ順路で進める。",
      [shiftDate(today, -4)]: "午後の商談に向けて資料を整理できた。",
      [shiftDate(today, -5)]: "設備に異常なし。引き続き状態を確認する。",
    },
    rate: 15,
  };
}
