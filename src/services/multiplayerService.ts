import { get, off, onValue, ref, set, update } from "firebase/database";
import { database } from "./firebaseConfig";

class MultiplayerService {
  /**
   * Generates a random 6-digit room code
   */
  private generateRoomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Creates a new battle room
   */
  async createRoom(playerData: any): Promise<string> {
    const roomCode = this.generateRoomCode();
    const roomRef = ref(database, `rooms/${roomCode}`);

    await set(roomRef, {
      host: playerData,
      status: "waiting",
      createdAt: Date.now(),
    });

    return roomCode;
  }

  /**
   * Joins an existing battle room
   */
  async joinRoom(
    roomCode: string,
    playerData: any,
  ): Promise<{ success: boolean; host?: any }> {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const roomData = snapshot.val();
      if (roomData.status === "waiting" && !roomData.opponent) {
        await update(roomRef, {
          opponent: playerData,
          status: "ready", // Room is full, ready for host to start
        });
        return { success: true, host: roomData.host };
      }
    }
    return { success: false };
  }

  /**
   * Listens for an opponent joining (used by Host)
   */
  onOpponentJoined(roomCode: string, callback: (opponent: any) => void) {
    const opponentRef = ref(database, `rooms/${roomCode}/opponent`);
    onValue(opponentRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  }

  /**
   * Start game from host - syncs boards to both players
   */
  async startGame(
    roomCode: string,
    gameData: { hostBoard: any; opponentBoard: any },
  ) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, {
      status: "playing",
      hostBoard: gameData.hostBoard,
      opponentBoard: gameData.opponentBoard,
      currentTurn: "host", // Host starts
    });
  }

  /**
   * Listen for game start (used by Opponent)
   */
  onGameStarted(roomCode: string, callback: (data: any) => void) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.status === "playing" && data.board) {
        callback(data);
      }
    });
  }

  private lastProcessedMoveTime: number = 0;

  /**
   * Sync tile flip
   */
  async emitMove(roomCode: string, tileId: number) {
    const moveRef = ref(database, `rooms/${roomCode}/lastMove`);
    const timestamp = Date.now();
    this.lastProcessedMoveTime = timestamp;
    await set(moveRef, {
      tileId,
      timestamp,
    });
  }

  /**
   * Listen for player moves
   */
  onMoveReceived(roomCode: string, callback: (data: any) => void) {
    const moveRef = ref(database, `rooms/${roomCode}/lastMove`);
    onValue(moveRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.timestamp > this.lastProcessedMoveTime) {
        this.lastProcessedMoveTime = data.timestamp;
        callback(data);
      }
    });
  }

  /**
   * Emit game over state
   */
  async emitGameOver(roomCode: string, winner: "host" | "opponent") {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, { status: "game_over", winner });
  }

  /**
   * Listen for game over
   */
  onGameOver(roomCode: string, callback: (winner: string) => void) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.status === "game_over" && data.winner) {
        callback(data.winner);
      }
    });
  }

  /**
   * Update current turn in Firebase
   */
  async updateTurn(roomCode: string, nextTurn: "host" | "opponent") {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, { currentTurn: nextTurn });
  }

  /**
   * Listen for turn changes
   */
  onTurnChanged(roomCode: string, callback: (turn: string) => void) {
    const turnRef = ref(database, `rooms/${roomCode}/currentTurn`);
    onValue(turnRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  }

  /**
   * Cleanup listeners
   */
  cleanup(roomCode: string) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    off(roomRef);
  }
}

export const multiplayerService = new MultiplayerService();
export default multiplayerService;
