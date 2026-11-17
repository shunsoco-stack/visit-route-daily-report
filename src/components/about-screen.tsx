"use client";

import { useState } from "react";
import { createSeed } from "@/lib/seed";
import { japanDate } from "@/lib/logic";
import { useApp } from "./app-provider";
import { PageHeading } from "./shared";

export function AboutScreen() {
  const { data, setData, setDate, notify } = useApp();
  const [rate, setRate] = useState(String(data.rate));
  return (
    <>
      <PageHeading
        eyebrow="ABOUT & SETTINGS"
        title="このデモについて"
        description="現場の記録を、もっと身軽に。"
      />
      <div className="about-grid">
        <section className="panel about-card">
          <span className="eyebrow">めぐる日報</span>
          <h2>ひとりの担当者の、一日を支える。</h2>
          <p>
            ルート営業・設備点検・検針などで使う、訪問リストとワンタップ記録のアプリです。
            順路を整え、到着や完了を記録すると、日報と交通費が自動でまとまります。
          </p>
          <h3>デモ用の架空データです</h3>
          <p>
            すべての訪問先・記録・住所は架空であり、実在の企業・個人・住所とは無関係です。
            訪問先12件、今日6件、過去5日分の記録、再訪2件からお試しいただけます。
          </p>
          <h3>この端末のブラウザに保存</h3>
          <p>
            データはlocalStorage（vrdr:v1）に保存されます。外部送信・認証・データベースは使用しません。
            ブラウザのデータ消去で記録も消えます。必要な日報はCSVで保存してください。
          </p>
          <h3>記録と集計のルール</h3>
          <p>
            時刻は日本時間です。到着のあとに完了を記録し、滞在時間は分単位で四捨五入します。
            稼働時間は最初の到着から最後の完了までです。初期の今日の記録はデモ用の固定時刻です。
            現在時刻より後の到着記録は、取り消してから操作してください。
          </p>
          <p>
            交通費は入力済みの全区間を集計します。単価変更は過去の日報にも反映されます。
            配車、車両管理、経費承認、地図API・GPS連携は含みません。
          </p>
        </section>
        <div>
          <section className="panel about-card">
            <h2>交通費の設定</h2>
            <form
              className="stack-form"
              onSubmit={(event) => {
                event.preventDefault();
                setData((current) => current && { ...current, rate: Number(rate) });
                notify("車の交通費単価を保存しました");
              }}
            >
              <label>
                車の単価（円 / km）
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  required
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                />
              </label>
              <p className="fine-print">既定：15円/km。電車・バスは入力運賃、徒歩・自転車は0円。</p>
              <button className="primary" type="submit">
                設定を保存
              </button>
            </form>
          </section>
          <section className="panel about-card reset-card">
            <h2>デモを最初から試す</h2>
            <p>追加・編集した全データを消去し、今日を基準とした既定データに戻します。</p>
            <button
              className="danger-text"
              onClick={() => {
                if (
                  !window.confirm(
                    "すべての記録と設定を消去し、既定データに戻しますか？この操作は取り消せません。",
                  )
                )
                  return;
                setData(createSeed());
                setDate(japanDate());
                setRate("15");
                notify("既定データに戻しました");
              }}
            >
              既定データに戻す
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
