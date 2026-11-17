"use client";

import { useState } from "react";
import {
  clockTime,
  dayVisits,
  reportCsv,
  reportText,
  stayMinutes,
  summarize,
  travelCost,
  weekDates,
} from "@/lib/logic";
import { useApp } from "./app-provider";
import { DatePicker, Modal, PageHeading, StatusBadge } from "./shared";

export function ReportScreen() {
  const { data, setData, date, setDate, notify } = useApp();
  const visits = dayVisits(data, date);
  const summary = summarize(visits, data.rate);
  const [copyFallback, setCopyFallback] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reportText(data, date));
      notify("日報テキストをコピーしました");
    } catch {
      setCopyFallback(true);
    }
  }

  function download() {
    const blob = new Blob([reportCsv(data, date)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `訪問日報_${date}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("CSVをダウンロードしました");
  }

  return (
    <>
      <PageHeading
        eyebrow="DAILY REPORT"
        title="一日の記録"
        description="訪問の結果と交通費を、ひとつの日報に。"
      >
        <DatePicker />
      </PageHeading>
      <div className="section-heading report-toolbar">
        <p className="muted">{date} の日報 · 日本時間</p>
        <div className="actions">
          <button onClick={copy}>日報をコピー</button>
          <button className="primary" onClick={download}>
            ↓ CSVダウンロード
          </button>
        </div>
      </div>
      <div className="metric-grid">
        <div className="panel metric">
          <span>訪問件数</span>
          <strong>
            {summary.total}
            <small>件</small>
          </strong>
          <p>
            完了 {summary.complete} · 不在 {summary.absent}
          </p>
        </div>
        <div className="panel metric">
          <span>稼働時間</span>
          <strong>
            {summary.work}
            <small>分</small>
          </strong>
          <p>最初の到着〜最後の完了</p>
        </div>
        <div className="panel metric">
          <span>合計滞在時間</span>
          <strong>
            {summary.stay}
            <small>分</small>
          </strong>
          <p>完了のうち要再訪 {summary.revisit}件</p>
        </div>
        <div className="panel metric accent-metric">
          <span>交通費合計</span>
          <strong>
            <small>¥</small>
            {summary.cost.toLocaleString()}
          </strong>
          <p>入力済みの全区間を集計</p>
        </div>
      </div>
      <section className="panel report-section">
        <div className="section-heading">
          <h2>訪問結果</h2>
          <span className="fine-print">{visits.length}件</span>
        </div>
        {visits.map((visit, index) => (
          <div className="report-visit" key={visit.id}>
            <div className="section-heading">
              <h3>
                <span className="inline-number">{index + 1}</span>
                {visit.name}
              </h3>
              <StatusBadge status={visit.status} />
            </div>
            <p className="muted">
              {visit.purpose} · 到着 {clockTime(visit.arrivedAt)} / 完了{" "}
              {clockTime(visit.finishedAt)}
              {visit.absentAt && ` / 不在 ${clockTime(visit.absentAt)}`} · 滞在 {stayMinutes(visit)}
              分
            </p>
            <p>
              {visit.status === "完了" && <span className="result-label">{visit.result}</span>}
              {visit.resultMemo || "結果メモなし"}
            </p>
          </div>
        ))}
        {!visits.length && <p className="empty-state">この日の訪問記録はありません。</p>}
      </section>
      <section className="panel report-section">
        <div className="section-heading">
          <h2>交通費の内訳</h2>
          <span className="fine-print">車：{data.rate}円/km</span>
        </div>
        <p className="fine-print">
          各訪問先までの往路区間を集計。車は区間ごとに四捨五入、徒歩・自転車は0円です。
        </p>
        <div className="cost-list">
          {visits.map((visit, index) => (
            <div key={visit.id} className="cost-row">
              <div>
                <strong>
                  {index + 1}. {visit.name}
                </strong>
                <p>{index === 0 ? "出発地点" : visits[index - 1].name} から</p>
                <small>
                  {visit.mode} ·{" "}
                  {visit.mode === "電車・バス" ? `${visit.fare}円` : `${visit.distance}km`}
                </small>
              </div>
              <strong>¥{travelCost(visit, data.rate).toLocaleString()}</strong>
            </div>
          ))}
        </div>
        <div className="cost-total">
          <span>合計</span>
          <strong>¥{summary.cost.toLocaleString()}</strong>
        </div>
      </section>
      <section className="panel report-section">
        <label className="reflection-label" htmlFor="reflection">
          今日の所感
        </label>
        <p className="fine-print">
          気づいたこと、明日につなげたいこと。入力内容は自動保存されます。
        </p>
        <textarea
          id="reflection"
          rows={4}
          maxLength={5000}
          value={data.reflections[date] || ""}
          placeholder="今日の振り返りを記入してください。"
          onChange={(event) =>
            setData(
              (current) =>
                current && {
                  ...current,
                  reflections: { ...current.reflections, [date]: event.target.value },
                },
            )
          }
        />
      </section>
      <section className="panel report-section">
        <h2>
          今週の一覧 <small>月曜日〜日曜日</small>
        </h2>
        <div className="week-list">
          {weekDates(date).map((day) => {
            const daySummary = summarize(dayVisits(data, day), data.rate);
            return (
              <button
                key={day}
                className={day === date ? "week-day selected" : "week-day"}
                onClick={() => setDate(day)}
                aria-label={`${day}の日報を表示`}
              >
                <span>{day.slice(5).replace("-", "/")}</span>
                <strong>{daySummary.total}件</strong>
                <span>¥{daySummary.cost.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      </section>
      {copyFallback && (
        <Modal title="日報テキスト" onClose={() => setCopyFallback(false)}>
          <p>自動コピーが許可されていません。下のテキストを選択してコピーしてください。</p>
          <textarea
            aria-label="コピー用の日報"
            rows={14}
            readOnly
            value={reportText(data, date)}
            onFocus={(event) => event.target.select()}
          />
        </Modal>
      )}
    </>
  );
}
