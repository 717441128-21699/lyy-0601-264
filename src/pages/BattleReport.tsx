import { useState, useEffect, useMemo } from 'react';
import {
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Swords,
  TrendingUp,
  Filter,
  Move,
  Flag,
  Handshake,
  Skull,
  Zap,
  Users,
  UserX,
  Gem,
  Target,
} from 'lucide-react';
import { useGameStore, useRoomStore } from '@/store';
import { cn } from '@/lib/utils';
import type { GameLogAction, Player, GameLog } from '@/types';

const ACTION_CONFIG: Record<GameLogAction, { label: string; color: string; Icon: any; glow: string; shadow: string }> = {
  move: { label: '移动', color: 'text-neon-cyan', Icon: Move, glow: 'shadow-neon-cyan', shadow: '#00f0ff' },
  occupy: { label: '占领', color: 'text-neon-purple', Icon: Flag, glow: 'shadow-neon-purple', shadow: '#b026ff' },
  steal: { label: '抢夺', color: 'text-neon-red', Icon: Target, glow: 'shadow-neon-red', shadow: '#ff2e63' },
  ally: { label: '结盟', color: 'text-neon-green', Icon: Handshake, glow: 'shadow-neon-green', shadow: '#39ff14' },
  betray: { label: '背叛', color: 'text-neon-pink', Icon: UserX, glow: 'shadow-neon-purple', shadow: '#ff2e8a' },
  trap: { label: '陷阱', color: 'text-neon-red', Icon: Skull, glow: 'shadow-neon-red', shadow: '#ff2e63' },
  skill: { label: '技能', color: 'text-neon-gold', Icon: Zap, glow: 'shadow-neon-gold', shadow: '#ffb347' },
};

