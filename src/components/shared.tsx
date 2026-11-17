"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { japanDate, shiftDate } from "@/lib/logic";
import type { Visit } from "@/lib/types";
import { useApp } from "./app-provider";

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function DatePicker() {
  const { date, setDate } = useApp();
  return (
    <div className="date-picker">
      <button aria-label="前日" onClick={() => setDate(shiftDate(date, -1))}>
        ‹
      </button>
      <label>
        <span className="sr-only">表示する日付</span>
        <input
          type="date"
          value={date}
          onChange={(event) => {
            if (event.target.value) setDate(event.target.value);
          }}
        />
      </label>
      <button aria-label="翌日" onClick={() => setDate(shiftDate(date, 1))}>
        ›
      </button>
      <button className="today-button" onClick={() => setDate(japanDate())}>
        今日
      </button>
    </div>
  );
}

export function StatusBadge({ status }: { status: Visit["status"] }) {
  const classes = { 未訪問: "pending", 到着中: "arrived", 完了: "done", 不在: "absent" };
  return (
    <span className={`status-badge ${classes[status]}`}>
      {status === "完了" ? "✓ " : "● "}
      {status}
    </span>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={onClose} aria-label={title}>
      <div className="section-heading">
        <h2>{title}</h2>
        <button aria-label="閉じる" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function RouteDiagram({ visits }: { visits: Visit[] }) {
  if (!visits.length) return <p className="empty-state">訪問先を追加すると順路が表示されます。</p>;
  const height = Math.max(140, visits.length * 66 + 20);
  return (
    <div className="route-diagram">
      <svg
        viewBox={`0 0 320 ${height}`}
        role="img"
        aria-label="訪問順を示す模式図。地図ではありません。"
      >
        <defs>
          <pattern id="route-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#d2ddd7" />
          </pattern>
        </defs>
        <rect width="320" height={height} fill="url(#route-dots)" rx="12" />
        {visits.map((visit, index) => {
          const x = index % 2 === 0 ? 38 : 74;
          const y = 40 + index * 66;
          const nextX = index % 2 === 0 ? 74 : 38;
          return (
            <g key={visit.id}>
              {index < visits.length - 1 && (
                <path d={`M${x} ${y} L${nextX} ${y + 66}`} stroke="#8eb5a5" strokeWidth="3" />
              )}
              <circle
                cx={x}
                cy={y}
                r="16"
                fill={visit.status === "完了" ? "#24644f" : "#fff"}
                stroke="#24644f"
                strokeWidth="2"
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill={visit.status === "完了" ? "#fff" : "#24644f"}
              >
                {index + 1}
              </text>
              <text x="105" y={y - 3} fontSize="12" fill="#263f35">
                {visit.name.replace("（架空）", "").slice(0, 16)}
              </text>
              <text x="105" y={y + 16} fontSize="11" fill="#617168">
                {visit.time} · {visit.area}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="fine-print">訪問順の模式図です。地図ではありません。</p>
    </div>
  );
}
