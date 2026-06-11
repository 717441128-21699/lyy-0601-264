import { useState, useEffect } from 'react';
import {
  Dices,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flag,
  Swords,
  Handshake,
  Target,
  Zap,
  SkipForward,
  X,
  MapPin,
} from 'lucide-react';
import { useGameStore, useRoomStore, usePlayerStore } from '@/store';
import { cn } from '@/lib/utils';

const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

type ActionType = 'steal' | 'ally' | 'betray' | null;
type PendingActionType = 'occupy' | 'steal' | 'ally' | 'betray' | null;

interface PendingAction {
  type: PendingActionType;
  data?: any;
  preview: string;
  confirmText: string;
  cost?: number;
  gain?: number;
  territoryDelta?: number;
  logPreview?: string;
  color: string;
}

export default function GameTurn({ compact = false }: { compact?: boolean }) {
  const { gameState, rollDice, movePlayer, occupyCell, stealCell, proposeAlliance, betray, useSkill, endTurn, enterActionPhase } = useGameStore();
  const { currentRoom } = useRoomStore();
  const { currentPlayer } = usePlayerStore();
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState(1);
  const [selectingAction, setSelectingAction] = useState<ActionType>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showEnterActionConfirm, setShowEnterActionConfirm] = useState(false);

  const currentPlayerInfo = currentRoom?.currentPlayers.find(
    (p) => p.id === gameState?.currentPlayerId
  );
  const currentPlayerState = gameState?.players.find(
    (p) => p.playerId === gameState?.currentPlayerId
  );
  const isMyTurn = currentPlayer?.id === gameState?.currentPlayerId;
  const phase = gameState?.phase || 'roll';
  const movesRemaining = gameState?.movesRemaining ?? 0;

  useEffect(() => {
    if (gameState?.diceValue) setDisplayDice(gameState.diceValue);
  }, [gameState?.diceValue]);

  const handleRoll = () => {
    if (!isMyTurn || phase !== 'roll' || isRolling) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDisplayDice(Math.floor(Math.random() * 6) + 1);
      if (++count >= 12) {
        clearInterval(interval);
        rollDice();
        setIsRolling(false);
      }
    }, 80);
  };

  const handleMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (!isMyTurn || phase !== 'move' || !currentPlayer) return;
    movePlayer(currentPlayer.id, dir);
  };

  const handleSkill = () => {
    if (!isMyTurn || !currentPlayer) return;
    if (currentPlayerInfo?.skill.currentCooldown && currentPlayerInfo.skill.currentCooldown > 0) return;
    useSkill(currentPlayer.id);
  };

  const otherPlayers = currentRoom?.currentPlayers.filter(
    (p) => p.id !== currentPlayer?.id
  ) || [];

  const myAllies = gameState?.alliances
    .filter((a) => a.playerIds.includes(currentPlayer?.id || ''))
    .map((a) => a.playerIds.find((id) => id !== currentPlayer?.id) as string)
    .filter(Boolean) || [];

  const nonAllyPlayers = otherPlayers.filter((p) => !myAllies.includes(p.id));

  const currentPosition = currentPlayerState?.position;

  const adjacentEnemyCells = (() => {
    if (!currentPosition || !gameState) return [];
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    const result: { x: number; y: number; ownerId: string; ownerName?: string; ownerColor?: string }[] = [];
    dirs.forEach(({ dx, dy }) => {
      const nx = currentPosition.x + dx;
      const ny = currentPosition.y + dy;
      if (nx < 0 || ny < 0 || !gameState.map[ny] || !gameState.map[ny][nx]) return;
      const cell = gameState.map[ny][nx];
      if (cell.ownerId && cell.ownerId !== currentPlayer?.id) {
        const owner = currentRoom?.currentPlayers.find((p) => p.id === cell.ownerId);
        result.push({ x: nx, y: ny, ownerId: cell.ownerId, ownerName: owner?.name, ownerColor: owner?.color });
      }
    });
    return result;
  })();

  const handleOccupy = () => {
    if (!isMyTurn || !currentPlayer || !currentPosition || !gameState) return;
    const cell = gameState.map[currentPosition.y]?.[currentPosition.x];
    if (!cell) return;
    const cost = cell.ownerId && cell.ownerId !== currentPlayer.id ? 20 : 5;
    const isEnemy = cell.ownerId && cell.ownerId !== currentPlayer.id;
    setPendingAction({
      type: 'occupy',
      data: { x: currentPosition.x, y: currentPosition.y, cost },
      preview: `${isEnemy ? '抢夺占领' : '占领'}格子 (${currentPosition.x}, ${currentPosition.y})${isEnemy ? ' · 敌方领地' : ' · 空地'}`,
      confirmText: '确认占领',
      cost,
      territoryDelta: 1,
      logPreview: `${currentPlayer.avatar} ${currentPlayer.name} ${isEnemy ? '夺取了敌方领地' : '占领了空地'} (${currentPosition.x}, ${currentPosition.y})，消耗 ${cost} 资源`,
      color: 'cyan',
    });
    setSelectingAction(null);
  };

  const handleStealCell = (x: number, y: number) => {
    if (!currentPlayer) return;
    const target = currentRoom?.currentPlayers.find((p) => p.id === adjacentEnemyCells.find((c) => c.x === x && c.y === y)?.ownerId);
    setPendingAction({
      type: 'steal',
      data: { x, y },
      preview: `抢夺 (${x}, ${y})${target ? ` · ${target.avatar} ${target.name}` : ''}`,
      confirmText: '确认抢夺（60%成功率）',
      cost: 15,
      gain: 25,
      territoryDelta: 1,
      logPreview: `${currentPlayer.avatar} ${currentPlayer.name} 试图抢夺 ${target?.name || '敌方'} 的领地 (${x}, ${y})，消耗 15 资源`,
      color: 'red',
    });
    setSelectingAction(null);
  };

  const handleAlly = (targetId: string) => {
    if (!currentPlayer) return;
    const target = currentRoom?.currentPlayers.find((p) => p.id === targetId);
    setPendingAction({
      type: 'ally',
      data: { targetId },
      preview: `与 ${target?.avatar || ''} ${target?.name || '玩家'} 结盟，持续 3 回合`,
      confirmText: '确认结盟',
      territoryDelta: 0,
      logPreview: `${currentPlayer.avatar} ${currentPlayer.name} 与 ${target?.name || '玩家'} 缔结同盟，持续 3 回合`,
      color: 'green',
    });
    setSelectingAction(null);
  };

  const handleBetray = (allyId: string) => {
    if (!currentPlayer) return;
    const ally = currentRoom?.currentPlayers.find((p) => p.id === allyId);
    setPendingAction({
      type: 'betray',
      data: { allyId },
      preview: `背刺盟友 ${ally?.avatar || ''} ${ally?.name || '玩家'}，获得 30 资源并造成 30 伤害`,
      confirmText: '确认背刺（盟约将立即破裂）',
      gain: 30,
      territoryDelta: 0,
      logPreview: `${currentPlayer.avatar} ${currentPlayer.name} 背刺了盟友 ${ally?.name || '玩家'}，获得 30 资源并造成 30 伤害`,
      color: 'purple',
    });
    setSelectingAction(null);
  };

  const confirmPendingAction = () => {
    if (!pendingAction || !currentPlayer) return;
    switch (pendingAction.type) {
      case 'occupy':
        occupyCell(currentPlayer.id);
        break;
      case 'steal':
        stealCell(currentPlayer.id, pendingAction.data.x, pendingAction.data.y);
        break;
      case 'ally':
        proposeAlliance(currentPlayer.id, pendingAction.data.targetId);
        break;
      case 'betray':
        betray(currentPlayer.id, pendingAction.data.allyId);
        break;
    }
    setPendingAction(null);
  };

  const cancelPendingAction = () => {
    setPendingAction(null);
  };

  const handleEndTurn = () => {
    if (!isMyTurn) return;
    if (movesRemaining > 0) {
      setShowAbandonConfirm(true);
    } else {
      endTurn();
    }
  };

  const confirmAbandonMoves = () => {
    setShowAbandonConfirm(false);
    endTurn();
  };

  const cancelAbandonMoves = () => {
    setShowAbandonConfirm(false);
  };

  const getPhaseTip = () => {
    if (!isMyTurn) return '等待对手行动中...';
    switch (phase) {
      case 'roll': return '点击骰子开始掷骰！';
      case 'move': return `使用方向键移动，剩余 ${movesRemaining} 步`;
      case 'action': return '选择一个行动来扩张你的势力！';
      case 'end': return '结束回合，传递给下一位玩家';
      default: return '';
    }
  };

  const phaseLabel = { roll: '掷骰', move: '移动', action: '行动', end: '结算' }[phase];

  return (
    <div className="space-y-5">
      <div className="glass-card neon-border p-5 clip-corner animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-purple/30 to-neon-cyan/30 border border-neon-purple/50 flex items-center justify-center text-3xl shadow-neon-purple">
              {currentPlayerInfo?.avatar || '👤'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-bold" style={{ color: currentPlayerInfo?.color || '#00f0ff' }}>
                  {currentPlayerInfo?.name || '未知玩家'}
                </h2>
                <span className={cn(
                  'chip text-[10px]',
                  isMyTurn
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                )}>
                  {isMyTurn ? '你的回合' : '等待中'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                <span>回合 <span className="text-neon-cyan font-bold">{gameState?.currentTurn || 1}</span></span>
                <span>❤ <span className="text-neon-red font-bold">{currentPlayerState?.hp ?? 0}</span></span>
                <span>💎 <span className="text-neon-gold font-bold">{currentPlayerState?.resources ?? 0}</span></span>
                <span>🏴 <span className="text-neon-purple font-bold">{currentPlayerState?.ownedCells ?? 0}</span></span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 font-display tracking-widest">当前阶段</div>
            <div className="text-lg font-display font-bold text-shadow-neon-cyan text-neon-cyan uppercase mt-1">
              {phaseLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-2">
        <p className={cn(
          'inline-block px-6 py-2 rounded-full text-sm font-medium',
          isMyTurn
            ? 'bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan text-shadow-neon-cyan'
            : 'bg-slate-700/30 border border-slate-600/30 text-slate-400'
        )}>
          {getPhaseTip()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card neon-border-purple p-6 flex flex-col items-center clip-corner animate-slide-up">
          <h3 className="text-sm font-display tracking-widest text-neon-purple mb-5 text-shadow-neon-purple">🎲 骰子</h3>
          <button
            onClick={handleRoll}
            disabled={!isMyTurn || phase !== 'roll' || isRolling}
            className={cn(
              'relative w-28 h-28 rounded-2xl bg-gradient-to-br from-midnight-700 to-midnight-900 border-2 flex items-center justify-center transition-all duration-300',
              isMyTurn && phase === 'roll' && !isRolling
                ? 'border-neon-cyan shadow-neon-cyan hover:scale-105 cursor-pointer'
                : 'border-slate-600/50 cursor-not-allowed opacity-60',
              isRolling && 'animate-shake'
            )}
            style={{ perspective: '500px', transformStyle: 'preserve-3d' }}
          >
            <span
              className={cn('text-7xl transition-transform', isRolling && 'animate-spin')}
              style={{
                transform: isRolling ? 'rotateY(360deg) rotateX(360deg)' : 'none',
                transition: isRolling ? 'transform 0.8s ease-out' : 'none',
                color: displayDice % 2 === 0 ? '#00f0ff' : '#b026ff',
                textShadow: `0 0 15px ${displayDice % 2 === 0 ? '#00f0ff' : '#b026ff'}`,
              }}
            >
              {diceFaces[displayDice - 1]}
            </span>
            {isRolling && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 animate-pulse" />
            )}
          </button>
          {gameState?.diceValue && !isRolling && (
            <div className="mt-5 text-center">
              <div className="text-xs text-slate-500">本次点数</div>
              <div className="text-3xl font-display font-bold text-shadow-neon-gold text-neon-gold mt-1">
                {gameState.diceValue}
              </div>
            </div>
          )}
          <Dices className={cn('w-5 h-5 mt-5', isMyTurn && phase === 'roll' ? 'text-neon-purple' : 'text-slate-600')} />
        </div>

        <div className="glass-card neon-border p-6 flex flex-col items-center clip-corner animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-display tracking-widest text-neon-cyan mb-4 text-shadow-neon-cyan">🎮 方向控制</h3>
          <div className="relative w-44 h-44">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                'w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2',
                phase === 'move' && isMyTurn
                  ? 'border-neon-gold bg-neon-gold/10 shadow-neon-gold'
                  : 'border-slate-600/40 bg-midnight-800/50'
              )}>
                <span className="text-xs text-slate-400">剩余</span>
                <span className="text-2xl font-display font-bold text-neon-gold text-shadow-neon-gold">{movesRemaining}</span>
                <span className="text-xs text-slate-400">步</span>
              </div>
            </div>
            {(['up', 'down', 'left', 'right'] as const).map((dir) => {
              const Icon = { up: ArrowUp, down: ArrowDown, left: ArrowLeft, right: ArrowRight }[dir];
              const posClass = {
                up: 'top-0 left-1/2 -translate-x-1/2',
                down: 'bottom-0 left-1/2 -translate-x-1/2',
                left: 'left-0 top-1/2 -translate-y-1/2',
                right: 'right-0 top-1/2 -translate-y-1/2',
              }[dir];
              return (
                <div key={dir} className={`absolute ${posClass}`}>
                  <button
                    onClick={() => handleMove(dir)}
                    disabled={!isMyTurn || phase !== 'move' || movesRemaining <= 0}
                    className="w-12 h-12 rounded-xl bg-midnight-700/80 border border-neon-cyan/50 text-neon-cyan flex items-center justify-center hover:bg-neon-cyan/10 hover:shadow-neon-cyan transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-6 h-6" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card neon-border p-6 flex flex-col items-center clip-corner animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm font-display tracking-widest text-neon-gold mb-4 text-shadow-neon-gold">⚡ 技能</h3>
          <button
            onClick={handleSkill}
            disabled={!isMyTurn || !currentPlayerInfo || (currentPlayerInfo.skill.currentCooldown ?? 0) > 0}
            className={cn(
              'relative w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2 overflow-hidden',
              isMyTurn && currentPlayerInfo && (currentPlayerInfo.skill.currentCooldown ?? 0) === 0
                ? 'bg-gradient-to-br from-neon-gold/20 to-neon-purple/20 border-neon-gold shadow-neon-gold hover:scale-105 cursor-pointer'
                : 'bg-midnight-800/50 border-slate-600/40 cursor-not-allowed opacity-60'
            )}
          >
            <span className="text-4xl mb-1">{currentPlayerInfo?.skill.icon || '⚡'}</span>
            <span className="text-xs font-display font-bold text-neon-gold">
              {currentPlayerInfo?.skill.name || '技能'}
            </span>
            {currentPlayerInfo && (currentPlayerInfo.skill.currentCooldown ?? 0) > 0 && (
              <div className="absolute inset-0 bg-midnight-900/80 flex items-center justify-center">
                <span className="text-3xl font-display font-bold text-neon-red text-shadow-neon-red">
                  {currentPlayerInfo.skill.currentCooldown}
                </span>
              </div>
            )}
          </button>
          <p className="text-xs text-slate-400 mt-3 text-center max-w-[180px] leading-relaxed">
            {currentPlayerInfo?.skill.description || '暂无技能'}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
            <Zap className="w-3 h-3 text-neon-gold" />
            <span>冷却: {currentPlayerInfo?.skill.cooldown ?? 0} 回合</span>
          </div>
        </div>
      </div>

      <div className="glass-card neon-border-purple p-6 clip-corner animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-sm font-display tracking-widest text-neon-purple mb-5 text-shadow-neon-purple text-center">⚔️ 行动面板</h3>

        {phase === 'move' && movesRemaining > 0 && (
          <div className="mb-5 p-4 rounded-xl bg-neon-amber/10 border border-neon-amber/30 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏸️</span>
              <div>
                <p className="text-sm font-display font-semibold text-neon-amber">移动阶段</p>
                <p className="text-xs text-slate-400">你还有 <span className="text-neon-amber font-bold">{movesRemaining}</span> 步可以移动</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              移动阶段只能移动棋子，无法进行占领、抢夺等行动。
              移动到目标位置后，可选择放弃剩余移动进入行动阶段。
            </p>
            <button
              onClick={() => setShowEnterActionConfirm(true)}
              disabled={!isMyTurn}
              className="w-full py-2.5 rounded-lg bg-neon-amber/20 border border-neon-amber/50 text-neon-amber text-sm font-display font-semibold hover:bg-neon-amber/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🚪 放弃移动，进入行动阶段
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: Flag,
              label: '占领格子',
              desc: currentPosition
                ? (() => {
                    const cell = gameState?.map[currentPosition.y]?.[currentPosition.x];
                    const cost = cell?.ownerId && cell.ownerId !== currentPlayer?.id ? 20 : 5;
                    return `消耗 ${cost} 资源`;
                  })()
                : '消耗 5 资源',
              color: 'cyan',
              action: handleOccupy,
              disabled:
                !isMyTurn ||
                phase !== 'action' ||
                !currentPosition ||
                !gameState ||
                gameState.map[currentPosition.y]?.[currentPosition.x]?.ownerId === currentPlayer?.id ||
                (currentPlayerState &&
                  currentPlayerState.resources <
                    (gameState?.map[currentPosition.y]?.[currentPosition.x]?.ownerId &&
                    gameState?.map[currentPosition.y]?.[currentPosition.x]?.ownerId !== currentPlayer?.id
                      ? 20
                      : 5)),
            },
            {
              icon: Swords,
              label: '抢夺相邻',
              desc:
                adjacentEnemyCells.length > 0
                  ? `消耗 15 资源 (${adjacentEnemyCells.length}个目标)`
                  : '消耗 15 资源',
              color: 'red',
              action: () => setSelectingAction('steal'),
              disabled:
                !isMyTurn ||
                phase !== 'action' ||
                adjacentEnemyCells.length === 0 ||
                (currentPlayerState?.resources ?? 0) < 15,
            },
            {
              icon: Handshake,
              label: '结盟提议',
              desc:
                nonAllyPlayers.length > 0
                  ? `持续 3 回合 (${nonAllyPlayers.length}人可结盟)`
                  : '持续 3 回合',
              color: 'green',
              action: () => setSelectingAction('ally'),
              disabled:
                !isMyTurn || phase !== 'action' || nonAllyPlayers.length === 0,
            },
            {
              icon: Target,
              label: '背刺盟友',
              desc: myAllies.length > 0 ? `获得 30 资源 (${myAllies.length}个盟友)` : '获得 30 资源',
              color: 'purple',
              action: () => setSelectingAction('betray'),
              disabled: !isMyTurn || phase !== 'action' || myAllies.length === 0,
            },
          ].map(({ icon: Icon, label, desc, color, action, disabled }) => (
            <button
              key={label}
              onClick={action}
              disabled={disabled}
              className={cn(
                'relative group p-4 rounded-xl bg-midnight-800/60 border flex flex-col items-center gap-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
                color === 'cyan' &&
                  'border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan hover:shadow-neon-cyan',
                color === 'red' &&
                  'border-neon-red/40 text-neon-red hover:bg-neon-red/10 hover:border-neon-red hover:shadow-neon-red',
                color === 'green' &&
                  'border-neon-green/40 text-neon-green hover:bg-neon-green/10 hover:border-neon-green hover:shadow-neon-green',
                color === 'purple' &&
                  'border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 hover:border-neon-purple hover:shadow-neon-purple'
              )}
            >
              <Icon className="w-7 h-7 group-hover:animate-pulse" />
              <span className="text-sm font-display font-semibold">{label}</span>
              <span className="text-[10px] text-slate-400">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {selectingAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
          <div className="glass-card neon-border p-6 w-full max-w-md clip-corner animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-display font-bold tracking-wider">
                {selectingAction === 'steal' && (
                  <span className="text-neon-red text-shadow-neon-red">🗡️ 选择抢夺目标</span>
                )}
                {selectingAction === 'ally' && (
                  <span className="text-neon-green text-shadow-neon-green">🤝 选择结盟对象</span>
                )}
                {selectingAction === 'betray' && (
                  <span className="text-neon-purple text-shadow-neon-purple">⚔️ 选择背刺目标</span>
                )}
              </h3>
              <button
                onClick={() => setSelectingAction(null)}
                className="w-8 h-8 rounded-lg bg-midnight-800/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/30 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectingAction === 'steal' && (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                {adjacentEnemyCells.length === 0 && (
                  <div className="text-center text-slate-500 py-6">附近没有可抢夺的敌方格子</div>
                )}
                {adjacentEnemyCells.map((cell) => {
                  const target = currentRoom?.currentPlayers.find((p) => p.id === cell.ownerId);
                  return (
                    <button
                      key={`${cell.x}-${cell.y}`}
                      onClick={() => handleStealCell(cell.x, cell.y)}
                      className="w-full p-3 rounded-xl bg-midnight-800/60 border border-neon-red/30 hover:border-neon-red hover:bg-neon-red/10 hover:shadow-neon-red transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{
                            backgroundColor: `${cell.ownerColor}20`,
                            border: `2px solid ${cell.ownerColor}`,
                          }}
                        >
                          {target?.avatar || '👤'}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold" style={{ color: cell.ownerColor }}>
                            {cell.ownerName || '敌方'} 的领地
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            位置 ({cell.x}, {cell.y})
                          </div>
                        </div>
                      </div>
                      <span className="chip bg-neon-red/20 text-neon-red border border-neon-red/40 text-xs">
                        抢夺
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectingAction === 'ally' && (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                {nonAllyPlayers.length === 0 && (
                  <div className="text-center text-slate-500 py-6">没有可结盟的玩家</div>
                )}
                {nonAllyPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAlly(p.id)}
                    className="w-full p-3 rounded-xl bg-midnight-800/60 border border-neon-green/30 hover:border-neon-green hover:bg-neon-green/10 hover:shadow-neon-green transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{
                          backgroundColor: `${p.color}20`,
                          border: `2px solid ${p.color}`,
                        }}
                      >
                        {p.avatar}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold" style={{ color: p.color }}>
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {p.title || '玩家'}
                        </div>
                      </div>
                    </div>
                    <span className="chip bg-neon-green/20 text-neon-green border border-neon-green/40 text-xs">
                      结盟
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectingAction === 'betray' && (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                {myAllies.length === 0 && (
                  <div className="text-center text-slate-500 py-6">没有盟友可以背刺</div>
                )}
                {myAllies.map((allyId) => {
                  const ally = currentRoom?.currentPlayers.find((p) => p.id === allyId);
                  if (!ally) return null;
                  const alliance = gameState?.alliances.find(
                    (a) => a.playerIds.includes(currentPlayer?.id || '') && a.playerIds.includes(allyId)
                  );
                  return (
                    <button
                      key={allyId}
                      onClick={() => handleBetray(allyId)}
                      className="w-full p-3 rounded-xl bg-midnight-800/60 border border-neon-purple/30 hover:border-neon-purple hover:bg-neon-purple/10 hover:shadow-neon-purple transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{
                            backgroundColor: `${ally.color}20`,
                            border: `2px solid ${ally.color}`,
                          }}
                        >
                          {ally.avatar}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold" style={{ color: ally.color }}>
                            {ally.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            盟友 · 剩余 {alliance?.turnLeft ?? 0} 回合
                          </div>
                        </div>
                      </div>
                      <span className="chip bg-neon-purple/20 text-neon-purple border border-neon-purple/40 text-xs">
                        背刺 +30资源
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectingAction(null)}
                className="w-full py-2.5 rounded-xl bg-midnight-800/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all text-sm"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingAction && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-card p-6 w-full max-w-md clip-corner animate-slide-up" style={{
            borderColor: pendingAction.color === 'cyan' ? '#00f0ff50' :
              pendingAction.color === 'red' ? '#ff2e6350' :
              pendingAction.color === 'green' ? '#39ff1450' : '#b026ff50',
            boxShadow: pendingAction.color === 'cyan' ? '0 0 30px #00f0ff40' :
              pendingAction.color === 'red' ? '0 0 30px #ff2e6340' :
              pendingAction.color === 'green' ? '0 0 30px #39ff1440' : '0 0 30px #b026ff40',
            borderWidth: '2px',
            borderStyle: 'solid',
          }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{
                backgroundColor: pendingAction.color === 'cyan' ? '#00f0ff20' :
                  pendingAction.color === 'red' ? '#ff2e6320' :
                  pendingAction.color === 'green' ? '#39ff1420' : '#b026ff20',
                border: `2px solid ${pendingAction.color === 'cyan' ? '#00f0ff' :
                  pendingAction.color === 'red' ? '#ff2e63' :
                  pendingAction.color === 'green' ? '#39ff14' : '#b026ff'}`,
              }}>
                {pendingAction.type === 'occupy' ? '🏴' :
                 pendingAction.type === 'steal' ? '⚔️' :
                 pendingAction.type === 'ally' ? '🤝' : '💔'}
              </div>
              <div>
                <h3 className="text-xl font-display font-bold" style={{
                  color: pendingAction.color === 'cyan' ? '#00f0ff' :
                    pendingAction.color === 'red' ? '#ff2e63' :
                    pendingAction.color === 'green' ? '#39ff14' : '#b026ff',
                  textShadow: `0 0 10px ${pendingAction.color === 'cyan' ? '#00f0ff80' :
                    pendingAction.color === 'red' ? '#ff2e6380' :
                    pendingAction.color === 'green' ? '#39ff1480' : '#b026ff80'}`,
                }}>
                  确认行动
                </h3>
                <p className="text-xs text-slate-400">确认后将不可撤销</p>
              </div>
            </div>
            <div className="bg-midnight-900/80 rounded-xl p-4 mb-4 border border-white/10 space-y-3">
              <p className="text-sm text-slate-200 font-medium">{pendingAction.preview}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {pendingAction.cost !== undefined && (
                  <span className="flex items-center gap-1 text-neon-red">
                    <span className="font-bold">消耗:</span>
                    <span>{pendingAction.cost} 资源</span>
                    <span className={cn((currentPlayerState?.resources ?? 0) < pendingAction.cost ? 'text-neon-red' : 'text-slate-500')}>
                      (当前: {currentPlayerState?.resources ?? 0})
                    </span>
                  </span>
                )}
                {pendingAction.gain !== undefined && (
                  <span className="flex items-center gap-1 text-neon-green">
                    <span className="font-bold">收益:</span>
                    <span>+{pendingAction.gain} 资源</span>
                  </span>
                )}
                {pendingAction.territoryDelta !== undefined && pendingAction.territoryDelta !== 0 && (
                  <span className="flex items-center gap-1 text-neon-cyan">
                    <span className="font-bold">领地:</span>
                    <span>+{pendingAction.territoryDelta}</span>
                    <span className="text-slate-500">(当前: {currentPlayerState?.ownedCells ?? 0})</span>
                  </span>
                )}
              </div>
            </div>
            {pendingAction.logPreview && (
              <div className="bg-midnight-800/50 rounded-xl p-3 mb-5 border border-dashed border-white/10">
                <p className="text-[10px] text-slate-500 mb-1 font-display">📜 战报预览</p>
                <p className="text-xs text-slate-300 leading-relaxed">{pendingAction.logPreview}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={cancelPendingAction}
                className="flex-1 py-3 rounded-xl bg-midnight-800/60 border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all font-display font-semibold text-sm"
              >
                取消
              </button>
              <button
                onClick={confirmPendingAction}
                disabled={pendingAction.cost !== undefined && (currentPlayerState?.resources ?? 0) < pendingAction.cost}
                className="flex-1 py-3 rounded-xl font-display font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: pendingAction.color === 'cyan' ? '#00f0ff20' :
                    pendingAction.color === 'red' ? '#ff2e6320' :
                    pendingAction.color === 'green' ? '#39ff1420' : '#b026ff20',
                  borderColor: pendingAction.color === 'cyan' ? '#00f0ff' :
                    pendingAction.color === 'red' ? '#ff2e63' :
                    pendingAction.color === 'green' ? '#39ff14' : '#b026ff',
                  borderWidth: '2px',
                  boxShadow: `0 0 20px ${pendingAction.color === 'cyan' ? '#00f0ff60' :
                    pendingAction.color === 'red' ? '#ff2e6360' :
                    pendingAction.color === 'green' ? '#39ff1460' : '#b026ff60'}`,
                }}
              >
                {pendingAction.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAbandonConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-card neon-border-amber p-6 w-full max-w-md clip-corner animate-shake">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-neon-amber/20 border-2 border-neon-amber flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-neon-amber text-shadow-neon-amber">
                  放弃移动，结束回合？
                </h3>
                <p className="text-xs text-slate-400">还有 {movesRemaining} 步未使用</p>
              </div>
            </div>
            <div className="bg-midnight-900/80 rounded-xl p-4 mb-5 border border-neon-amber/20">
              <p className="text-sm text-slate-300">
                你还有 <span className="text-neon-amber font-bold">{movesRemaining}</span> 步可以移动。
                如果现在结束回合，剩余步数将作废。
              </p>
              <p className="text-xs text-slate-500 mt-2">
                你可以先移动到资源点或敌方格子附近，再采取行动以获得最大收益。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelAbandonMoves}
                className="flex-1 py-3 rounded-xl bg-neon-amber/20 border-2 border-neon-amber/50 text-neon-amber hover:bg-neon-amber/30 transition-all font-display font-semibold text-sm"
              >
                继续移动
              </button>
              <button
                onClick={confirmAbandonMoves}
                className="flex-1 py-3 rounded-xl bg-neon-red/20 border-2 border-neon-red text-neon-red hover:bg-neon-red/30 transition-all font-display font-semibold text-sm"
              >
                确认结束
              </button>
            </div>
          </div>
        </div>
      )}

      {showEnterActionConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-card neon-border-amber p-6 w-full max-w-md clip-corner animate-shake">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-neon-amber/20 border-2 border-neon-amber flex items-center justify-center text-2xl">
                🚪
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-neon-amber text-shadow-neon-amber">
                进入行动阶段？
                </h3>
                <p className="text-xs text-slate-400">剩余 {movesRemaining} 步将作废</p>
              </div>
            </div>
            <div className="bg-midnight-900/80 rounded-xl p-4 mb-5 border border-neon-amber/20">
              <p className="text-sm text-slate-300">
                你还有 <span className="text-neon-amber font-bold">{movesRemaining}</span> 步可以移动。
                如果现在进入行动阶段，剩余移动步数将作废。
              </p>
              <p className="text-xs text-slate-500 mt-2">
                进入行动阶段后，你可以进行占领、抢夺、结盟、背刺等操作。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEnterActionConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-midnight-800/60 border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all font-display font-semibold text-sm"
              >
                继续移动
              </button>
              <button
                onClick={() => {
                  enterActionPhase();
                  setShowEnterActionConfirm(false);
                }}
                className="flex-1 py-3 rounded-xl bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/30 transition-all font-display font-semibold text-sm"
              >
                确认进入
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <button
          onClick={handleEndTurn}
          disabled={!isMyTurn}
          className={cn(
            'relative px-10 py-4 rounded-xl font-display font-bold tracking-widest text-base flex items-center gap-3 transition-all duration-300 border-2',
            isMyTurn
              ? 'bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-pink/20 border-neon-cyan text-white hover:shadow-neon-cyan hover:shadow-neon-purple hover:scale-105'
              : 'bg-midnight-800/50 border-slate-600/40 text-slate-500 cursor-not-allowed'
          )}
        >
          <SkipForward className={cn('w-6 h-6', isMyTurn && 'animate-pulse')} />
          结束回合
        </button>
      </div>
    </div>
  );
}
