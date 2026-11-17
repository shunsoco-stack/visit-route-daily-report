export type IconName = "today" | "route" | "report" | "revisit" | "places" | "about";

const paths: Record<IconName, string> = {
  today: "M8 3v4m8-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1m3 9 3 3 5-5",
  route: "M7 6h9a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8m0-16a2 2 0 1 1-4 0 2 2 0 0 1 4 0m0 16h9",
  report: "M6 3h9l4 4v14H6V3m8 0v5h5M9 12h7m-7 4h7",
  revisit: "M4 9a8 8 0 1 1 0 7M4 4v5h5m3-2v5l3 2",
  places: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0m-4 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  about: "M12 11v6m0-10v1m9 4a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[name]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
