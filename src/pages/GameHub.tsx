import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, Swords, MessageSquare, BarChart3, ArrowLeft, Trophy, Users } from 'lucide-react';
import { useGameStore, useRoomStore } from '@/store';
import GameMap from './GameMap';
import GameTurn from './GameTurn';
import GameChat from './GameChat';
import BattleReport from './BattleReport';

type GameTab = 'map' | 'turn' | 'chat' | 'report';

const TABS: { key: GameTab; label: string; icon: any }[] = [
  { key: 'map', label: '地图', icon: Map },
  { key: 'turn', label: '回合', icon: Swords },
  { key: 'chat', label: '聊天', icon: MessageSquare },
  { key: 'report', label: '战报', icon: BarChart3 },
];

export default function GameHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState, initGame } = useGameStore();
  const { currentRoom } = useRoomStore();

  const getTabFromPath = (): GameTab => {
    if (location.pathname.includes('/turn')) return 'turn';
    if (location.pathname.includes('/chat')) return 'chat';
    if (location.pathname.includes('/report')) return 'report';
    return 'map';
  };

  const [activeTab, setActiveTab] = useState<GameTab>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    if (!gameState && currentRoom) {
      initGame(currentRoom);
    }
  }, [gameState, currentRoom, initGame]);

  const handleTabChange = (tab: GameTab) => {
    setActiveTab(tab);
    navigate(`/game/${tab === 'map' ? 'map' : tab}`);
  };

  if (!gameState) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-slate-400">暂无进行中的游戏</div>
        <button onClick={() => navigate('/')} className="btn-neon flex items-center gap-2">
          <ArrowLeft size={16} />
          返回大厅
        </button>
      </div>
    );
  }

  const winner = gameState.winnerId
    ? currentRoom?.currentPlayers.find((p) => p.id === gameState.winnerId)
    : null;

  return (
    <div className="min-h-[calc(100vh-10rem)]">
      {winner && (
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-neon-gold/20 via-neon-cyan/10 to-neon-purple/20 border border-neon-gold/40 text-center animate-fade-in">
          <Trophy className="w-12 h-12 mx-auto text-neon-gold mb-2 animate-glow" />
          <h2 className="text-2xl font-display font-bold heading-glow mb-1">游戏结束！</h2>
          <p className="text-lg" style={{ color: winner.color }}>
            🏆 {winner.avatar} {winner.name} 获得胜利！
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={() => navigate('/')} className="btn-neon flex items-center gap-2">
              <ArrowLeft size={16} />
              返回大厅
            </button>
            <button onClick={() => navigate('/leaderboard')} className="btn-neon-gold flex items-center gap-2">
              <Trophy size={16} />
              查看排行榜
            </button>
          </div>
        </div>
      )}

      <div className="hidden xl:grid xl:grid-cols-[1fr_auto_1fr] gap-5">
        <div className="glass-card neon-border p-4 overflow-hidden">
          <h3 className="text-sm font-display text-neon-cyan mb-3 flex items-center gap-2">
            <Map size={16} /> 战场地图
          </h3>
          <GameMap compact />
        </div>

        <div className="w-80 space-y-5">
          <div className="glass-card neon-border-purple p-4">
            <h3 className="text-sm font-display text-neon-purple mb-3 flex items-center gap-2">
              <Swords size={16} /> 回合操作
            </h3>
            <GameTurn compact />
          </div>

          <div className="glass-card neon-border p-4">
            <h3 className="text-sm font-display text-neon-cyan mb-3 flex items-center gap-2">
              <Users size={16} /> 玩家状态
            </h3>
            <div className="space-y-2">
              {currentRoom?.currentPlayers.map((p) => {
                const ps = gameState.players.find((s) => s.playerId === p.id);
                const isCurrent = gameState.currentPlayerId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-lg flex items-center gap-2 transition-all ${
                      isCurrent
                        ? 'bg-neon-cyan/10 border border-neon-cyan/40 animate-pulse-slow'
                        : 'bg-white/3'
                    }`}
                  >
                    <span className="text-xl">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: p.color }}>
                        {p.name}
                      </div>
                      <div className="flex gap-2 text-[10px] text-slate-400">
                        <span>💎 {ps?.resources ?? 0}</span>
                        <span>❤ {ps?.hp ?? 0}</span>
                        <span>🏰 {ps?.ownedCells ?? 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass-card neon-border-purple p-4 flex flex-col min-h-[600px]">
          <h3 className="text-sm font-display text-neon-purple mb-3 flex items-center gap-2">
            <MessageSquare size={16} /> 战场聊天
          </h3>
          <GameChat compact />
        </div>
      </div>

      <div className="xl:hidden">
        <div className="glass-card neon-border p-2 mb-4 flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display transition-all whitespace-nowrap ${
                activeTab === key
                  ? 'bg-neon-cyan/15 border border-neon-cyan text-neon-cyan shadow-neon-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">
          {activeTab === 'map' && <GameMap />}
          {activeTab === 'turn' && <GameTurn />}
          {activeTab === 'chat' && <GameChat />}
          {activeTab === 'report' && <BattleReport />}
        </div>
      </div>
    </div>
  );
}
