import type {
  Room,
  Player,
  Skill,
  LeaderboardEntry,
  ChatMessage,
  MapCell,
  GameState,
  PlayerState,
} from '@/types';
import { PIECE_COLORS } from '@/types';

const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🦄', '🐙', '🦅', '🐲', '🦖'];
const NAMES = ['影狐', '墨竹', '星尘', '破晓', '流云', '寒霜', '烈焰', '惊雷', '疾风', '暗夜'];

export const SKILLS_PRESET: Skill[] = [
  {
    id: 'skill_speed',
    name: '疾风步',
    description: '获得额外 3 点移动力，可跨越障碍',
    cooldown: 3,
    currentCooldown: 0,
    type: 'move',
    icon: '💨',
  },
  {
    id: 'skill_strike',
    name: '雷霆一击',
    description: '下次攻击伤害提升 50%，无视防御',
    cooldown: 4,
    currentCooldown: 0,
    type: 'attack',
    icon: '⚡',
  },
  {
    id: 'skill_shield',
    name: '能量护盾',
    description: '恢复 30 点生命值，本回合免疫陷阱',
    cooldown: 4,
    currentCooldown: 0,
    type: 'defense',
    icon: '🛡️',
  },
  {
    id: 'skill_gather',
    name: '资源汲取',
    description: '立即获得 30 点资源，并标记最近资源点',
    cooldown: 3,
    currentCooldown: 0,
    type: 'resource',
    icon: '💎',
  },
  {
    id: 'skill_teleport',
    name: '空间跳跃',
    description: '传送到任意已占领的格子',
    cooldown: 5,
    currentCooldown: 0,
    type: 'move',
    icon: '🌀',
  },
  {
    id: 'skill_poison',
    name: '剧毒迷雾',
    description: '在当前位置放置陷阱，触发造成 25 伤害',
    cooldown: 4,
    currentCooldown: 0,
    type: 'attack',
    icon: '☠️',
  },
];

function generatePlayer(idx: number, isHost = false): Player {
  return {
    id: 'player_' + Math.random().toString(36).slice(2, 9),
    name: NAMES[idx % NAMES.length] + (idx >= NAMES.length ? idx : ''),
    avatar: AVATARS[idx % AVATARS.length],
    color: PIECE_COLORS[idx % PIECE_COLORS.length],
    title: idx < 3 ? ['领地守护者', '资源掠夺者', '策略大师'][idx] : undefined,
    pieceShape: (['circle', 'square', 'triangle', 'diamond', 'star'] as const)[idx % 5],
    skill: { ...SKILLS_PRESET[idx % SKILLS_PRESET.length] },
    isReady: idx === 0,
    isConnected: true,
    isHost,
  };
}

export function generateMockRooms(): Room[] {
  return [
    {
      id: 'room_1',
      name: '午休欢乐局',
      hostId: 'player_1',
      maxPlayers: 4,
      currentPlayers: [generatePlayer(0, true), generatePlayer(1), generatePlayer(2)],
      status: 'waiting',
      hasPassword: false,
      createdAt: Date.now() - 300000,
      inviteCode: 'ABC123',
    },
    {
      id: 'room_2',
      name: '策略高手场',
      hostId: 'player_4',
      maxPlayers: 6,
      currentPlayers: [generatePlayer(3, true), generatePlayer(4)],
      status: 'waiting',
      hasPassword: true,
      createdAt: Date.now() - 600000,
      inviteCode: 'STR456',
    },
    {
      id: 'room_3',
      name: '新人友好局',
      hostId: 'player_6',
      maxPlayers: 2,
      currentPlayers: [generatePlayer(5, true)],
      status: 'waiting',
      hasPassword: false,
      createdAt: Date.now() - 120000,
      inviteCode: 'NEW789',
    },
    {
      id: 'room_4',
      name: '激战进行中',
      hostId: 'player_8',
      maxPlayers: 6,
      currentPlayers: [generatePlayer(6, true), generatePlayer(7), generatePlayer(8), generatePlayer(9)],
      status: 'playing',
      hasPassword: false,
      createdAt: Date.now() - 900000,
      inviteCode: 'BATTLE1',
    },
  ];
}

export function generateMockLeaderboard(): LeaderboardEntry[] {
  const data: LeaderboardEntry[] = [];
  for (let i = 0; i < 20; i++) {
    const wins = Math.floor(Math.random() * 100) + 10;
    const losses = Math.floor(Math.random() * 80) + 5;
    data.push({
      playerId: 'player_' + i,
      name: NAMES[i % NAMES.length] + (i >= NAMES.length ? i : ''),
      avatar: AVATARS[i % AVATARS.length],
      color: PIECE_COLORS[i % PIECE_COLORS.length],
      wins,
      losses,
      winRate: +(wins / (wins + losses)).toFixed(3),
      winStreak: Math.floor(Math.random() * 15),
      seasonPoints: Math.floor(Math.random() * 2000) + 200,
      rank: i + 1,
    });
  }
  return data;
}

