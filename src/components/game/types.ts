export type TileType = "safe" | "bomb" | "heart";
export type GamePhase =
  | "setup_bombs"
  | "waiting_for_opponent"
  | "playing"
  | "game_over"
  | "game_won"
  | "paused";

export interface Tile {
  id: number;
  type: TileType;
  flipped: boolean;
}
