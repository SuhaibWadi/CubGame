import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private url: string = "https://your-fly-io-app.fly.dev"; // Placeholder

  connect() {
    if (this.socket) return;

    this.socket = io(this.url, {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Connected to server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room Logic
  createRoom(callback: (roomCode: string) => void) {
    if (!this.socket) this.connect();
    this.socket?.emit("create_room");
    this.socket?.on("room_created", (data) => callback(data.roomCode));
  }

  joinRoom(roomCode: string, callback: (success: boolean) => void) {
    if (!this.socket) this.connect();
    this.socket?.emit("join_room", { roomCode });
    this.socket?.on("room_joined", () => callback(true));
    this.socket?.on("room_error", () => callback(false));
  }

  onOpponentJoined(callback: (opponent: any) => void) {
    this.socket?.on("opponent_joined", callback);
  }

  onGameStart(callback: (board: any) => void) {
    this.socket?.on("game_start", callback);
  }

  emitMove(tileId: number) {
    this.socket?.emit("tile_flip", { tileId });
  }

  onMoveReceived(callback: (data: any) => void) {
    this.socket?.on("tile_flipped", callback);
  }

  emitWin() {
    this.socket?.emit("player_won");
  }

  onOpponentWon(callback: () => void) {
    this.socket?.on("opponent_won", callback);
  }
}

export const socketService = new SocketService();
export default socketService;
