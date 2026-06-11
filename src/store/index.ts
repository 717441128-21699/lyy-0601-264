import { SKILLS_PRESET, generateMockRooms, generateMockLeaderboard, generateInitialMap, generateMockChatMessages, generateMockGameState } from '@/mock/data';
import type { Room, Player, Skill, LeaderboardEntry, ChatMessage, GameState, MapCell, GameLog, Alliance, PlayerState } from '@/types';
import { create } from 'zustand';

const AI_AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🦄', '🐙', '🦅', '🐲', '🦖'];
const AI_NAMES = ['影狐', '墨竹', '星尘', '破晓', '流云', '寒霜', '烈焰', '惊雷', '疾风', '暗夜'];
const AI_COLORS = ['#00f0ff', '#b026ff', '#ff2e8a', '#ffb347', '#39ff14', '#ff6b35'];
const AI_SHAPES: any[] = ['circle', 'square', 'triangle', 'diamond', 'star'];

interface PlayerStore {
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player) => void;
  updatePlayer: (patch: Partial<Player>) => void;
}

const savedPlayer = localStorage.getItem('lw_currentPlayer');
const initialPlayer: Player | null = savedPlayer
  ? JSON.parse(savedPlayer)
  : null;

const savedRoom = localStorage.getItem('lw_currentRoom');
const initialRoom: Room | null = savedRoom
  ? JSON.parse(savedRoom)
  : null;

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentPlayer: initialPlayer,
  setCurrentPlayer: (player) => {
    localStorage.setItem('lw_currentPlayer', JSON.stringify(player));
    set({ currentPlayer: player });
  },
  updatePlayer: (patch) =>
    set((state) => {
      if (!state.currentPlayer) return state;
      const updated = { ...state.currentPlayer, ...patch };
      localStorage.setItem('lw_currentPlayer', JSON.stringify(updated));
      return { currentPlayer: updated };
    }),
}));