const MAP_SIZE = 7;

export function generateInitialMap(): MapCell[][] {
  const map: MapCell[][] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    const row: MapCell[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const rand = Math.random();
      let type: MapCell['type'] = 'normal';
      if (rand < 0.12) type = 'resource';
      else if (rand < 0.2) type = 'trap';
      row.push({
        x,
        y,
        type,
        ownerId: null,
        resourceAmount: type === 'resource' ? Math.floor(Math.random() * 30) + 20 : 0,
        isTrapActive: type === 'trap',
      });
    }
    map.push(row);
  }
  map[0][0] = { x: 0, y: 0, type: 'base', ownerId: null, resourceAmount: 0, isTrapActive: false };
  map[MAP_SIZE - 1][MAP_SIZE - 1] = {
    x: MAP_SIZE - 1,
    y: MAP_SIZE - 1,
    type: 'base',
    ownerId: null,
    resourceAmount: 0,
    isTrapActive: false,
  };
  if (MAP_SIZE >= 6) {
    map[0][MAP_SIZE - 1] = { x: MAP_SIZE - 1, y: 0, type: 'base', ownerId: null, resourceAmount: 0, isTrapActive: false };
    map[MAP_SIZE - 1][0] = { x: 0, y: MAP_SIZE - 1, type: 'base', ownerId: null, resourceAmount: 0, isTrapActive: false };
  }
  return map;
}

export function generateMockGameState(room: Room): GameState {
  const players: PlayerState[] = room.currentPlayers.map((p, i) => {
    const positions = [
      { x: 0, y: 0 },
      { x: MAP_SIZE - 1, y: MAP_SIZE - 1 },
      { x: MAP_SIZE - 1, y: 0 },
      { x: 0, y: MAP_SIZE - 1 },
      { x: Math.floor(MAP_SIZE / 2), y: 0 },
      { x: Math.floor(MAP_SIZE / 2), y: MAP_SIZE - 1 },
    ];
    return {
      playerId: p.id,
      position: positions[i % positions.length],
      resources: 50,
      hp: 100,
      ownedCells: 0,
      skipTurn: false,
      damageDealt: 0,
      damageTaken: 0,
      resourcesGained: 0,
    };
  });
  const initialMap = generateInitialMap();
  const initialPlayers = players.map((p) => ({ ...p, position: { ...p.position } }));
  const map = initialMap.map((row) => row.map((c) => ({ ...c })));
  players.forEach((p, i) => {
    const { x, y } = p.position;
    if (map[y] && map[y][x]) {
      map[y][x].ownerId = p.playerId;
    }
  });
  const playersWithOwned = players.map((p) => ({
    ...p,
    ownedCells: map.flat().filter((c) => c.ownerId === p.playerId).length,
  }));
  return {
    roomId: room.id,
    currentTurn: 1,
    currentPlayerId: room.currentPlayers[0]?.id || '',
    map,
    players: playersWithOwned,
    phase: 'roll',
    status: 'playing',
    alliances: [],
    logs: [],
    diceValue: null,
    movesRemaining: 0,
    winnerId: null,
    initialMap,
    initialPlayers,
    markedLogIds: [],
  };
}

export function generateMockChatMessages(players: Player[]): ChatMessage[] {
  return [
    {
      id: 'msg_1',
      playerId: players[0]?.id || 'sys',
      playerName: players[0]?.name || '系统',
      playerColor: players[0]?.color || '#00f0ff',
      content: '欢迎来到领地战棋！占领格子、抢夺资源、合纵连横！',
      type: 'system',
      timestamp: Date.now() - 60000,
    },
    {
      id: 'msg_2',
      playerId: players[1]?.id || 'p2',
      playerName: players[1]?.name || '玩家2',
      playerColor: players[1]?.color || '#b026ff',
      content: '大家好呀～ 请多指教！',
      type: 'text',
      timestamp: Date.now() - 50000,
    },
    {
      id: 'msg_3',
      playerId: players[2]?.id || 'p3',
      playerName: players[2]?.name || '玩家3',
      playerColor: players[2]?.color || '#ff2e8a',
      content: '🔥',
      type: 'emoji',
      timestamp: Date.now() - 40000,
    },
    {
      id: 'msg_4',
      playerId: players[0]?.id || 'p1',
      playerName: players[0]?.name || '玩家1',
      playerColor: players[0]?.color || '#00f0ff',
      content: '集合进攻！',
      type: 'tactic',
      timestamp: Date.now() - 30000,
    },
  ];
}
