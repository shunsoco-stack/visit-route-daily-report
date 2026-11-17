"use client";

import Link from "next/link";
import { useState } from "react";
import {
  clockTime,
  dayVisits,
  japanDate,
  recordVisit,
  stayMinutes,
  summarize,
  undoRecord,
} from "@/lib/logic";
import type { Visit } from "@/lib/types";
import { useApp } from "./app-provider";
import { DatePicker, PageHeading, RouteDiagram, StatusBadge } from "./shared";
import { VisitEditor } from "./visit-editor";
import { Icon } from "./icon";

function VisitCard({ visit, index, onEdit }: { visit: Visit; index: number; onEdit: () => void }) {
  const { setData, notify, date } = useApp();
  const terminal = visit.status === "完了" || visit.status === "不在";
  const isToday = date === japanDate();
  const timeRange = `${clockTime(visit.arrivedAt)} → ${clockTime(visit.finishedAt)}`;

  function update(next: Visit) {
    setData(
      (current) =>
        current && {
          ...current,
          visits: current.visits.map((item) => (item.id === visit.id ? next : item)),
        },
    );
  }

  function record(action: "到着中" | "完了" | "不在") {
    const next = recordVisit(visit, action, new Date().toISOString());
    if (next === visit) {
      notify("到着時刻より前の記録はできません。到着を取り消してから記録してください。");
      return;
    }
    update(next);
    notify(`${action === "到着中" ? "到着" : action}を記録しました`);
  }

  return (
    <article className={`visit-card ${visit.status === "到着中" ? "current-visit" : ""}`}>
      <div className="visit-top">
        <span className={`visit-number ${terminal ? "finished" : ""}`}>{index + 1}</span>
        <span className="visit-time">
          {visit.time}
          <small>予定</small>
        </span>
        <StatusBadge status={visit.status} />
        <button
          className="text-button edit-button"
          onClick={onEdit}
          aria-label={`${visit.name}を編集`}
        >
          編集
        </button>
      </div>
      <div className="visit-body">
        <div className="visit-tags">
          <span>{visit.purpose}</span>
          <span>{visit.area}</span>
        </div>
        <h3>{visit.name}</h3>
        <p className="address">
          <Icon name="places" />
          {visit.address}
        </p>
        <p className="visit-memo">{visit.memo || "訪問メモはありません"}</p>
        {terminal ? (
          <div className="record-summary">
            <span>
              {visit.status === "不在"
                ? `不在 ${clockTime(visit.absentAt)}`
                : `${timeRange} · 滞在 ${stayMinutes(visit)}分`}
            </span>
            {visit.status === "完了" && <span>{visit.result}</span>}
          </div>
        ) : (
          <>
            {visit.arrivedAt && (
              <p className="arrival-note">● {clockTime(visit.arrivedAt)} に到着しました</p>
            )}
            {visit.status === "到着中" && (
              <div className="result-fields">
                <label>
                  結果区分
                  <select
                    value={visit.result}
                    onChange={(event) =>
                      update({ ...visit, result: event.target.value as Visit["result"] })
                    }
                  >
                    <option>対応済み</option>
                    <option>要再訪</option>
                    <option>持ち帰り</option>
                  </select>
                </label>
                <label>
                  結果メモ（任意）
                  <input
                    value={visit.resultMemo}
                    maxLength={1000}
                    placeholder="対応内容や次回への申し送り"
                    onChange={(event) => update({ ...visit, resultMemo: event.target.value })}
                  />
                </label>
              </div>
            )}
            <div className="one-tap-actions">
              <button
                disabled={!isToday || visit.status !== "未訪問"}
                onClick={() => record("到着中")}
              >
                ↳ 到着
              </button>
              <button
                className="primary"
                disabled={!isToday || visit.status !== "到着中"}
                onClick={() => record("完了")}
              >
                ✓ 完了
              </button>
              <button disabled={!isToday} onClick={() => record("不在")}>
                不在
              </button>
            </div>
            {!isToday && <p className="fine-print">ワンタップ記録は今日の訪問で利用できます。</p>}
          </>
        )}
        {terminal && (
          <details className="result-details">
            <summary>結果メモ{visit.resultMemo ? `：${visit.resultMemo}` : "を記入・編集"}</summary>
            {visit.status === "完了" && (
              <label>
                結果区分
                <select
                  value={visit.result}
                  onChange={(event) =>
                    update({ ...visit, result: event.target.value as Visit["result"] })
                  }
                >
                  <option>対応済み</option>
                  <option>要再訪</option>
                  <option>持ち帰り</option>
                </select>
              </label>
            )}
            <label>
              結果メモ
              <textarea
                value={visit.resultMemo}
                maxLength={1000}
                onChange={(event) => update({ ...visit, resultMemo: event.target.value })}
              />
            </label>
          </details>
        )}
        {visit.history.length > 0 && (
          <button
            className="undo-button"
            onClick={() => {
              update(undoRecord(visit));
              notify("直前の記録を取り消しました");
            }}
          >
            ↶ 直前の記録を取り消す
          </button>
        )}
      </div>
    </article>
  );
}