interface RoomStore {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  fetchRooms: () => void;
  createRoom: (name: string, maxPlayers: number, password?: string) => Room;
  joinRoom: (roomId: string, player: Player, password?: string) => boolean;
  leaveRoom: () => void;
  updateRoom: (patch: Partial<Room>) => void;
  addPlayerToRoom: (player: Player) => void;
  removePlayerFromRoom: (playerId: string) => void;
  togglePlayerReady: (playerId: string) => void;
  startGame: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  currentRoom: initialRoom,
  isLoading: false,
  fetchRooms: () => {
    set({ isLoading: true });
    setTimeout(() => {
      set({ rooms: generateMockRooms(), isLoading: false });
    }, 300);
  },
  createRoom: (name, maxPlayers, password) => {
    const currentPlayer = usePlayerStore.getState().currentPlayer!;
    const newRoom: Room = {
      id: 'room_' + Date.now(),
      name,
      hostId: currentPlayer.id,
      maxPlayers,
      currentPlayers: [{ ...currentPlayer, isHost: true, isReady: true }],
      status: 'waiting',
      hasPassword: !!password,
      password,
      createdAt: Date.now(),
      inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    };
    localStorage.setItem('lw_currentRoom', JSON.stringify(newRoom));
    set({ currentRoom: newRoom });
    return newRoom;
  },
  joinRoom: (roomId, player, password) => {
    const room = get().rooms.find((r) => r.id === roomId);
    if (!room) return false;
    if (room.hasPassword && room.password !== password) return false;
    if (room.currentPlayers.length >= room.maxPlayers) return false;
    const updatedRoom: Room = {
      ...room,
      currentPlayers: [...room.currentPlayers, { ...player, isHost: false, isReady: false }],
    };
    localStorage.setItem('lw_currentRoom', JSON.stringify(updatedRoom));
    set({ currentRoom: updatedRoom });
    return true;
  },
  leaveRoom: () => {
    localStorage.removeItem('lw_currentRoom');
    set({ currentRoom: null });
  },
  updateRoom: (patch) =>
    set((state) => {
      if (!state.currentRoom) return state;
      const updated = { ...state.currentRoom, ...patch };
      localStorage.setItem('lw_currentRoom', JSON.stringify(updated));
      return { currentRoom: updated };
    }),
  addPlayerToRoom: (player) =>
    set((state) => {
      if (!state.currentRoom) return state;
      const updated = {
        ...state.currentRoom,
        currentPlayers: [...state.currentRoom.currentPlayers, player],
      };
      localStorage.setItem('lw_currentRoom', JSON.stringify(updated));
      return { currentRoom: updated };
    }),
  removePlayerFromRoom: (playerId) =>
    set((state) => {
      if (!state.currentRoom) return state;
      const updated = {
        ...state.currentRoom,
        currentPlayers: state.currentRoom.currentPlayers.filter((p) => p.id !== playerId),
      };
      localStorage.setItem('lw_currentRoom', JSON.stringify(updated));
      return { currentRoom: updated };
    }),
  togglePlayerReady: (playerId) =>
    set((state) => {
      if (!state.currentRoom) return state;
      const updated = {
        ...state.currentRoom,
        currentPlayers: state.currentRoom.currentPlayers.map((p) =>
          p.id === playerId ? { ...p, isReady: !p.isReady } : p
        ),
      };
      localStorage.setItem('lw_currentRoom', JSON.stringify(updated));
      return { currentRoom: updated };
    }),
  startGame: () =>
    set((state) => {
      if (!state.currentRoom) return state;
      let players = [...state.currentRoom.currentPlayers];
      const usedColors = players.map((p) => p.color);
      let aiIdx = 0;
      while (players.length < Math.min(2, state.currentRoom.maxPlayers)) {
        const color = AI_COLORS.find((c) => !usedColors.includes(c)) || AI_COLORS[aiIdx % AI_COLORS.length];
        usedColors.push(color);
        players.push({
          id: 'ai_' + Date.now() + '_' + aiIdx,
          name: 'AI-' + AI_NAMES[aiIdx % AI_NAMES.length],
          avatar: AI_AVATARS[aiIdx % AI_AVATARS.length],
          color,
          pieceShape: AI_SHAPES[aiIdx % AI_SHAPES.length],
          skill: { ...SKILLS_PRESET[aiIdx % SKILLS_PRESET.length] },
          isReady: true,
          isConnected: true,
          isHost: false,
        });
        aiIdx++;
      }
      const updated = { ...state.currentRoom, status: 'playing' as const, currentPlayers: players };
      localStorage.setItem('lw_currentRoom', JSON.stringify(updated));
      return { currentRoom: updated };
    }),
}));

