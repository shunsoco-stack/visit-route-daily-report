"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Place, Visit } from "@/lib/types";
import { makeVisit } from "@/lib/seed";
import { useApp } from "./app-provider";
import { Modal } from "./shared";

export function PlaceFields({
  value,
  onChange,
}: {
  value: Place;
  onChange: (value: Place) => void;
}) {
  return (
    <>
      <label>
        訪問先名
        <input
          required
          maxLength={80}
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
        />
      </label>
      <div className="form-grid">
        <label>
          エリア
          <input
            required
            maxLength={40}
            value={value.area}
            onChange={(event) => onChange({ ...value, area: event.target.value })}
          />
        </label>
        <label>
          用件
          <select
            value={value.purpose}
            onChange={(event) => onChange({ ...value, purpose: event.target.value })}
          >
            {["定期巡回", "点検", "納品", "商談", "検針", "その他"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        住所の目安（町名まで）
        <input
          required
          maxLength={80}
          value={value.address}
          onChange={(event) => onChange({ ...value, address: event.target.value })}
        />
      </label>
      <label>
        訪問メモ
        <textarea
          rows={3}
          maxLength={1000}
          value={value.memo}
          onChange={(event) => onChange({ ...value, memo: event.target.value })}
        />
      </label>
    </>
  );
}

export function VisitEditor({ visit, onClose }: { visit?: Visit; onClose: () => void }) {
  const { data, setData, date, notify } = useApp();
  const [draft, setDraft] = useState<Visit>(
    () =>
      visit ||
      makeVisit(
        {
          id: "",
          name: "",
          area: "",
          address: "",
          purpose: "定期巡回",
          memo: "",
        },
        date,
        crypto.randomUUID(),
      ),
  );

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.area.trim() || !draft.address.trim()) return;
    setData(
      (current) =>
        current && {
          ...current,
          visits: visit
            ? current.visits.map((item) => (item.id === visit.id ? draft : item))
            : [...current.visits, draft],
        },
    );
    notify(visit ? "訪問先を更新しました" : "訪問先を追加しました");
    onClose();
  }

  return (
    <Modal title={visit ? "訪問先を編集" : "訪問先を追加"} onClose={onClose}>
      <form className="stack-form" onSubmit={save}>
        {!visit && (
          <label>
            よく行く訪問先から選択
            <select
              defaultValue=""
              onChange={(event) => {
                const place = data.places.find((item) => item.id === event.target.value);
                if (place) setDraft({ ...makeVisit(place, date, draft.id), time: draft.time });
              }}
            >
              <option value="">新しい訪問先を入力</option>
              {data.places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <PlaceFields value={draft} onChange={(place) => setDraft({ ...draft, ...place })} />
        <label>
          予定時刻
          <input
            type="time"
            required
            value={draft.time}
            onChange={(event) => setDraft({ ...draft, time: event.target.value })}
          />
        </label>
        <p className="fine-print">
          対象日：{date} ／ 移動手段・距離・運賃は「順路」で編集できます。
        </p>
        <div className="actions">
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button className="primary" type="submit">
            {visit ? "変更を保存" : "訪問リストに追加"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
