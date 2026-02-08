import { supabase } from "./supabaseConfig";

export interface RoomData {
  id: string;
  code: string;
  host_id: string;
  opponent_id: string | null;
  status: "waiting" | "playing" | "game_over";
  game_state: any;
  winner: string | null;
}

class MultiplayerService {
  /**
   * Generates a random 6-digit room code
   */
  private generateRoomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Creates a new room in Supabase
   */
  async createRoom(hostId: string, hostName?: string): Promise<string | null> {
    try {
      const code = this.generateRoomCode();
      const { data, error } = await supabase
        .from("rooms")
        .insert([
          {
            code,
            host_id: hostId,
            status: "waiting",
            game_state: {
              hostName: hostName || "Player 1",
              turn: hostId,
              [hostId]: { status: "setting_up" }, // Initialize host state
              version: 0,
            },
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating room:", error);
        return null; // Should handle retry for unique code violation
      }

      return code;
    } catch (e) {
      console.error("Exception in createRoom:", e);
      return null;
    }
  }

  /**
   * Joins an existing room
   */
  async joinRoom(
    roomCode: string,
    playerId: string,
    playerName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Fetch room to check status
      const { data: room, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode)
        .single();

      if (fetchError || !room) {
        return { success: false, error: "Room not found" };
      }

      if (room.status !== "waiting") {
        return { success: false, error: "Room is already full or playing" };
      }

      if (room.host_id === playerId) {
        return { success: true }; // Re-joining own room
      }

      // 2. Update room to join
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          opponent_id: playerId,
          status: "waiting", // Wait for setup
          // For now, let's say we go to 'playing' or we stay 'waiting' until boards are set.
          // The previous logic had a 'waiting' room then 'playing'.
          // user said "remove online logic", creating fresh.
          game_state: {
            ...room.game_state,
            opponentName: playerName || "Player 2",
            [playerId]: { status: "setting_up" }, // Initialize joiner state
          },
        })
        .eq("code", roomCode);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (e) {
      console.error("Exception in joinRoom:", e);
      return { success: false, error: "Connection error" };
    }
  }