interface GameStore {
  gameState: GameState | null;
  skills: Skill[];
  initGame: (room: Room) => void;
  rollDice: () => number;
  movePlayer: (playerId: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  occupyCell: (playerId: string) => void;
  stealCell: (playerId: string, targetX: number, targetY: number) => void;
  proposeAlliance: (playerId: string, targetId: string) => void;
  betray: (playerId: string, allyId: string) => void;
  useSkill: (playerId: string) => void;
  endTurn: () => void;
  addLog: (log: Omit<GameLog, 'id' | 'timestamp'>) => void;
  restoreGame: (saved: GameState) => void;
}

const savedGame = localStorage.getItem('lw_gameState');
const initialGame: GameState | null = savedGame ? JSON.parse(savedGame) : null;

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: initialGame,
  skills: SKILLS_PRESET,
  initGame: (room) => {
    const state = generateMockGameState(room);
    localStorage.setItem('lw_gameState', JSON.stringify(state));
    set({ gameState: state });
  },
  rollDice: () => {
    const val = Math.floor(Math.random() * 6) + 1;
    set((state) => {
      if (!state.gameState) return state;
      const updated = {
        ...state.gameState,
        diceValue: val,
        movesRemaining: val,
        phase: 'move' as const,
      };
      localStorage.setItem('lw_gameState', JSON.stringify(updated));
      return { gameState: updated };
    });
    return val;
  },
  movePlayer: (playerId, direction) =>
    set((state) => {
      if (!state.gameState) return state;
      const gs = state.gameState;
      const playerIdx = gs.players.findIndex((p) => p.playerId === playerId);
      if (playerIdx === -1 || gs.movesRemaining <= 0) return state;
      const player = gs.players[playerIdx];
      const mapSize = gs.map.length;
      let { x, y } = player.position;
      if (direction === 'up') y = Math.max(0, y - 1);
      if (direction === 'down') y = Math.min(mapSize - 1, y + 1);
      if (direction === 'left') x = Math.max(0, x - 1);
      if (direction === 'right') x = Math.min(mapSize - 1, x + 1);
      if (x === player.position.x && y === player.position.y) return state;

      const newMap = gs.map.map((row) => row.map((c) => ({ ...c })));
      const cell = newMap[y][x];
      let newResources = player.resources;
      let resourcesGained = 0;
      let skipTurn = false;
      const newLogs = [...gs.logs];

      if (cell.type === 'trap' && cell.isTrapActive) {
        newResources = Math.max(0, newResources - 10);
        skipTurn = true;
        cell.isTrapActive = false;
        newLogs.push({
          id: 'log_' + Date.now() + '_trap',
          turn: gs.currentTurn,
          playerId,
          action: 'trap',
          data: { x, y, lost: 10, fromX: player.position.x, fromY: player.position.y },
          timestamp: Date.now(),
        });
      }
      if (cell.type === 'resource' && cell.resourceAmount > 0) {
        const gained = Math.min(15, cell.resourceAmount);
        newResources += gained;
        resourcesGained = gained;
        cell.resourceAmount -= gained;
      }

      newLogs.push({
        id: 'log_' + Date.now() + '_move',
        turn: gs.currentTurn,
        playerId,
        action: 'move',
        data: { x, y, fromX: player.position.x, fromY: player.position.y, direction },
        timestamp: Date.now(),
      });

      const newPlayers = [...gs.players];
      newPlayers[playerIdx] = {
        ...player,
        position: { x, y },
        resources: newResources,
        skipTurn,
        resourcesGained: player.resourcesGained + resourcesGained,
      };

      const updated = {
        ...gs,
        map: newMap,
        players: newPlayers,
        movesRemaining: gs.movesRemaining - 1,
        logs: newLogs,
        phase: gs.movesRemaining - 1 === 0 ? 'action' : gs.phase,
      };
      localStorage.setItem('lw_gameState', JSON.stringify(updated));
      return { gameState: updated };
    }),
  occupyCell: (playerId) =>
    set((state) => {
      if (!state.gameState) return state;
      const gs = state.gameState;
      const player = gs.players.find((p) => p.playerId === playerId);
      if (!player) return state;
      const { x, y } = player.position;
      const cell = gs.map[y][x];
      if (cell.ownerId === playerId) return state;
      const cost = cell.ownerId && cell.ownerId !== playerId ? 20 : 5;
      if (player.resources < cost) return state;
      const newMap = gs.map.map((row) => row.map((c) => ({ ...c })));
      newMap[y][x] = { ...cell, ownerId: playerId };
      const prevOwnerId = cell.ownerId;
      const newPlayers = gs.players.map((p) => {
        if (p.playerId === playerId) {
          return {
            ...p,
            resources: p.resources - cost,
            ownedCells: p.ownedCells + 1,
          };
        }
        if (prevOwnerId && p.playerId === prevOwnerId) {
          return { ...p, ownedCells: Math.max(0, p.ownedCells - 1) };
        }
        return p;
      });
      const newLogs = [
        ...gs.logs,
        {
          id: 'log_' + Date.now() + '_occupy',
          turn: gs.currentTurn,
          playerId,
          action: 'occupy' as const,
          data: { x, y, wasEnemy: !!prevOwnerId, cost, targetId: prevOwnerId },
          timestamp: Date.now(),
        },
      ];
      const updated = { ...gs, map: newMap, players: newPlayers, logs: newLogs, phase: 'end' as const };
      localStorage.setItem('lw_gameState', JSON.stringify(updated));
      return { gameState: updated };
    }),
  stealCell: (playerId, targetX, targetY) =>
    set((state) => {
      if (!state.gameState) return state;
      const gs = state.gameState;
      const attacker = gs.players.find((p) => p.playerId === playerId);
      const cell = gs.map[targetY]?.[targetX];
      if (!attacker || !cell || !cell.ownerId || cell.ownerId === playerId) return state;
      if (attacker.resources < 15) return state;
      const prevOwnerId = cell.ownerId;
      const success = Math.random() > 0.4;
      const newPlayers = gs.players.map((p) => {
        if (p.playerId === playerId) {
          return {
            ...p,
            resources: Math.max(0, p.resources - 15 + (success ? 25 : 0)),
            damageDealt: p.damageDealt + (success ? 20 : 0),
            resourcesGained: p.resourcesGained + (success ? 25 : 0),
            ownedCells: p.ownedCells + (success ? 1 : 0),
          };
        }
        if (p.playerId === prevOwnerId) {
          return {
            ...p,
            resources: success ? Math.max(0, p.resources - 25) : p.resources,
            damageTaken: p.damageTaken + (success ? 20 : 0),
            ownedCells: Math.max(0, p.ownedCells - (success ? 1 : 0)),
          };
        }
        return p;
      });
      const newMap = gs.map.map((row) => row.map((c) => ({ ...c })));
      if (success) newMap[targetY][targetX] = { ...cell, ownerId: playerId };
      const newLogs = [
        ...gs.logs,
        {
          id: 'log_' + Date.now() + '_steal',
          turn: gs.currentTurn,
          playerId,
          action: 'steal' as const,
          data: { x: targetX, y: targetY, success, targetId: prevOwnerId, cost: 15 },
          timestamp: Date.now(),
        },
      ];
      const updated = { ...gs, map: newMap, players: newPlayers, logs: newLogs, phase: 'end' as const };
      localStorage.setItem('lw_gameState', JSON.stringify(updated));
      return { gameState: updated };
    }),
  proposeAlliance: (playerId, targetId) =>
    set((state) => {
      if (!state.gameState) return state;
      const gs = state.gameState;
      const exists = gs.alliances.some(
        (a) => a.playerIds.includes(playerId) && a.playerIds.includes(targetId)
      );
      if (exists) return state;
      const newAlliance: Alliance = {
        id: 'ally_' + Date.now(),
        playerIds: [playerId, targetId] as [string, string],
        turnLeft: 3,
      };
      const newLogs = [
        ...gs.logs,
        {
          id: 'log_' + Date.now() + '_ally',
          turn: gs.currentTurn,
          playerId,
          action: 'ally' as const,
          data: { targetId },
          timestamp: Date.now(),
        },
      ];
      const updated = { ...gs, alliances: [...gs.alliances, newAlliance], logs: newLogs, phase: 'end' as const };
      localStorage.setItem('lw_gameState', JSON.stringify(updated));
      return { gameState: updated };
    }),
  betray: (playerId, allyId) =>
    set((state) => {
      if (!state.gameState) return state;
      const gs = state.gameState;
      const allianceIdx = gs.alliances.findIndex(
        (a) => a.playerIds.includes(playerId) && a.playerIds.includes(allyId)
      );
      if (allianceIdx === -1) return state;
      const bonus = 30;
      const newPlayers = gs.players.map((p) => {
        if (p.playerId === playerId) return { ...p, resources: p.resources + bonus, damageDealt: p.damageDealt + 30 };
        if (p.playerId === allyId) return { ...p, hp: Math.max(0, p.hp - 30), damageTaken: p.damageTaken + 30 };
        return p;
      });
      const newAlliances = gs.alliances.filter((_, i) => i !== allianceIdx);
      const newLogs = [
        ...gs.logs,
        {
          id: 'log_' + Date.now(),
          turn: gs.currentTurn,
          playerId,
          action: 'betray' as const,
          data: { targetId: allyId, bonus },
          timestamp: Date.now(),
        },
      ];
      const updated = { ...gs, players: newPlayers, alliances: newAlliances, logs: newLogs, phase: 'end' as const };
      localStorage.setItem('lw_gameState', JSON.stringify(updated));
      return { gameState: updated };
    }),
  useSkill: (playerId) =>
    set((state) => {
      if (!state.gameState) return state;
      const gs = state.gameState;
      const player = gs.players.find((p) => p.playerId === playerId);
      if (!player) return state;
      const room = useRoomStore.getState().currentRoom;
      const playerInfo = room?.currentPlayers.find((p) => p.id === playerId);
      if (!playerInfo || playerInfo.skill.currentCooldown > 0) return state;
      let newPlayers = gs.players.map((p) => ({ ...p }));
      let newMap = gs.map.map((row) => row.map((c) => ({ ...c })));
      const pIdx = newPlayers.findIndex((p) => p.playerId === playerId);
      switch (playerInfo.skill.type) {
        case 'move':
          newPlayers[pIdx] = { ...newPlayers[pIdx], resources: newPlayers[pIdx].resources + 0 };
          const updatedStateMove = { ...gs, movesRemaining: gs.movesRemaining + 3, players: newPlayers };
          localStorage.setItem('lw_gameState', JSON.stringify(updatedStateMove));
          return { gameState: updatedStateMove };
        case 'attack':
          newPlayers[pIdx] = { ...newPlayers[pIdx], damageDealt: newPlayers[pIdx].damageDealt + 15 };
          break;
        case 'defense':
          newPlayers[pIdx] = { ...newPlayers[pIdx], hp: Math.min(100, newPlayers[pIdx].hp + 30) };
          break;
        case 'resource':
          newPlayers[pIdx] = { ...newPlayers[pIdx], resources: newPlayers[pIdx].resources + 30, resourcesGained: newPlayers[pIdx].resourcesGained + 30 };
          break;
      }
      const newLogs = [
        ...gs.logs,
        {
          id: 'log_' + Date.now(),
          turn: gs.currentTurn,
          playerId,
          action: 'skill' as const,
          data: { skillName: playerInfo.skill.name, type: playerInfo.skill.type },
          timestamp: Date.now(),
        },
      ];
      if (room) {
        const updatedRoom = {
          ...room,
          currentPlayers: room.currentPlayers.map((p) =>
            p.id === playerId
              ? { ...p, skill: { ...p.skill, currentCooldown: p.skill.cooldown } }
              : p
          ),
        };
        useRoomStore.getState().updateRoom(updatedRoom);
      }
      const updated = { ...gs, map: newMap, players: newPlayers, logs: newLogs, phase: 'end' as const };
      localStorage.setItem('lw_gameState', JSON.stringify(updated));
      return { gameState: updated };
    }),
  endTurn: () =>
    set((state) => {
      if (!state.gameState) return state;
      const gs = state.gameState;
      const room = useRoomStore.getState().currentRoom;
      if (!room) return state;

      const currentIdx = room.currentPlayers.findIndex((p) => p.id === gs.currentPlayerId);
      const nextIdx = (currentIdx + 1) % room.currentPlayers.length;
      const nextPlayerId = room.currentPlayers[nextIdx].id;
      const newTurn = nextIdx === 0 ? gs.currentTurn + 1 : gs.currentTurn;

      const updatedRoom = {
        ...room,
        currentPlayers: room.currentPlayers.map((p) => ({
          ...p,
          skill: { ...p.skill, currentCooldown: Math.max(0, p.skill.currentCooldown - 1) },
        })),
      };
      useRoomStore.getState().updateRoom(updatedRoom);

      const resourcePlayers = gs.players.map((p) => {
        const owned = gs.map.flat().filter((c) => c.ownerId === p.playerId);
        const resourceGain = owned.reduce((sum, c) => sum + (c.type === 'resource' ? 5 : 1), 0);
        return { ...p, resources: p.resources + resourceGain, resourcesGained: p.resourcesGained + resourceGain };
      });

      const updatedAlliances = gs.alliances
        .map((a) => ({ ...a, turnLeft: a.turnLeft - 1 }))
        .filter((a) => a.turnLeft > 0);

      let winnerId: string | null = null;
      if (newTurn > 15) {
        const sorted = [...resourcePlayers].sort((a, b) => b.ownedCells - a.ownedCells || b.resources - a.resources);
        winnerId = sorted[0].playerId;
      }
      const hpDead = resourcePlayers.find((p) => p.hp <= 0);
      if (hpDead && resourcePlayers.length === 2) {
        winnerId = resourcePlayers.find((p) => p.hp > 0)?.playerId || null;
      }

      const updated = {
        ...gs,
        currentPlayerId: nextPlayerId,
        currentTurn: newTurn,
        diceValue: null,
        movesRemaining: 0,
        phase: 'roll' as const,
        players: resourcePlayers,
        alliances: updatedAlliances,
        status: winnerId ? 'ended' : gs.status,
        winnerId,
      };
      localStorage.setItem('lw_gameState', JSON.stringify(updated));
      return { gameState: updated };
    }),
  addLog: (log) =>
    set((state) => {
      if (!state.gameState) return state;
      const newLog: GameLog = { ...log, id: 'log_' + Date.now(), timestamp: Date.now() };
      const updated = { ...state.gameState, logs: [...state.gameState.logs, newLog] };
      localStorage.setItem('lw_gameState', JSON.stringify(updated));
      return { gameState: updated };
    }),
  restoreGame: (saved) => {
    localStorage.setItem('lw_gameState', JSON.stringify(saved));
    set({ gameState: saved });
  },
}));

