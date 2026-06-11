export type SkillType = 'move' | 'attack' | 'defense' | 'resource';

export interface Skill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  type: SkillType;
  icon: string;
}

export type CellType = 'normal' | 'resource' | 'trap' | 'base';

export interface MapCell {
  x: number;
  y: number;
  type: CellType;
  ownerId: string | null;
  resourceAmount: number;
  isTrapActive: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  title?: string;
  pieceShape: 'circle' | 'square' | 'triangle' | 'diamond' | 'star';
  skill: Skill;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
}

export interface PlayerState {
  playerId: string;
  position: { x: number; y: number };
  resources: number;
  hp: number;
  ownedCells: number;
  skipTurn: boolean;
  damageDealt: number;
  damageTaken: number;
  resourcesGained: number;
}

export interface Alliance {
  id: string;
  playerIds: [string, string];
  turnLeft: number;
}

export type GamePhase = 'roll' | 'move' | 'action' | 'end';
export type GameStatus = 'waiting' | 'playing' | 'ended';

export type GameLogAction =
  | 'move'
  | 'occupy'
  | 'steal'
  | 'ally'
  | 'betray'
  | 'trap'
  | 'skill';

export interface GameLog {
  id: string;
  turn: number;
  playerId: string;
  action: GameLogAction;
  data: any;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  currentTurn: number;
  currentPlayerId: string;
  map: MapCell[][];
  players: PlayerState[];
  phase: GamePhase;
  status: GameStatus;
  alliances: Alliance[];
  logs: GameLog[];
  diceValue: number | null;
  movesRemaining: number;
  winnerId: string | null;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  currentPlayers: Player[];
  status: GameStatus;
  password?: string;
  hasPassword: boolean;
  createdAt: number;
  inviteCode: string;
}

export type ChatMessageType = 'text' | 'emoji' | 'tactic' | 'system';

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  content: string;
  type: ChatMessageType;
  timestamp: number;
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  avatar: string;
  color: string;
  wins: number;
  losses: number;
  winRate: number;
  winStreak: number;
  seasonPoints: number;
  rank: number;
}

export type PieceShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'star';

export const PIECE_COLORS = [
  '#00f0ff',
  '#b026ff',
  '#ff2e8a',
  '#ffb347',
  '#39ff14',
  '#ff6b35',
];

export const PIECE_SHAPES: PieceShape[] = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'star',
];

export const TITLES = [
  '新手冒险者',
  '领地守护者',
  '资源掠夺者',
  '合纵连横者',
  '背刺之王',
  '不败传说',
  '午休战神',
  '策略大师',
];

export const TACTIC_PHRASES = [
  '集合进攻！',
  '防守据点',
  '速推资源点',
  '小心有陷阱',
  '结盟吗？',
  '别信他！',
  '我来殿后',
  '绕后偷袭',
  '稳住发育',
  '一波带走！',
];

export const EMOJIS = ['😀', '😂', '🔥', '💀', '👍', '👎', '🤝', '⚔️', '🛡️', '💎', '🎲', '🚀'];
