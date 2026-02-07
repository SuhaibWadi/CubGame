export type TileType = "safe" | "bomb" | "heart";
export type GamePhase =
  | "setup_bombs"
  | "setup_heart"
  | "playing"
  | "game_over"
  | "game_won";

export interface Tile {
  id: number;
  type: TileType;
  flipped: boolean;
}
