"use client";

import Link from "next/link";
import { useState } from "react";
import { japanDate, revisitVisits, shiftDate } from "@/lib/logic";
import { makeVisit } from "@/lib/seed";
import type { Visit } from "@/lib/types";
import { useApp } from "./app-provider";
import { PageHeading, StatusBadge } from "./shared";

function RevisitCard({ visit }: { visit: Visit }) {
  const { data, setData, notify, setDate } = useApp();
  const [target, setTarget] = useState(shiftDate(japanDate(), 1));
  const followups = data.visits.filter((item) => item.revisitOf === visit.id);
  const resolved = followups.some((item) => item.status === "完了" && item.result === "対応済み");

  function schedule() {
    if (!target || target === visit.date) {
      notify("元の訪問日とは別の日を指定してください");
      return;
    }
    if (followups.some((item) => item.date === target)) {
      notify("その日には追加済みです");
      return;
    }
    const next = {
      ...makeVisit({ ...visit, id: visit.placeId }, target, crypto.randomUUID()),
      time: visit.time,
      revisitOf: visit.id,
      memo: [visit.memo, `再訪：${visit.resultMemo || visit.status}`].join("\n"),
    };
    setData((current) => current && { ...current, visits: [...current.visits, next] });
    notify(`${target} の訪問リストに追加しました`);
  }

  return (
    <article className="panel revisit-card">
      <div className="section-heading">
        <span className="fine-print">{visit.date} の訪問</span>
        <StatusBadge status={visit.status} />
      </div>
      <h2>{visit.name}</h2>
      <p className="muted">
        {visit.area} · {visit.purpose}
      </p>
      <p className="revisit-reason">
        {visit.status === "不在" ? "不在のため再訪" : "要再訪"}：{visit.resultMemo || "メモなし"}
      </p>
      {followups.map((item) => (
        <p className="scheduled-note" key={item.id}>
          {item.date} に追加済み · {item.status}
          <Link href="/" onClick={() => setDate(item.date)}>
            訪問を確認 ↗
          </Link>
        </p>
      ))}
      {resolved ? (
        <p className="arrival-note">✓ 再訪先で対応済みです</p>
      ) : (
        <div className="schedule-controls">
          <label>
            再訪する日
            <input type="date" value={target} onChange={(event) => setTarget(event.target.value)} />
          </label>
          <button className="primary" disabled={!target} onClick={schedule}>
            ＋ 別日に追加
          </button>
        </div>
      )}
    </article>
  );
}

export function RevisitScreen() {
  const { data } = useApp();
  const revisits = revisitVisits(data.visits);
  return (
    <>
      <PageHeading
        eyebrow="FOLLOW UP"
        title="再訪リスト"
        description="不在・要再訪の記録を、次の訪問につなげる。"
      />
      <div className="info-strip">
        不在、または完了時に「要再訪」を選んだ訪問が自動で表示されます。
      </div>
      <div className="section-heading">
        <h2>
          フォローする訪問 <span className="count-pill">{revisits.length}</span>
        </h2>
      </div>
      <div className="two-column">
        {revisits.map((visit) => (
          <RevisitCard key={visit.id} visit={visit} />
        ))}
      </div>
      {!revisits.length && <p className="empty-state panel">再訪が必要な訪問はありません。</p>}
    </>
  );
}