export default function BattleReport() {
  const { gameState } = useGameStore();
  const { currentRoom } = useRoomStore();
  const [replayIdx, setReplayIdx] = useState(-1);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [filterPlayers, setFilterPlayers] = useState<string[]>([]);
  const [filterActions, setFilterActions] = useState<GameLogAction[]>([]);

  const logs = gameState?.logs || [];
  const players = currentRoom?.currentPlayers || [];
  const playerStates = gameState?.players || [];

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => a.turn - b.turn || a.timestamp - b.timestamp),
    [logs]
  );

  const filteredLogs = useMemo(
    () =>
      sortedLogs.filter(
        (l) =>
          (!filterPlayers.length || filterPlayers.includes(l.playerId)) &&
          (!filterActions.length || filterActions.includes(l.action))
      ),
    [sortedLogs, filterPlayers, filterActions]
  );

  useEffect(() => {
    if (!isAutoPlay) return;
    if (replayIdx >= filteredLogs.length - 1) {
      setIsAutoPlay(false);
      return;
    }
    const t = setTimeout(() => setReplayIdx((i) => i + 1), 1200);
    return () => clearTimeout(t);
  }, [isAutoPlay, replayIdx, filteredLogs.length]);

  useEffect(() => {
    setReplayIdx(filteredLogs.length - 1);
  }, [filteredLogs.length]);

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const formatDetail = (log: GameLog) => {
    const p = (id: string) => getPlayer(id)?.name || '玩家';
    switch (log.action) {
      case 'move': return `移动到 (${log.data?.x}, ${log.data?.y})`;
      case 'occupy': return `占领 (${log.data?.x}, ${log.data?.y})${log.data?.wasEnemy ? '（敌方）' : ''}`;
      case 'steal': return `${log.data?.success ? '成功抢夺' : '抢夺失败'} (${log.data?.x}, ${log.data?.y})`;
      case 'ally': return `与 ${p(log.data?.targetId)} 结盟`;
      case 'betray': return `背叛 ${p(log.data?.targetId)}，+${log.data?.bonus}资源`;
      case 'trap': return `触发陷阱，-${log.data?.lost}资源`;
      case 'skill': return `使用「${log.data?.skillName || '技能'}」`;
      default: return '';
    }
  };

  const toggle = <T,>(arr: T[], set: (v: T[]) => void, val: T) =>
    set(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  const maxDmg = Math.max(1, ...playerStates.map((p) => Math.max(p.damageDealt, p.damageTaken)));
  const maxRes = Math.max(1, ...playerStates.map((p) => Math.max(p.resourcesGained, p.ownedCells)));

  const Bar = ({ pct, color, shadow }: { pct: number; color: string; shadow: string }) => (
    <div className="h-2 rounded-full bg-midnight-900/80 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${shadow}` }} />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-purple/30 to-neon-cyan/30 border border-neon-purple/50 flex items-center justify-center shadow-neon-purple">
            <History className="w-6 h-6 text-neon-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold heading-glow">战报分析</h1>
            <p className="text-xs text-slate-400 mt-0.5">回合 {gameState?.currentTurn || 1} · {filteredLogs.length} 条记录</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setReplayIdx(Math.max(0, replayIdx - 1))} disabled={replayIdx <= 0} className="btn-neon !px-3 !py-2">
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={() => setIsAutoPlay(!isAutoPlay)} className={cn(isAutoPlay ? 'btn-neon-red' : 'btn-neon-gold', '!px-3 !py-2')}>
            {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={() => setReplayIdx(Math.min(filteredLogs.length - 1, replayIdx + 1))} disabled={replayIdx >= filteredLogs.length - 1} className="btn-neon !px-3 !py-2">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card neon-border p-4 clip-corner">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm font-display text-neon-cyan">筛选条件</span>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggle(filterPlayers, setFilterPlayers, p.id)}
                    className={cn('chip border transition-all', filterPlayers.includes(p.id) ? 'bg-white/10' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30')}
                    style={filterPlayers.includes(p.id) ? { borderColor: p.color, color: p.color, boxShadow: `0 0 10px ${p.color}40` } : undefined}
                  >
                    <span>{p.avatar}</span>
                    <span className="text-xs">{p.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ACTION_CONFIG) as GameLogAction[]).map((a) => {
                  const cfg = ACTION_CONFIG[a];
                  const active = filterActions.includes(a);
                  return (
                    <button key={a} onClick={() => toggle(filterActions, setFilterActions, a)} className={cn('chip border transition-all text-xs', active ? `bg-white/10 ${cfg.color}` : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30')}>
                      <cfg.Icon className="w-3 h-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="glass-card neon-border-purple p-5 clip-corner max-h-[520px] overflow-y-auto scrollbar-thin">
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-neon-cyan via-neon-purple to-neon-pink opacity-60" />
              {filteredLogs.length === 0 && <div className="text-center text-slate-500 py-10">暂无战报记录</div>}
              {filteredLogs.map((log, idx) => {
                const cfg = ACTION_CONFIG[log.action];
                const player = getPlayer(log.playerId);
                const active = idx === replayIdx;
                const Icon = cfg.Icon;
                return (
                  <div key={log.id} onClick={() => setReplayIdx(idx)} className={cn('relative mb-4 cursor-pointer transition-all duration-300', active && 'scale-[1.02]')}>
                    <div
                      className={cn('absolute -left-[18px] top-1 w-4 h-4 rounded-full border-2 bg-midnight-900 flex items-center justify-center transition-all duration-300', active && cfg.glow, active ? 'border-opaque animate-pulse' : 'border-white/30')}
                      style={active ? { borderColor: player?.color, boxShadow: `0 0 12px ${player?.color}` } : undefined}
                    >
                      {active && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: player?.color }} />}
                    </div>
                    <div className={cn('rounded-lg border p-3 transition-all duration-300', active ? 'bg-midnight-700/80 border-neon-cyan/60 shadow-neon-cyan' : 'bg-midnight-800/40 border-white/10 hover:border-white/20')}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="chip bg-neon-purple/20 text-neon-purple border border-neon-purple/40 text-[10px]">回合 {log.turn}</span>
                        <span className="chip bg-white/5 text-slate-300 border border-white/10 text-[10px]">{new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-sm" style={{ color: player?.color }}>{player?.avatar} {player?.name || '未知'}</span>
                          <span className={cn('flex items-center gap-1 text-xs', cfg.color)}><Icon className="w-3 h-3" />{cfg.label}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mt-2 pl-1">{formatDetail(log)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-card neon-border p-5 clip-corner">
            <div className="flex items-center gap-2 mb-4">
              <Swords className="w-4 h-4 text-neon-red" />
              <h3 className="text-sm font-display tracking-widest text-neon-red text-shadow-neon-red">伤害统计</h3>
            </div>
            <div className="space-y-4">
              {playerStates.map((ps) => {
                const p = getPlayer(ps.playerId);
                return (
                  <div key={ps.playerId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm" style={{ color: p?.color }}>{p?.avatar} {p?.name || '玩家'}</span>
                      <span className="text-xs text-slate-400">
                        <span className="text-neon-red font-bold">{ps.damageDealt}</span>
                        <span className="mx-1">/</span>
                        <span className="text-neon-cyan font-bold">{ps.damageTaken}</span>
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Bar pct={(ps.damageDealt / maxDmg) * 100} color="linear-gradient(to right, #ff2e63, #ff2e8a)" shadow="#ff2e63" />
                      <Bar pct={(ps.damageTaken / maxDmg) * 100} color="linear-gradient(to right, #00f0ff, #b026ff)" shadow="#00f0ff" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>造成伤害</span>
                      <span>受到伤害</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card neon-border-purple p-5 clip-corner">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-neon-gold" />
              <h3 className="text-sm font-display tracking-widest text-neon-gold text-shadow-neon-gold">收益统计</h3>
            </div>
            <div className="space-y-3">
              {playerStates.map((ps) => {
                const p = getPlayer(ps.playerId);
                return (
                  <div key={ps.playerId} className="p-3 rounded-lg border border-white/5 bg-midnight-900/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm" style={{ color: p?.color }}>{p?.avatar} {p?.name || '玩家'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Gem className="w-3 h-3 text-neon-gold" />
                          <span className="text-[10px] text-slate-400">获取资源</span>
                        </div>
                        <div className="text-lg font-display font-bold text-neon-gold text-shadow-neon-gold">{ps.resourcesGained}</div>
                        <Bar pct={(ps.resourcesGained / maxRes) * 100} color="#ffb347" shadow="#ffb347" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Flag className="w-3 h-3 text-neon-purple" />
                          <span className="text-[10px] text-slate-400">占领格子</span>
                        </div>
                        <div className="text-lg font-display font-bold text-neon-purple text-shadow-neon-purple">{ps.ownedCells}</div>
                        <Bar pct={(ps.ownedCells / maxRes) * 100} color="#b026ff" shadow="#b026ff" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card neon-border p-4 clip-corner">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-neon-cyan" />
              <h3 className="text-sm font-display tracking-widest text-neon-cyan">操作图例</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ACTION_CONFIG) as GameLogAction[]).map((a) => {
                const cfg = ACTION_CONFIG[a];
                const Icon = cfg.Icon;
                return (
                  <div key={a} className="flex items-center gap-2 text-xs">
                    <div className={cn('w-6 h-6 rounded-md bg-midnight-800/60 border flex items-center justify-center', cfg.color)} style={{ borderColor: 'currentColor' }}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={cfg.color}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
