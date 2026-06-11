import { useState, useEffect } from 'react';
import { useGameStore, useRoomStore } from '@/store';
import type { MapCell, CellType, PieceShape, PlayerState, Player } from '@/types';

const CELL_TYPE_CONFIG: Record<CellType, { label: string; icon: string; color: string; bg: string }> = {
  normal: { label: '普通', icon: '◻', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.03)' },
  resource: { label: '资源', icon: '💎', color: '#ffb347', bg: 'rgba(255,179,71,0.12)' },
  trap: { label: '陷阱', icon: '⚠', color: '#ff2e63', bg: 'rgba(255,46,99,0.10)' },
  base: { label: '基地', icon: '⌂', color: '#39ff14', bg: 'rgba(57,255,20,0.12)' },
};

function getPlayerColorMap(players: Player[]): Record<string, string> {
  const map: Record<string, string> = {};
  players.forEach((p) => {
    map[p.id] = p.color;
  });
  return map;
}

function PieceShape({ shape, color, size = 28 }: { shape: PieceShape; color: string; size?: number }) {
  const half = size / 2;
  const glowStyle = { filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}80)` };

  if (shape === 'circle') {
    return (
      <svg width={size} height={size} style={glowStyle}>
        <circle cx={half} cy={half} r={half - 3} fill={color} stroke="#fff" strokeWidth="1.5" />
      </svg>
    );
  }
  if (shape === 'square') {
    return (
      <svg width={size} height={size} style={glowStyle}>
        <rect x="3" y="3" width={size - 6} height={size - 6} rx="3" fill={color} stroke="#fff" strokeWidth="1.5" />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg width={size} height={size} style={glowStyle}>
        <polygon points={`${half},3 ${size - 3},${size - 3} 3,${size - 3}`} fill={color} stroke="#fff" strokeWidth="1.5" />
      </svg>
    );
  }
  if (shape === 'diamond') {
    return (
      <svg width={size} height={size} style={glowStyle}>
        <polygon points={`${half},3 ${size - 3},${half} ${half},${size - 3} 3,${half}`} fill={color} stroke="#fff" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={glowStyle}>
      <polygon
        points="12,2 15,9 22,9.5 16.5,14.5 18.5,22 12,17.5 5.5,22 7.5,14.5 2,9.5 9,9"
        fill={color}
        stroke="#fff"
        strokeWidth="1"
      />
    </svg>
  );
}

interface RippleState {
  x: number;
  y: number;
  key: number;
}

export default function GameMap({ compact = false }: { compact?: boolean }) {
  const { gameState } = useGameStore();
  const { currentRoom } = useRoomStore();
  const [highlight, setHighlight] = useState<{ x: number; y: number } | null>(null);
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const [rippleKey, setRippleKey] = useState(0);

  const map = gameState?.map || [];
  const playerStates: PlayerState[] = gameState?.players || [];
  const roomPlayers: Player[] = currentRoom?.currentPlayers || [];
  const playerColorMap = getPlayerColorMap(roomPlayers);

  const handleCellClick = (cell: MapCell) => {
    setHighlight({ x: cell.x, y: cell.y });
    const newKey = rippleKey + 1;
    setRippleKey(newKey);
    setRipples((prev) => [...prev, { x: cell.x, y: cell.y, key: newKey }]);
  };

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  if (map.length === 0) {
    return (
      <div className="glass-card neon-border p-8 text-center">
        <p className="text-slate-400">暂无地图数据</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="glass-card neon-border p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold heading-glow">战场地图</h2>
            <div className="text-xs text-slate-400 font-mono">
              回合 {gameState?.currentTurn || 1} · {map.length}×{map.length}
            </div>
          </div>

          <div
            className="grid gap-1.5 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${map.length}, minmax(0, 1fr))`,
              maxWidth: 560,
            }}
          >
            {map.map((row, y) =>
              row.map((cell, x) => {
                const cfg = CELL_TYPE_CONFIG[cell.type];
                const ownerColor = cell.ownerId ? playerColorMap[cell.ownerId] : null;
                const cellPlayers = playerStates.filter((p) => p.position.x === x && p.position.y === y);
                const isHighlight = highlight?.x === x && highlight?.y === y;
                const cellRipples = ripples.filter((r) => r.x === x && r.y === y);

                return (
                  <div
                    key={`${x}-${y}`}
                    className="grid-cell group relative overflow-hidden"
                    style={{
                      background: ownerColor
                        ? `linear-gradient(135deg, ${ownerColor}25 0%, ${cfg.bg} 100%)`
                        : cfg.bg,
                      borderColor: ownerColor ? `${ownerColor}60` : isHighlight ? '#00f0ff' : 'rgba(255,255,255,0.08)',
                      boxShadow: ownerColor
                        ? `0 0 8px ${ownerColor}40, inset 0 0 8px ${ownerColor}20`
                        : isHighlight
                        ? '0 0 12px rgba(0,240,255,0.5), inset 0 0 8px rgba(0,240,255,0.2)'
                        : 'none',
                    }}
                    onClick={() => handleCellClick(cell)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-lg opacity-60 select-none pointer-events-none">
                      {cfg.icon}
                    </div>

                    {cell.type === 'resource' && cell.resourceAmount > 0 && (
                      <div className="absolute top-0.5 right-1 text-[10px] font-mono text-neon-gold">
                        {cell.resourceAmount}
                      </div>
                    )}

                    {cell.type === 'trap' && !cell.isTrapActive && (
                      <div className="absolute top-0.5 right-1 text-[10px] text-slate-500">×</div>
                    )}

                    {ownerColor && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ background: `linear-gradient(90deg, ${ownerColor}, transparent)`, boxShadow: `0 0 6px ${ownerColor}` }}
                      />
                    )}

                    {cellPlayers.length > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center animate-float">
                        {cellPlayers.map((ps, i) => {
                          const info = roomPlayers.find((rp) => rp.id === ps.playerId);
                          if (!info) return null;
                          return (
                            <div key={ps.playerId} style={{ marginLeft: i > 0 ? -6 : 0 }}>
                              <PieceShape shape={info.pieceShape} color={info.color} size={26} />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {cellRipples.map((r) => (
                      <div
                        key={r.key}
                        className="absolute inset-0 rounded-md border-2 border-neon-cyan animate-ripple pointer-events-none"
                      />
                    ))}

                    <div className="absolute bottom-0.5 left-1 text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {x},{y}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-white/5">
            <div className="text-xs font-display text-neon-cyan/80 mb-2 tracking-wider">图例说明</div>
            <div className="flex flex-wrap gap-3">
              {(['normal', 'resource', 'trap', 'base'] as CellType[]).map((t) => {
                const cfg = CELL_TYPE_CONFIG[t];
                return (
                  <div key={t} className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-sm border"
                      style={{ background: cfg.bg, borderColor: `${cfg.color}40`, color: cfg.color }}
                    >
                      {cfg.icon}
                    </div>
                    <span className="text-xs text-slate-300">{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:w-72 space-y-4">
        <div className="glass-card neon-border-purple p-4">
          <h3 className="font-display text-sm font-bold text-neon-purple text-shadow-neon-purple mb-3 tracking-wider">
            玩家状态
          </h3>
          <div className="space-y-3">
            {roomPlayers.map((rp) => {
              const ps = playerStates.find((p) => p.playerId === rp.id) || {
                resources: 0,
                hp: 100,
                ownedCells: 0,
              };
              const isCurrent = gameState?.currentPlayerId === rp.id;
              return (
                <div
                  key={rp.id}
                  className="p-2.5 rounded-lg transition-all duration-300"
                  style={{
                    background: isCurrent ? `${rp.color}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isCurrent ? `${rp.color}60` : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isCurrent ? `0 0 12px ${rp.color}30` : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg border-2"
                      style={{ borderColor: rp.color, background: `${rp.color}20`, boxShadow: `0 0 8px ${rp.color}60` }}
                    >
                      {rp.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate">{rp.name}</span>
                        <PieceShape shape={rp.pieceShape} color={rp.color} size={14} />
                      </div>
                      {rp.title && <div className="text-[10px] text-slate-400 truncate">{rp.title}</div>}
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono animate-pulse" style={{ background: `${rp.color}30`, color: rp.color }}>
                        当前
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-midnight-900/60 rounded py-1">
                      <div className="text-[10px] text-slate-400">资源</div>
                      <div className="text-sm font-mono text-neon-gold">{ps.resources}</div>
                    </div>
                    <div className="bg-midnight-900/60 rounded py-1">
                      <div className="text-[10px] text-slate-400">HP</div>
                      <div className="text-sm font-mono text-neon-green">{ps.hp}</div>
                    </div>
                    <div className="bg-midnight-900/60 rounded py-1">
                      <div className="text-[10px] text-slate-400">占领</div>
                      <div className="text-sm font-mono text-neon-cyan">{ps.ownedCells}</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1 bg-midnight-900 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, ps.hp))}%`, background: `linear-gradient(90deg, ${rp.color}, ${rp.color}80)`, boxShadow: `0 0 6px ${rp.color}` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
