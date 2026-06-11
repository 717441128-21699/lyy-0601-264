import { useState, useEffect, useRef } from 'react';
import { Send, Smile, Target, Ban, UserX, Users } from 'lucide-react';
import { useChatStore, useRoomStore, usePlayerStore } from '@/store';
import { EMOJIS, TACTIC_PHRASES } from '@/types';
import type { ChatMessage, ChatMessageType } from '@/types';
import { generateMockChatMessages } from '@/mock/data';

export default function GameChat({ compact = false }: { compact?: boolean }) {
  const { messages, blockedPlayers, initMessages, sendMessage, blockPlayer, unblockPlayer } = useChatStore();
  const { currentRoom } = useRoomStore();
  const { currentPlayer } = usePlayerStore();

  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const players = currentRoom?.currentPlayers || [];

  useEffect(() => {
    if (players.length > 0 && messages.length === 0) {
      initMessages(generateMockChatMessages(players));
    }
  }, [players, messages.length, initMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (type: ChatMessageType = 'text', content?: string) => {
    if (!currentPlayer || !currentRoom) return;
    const msgContent = content ?? input.trim();
    if (!msgContent) return;
    sendMessage({
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      playerColor: currentPlayer.color,
      content: msgContent,
      type,
    });
    setInput('');
    setShowEmoji(false);
  };

  const visibleMessages = messages.filter((m) => !blockedPlayers.includes(m.playerId));

  const getTypeStyle = (type: ChatMessageType) => {
    switch (type) {
      case 'emoji':
        return 'bg-neon-gold/15 border-neon-gold/40';
      case 'tactic':
        return 'bg-neon-purple/15 border-neon-purple/40';
      case 'system':
        return 'bg-midnight-700/60 border-white/10';
      default:
        return 'bg-midnight-700/60 border-white/10';
    }
  };

  const getTypeIcon = (type: ChatMessageType) => {
    if (type === 'tactic') return <Target size={12} className="text-neon-purple" />;
    return null;
  };

  const isBlocked = (id: string) => blockedPlayers.includes(id);

  return (
    <div className="min-h-screen p-4 md:p-6 container">
      <h1 className="heading-glow text-2xl md:text-3xl mb-6 flex items-center gap-3">
        <Users size={28} />
        游戏聊天
      </h1>

      <div className="grid lg:grid-cols-4 gap-5 h-[calc(100vh-160px)]">
        <div className="lg:col-span-3 flex flex-col glass-card neon-border p-4 md:p-5">
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {visibleMessages.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-500">
                暂无消息，开始聊天吧！
              </div>
            )}
            {visibleMessages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-fade-in ${msg.type === 'system' ? 'justify-center' : ''}`}
              >
                {msg.type !== 'system' && (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{
                      backgroundColor: `${msg.playerColor}20`,
                      border: `2px solid ${msg.playerColor}`,
                      boxShadow: `0 0 10px ${msg.playerColor}30`,
                    }}
                  >
                    {players.find((p) => p.id === msg.playerId)?.avatar || '?'}
                  </div>
                )}
                <div className={`flex-1 max-w-[80%] ${msg.type === 'system' ? 'max-w-full' : ''}`}>
                  {msg.type !== 'system' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: msg.playerColor }}>
                        {msg.playerName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isBlocked(msg.playerId) && (
                        <span className="chip bg-neon-red/15 text-neon-red border border-neon-red/30">
                          <UserX size={10} /> 已屏蔽
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-4 py-2.5 border ${getTypeStyle(msg.type)} ${
                      msg.type === 'emoji' ? 'text-4xl text-center py-4' : ''
                    } ${msg.type === 'system' ? 'text-center text-slate-400 text-sm py-2 px-6' : ''}`}
                  >
                    {msg.type === 'system' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-neon-cyan">◆</span>
                        {msg.content}
                        <span className="text-neon-purple">◆</span>
                      </span>
                    ) : (
                      <div className="flex items-start gap-2">
                        {getTypeIcon(msg.type)}
                        <span className={msg.type === 'tactic' ? 'text-neon-purple font-semibold' : 'text-white'}>
                          {msg.content}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {showEmoji && (
            <div className="mt-3 p-3 rounded-xl bg-midnight-900/80 border border-neon-gold/30 animate-fade-in">
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                {EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend('emoji', emoji)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl hover:bg-neon-gold/20 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {TACTIC_PHRASES.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handleSend('tactic', phrase)}
                className="chip bg-neon-purple/10 text-neon-purple border border-neon-purple/40 hover:bg-neon-purple/20 hover:shadow-neon-purple transition-all px-3 py-1.5 text-xs cursor-pointer"
              >
                <Target size={12} />
                {phrase}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={`btn-neon !px-3 !py-3 flex items-center justify-center ${
                showEmoji ? 'border-neon-gold text-neon-gold shadow-neon-gold' : ''
              }`}
            >
              <Smile size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="input-neon flex-1"
              maxLength={200}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="btn-primary !px-5 !py-3 flex items-center gap-2"
            >
              <Send size={18} />
              <span className="hidden md:inline">发送</span>
            </button>
          </div>
        </div>

        <div className="glass-card neon-border-purple p-4 flex flex-col">
          <h2 className="text-lg font-display text-neon-purple mb-4 flex items-center gap-2">
            <Users size={20} />
            玩家列表 ({players.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {players.map((player) => (
              <div
                key={player.id}
                className={`relative p-3 rounded-lg border transition-all duration-200 ${
                  player.id === currentPlayer?.id
                    ? 'bg-neon-cyan/8 border-neon-cyan/40'
                    : 'bg-midnight-800/60 border-white/10 hover:border-white/25'
                }`}
              >
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() =>
                    setActiveMenu(activeMenu === player.id ? null : player.id)
                  }
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      backgroundColor: `${player.color}20`,
                      border: `2px solid ${player.color}`,
                      boxShadow: `0 0 8px ${player.color}30`,
                    }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-bold text-sm truncate"
                        style={{ color: player.color }}
                      >
                        {player.name}
                      </span>
                      {player.id === currentPlayer?.id && (
                        <span className="chip bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 text-[10px] px-1.5 py-0">
                          我
                        </span>
                      )}
                    </div>
                    {player.title && (
                      <div className="text-xs text-slate-500 truncate">{player.title}</div>
                    )}
                  </div>
                  {isBlocked(player.id) && (
                    <Ban size={14} className="text-neon-red flex-shrink-0" />
                  )}
                </div>
                {activeMenu === player.id && player.id !== currentPlayer?.id && (
                  <div className="mt-2 pt-2 border-t border-white/10 animate-fade-in">
                    <button
                      onClick={() => {
                        isBlocked(player.id) ? unblockPlayer(player.id) : blockPlayer(player.id);
                        setActiveMenu(null);
                      }}
                      className={`w-full text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        isBlocked(player.id)
                          ? 'bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border border-neon-green/30'
                          : 'bg-neon-red/10 text-neon-red hover:bg-neon-red/20 border border-neon-red/30'
                      }`}
                    >
                      {isBlocked(player.id) ? (
                        <>取消屏蔽</>
                      ) : (
                        <>
                          <UserX size={12} /> 屏蔽该玩家
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {blockedPlayers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Ban size={12} className="text-neon-red" />
                已屏蔽 {blockedPlayers.length} 名玩家
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
