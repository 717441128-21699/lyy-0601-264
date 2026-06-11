import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  User,
  Palette,
  Shapes,
  Sparkles,
  Crown,
  Save,
  Eye,
  Check,
  ChevronRight,
} from 'lucide-react';
import { usePlayerStore } from '@/store';
import type { Player, PieceShape, Skill } from '@/types';
import { PIECE_COLORS, PIECE_SHAPES, TITLES } from '@/types';
import { SKILLS_PRESET } from '@/mock/data';

const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🦄', '🐙', '🦅', '🐲', '🦖'];

function PieceSVG({ shape, color, size = 80 }: { shape: PieceShape; color: string; size?: number }) {
  const glow = `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}80)`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: glow }}>
      {shape === 'circle' && <circle cx="50" cy="50" r="38" fill={color} stroke="#fff" strokeWidth="2" />}
      {shape === 'square' && <rect x="14" y="14" width="72" height="72" rx="8" fill={color} stroke="#fff" strokeWidth="2" />}
      {shape === 'triangle' && <polygon points="50,10 92,86 8,86" fill={color} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />}
      {shape === 'diamond' && <polygon points="50,8 92,50 50,92 8,50" fill={color} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />}
      {shape === 'star' && (
        <polygon
          points="50,8 61,38 94,38 67,57 78,90 50,70 22,90 33,57 6,38 39,38"
          fill={color}
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export default function Character() {
  const { currentPlayer, setCurrentPlayer, updatePlayer } = usePlayerStore();

  const [name, setName] = useState(currentPlayer?.name || '');
  const [avatar, setAvatar] = useState(currentPlayer?.avatar || AVATARS[0]);
  const [color, setColor] = useState(currentPlayer?.color || PIECE_COLORS[0]);
  const [pieceShape, setPieceShape] = useState<PieceShape>(currentPlayer?.pieceShape || 'circle');
  const [selectedSkill, setSelectedSkill] = useState<Skill>(currentPlayer?.skill || SKILLS_PRESET[0]);
  const [title, setTitle] = useState<string | undefined>(currentPlayer?.title);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) return;
    const basePlayer: Player = {
      id: currentPlayer?.id || 'player_' + Date.now().toString(36),
      name: name.trim(),
      avatar,
      color,
      title,
      pieceShape,
      skill: { ...selectedSkill },
      isReady: currentPlayer?.isReady || false,
      isConnected: currentPlayer?.isConnected || true,
      isHost: currentPlayer?.isHost || false,
    };
    if (currentPlayer) {
      updatePlayer(basePlayer);
    } else {
      setCurrentPlayer(basePlayer);
    }
  };

  const SectionTitle = ({ icon: Icon, text }: { icon: LucideIcon; text: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-neon-cyan" />
      <h3 className="font-display font-bold text-lg text-white tracking-wider">{text}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-neon-cyan/50 to-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="heading-glow text-3xl md:text-4xl text-center mb-8">角色配置</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card neon-border p-6">
              <SectionTitle icon={User} text="昵称与头像" />
              <div className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入你的昵称..."
                  className="input-neon"
                  maxLength={12}
                />
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {AVATARS.map((em) => (
                    <button
                      key={em}
                      onClick={() => setAvatar(em)}
                      className={`aspect-square text-2xl md:text-3xl rounded-lg border transition-all duration-300 flex items-center justify-center ${
                        avatar === em
                          ? 'border-neon-cyan bg-neon-cyan/10 shadow-neon-cyan scale-110'
                          : 'border-white/10 bg-midnight-800/40 hover:border-neon-cyan/50'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card neon-border p-6">
              <SectionTitle icon={Palette} text="棋子颜色" />
              <div className="grid grid-cols-6 gap-3">
                {PIECE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`aspect-square rounded-lg border-2 transition-all duration-300 relative ${
                      color === c ? 'border-white scale-110' : 'border-transparent hover:border-white/50'
                    }`}
                    style={{ backgroundColor: c, boxShadow: color === c ? `0 0 15px ${c}` : `0 0 5px ${c}60` }}
                  >
                    {color === c && <Check className="w-5 h-5 text-white absolute inset-0 m-auto" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card neon-border p-6">
              <SectionTitle icon={Shapes} text="棋子形状" />
              <div className="grid grid-cols-5 gap-3">
                {PIECE_SHAPES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPieceShape(s)}
                    className={`aspect-square rounded-lg border transition-all duration-300 flex items-center justify-center ${
                      pieceShape === s
                        ? 'border-neon-purple bg-neon-purple/10 shadow-neon-purple'
                        : 'border-white/10 bg-midnight-800/40 hover:border-neon-purple/50'
                    }`}
                  >
                    <PieceSVG shape={s} color={color} size={44} />
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card neon-border-purple p-6">
              <SectionTitle icon={Sparkles} text="技能选择（三选一）" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {SKILLS_PRESET.map((skill) => {
                  const isSelected = selectedSkill.id === skill.id;
                  const isFlipped = flippedCard === skill.id;
                  return (
                    <div
                      key={skill.id}
                      className="relative h-40 cursor-pointer perspective-1000"
                      onMouseEnter={() => setFlippedCard(skill.id)}
                      onMouseLeave={() => setFlippedCard(null)}
                      onClick={() => setSelectedSkill(skill)}
                      style={{ perspective: '1000px' }}
                    >
                      <div
                        className="relative w-full h-full transition-transform duration-500"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                        }}
                      >
                        <div
                          className={`absolute inset-0 rounded-xl border p-4 flex flex-col items-center justify-center backface-hidden ${
                            isSelected
                              ? 'border-neon-purple bg-neon-purple/10 shadow-neon-purple'
                              : 'border-white/10 bg-midnight-800/60 hover:border-neon-purple/50'
                          }`}
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <span className="text-4xl mb-2">{skill.icon}</span>
                          <span className="font-display font-semibold text-white">{skill.name}</span>
                          <span className="text-xs text-slate-400 mt-1">冷却: {skill.cooldown}回合</span>
                          <ChevronRight className="w-4 h-4 text-neon-purple absolute bottom-2 right-2 animate-pulse" />
                        </div>
                        <div
                          className={`absolute inset-0 rounded-xl border p-3 flex flex-col items-center justify-center text-center ${
                            isSelected ? 'border-neon-cyan bg-neon-cyan/10' : 'border-neon-cyan/40 bg-midnight-900/90'
                          }`}
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                          <span className="text-2xl mb-1">{skill.icon}</span>
                          <span className="font-display font-bold text-neon-cyan text-sm">{skill.name}</span>
                          <p className="text-xs text-slate-300 mt-2 leading-relaxed">{skill.description}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-neon-purple rounded-full flex items-center justify-center shadow-neon-purple">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card neon-border p-6">
              <SectionTitle icon={Crown} text="称号选择" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TITLES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTitle(title === t ? undefined : t)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all duration-300 ${
                      title === t
                        ? 'border-neon-gold bg-neon-gold/10 text-neon-gold shadow-neon-gold text-shadow-neon-gold'
                        : 'border-white/10 bg-midnight-800/40 text-slate-300 hover:border-neon-gold/50 hover:text-neon-gold'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card neon-border p-6 lg:sticky lg:top-6">
              <div className="flex items-center gap-2 mb-5">
                <Eye className="w-5 h-5 text-neon-cyan" />
                <h3 className="font-display font-bold text-lg text-white tracking-wider">实时预览</h3>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-5xl border-2 animate-glow"
                    style={{ borderColor: color, boxShadow: `0 0 20px ${color}60` }}
                  >
                    {avatar}
                  </div>
                </div>

                <h2 className="font-display font-bold text-2xl text-white mb-1">{name || '未命名玩家'}</h2>
                {title && (
                  <span className="chip bg-neon-gold/15 text-neon-gold border border-neon-gold/40 mb-3">
                    <Crown className="w-3 h-3" />
                    {title}
                  </span>
                )}

                <div className="my-6 p-6 bg-midnight-900/60 rounded-xl border border-white/10 w-full flex justify-center">
                  <PieceSVG shape={pieceShape} color={color} size={120} />
                </div>

                <div className="w-full space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">技能</span>
                    <span className="text-neon-purple font-medium">
                      {selectedSkill.icon} {selectedSkill.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">形状</span>
                    <span className="text-white capitalize">{pieceShape}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">颜色</span>
                    <div className="w-5 h-5 rounded-full border border-white/30" style={{ backgroundColor: color }} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                保存配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