interface ChatStore {
  messages: ChatMessage[];
  blockedPlayers: string[];
  initMessages: (msgs: ChatMessage[]) => void;
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  blockPlayer: (playerId: string) => void;
  unblockPlayer: (playerId: string) => void;
}

const savedMessages = localStorage.getItem('lw_chatMessages');
const initialMessages = savedMessages ? JSON.parse(savedMessages) : [];

export const useChatStore = create<ChatStore>((set) => ({
  messages: initialMessages,
  blockedPlayers: JSON.parse(localStorage.getItem('lw_blocked') || '[]'),
  initMessages: (msgs) => {
    localStorage.setItem('lw_chatMessages', JSON.stringify(msgs));
    set({ messages: msgs });
  },
  sendMessage: (msg) =>
    set((state) => {
      const updated = [
        ...state.messages,
        { ...msg, id: 'msg_' + Date.now(), timestamp: Date.now() },
      ];
      localStorage.setItem('lw_chatMessages', JSON.stringify(updated));
      return { messages: updated };
    }),
  blockPlayer: (playerId) =>
    set((state) => {
      const blocked = [...state.blockedPlayers, playerId];
      localStorage.setItem('lw_blocked', JSON.stringify(blocked));
      return { blockedPlayers: blocked };
    }),
  unblockPlayer: (playerId) =>
    set((state) => {
      const blocked = state.blockedPlayers.filter((id) => id !== playerId);
      localStorage.setItem('lw_blocked', JSON.stringify(blocked));
      return { blockedPlayers: blocked };
    }),
}));

