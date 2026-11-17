import type { AppData, Place, RecordState, Visit } from "./types.ts";

export const STORAGE_KEY = "vrdr:v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlace(value: unknown): value is Place {
  return (
    isObject(value) &&
    ["id", "name", "area", "address", "purpose", "memo"].every(
      (key) => typeof value[key] === "string",
    )
  );
}

function isRecord(value: unknown): value is RecordState {
  if (!isObject(value)) return false;
  return (
    ["未訪問", "到着中", "完了", "不在"].includes(String(value.status)) &&
    ["対応済み", "要再訪", "持ち帰り"].includes(String(value.result)) &&
    typeof value.resultMemo === "string" &&
    ["arrivedAt", "finishedAt", "absentAt"].every(
      (key) =>
        value[key] === undefined ||
        (typeof value[key] === "string" && Number.isFinite(Date.parse(value[key]))),
    )
  );
}

function isVisit(value: unknown): value is Visit {
  if (!isObject(value) || !isPlace(value) || !isRecord(value)) return false;
  const item = value as unknown as Record<string, unknown>;
  return (
    typeof item.placeId === "string" &&
    typeof item.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    typeof item.time === "string" &&
    /^\d{2}:\d{2}$/.test(item.time) &&
    ["徒歩", "自転車", "車", "電車・バス"].includes(String(item.mode)) &&
    [item.distance, item.fare].every(
      (number) => typeof number === "number" && Number.isFinite(number) && number >= 0,
    ) &&
    Array.isArray(item.history) &&
    item.history.every(isRecord) &&
    (item.revisitOf === undefined || typeof item.revisitOf === "string")
  );
}

export function isAppData(value: unknown): value is AppData {
  if (!isObject(value)) return false;
  return (
    value.version === 1 &&
    typeof value.rate === "number" &&
    Number.isFinite(value.rate) &&
    value.rate >= 0 &&
    Array.isArray(value.places) &&
    value.places.every(isPlace) &&
    Array.isArray(value.visits) &&
    value.visits.every(isVisit) &&
    new Set(value.visits.map((visit) => visit.id)).size === value.visits.length &&
    new Set(value.places.map((place) => place.id)).size === value.places.length &&
    isObject(value.reflections) &&
    Object.values(value.reflections).every((text) => typeof text === "string")
  );
}