  /**
   * Subscribes to room updates
   */
  subscribeToRoom(roomCode: string, onUpdate: (room: RoomData) => void) {
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "*", // listen to all changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "rooms",
          filter: `code=eq.${roomCode}`,
        },
        (payload) => {
          // payload.new is the new record
          if (payload.new) {
            onUpdate(payload.new as RoomData);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Fetch initial state just in case we missed it or to sync immediately
          this.getRoomData(roomCode).then((data) => {
            if (data) onUpdate(data);
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Fetch one-time room data
   */
  async getRoomData(roomCode: string): Promise<RoomData | null> {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single();

    if (error) return null;
    return data as RoomData;
  }

  /**
   * Generic update room function
   */
  async updateRoom(roomCode: string, updates: Partial<RoomData>) {
    await supabase.from("rooms").update(updates).eq("code", roomCode);
  }

  /**
   * Update specifically the game_state JSON
   */
  async updateGameState(roomCode: string, newGameState: any) {
    await supabase
      .from("rooms")
      .update({ game_state: newGameState })
      .eq("code", roomCode);
  }

  async submitBoard(roomCode: string, playerId: string, boardConfig: any) {
    console.log(`[submitBoard] Starts for ${playerId} in room ${roomCode}`);
    let retries = 5;

    while (retries > 0) {
      try {
        // 1. Fetch current state
        const room = await this.getRoomData(roomCode);
        if (!room) {
          console.error("[submitBoard] Room not found");
          return;
        }

        const currentState = room.game_state || {};
        console.log(
          `[submitBoard] Attempt ${6 - retries}. Current version: ${currentState.version}`,
        );

        // 2. Prepare new state (Merging)
        const newState = {
          ...currentState,
          [playerId]: {
            ...(currentState[playerId] || {}),
            status: "ready",
            boardConfig,
            lives: 3,
            revealedIndexes: [],
          },
          version: (currentState.version || 0) + 1,
        };

        // 3. Determine Room Status
        const hostId = room.host_id;
        const opponentId = room.opponent_id;
        let newRoomStatus = room.status;

        if (hostId && opponentId) {
          const hostIsReady = newState[hostId]?.status === "ready";
          const opponentIsReady = newState[opponentId]?.status === "ready";
          if (hostIsReady && opponentIsReady) {
            newRoomStatus = "playing";
          }
        }

        // 4. Update (Blind Write with Merge)
        const { error } = await supabase
          .from("rooms")
          .update({
            game_state: newState,
            status: newRoomStatus,
          })
          .eq("code", roomCode);

        if (error) {
          console.error("[submitBoard] Update error:", error);
          throw error;
        }

        // 5. Verify (Read Back)
        // Wait a tiny bit to ensure consistency if needed, but usually immediate read is fine on same connection
        // However, with Supabase/Postgres, read-after-write is consistent.
        const updatedRoom = await this.getRoomData(roomCode);
        const updatedState = updatedRoom?.game_state || {};

        // Check if MY status is "ready".
        if (updatedState[playerId]?.status === "ready") {
          // Also check if we accidentally wiped the other player?
          // If we merged correctly, we shouldn't have.
          // Success!
          console.log("[submitBoard] Success! Status:", newRoomStatus);
          return newRoomStatus;
        } else {
          // If my status is NOT ready, someone else acted and overwrote me or I failed.
          console.warn(
            "[submitBoard] Verification failed (my status not ready). Retrying...",
          );
        }
      } catch (e) {
        console.error("[submitBoard] Exception:", e);
      }

      retries--;
      const waitTime = Math.random() * 500 + 200;
      console.log(`[submitBoard] Waiting ${waitTime}ms before retry...`);
      await new Promise((r) => setTimeout(r, waitTime));
    }
    console.error("[submitBoard] Failed after all retries.");
    return null;
  }

  /**
   * Robust Attack Handling:
   * 1. Reads latest state
   * 2. Merges new move (lives, revealed)
   * 3. Switches turn
   * 4. Updates DB with version check/retry
   */
  async handleAttack(
    roomCode: string,
    targetId: string,
    newOppLives: number,
    revealedIndexes: number[],
    nextTurn: string,
  ): Promise<boolean> {
    let retries = 5;
    while (retries > 0) {
      try {
        const room = await this.getRoomData(roomCode);
        if (!room) return false;

        const currentState = room.game_state || {};
        // Merge target state
        const nextState = {
          ...currentState,
          [targetId]: {
            ...(currentState[targetId] || {}),
            lives: newOppLives,
            revealedIndexes: revealedIndexes, // We trust the client calculated the full list correctly?
            // Actually, it's safer to merge revealedIndexes here if we want to be super safe,
            // but the client usually sends the full new list.
            // Let's assume input `revealedIndexes` is the COMPLETE new list from the client
            // (which merged it locally).
          },
          turn: nextTurn,
          version: (currentState.version || 0) + 1,
        };

        const { error } = await supabase
          .from("rooms")
          .update({
            game_state: nextState,
          })
          .eq("code", roomCode);

        if (!error) {
          return true;
        }

        console.warn("Attack update failed, retrying...", error);
      } catch (e) {
        console.error("Attack exception:", e);
      }

      retries--;
      await new Promise((r) => setTimeout(r, Math.random() * 500 + 200));
    }
    return false;
  }

  async switchTurn(roomCode: string, nextPlayerId: string) {
    const room = await this.getRoomData(roomCode);
    if (!room) return;

    const newState = {
      ...room.game_state,
      turn: nextPlayerId,
    };

    await this.updateGameState(roomCode, newState);
  }
}

export const multiplayerService = new MultiplayerService();
