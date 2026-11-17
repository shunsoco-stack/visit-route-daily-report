export type TravelMode = "徒歩" | "自転車" | "車" | "電車・バス";
export type Status = "未訪問" | "到着中" | "完了" | "不在";
export type Result = "対応済み" | "要再訪" | "持ち帰り";

export interface Place {
  id: string;
  name: string;
  area: string;
  address: string;
  purpose: string;
  memo: string;
}

export interface RecordState {
  status: Status;
  arrivedAt?: string;
  finishedAt?: string;
  absentAt?: string;
  result: Result;
  resultMemo: string;
}

export interface Visit extends Place, RecordState {
  placeId: string;
  date: string;
  time: string;
  mode: TravelMode;
  distance: number;
  fare: number;
  history: RecordState[];
  revisitOf?: string;
}

export interface AppData {
  version: 1;
  places: Place[];
  visits: Visit[];
  reflections: Record<string, string>;
  rate: number;
}
