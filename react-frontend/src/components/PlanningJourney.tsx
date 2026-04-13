import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, FileText, Globe, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface PlanningJourneyProps {
  compact?: boolean;
}

type StepStatus = 'completed' | 'active' | 'inactive';

interface Step {
  label: string;
  icon: React.ElementType;
  status: StepStatus;
}

interface NextAction {
  message: string;
  buttonLabel: string;
  href: string;
}

const PlanningJourney: React.FC<PlanningJourneyProps> = ({ compact = false }) => {
  const navigate = useNavigate();
  const blueprintId = useAppStore((s) => s.blueprintId);
  const weddingPreferences = useAppStore((s) => s.weddingPreferences);
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  const { steps, nextAction } = useMemo(() => {
    const hasPreferences = !!(
      weddingPreferences &&
      (weddingPreferences.weddingType || weddingPreferences.city || weddingPreferences.budget)
    );
    const hasBlueprint = blueprintId !== null;

    let blueprintStatus: string | null = null;
    let shortlistedVendors: any[] = [];
    let bookedVendors: any[] = [];

    try {
      blueprintStatus = localStorage.getItem('blueprintStatus');
      const slRaw = localStorage.getItem('shortlistedVendors');
      if (slRaw) shortlistedVendors = JSON.parse(slRaw);
      const bkRaw = localStorage.getItem('bookedVendors');
      if (bkRaw) bookedVendors = JSON.parse(bkRaw);
    } catch { /* ignore */ }

    const isPublished = blueprintStatus === 'published';
    const hasShortlisted = shortlistedVendors.length > 0;
    const allBooked = bookedVendors.length > 0;

    let activeStep = 0;
    if (allBooked) activeStep = 4;
    else if (hasShortlisted) activeStep = 3;
    else if (isPublished) activeStep = 3;
    else if (hasBlueprint) activeStep = 2;
    else if (hasPreferences) activeStep = 1;

    const stepDefs: Array<{ label: string; icon: React.ElementType }> = [
      { label: 'Preferences', icon: Heart },
      { label: 'Blueprint', icon: FileText },
      { label: 'Published', icon: Globe },
      { label: 'Vendors', icon: Users },
      { label: 'Booked', icon: CheckCircle },
    ];

    const stepsResult: Step[] = stepDefs.map((def, i) => ({
      ...def,
      status: i < activeStep ? 'completed' : i === activeStep ? 'active' : 'inactive',
    }));

    let action: NextAction;
    if (allBooked) {
      action = { message: "You're all set! Manage your wedding timeline", buttonLabel: 'Timeline', href: '/wedding-invites' };
    } else if (hasShortlisted) {
      action = { message: 'Finalize your vendor selections', buttonLabel: 'Review Vendors', href: '/quotes' };
    } else if (isPublished) {
      action = { message: 'Vendors are bidding! Review incoming quotes', buttonLabel: 'View Quotes', href: '/quotes' };
    } else if (hasBlueprint) {
      action = { message: 'Review and publish your blueprint to get vendor quotes', buttonLabel: 'Review Blueprint', href: '/blueprint' };
    } else if (hasPreferences) {
      action = { message: 'Generate your AI wedding blueprint', buttonLabel: 'Generate Blueprint', href: '/plan' };
    } else {
      action = { message: 'Start by telling us about your dream wedding', buttonLabel: 'Set Preferences', href: '/plan' };
    }

    return { steps: stepsResult, nextAction: action };
  }, [blueprintId, weddingPreferences]);

  const stepStyle = (status: StepStatus) => {
    if (status === 'completed') return {
      ring: isDark ? 'bg-sage-600' : 'bg-sage-500',
      icon: 'text-white',
      label: isDark ? 'text-sage-300' : 'text-sage-700',
    };
    if (status === 'active') return {
      ring: 'bg-rose-500 shadow-glow-rose',
      icon: 'text-white',
      label: isDark ? 'text-rose-300' : 'text-rose-600',
    };
    return {
      ring: isDark ? 'bg-gray-700' : 'bg-gray-200',
      icon: isDark ? 'text-gray-500' : 'text-gray-400',
      label: isDark ? 'text-gray-500' : 'text-gray-400',
    };
  };

  const connectorColor = (leftStatus: StepStatus) =>
    leftStatus === 'completed'
      ? isDark ? 'bg-sage-700' : 'bg-sage-300'
      : isDark ? 'bg-gray-700' : 'bg-gray-200';

  // ── Compact ──
  if (compact) {
    return (
      <div className={`rounded-2xl px-5 py-3.5 border shadow-soft ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, i) => {
            const s = stepStyle(step.status);
            const Icon = step.icon;
            return (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <motion.div
                    initial={false}
                    animate={{ scale: step.status === 'active' ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${s.ring}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${s.icon}`} />
                  </motion.div>
                  <span className={`text-[10px] font-medium truncate ${s.label}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-[2px] rounded-full mx-1 mt-[-1rem] ${connectorColor(step.status)}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Full ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-3xl p-7 border shadow-card ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}
    >
      <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Your Wedding Journey</h3>

      <div className="flex items-center justify-between mb-7">
        {steps.map((step, i) => {
          const s = stepStyle(step.status);
          const Icon = step.icon;
          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center gap-2.5 min-w-0">
                <motion.div
                  initial={false}
                  animate={{
                    scale: step.status === 'active' ? 1.15 : 1,
                    boxShadow: step.status === 'active'
                      ? '0 0 0 4px rgba(212,115,110,0.2)'
                      : '0 0 0 0px rgba(0,0,0,0)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${s.ring}`}
                >
                  <Icon className={`w-5 h-5 ${s.icon}`} />
                </motion.div>
                <span className={`text-xs font-medium ${s.label}`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-[2px] rounded-full mx-3 mt-[-1.5rem] ${connectorColor(step.status)}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* What's Next CTA */}
      <div className={`rounded-2xl p-5 flex items-center justify-between gap-4 ${
        isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-gradient-to-r from-rose-50 to-rose-50/50 border border-rose-100/50'
      }`}>
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${
            isDark ? 'text-rose-400' : 'text-rose-400'
          }`}>What's Next</p>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{nextAction.message}</p>
        </div>
        <button
          onClick={() => navigate(nextAction.href)}
          className="btn-primary flex items-center gap-2 shrink-0 text-sm"
        >
          {nextAction.buttonLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default PlanningJourney;
