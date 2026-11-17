"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createSeed } from "@/lib/seed";
import { japanDate } from "@/lib/logic";
import { isAppData, STORAGE_KEY } from "@/lib/storage";
import type { AppData } from "@/lib/types";
import { Icon, type IconName } from "./icon";

interface AppContextValue {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData | null>>;
  date: string;
  setDate: (date: string) => void;
  notify: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "今日の訪問", icon: "today" },
  { href: "/route", label: "順路", icon: "route" },
  { href: "/report", label: "日報", icon: "report" },
  { href: "/revisit", label: "再訪リスト", icon: "revisit" },
  { href: "/places", label: "訪問先", icon: "places" },
  { href: "/about", label: "このデモについて", icon: "about" },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<AppData | null>(null);
  const [date, setDate] = useState("");
  const [message, notify] = useState("");
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let initial = createSeed();
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (!isAppData(parsed)) throw new Error("Invalid data");
          initial = parsed;
        }
      } catch {
        setStorageError("保存データを読み込めませんでした。既定データを表示しています。");
      }
      setDate(japanDate());
      setData(initial);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      queueMicrotask(() =>
        setStorageError(
          "端末に保存できません。空き容量やブラウザ設定をご確認ください。現在の操作は画面内のみ有効です。",
        ),
      );
    }
  }, [data]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => notify(""), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        本文へスキップ
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="訪問・巡回ルート日報 ホーム">
          <span className="brand-symbol">
            <Icon name="route" />
          </span>
          <span>
            めぐる日報<small>訪問・巡回ルート日報</small>
          </span>
        </Link>
        <div className="nav-caption">MY WORKSPACE</div>
        <nav aria-label="メインナビゲーション">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-link active" : "nav-link"}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="small-label">ONE VISIT AT A TIME</span>
          <p>
            ひとつずつ、確かな記録。
            <br />
            今日の仕事を、明日につなぐ。
          </p>
          <span className="local-dot" /> この端末に保存
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>訪問・巡回ルート日報</span>
          <span className="demo-label">
            DEMO <span>デモ用の架空データです</span>
          </span>
        </header>
        {storageError && (
          <div className="storage-warning" role="alert">
            {storageError}
          </div>
        )}
        {data ? (
          <AppContext.Provider value={{ data, setData, date, setDate, notify }}>
            <main id="main" className="main-content">
              {children}
            </main>
          </AppContext.Provider>
        ) : (
          <main id="main" className="main-content" aria-busy="true">
            <p>訪問リストを準備しています…</p>
          </main>
        )}
        <footer className="page-footer">
          めぐる日報 <span>自分のペースで、今日も一歩ずつ。</span>
        </footer>
      </div>
      {message && (
        <div className="toast" role="status">
          ✓ {message}
        </div>
      )}
    </div>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider is required");
  return context;
}
