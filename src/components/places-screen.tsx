"use client";

import { useState } from "react";
import { makeVisit } from "@/lib/seed";
import type { Place } from "@/lib/types";
import { useApp } from "./app-provider";
import { DatePicker, Modal, PageHeading } from "./shared";
import { PlaceFields } from "./visit-editor";

export function PlacesScreen() {
  const { data, setData, date, notify } = useApp();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Place | null>(null);
  const places = data.places.filter((place) =>
    `${place.name} ${place.area} ${place.address}`.includes(search),
  );

  return (
    <>
      <PageHeading
        eyebrow="YOUR PLACES"
        title="よく行く訪問先"
        description="いつもの訪問先を、すぐに今日の予定へ。"
      >
        <DatePicker />
      </PageHeading>
      <div className="section-heading places-toolbar">
        <label className="search-label">
          <span className="sr-only">訪問先を検索</span>
          <input
            type="search"
            placeholder="訪問先名・エリアで検索"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button
          className="primary"
          onClick={() =>
            setDraft({
              id: crypto.randomUUID(),
              name: "",
              area: "",
              address: "",
              purpose: "定期巡回",
              memo: "",
            })
          }
        >
          ＋ マスタに登録
        </button>
      </div>
      <p className="fine-print">
        追加先：{date} ／ マスタの編集・削除は、既に追加した訪問記録には影響しません。
      </p>
      <div className="two-column">
        {places.map((place) => (
          <article className="panel place-card" key={place.id}>
            <div className="visit-tags">
              <span>{place.purpose}</span>
              <span>{place.area}</span>
            </div>
            <h2>{place.name}</h2>
            <p className="muted">{place.address}</p>
            <p className="place-memo">{place.memo || "メモなし"}</p>
            <div className="actions">
              <button
                className="primary"
                onClick={() => {
                  const exists = data.visits.some(
                    (visit) => visit.date === date && visit.placeId === place.id,
                  );
                  if (exists && !window.confirm("この日には追加済みです。もう1件追加しますか？"))
                    return;
                  const visit = makeVisit(place, date, crypto.randomUUID());
                  setData(
                    (current) => current && { ...current, visits: [...current.visits, visit] },
                  );
                  notify(`${date} に追加しました。予定時刻は訪問リストで編集できます`);
                }}
              >
                ＋ 訪問に追加
              </button>
              <button onClick={() => setDraft(place)}>編集</button>
              <button
                className="danger-text"
                onClick={() => {
                  if (!window.confirm(`${place.name}をマスタから削除しますか？`)) return;
                  setData(
                    (current) =>
                      current && {
                        ...current,
                        places: current.places.filter((item) => item.id !== place.id),
                      },
                  );
                  notify("マスタから削除しました");
                }}
              >
                削除
              </button>
            </div>
          </article>
        ))}
      </div>
      {!places.length && <div className="empty-state panel">該当する訪問先はありません。</div>}
      {draft && (
        <Modal title="訪問先マスタを編集" onClose={() => setDraft(null)}>
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.name.trim() || !draft.area.trim() || !draft.address.trim()) return;
              setData(
                (current) =>
                  current && {
                    ...current,
                    places: current.places.some((place) => place.id === draft.id)
                      ? current.places.map((place) => (place.id === draft.id ? draft : place))
                      : [...current.places, draft],
                  },
              );
              setDraft(null);
              notify("訪問先マスタを保存しました");
            }}
          >
            <PlaceFields value={draft} onChange={setDraft} />
            <button className="primary" type="submit">
              保存する
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
