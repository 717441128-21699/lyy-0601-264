import { HelpCircle, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { useGuideStore } from '@/store';
import { cn } from '@/lib/utils';

interface GuideStep {
  title: string;
  description: string;
  icon: typeof HelpCircle;
  highlight?: string;
}

const steps: GuideStep[] = [
  {
    title: '欢迎来到领地战棋',
    description: '在霓虹闪烁的赛博世界中，与好友展开一场策略与谋略的对决。占领格子、积累资源、合纵连横，成为最终的领地霸主！',
    icon: Sparkles,
  },
  {
    title: '大厅',
    description: '创建属于你的私人房间，或加入好友的战局。使用邀请码快速组队，设置密码保护私密对战。',
    icon: HelpCircle,
    highlight: '大厅区域',
  },
  {
    title: '角色配置',
    description: '打造独一无二的赛博身份：选择炫酷外观、配置战术技能、解锁荣誉称号。你的角色，你的风格。',
    icon: HelpCircle,
    highlight: '角色配置区域',
  },
  {
    title: '地图',
    description: '战棋地图由多种格子组成：普通格子可供占领，资源点产出额外收益，陷阱则会让你损失资源并暂停回合。',
    icon: HelpCircle,
    highlight: '地图区域',
  },
  {
    title: '回合操作',
    description: '每回合掷骰决定移动步数，在地图上策略性移动。占领空地消耗少量资源，抢夺敌方领地则需要更多资源并有概率失败。',
    icon: HelpCircle,
    highlight: '回合操作区域',
  },
  {
    title: '结盟与背叛',
    description: '与其他玩家缔结临时同盟，共同对抗强敌。但要小心——盟友随时可能背刺突袭，获取巨额资源奖励！',
    icon: HelpCircle,
    highlight: '结盟区域',
  },
  {
    title: '战报与排行',
    description: '对局结束后查看详细战报，分析每一步的得失。冲击赛季排行榜，成为全服公认的战棋大师！',
    icon: HelpCircle,
    highlight: '战报区域',
  },
];

export default function GuideOverlay() {
  const { showGuide, currentStep, totalSteps, nextStep, prevStep, closeGuide } = useGuideStore();

  if (!showGuide) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="absolute inset-0 bg-midnight-950/85 backdrop-blur-sm">
        {step.highlight && (
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-transparent border-2 border-neon-cyan/60 shadow-neon-cyan animate-pulse-slow" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-neon-purple/30 animate-spin-slow" />
          </div>
        )}
      </div>

      <button
        onClick={closeGuide}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-midnight-800/80 border border-neon-red/40 text-neon-red flex items-center justify-center transition-all duration-300 hover:bg-neon-red/10 hover:border-neon-red hover:shadow-neon-red"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md glass-card neon-border-purple p-6 animate-slide-up">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />

          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/40 flex items-center justify-center shadow-neon-cyan shrink-0">
              <StepIcon className="w-6 h-6 text-neon-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-display tracking-widest px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                  步骤 {currentStep + 1} / {totalSteps}
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-shadow-neon-cyan text-neon-cyan">
                {step.title}
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-6 min-h-[60px]">
            {step.description}
          </p>

          {step.highlight && (
            <div className="mb-5 px-3 py-2 rounded-lg bg-midnight-900/60 border border-neon-cyan/20 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-gold shrink-0" />
              <span className="text-xs text-neon-gold">关注高亮区域：{step.highlight}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 mb-5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx === currentStep
                    ? 'w-8 bg-gradient-to-r from-neon-cyan to-neon-purple shadow-neon-cyan'
                    : idx < currentStep
                    ? 'w-1.5 bg-neon-purple'
                    : 'w-1.5 bg-white/15'
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={prevStep}
              disabled={isFirst}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-midnight-800/60 border border-white/10 text-slate-400 text-sm font-display tracking-wider transition-all duration-300 hover:border-neon-cyan/30 hover:text-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-slate-400"
            >
              <ChevronLeft className="w-4 h-4" />
              上一步
            </button>

            <button
              onClick={closeGuide}
              className="text-xs text-slate-500 hover:text-neon-pink transition-colors duration-300"
            >
              跳过引导
            </button>

            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-4 py-2 rounded-lg font-display tracking-wider text-sm transition-all duration-300 active:scale-95 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan text-neon-cyan hover:shadow-neon-cyan"
            >
              {isLast ? '开始游戏' : '下一步'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
