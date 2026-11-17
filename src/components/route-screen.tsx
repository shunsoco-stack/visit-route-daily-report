"use client";

import { useState } from "react";
import { dayVisits, reorder, travelCost } from "@/lib/logic";
import type { Visit } from "@/lib/types";
import { useApp } from "./app-provider";
import { DatePicker, PageHeading, RouteDiagram } from "./shared";
import { VisitEditor } from "./visit-editor";

export function RouteScreen() {
  const { data, setData, date, notify } = useApp();
  const visits = dayVisits(data, date);
  const [editor, setEditor] = useState<Visit | "new" | null>(null);

  function update(visit: Visit) {
    setData(
      (current) =>
        current && {
          ...current,
          visits: current.visits.map((item) => (item.id === visit.id ? visit : item)),
        },
    );
  }

  function move(index: number, direction: -1 | 1) {
    const ordered = reorder(visits, index, direction);
    setData(
      (current) =>
        current && {
          ...current,
          visits: [...current.visits.filter((visit) => visit.date !== date), ...ordered],
        },
    );
    notify("訪問順を変更しました。移動区間を確認してください");
  }

  return (
    <>
      <PageHeading
        eyebrow="ROUTE PLANNER"
        title="順路を整える"
        description="訪問の順番と移動方法を、出発前に確認。"
      >
        <DatePicker />
      </PageHeading>
      <div className="info-strip">
        各区間は「前の訪問先 → この訪問先」です。1件目は出発地点からの移動です。
      </div>
      <div className="today-layout">
        <section>
          <div className="section-heading">
            <h2>訪問順と移動区間</h2>
            <button className="primary" onClick={() => setEditor("new")}>
              ＋ 追加
            </button>
          </div>
          <p className="fine-print">
            並べ替え後も入力値は訪問先に付随します。区間の距離・運賃をご確認ください。
          </p>
          {visits.map((visit, index) => (
            <article key={visit.id} className="panel route-item">
              <div className="route-item-heading">
                <span className="visit-number">{index + 1}</span>
                <div>
                  <small>
                    {visit.time} · {visit.purpose}
                  </small>
                  <h3>{visit.name}</h3>
                </div>
              </div>
              <p className="muted">{visit.address}</p>
              <div className="actions route-controls">
                <button
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`${visit.name}を上へ`}
                >
                  ↑ 上へ
                </button>
                <button
                  disabled={index === visits.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`${visit.name}を下へ`}
                >
                  ↓ 下へ
                </button>
                <button onClick={() => setEditor(visit)}>編集</button>
                <button
                  className="danger-text"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `${visit.name}をこの日のリストから削除しますか？記録も削除されます。`,
                      )
                    )
                      return;
                    setData(
                      (current) =>
                        current && {
                          ...current,
                          visits: current.visits.filter((item) => item.id !== visit.id),
                        },
                    );
                    notify("訪問先を削除しました");
                  }}
                >
                  削除
                </button>
              </div>
              <div className="travel-fields">
                <label>
                  ここまでの移動
                  <select
                    value={visit.mode}
                    onChange={(event) =>
                      update({ ...visit, mode: event.target.value as Visit["mode"] })
                    }
                  >
                    {["徒歩", "自転車", "車", "電車・バス"].map((mode) => (
                      <option key={mode}>{mode}</option>
                    ))}
                  </select>
                </label>
                {visit.mode === "電車・バス" ? (
                  <label>
                    運賃（円）
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      step="1"
                      value={visit.fare}
                      onChange={(event) => {
                        if (event.target.validity.valid)
                          update({ ...visit, fare: Number(event.target.value) });
                      }}
                    />
                  </label>
                ) : (
                  <label>
                    距離（km）
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      step="0.1"
                      value={visit.distance}
                      onChange={(event) => {
                        if (event.target.validity.valid)
                          update({ ...visit, distance: Number(event.target.value) });
                      }}
                    />
                  </label>
                )}
                <div className="segment-cost">
                  <small>区間の交通費</small>
                  <strong>¥{travelCost(visit, data.rate).toLocaleString()}</strong>
                </div>
              </div>
            </article>
          ))}
          {!visits.length && (
            <div className="empty-state panel">訪問先を追加して順路を作成しましょう。</div>
          )}
        </section>
        <aside className="panel diagram-panel">
          <h2>ルートプレビュー</h2>
          <RouteDiagram visits={visits} />
        </aside>
      </div>
      {editor && (
        <VisitEditor
          visit={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