interface LeaderboardStore {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  sortBy: 'winRate' | 'winStreak' | 'seasonPoints';
  fetchLeaderboard: () => void;
  setSortBy: (sort: 'winRate' | 'winStreak' | 'seasonPoints') => void;
}

export const useLeaderboardStore = create<LeaderboardStore>((set, get) => ({
  entries: [],
  isLoading: false,
  sortBy: 'winRate',
  fetchLeaderboard: () => {
    set({ isLoading: true });
    setTimeout(() => {
      const sortBy = get().sortBy;
      const entries = generateMockLeaderboard().sort((a, b) => {
        if (sortBy === 'winRate') return b.winRate - a.winRate;
        if (sortBy === 'winStreak') return b.winStreak - a.winStreak;
        return b.seasonPoints - a.seasonPoints;
      }).map((e, i) => ({ ...e, rank: i + 1 }));
      set({ entries, isLoading: false });
    }, 400);
  },
  setSortBy: (sort) => {
    set({ sortBy: sort });
    get().fetchLeaderboard();
  },
}));

interface GuideStore {
  showGuide: boolean;
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  startGuide: () => void;
  nextStep: () => void;
  prevStep: () => void;
  closeGuide: () => void;
}

const GUIDE_STEPS = 7;
const guideCompleted = localStorage.getItem('lw_guideCompleted');

export const useGuideStore = create<GuideStore>((set) => ({
  showGuide: !guideCompleted,
  currentStep: 0,
  completedSteps: [],
  totalSteps: GUIDE_STEPS,
  startGuide: () => set({ showGuide: true, currentStep: 0 }),
  nextStep: () =>
    set((state) => {
      const next = state.currentStep + 1;
      if (next >= state.totalSteps) {
        localStorage.setItem('lw_guideCompleted', 'true');
        return { showGuide: false, currentStep: 0, completedSteps: [] };
      }
      return { currentStep: next, completedSteps: [...state.completedSteps, state.currentStep] };
    }),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
  closeGuide: () => {
    localStorage.setItem('lw_guideCompleted', 'true');
    set({ showGuide: false });
  },
}));