export function TodayScreen() {
  const { data, date } = useApp();
  const visits = dayVisits(data, date);
  const summary = summarize(visits, data.rate);
  const active = visits.find((visit) => visit.status === "到着中");
  const next = visits.find((visit) => visit.status === "未訪問");
  const [editor, setEditor] = useState<Visit | "new" | null>(null);
  const [filter, setFilter] = useState("すべて");
  const displayed = visits.filter(
    (visit) =>
      filter === "すべて" ||
      (filter === "未完了" ? ["未訪問", "到着中"].includes(visit.status) : visit.status === filter),
  );
  const completedPercent = visits.length
    ? ((summary.complete + summary.absent) / visits.length) * 100
    : 0;

  return (
    <>
      <PageHeading
        eyebrow="TODAY’S VISITS"
        title={date === japanDate() ? "今日の訪問" : "訪問リスト"}
        description="今日の訪問を、ひとつずつ。記録はワンタップで。"
      >
        <DatePicker />
      </PageHeading>
      <div className="progress-panel">
        <div className="progress-main">
          <span className="small-label">本日の進捗</span>
          <p>
            <strong>{summary.complete}</strong>
            <span> / {summary.total} 件完了</span>
            <span className="absence-count">不在 {summary.absent}件</span>
          </p>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="完了・不在の進捗"
            aria-valuenow={Math.round(completedPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${completedPercent}%` }} />
          </div>
        </div>
        <div className="progress-stat">
          <span>残りの訪問</span>
          <strong>
            {summary.total - summary.complete - summary.absent}
            <small>件</small>
          </strong>
        </div>
        <div className="progress-stat">
          <span>合計滞在時間</span>
          <strong>
            {summary.stay}
            <small>分</small>
          </strong>
        </div>
      </div>
      <div className="today-layout">
        <section>
          <div className="section-heading visit-list-heading">
            <h2>
              訪問リスト <span className="count-pill">{visits.length}</span>
            </h2>
            <button className="primary" onClick={() => setEditor("new")}>
              ＋ 訪問先を追加
            </button>
          </div>
          <div className="filter-tabs" aria-label="訪問の絞り込み">
            {["すべて", "未完了", "完了", "不在"].map((item) => (
              <button
                key={item}
                className={filter === item ? "selected" : ""}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="visit-list">
            {displayed.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                index={visits.indexOf(visit)}
                onEdit={() => setEditor(visit)}
              />
            ))}
            {!displayed.length && (
              <div className="empty-state panel">表示する訪問はありません。</div>
            )}
          </div>
        </section>
        <aside className="today-aside">
          <section className="next-card">
            <span className="small-label">UP NEXT</span>
            <div className="section-heading">
              <h2>次の訪問先</h2>
              <Icon name="route" />
            </div>
            {next ? (
              <>
                <span className="next-time">
                  {next.time}
                  <small> 予定</small>
                </span>
                <h3>{next.name}</h3>
                <p>
                  {next.area} · {next.purpose}
                </p>
                <p className="next-memo">{next.memo}</p>
              </>
            ) : (
              <p>
                未訪問の予定はありません。
                <br />
                今日もおつかれさまです。
              </p>
            )}
            {active && <div className="active-location">現在：{active.name} に到着中</div>}
          </section>
          <section className="panel route-preview">
            <div className="section-heading">
              <h2>今日の順路</h2>
              <Link href="/route">編集 ↗</Link>
            </div>
            <RouteDiagram visits={visits} />
          </section>
          <Link href="/report" className="report-link">
            <Icon name="report" />
            <span>
              今日の記録を日報に<small>交通費も自動でまとまります</small>
            </span>
            <span>→</span>
          </Link>
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
