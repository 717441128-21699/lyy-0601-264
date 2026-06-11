import { Link, useLocation } from 'react-router-dom';
import { Home, User, Map, Swords, MessageSquare, BarChart3, Trophy, Wifi, WifiOff } from 'lucide-react';
import { usePlayerStore } from '@/store';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '大厅', icon: Home },
  { path: '/character', label: '角色', icon: User },
  { path: '/game/map', label: '地图', icon: Map },
  { path: '/game/turn', label: '回合', icon: Swords },
  { path: '/game/chat', label: '聊天', icon: MessageSquare },
  { path: '/game/report', label: '战报', icon: BarChart3 },
  { path: '/leaderboard', label: '排行', icon: Trophy },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentPlayer = usePlayerStore((s) => s.currentPlayer);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neon-cyan/20 bg-midnight-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-cyan">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-display text-lg font-bold tracking-widest text-shadow-neon-cyan text-neon-cyan">
              领地战棋
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive =
                path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'relative px-3 py-2 rounded-md text-xs font-display tracking-wider transition-all duration-300 flex items-center gap-1.5',
                    isActive
                      ? 'text-neon-cyan bg-neon-cyan/10 shadow-neon-cyan'
                      : 'text-slate-400 hover:text-neon-cyan/80 hover:bg-white/5'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {isActive && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-gradient-to-r from-neon-cyan to-neon-purple" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {currentPlayer ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-midnight-800/80 border border-neon-purple/30">
                <span className="text-lg">{currentPlayer.avatar}</span>
                <span className="text-sm font-medium" style={{ color: currentPlayer.color }}>
                  {currentPlayer.name}
                </span>
                {currentPlayer.title && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-gold/20 text-neon-gold">
                    {currentPlayer.title}
                  </span>
                )}
              </div>
            ) : (
              <Link to="/character" className="btn-neon text-xs px-4 py-1.5">
                创建角色
              </Link>
            )}
            <div className="w-8 h-8 rounded-full border border-neon-green/40 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-neon-green" />
            </div>
          </div>
        </div>

        <nav className="md:hidden flex items-center justify-around px-2 py-1 border-t border-white/5 overflow-x-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive =
              path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded transition-all text-[10px]',
                  isActive ? 'text-neon-cyan' : 'text-slate-500'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
