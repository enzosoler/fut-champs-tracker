export type Match = {
  id: string;
  user_id: string;
  result: "W" | "L";
  goals_for: number;
  goals_against: number;
  notes: string | null;
  created_at: string;
};

export type ChartPoint = {
  game: number;
  winPct: number;
};
