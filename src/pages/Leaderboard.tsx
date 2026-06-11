import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Search,
  RotateCcw,
  PlayCircle,
  HelpCircle,
  TrendingUp,
  Flame,
  Star,
} from 'lucide-react';
import { useLeaderboardStore, useGameStore, useGuideStore } from '@/store';

const PODIUM_COLORS = [
  { glow: 'shadow-neon-gold', border: 'border-neon-gold', text: 'text-neon-gold', bg: 'bg-neon-gold/20', height: 'h-40' },
  { glow: 'shadow-[0_0_5px_#c0c0c0,0_0_20px_rgba(192,192,192,0.3)]', border: 'border-[#c0c0c0]', text: 'text-[#c0c0c0]', bg: 'bg-[#c0c0c0]/20', height: 'h-28' },
  { glow: 'shadow-[0_0_5px_#cd7f32,0_0_20px_rgba(205,127,50,0.3)]', border: 'border-[#cd7f32]', text: 'text-[#cd7f32]', bg: 'bg-[#cd7f32]/20', height: 'h-20' },
];

const TAB_CONFIG = [
  { key: 'winRate' as const, label: '胜率', icon: TrendingUp },
  { key: 'winStreak' as const, label: '连胜', icon: Flame },
  { key: 'seasonPoints' as const, label: '赛季积分', icon: Star },
];

export default function Leaderboard() {
  const navigate = useNavigate();
  const { entries, sortBy, fetchLeaderboard, setSortBy, isLoading } = useLeaderboardStore();
  const { gameState, restoreGame } = useGameStore();
  const { startGuide } = useGuideStore();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const restList = useMemo(() => entries.slice(3), [entries]);

  const filteredList = useMemo(() => {
    if (!searchText.trim()) return restList;
    const keyword = searchText.trim().toLowerCase();
    return restList.filter((e) => e.name.toLowerCase().includes(keyword));
  }, [restList, searchText]);

  const hasSavedGame = useMemo(() => {
    if (gameState && gameState.status === 'playing') return true;
    const saved = localStorage.getItem('lw_gameState');
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved);
      return parsed && parsed.status === 'playing';
    } catch {
      return false;
    }
  }, [gameState]);

  const handleReconnect = () => {
    const saved = localStorage.getItem('lw_gameState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        restoreGame(parsed);
        navigate('/game');
      } catch {
        /* ignore */
      }
    } else if (gameState) {
      navigate('/game');
    }
  };

  return (
    <div className="min-h-screen p-6 container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="text-neon-gold w-9 h-9" />
          <h1 className="heading-glow text-3xl md:text-4xl">赛季排行榜</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {hasSavedGame && (
            <button onClick={handleReconnect} className="btn-neon-gold flex items-center gap-2">
              <RotateCcw size={16} />
              继续游戏
            </button>
          )}
          <button onClick={startGuide} className="btn-neon-purple flex items-center gap-2">
            <HelpCircle size={16} />
            新手引导
          </button>
        </div>
      </div>

      <div className="flex items-end justify-center gap-4 md:gap-8 mb-10">
        {[1, 0, 2].map((orderIdx) => {
          const player = topThree[orderIdx];
          const config = PODIUM_COLORS[orderIdx];
          const rankNum = orderIdx + 1;
          if (!player) {
            return (
              <div key={orderIdx} className={`${config.height} w-24 md:w-32`} />
            );
          }
          return (
            <div
              key={player.playerId}
              className="flex flex-col items-center animate-fade-in"
              style={{ animationDelay: `${orderIdx * 100}ms` }}
            >
              <div
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl mb-2 border-2 ${config.border} ${config.bg} ${config.glow} animate-float`}
                style={{ boxShadow: config.glow.includes('shadow-neon') ? undefined : undefined }}
              >
                {player.avatar}
              </div>
              <div className={`text-sm md:text-base font-bold ${config.text} mb-1 truncate max-w-20 md:max-w-28 text-center`}>
                {player.name}
              </div>
              <div className={`relative ${config.height} w-24 md:w-32 rounded-t-xl border-2 border-b-0 ${config.border} ${config.bg} flex flex-col items-center justify-end pb-3`}>
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${config.text}`}>
                  {rankNum === 1 ? <Trophy size={32} className="animate-glow" /> : <Medal size={28} />}
                </div>
                <div className="text-xs text-slate-400">
                  {sortBy === 'winRate' && `胜率 ${(player.winRate * 100).toFixed(1)}%`}
                  {sortBy === 'winStreak' && `连胜 ${player.winStreak}`}
                  {sortBy === 'seasonPoints' && `积分 ${player.seasonPoints}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card neon-border p-5 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索玩家名称..."
              className="input-neon pl-11"
            />
          </div>
          <div className="flex gap-2">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const active = sortBy === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSortBy(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-display text-sm tracking-wider uppercase transition-all duration-300 ${
                    active
                      ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan shadow-neon-cyan'
                      : 'bg-midnight-800/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs text-slate-400 font-display uppercase tracking-wider border-b border-white/10">
          <div className="col-span-1">排名</div>
          <div className="col-span-4 md:col-span-3">玩家</div>
          <div className="col-span-4 md:col-span-4">胜率</div>
          <div className="col-span-2 md:col-span-2 text-center">连胜</div>
          <div className="col-span-1 text-right">积分</div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">加载中...</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">暂无匹配的玩家</div>
          ) : (
            filteredList.map((entry, idx) => (
              <div
                key={entry.playerId}
                className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="col-span-1">
                  <span className="font-mono font-bold text-slate-400">#{entry.rank}</span>
                </div>
                <div className="col-span-4 md:col-span-3 flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{
                      backgroundColor: `${entry.color}20`,
                      border: `1px solid ${entry.color}`,
                    }}
                  >
                    {entry.avatar}
                  </div>
                  <span className="text-white font-medium truncate">{entry.name}</span>
                </div>
                <div className="col-span-4 md:col-span-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-midnight-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-500"
                        style={{ width: `${entry.winRate * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-300 w-12 text-right">
                      {(entry.winRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="col-span-2 md:col-span-2 flex items-center justify-center gap-1">
                  {entry.winStreak >= 3 ? (
                    <Flame size={14} className="text-neon-red" />
                  ) : null}
                  <span className={`font-mono font-bold ${entry.winStreak >= 5 ? 'text-neon-red' : entry.winStreak >= 3 ? 'text-neon-gold' : 'text-slate-300'}`}>
                    {entry.winStreak}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <span className="font-mono font-bold text-neon-gold">{entry.seasonPoints}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!hasSavedGame && (
        <div className="mt-6 flex justify-center">
          <button onClick={() => navigate('/lobby')} className="btn-primary flex items-center gap-2">
            <PlayCircle size={20} />
            进入大厅开始游戏
          </button>
        </div>
      )}
    </div>
  );
}
