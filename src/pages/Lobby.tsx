import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Lock,
  Unlock,
  Plus,
  Zap,
  Copy,
  Check,
  Play,
  LogOut,
  Crown,
  RefreshCw,
  X,
  Link,
  ShieldCheck,
} from 'lucide-react';
import { useRoomStore, usePlayerStore } from '@/store';

const STATUS_TEXT: Record<string, string> = {
  waiting: '等待中',
  playing: '进行中',
  ended: '已结束',
};

const STATUS_COLOR: Record<string, string> = {
  waiting: 'text-neon-green',
  playing: 'text-neon-gold',
  ended: 'text-slate-500',
};

export default function Lobby() {
  const navigate = useNavigate();
  const { rooms, currentRoom, fetchRooms, createRoom, joinRoom, leaveRoom, togglePlayerReady, startGame, isLoading } =
    useRoomStore();
  const { currentPlayer, updatePlayer } = usePlayerStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [password, setPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = () => {
    if (!roomName.trim() || !currentPlayer) return;
    createRoom(roomName.trim(), maxPlayers, password.trim() || undefined);
    setShowCreateModal(false);
    setRoomName('');
    setMaxPlayers(4);
    setPassword('');
  };

  const handleJoinRoom = (roomId: string, hasPassword: boolean) => {
    if (!currentPlayer) return;
    if (hasPassword) {
      setShowPasswordModal(roomId);
      return;
    }
    joinRoom(roomId, currentPlayer);
  };

  const handleQuickJoin = () => {
    if (!currentPlayer) return;
    const availableRoom = rooms.find(
      (r) => r.status === 'waiting' && r.currentPlayers.length < r.maxPlayers && !r.hasPassword
    );
    if (availableRoom) {
      joinRoom(availableRoom.id, currentPlayer);
    }
  };

  const handleCopyInvite = () => {
    if (!currentRoom) return;
    const link = `${window.location.origin}/lobby?invite=${currentRoom.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    if (!currentPlayer) return;
    togglePlayerReady(currentPlayer.id);
    updatePlayer({ isReady: !currentPlayer.isReady });
  };

  const handleStartGame = () => {
    if (!currentRoom) return;
    const allReady = currentRoom.currentPlayers.every((p) => p.isReady);
    if (!allReady) return;
    startGame();
    navigate('/game');
  };

  const isHost = currentRoom?.hostId === currentPlayer?.id;
  const allReady = currentRoom?.currentPlayers.every((p) => p.isReady);

  if (currentRoom) {
    return (
      <div className="min-h-screen p-6 container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="heading-glow text-3xl md:text-4xl">{currentRoom.name}</h1>
          <button onClick={leaveRoom} className="btn-neon-red flex items-center gap-2">
            <LogOut size={18} />
            离开房间
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card neon-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display text-neon-cyan flex items-center gap-2">
                <Users size={22} />
                玩家列表 ({currentRoom.currentPlayers.length}/{currentRoom.maxPlayers})
              </h2>
              <div className="flex items-center gap-2">
                <span className="chip bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                  邀请码: <span className="font-mono font-bold">{currentRoom.inviteCode}</span>
                </span>
                <button onClick={handleCopyInvite} className="btn-neon !px-3 !py-2">
                  {copied ? <Check size={16} className="text-neon-green" /> : <Copy size={16} />}
                </button>
                <button onClick={handleCopyInvite} className="btn-neon-purple !px-3 !py-2" title="复制邀请链接">
                  <Link size={16} />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {currentRoom.currentPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`glass-card p-4 flex items-center gap-4 border transition-all duration-300 ${
                    player.id === currentPlayer?.id ? 'neon-border' : 'border-white/10'
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                    style={{
                      backgroundColor: `${player.color}20`,
                      border: `2px solid ${player.color}`,
                      boxShadow: `0 0 12px ${player.color}40`,
                    }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{player.name}</span>
                      {player.isHost && (
                        <Crown size={16} className="text-neon-gold flex-shrink-0" />
                      )}
                    </div>
                    {player.title && (
                      <div className="text-xs text-slate-400 truncate">{player.title}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {player.isReady ? (
                        <span className="chip bg-neon-green/20 text-neon-green border border-neon-green/30">
                          <ShieldCheck size={12} /> 已准备
                        </span>
                      ) : (
                        <span className="chip bg-neon-red/20 text-neon-red border border-neon-red/30">
                          未准备
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({ length: currentRoom.maxPlayers - currentRoom.currentPlayers.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="glass-card p-4 flex items-center gap-4 border border-dashed border-white/10"
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl text-slate-600 border-2 border-dashed border-slate-600">
                    ?
                  </div>
                  <div className="text-slate-500">等待玩家加入...</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={!allReady}
                  className="btn-primary flex items-center gap-2 text-base"
                >
                  <Play size={20} />
                  开始游戏
                </button>
              ) : (
                <button
                  onClick={handleToggleReady}
                  className={currentPlayer?.isReady ? 'btn-neon-gold flex items-center gap-2' : 'btn-primary flex items-center gap-2'}
                >
                  {currentPlayer?.isReady ? '取消准备' : '准备就绪'}
                </button>
              )}
            </div>
          </div>

          <div className="glass-card neon-border-purple p-6">
            <h2 className="text-xl font-display text-neon-purple mb-4">房间信息</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">房间状态</span>
                <span className={STATUS_COLOR[currentRoom.status]}>{STATUS_TEXT[currentRoom.status]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">最大人数</span>
                <span className="text-white">{currentRoom.maxPlayers} 人</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">加密保护</span>
                <span className="flex items-center gap-1">
                  {currentRoom.hasPassword ? (
                    <><Lock size={14} className="text-neon-gold" /> 已加密</>
                  ) : (
                    <><Unlock size={14} className="text-neon-green" /> 公开</>
                  )}
                </span>
              </div>
              {!allReady && (
                <div className="mt-4 p-3 rounded-lg bg-neon-gold/10 border border-neon-gold/30 text-neon-gold text-xs">
                  ⚠️ 等待所有玩家准备就绪...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="heading-glow text-3xl md:text-4xl">游戏大厅</h1>
        <div className="flex flex-wrap gap-3">
          <button onClick={fetchRooms} disabled={isLoading} className="btn-neon flex items-center gap-2">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            刷新
          </button>
          <button onClick={handleQuickJoin} className="btn-neon-gold flex items-center gap-2">
            <Zap size={16} />
            快速加入
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            创建房间
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {rooms.map((room) => (
          <div key={room.id} className="glass-card neon-border p-5 hover:shadow-neon-cyan transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors">
                  {room.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`chip ${STATUS_COLOR[room.status]} bg-current/10 border border-current/30`}>
                    {STATUS_TEXT[room.status]}
                  </span>
                  {room.hasPassword && (
                    <span className="chip text-neon-gold bg-neon-gold/10 border border-neon-gold/30">
                      <Lock size={12} />
                      加密
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Users size={16} />
                <span className="font-mono">
                  {room.currentPlayers.length}/{room.maxPlayers}
                </span>
              </div>
            </div>

            <div className="flex -space-x-2 mb-4">
              {room.currentPlayers.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base border-2 border-midnight-800"
                  style={{ backgroundColor: `${p.color}30`, color: p.color }}
                  title={p.name}
                >
                  {p.avatar}
                </div>
              ))}
              {room.currentPlayers.length > 5 && (
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs bg-slate-700 text-slate-300 border-2 border-midnight-800">
                  +{room.currentPlayers.length - 5}
                </div>
              )}
            </div>

            <button
              onClick={() => handleJoinRoom(room.id, room.hasPassword)}
              disabled={room.status !== 'waiting' || room.currentPlayers.length >= room.maxPlayers}
              className="btn-neon w-full flex items-center justify-center gap-2"
            >
              {room.status !== 'waiting'
                ? '游戏进行中'
                : room.currentPlayers.length >= room.maxPlayers
                ? '房间已满'
                : '加入房间'}
            </button>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card neon-border p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-glow text-2xl">创建房间</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-300 mb-2">房间名称</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="请输入房间名称"
                  className="input-neon"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  最大人数: <span className="text-neon-cyan font-bold">{maxPlayers}</span> 人
                </label>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full h-2 bg-midnight-900 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>2人</span>
                  <span>3人</span>
                  <span>4人</span>
                  <span>5人</span>
                  <span>6人</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  房间密码 <span className="text-slate-500">(可选)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="不填则为公开房间"
                  className="input-neon"
                  maxLength={16}
                />
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card neon-border-purple p-6 w-full max-w-sm animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-glow text-xl">输入房间密码</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(null);
                  setInputPassword('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="请输入密码"
                className="input-neon"
                autoFocus
              />
              <button
                onClick={() => {
                  if (currentPlayer && showPasswordModal) {
                    const ok = joinRoom(showPasswordModal, currentPlayer, inputPassword);
                    if (ok) {
                      setShowPasswordModal(null);
                      setInputPassword('');
                    }
                  }
                }}
                className="btn-neon-purple w-full"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
