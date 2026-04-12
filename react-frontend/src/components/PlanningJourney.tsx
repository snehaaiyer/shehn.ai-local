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

  const { steps, nextAction } = useMemo(() => {
    // Derive state from store + localStorage
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
    } catch {
      // ignore parse errors
    }

    const isPublished = blueprintStatus === 'published';
    const hasShortlisted = shortlistedVendors.length > 0;
    const allBooked = bookedVendors.length > 0;

    // Determine current active step index (0-based)
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

    // Determine next action
    let action: NextAction;
    if (allBooked) {
      action = {
        message: "You're all set! Manage your wedding timeline",
        buttonLabel: 'Wedding Timeline',
        href: '/wedding-invites',
      };
    } else if (hasShortlisted) {
      action = {
        message: 'Finalize your vendor selections',
        buttonLabel: 'Review Vendors',
        href: '/quotes',
      };
    } else if (isPublished) {
      action = {
        message: 'Vendors are bidding! Review incoming quotes',
        buttonLabel: 'View Quotes',
        href: '/quotes',
      };
    } else if (hasBlueprint) {
      action = {
        message: 'Review and publish your blueprint to get vendor quotes',
        buttonLabel: 'Review Blueprint',
        href: '/blueprint',
      };
    } else if (hasPreferences) {
      action = {
        message: 'Generate your AI wedding blueprint',
        buttonLabel: 'Generate Blueprint',
        href: '/plan',
      };
    } else {
      action = {
        message: 'Start by telling us about your dream wedding',
        buttonLabel: 'Set Preferences',
        href: '/plan',
      };
    }

    return { steps: stepsResult, nextAction: action };
  }, [blueprintId, weddingPreferences]);

  const statusColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return { bg: '#16a34a', text: '#ffffff' }; // green
      case 'active':
        return { bg: '#D4736E', text: '#ffffff' }; // rose/pink
      case 'inactive':
        return { bg: '#e5e7eb', text: '#9ca3af' }; // gray
    }
  };

  const connectorColor = (leftStatus: StepStatus) =>
    leftStatus === 'completed' ? '#16a34a' : '#e5e7eb';

  // ── Compact variant ──
  if (compact) {
    return (
      <div className="bg-white rounded-2xl px-6 py-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, i) => {
            const colors = statusColor(step.status);
            const Icon = step.icon;
            return (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <motion.div
                    initial={false}
                    animate={{ scale: step.status === 'active' ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color: colors.text }} />
                  </motion.div>
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: step.status === 'inactive' ? '#9ca3af' : '#374151' }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-0.5 rounded-full mx-1 mt-[-1rem]"
                    style={{ backgroundColor: connectorColor(step.status) }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Full variant ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-6">Your Wedding Journey</h3>

      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, i) => {
          const colors = statusColor(step.status);
          const Icon = step.icon;
          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center gap-2 min-w-0">
                <motion.div
                  initial={false}
                  animate={{
                    scale: step.status === 'active' ? 1.2 : 1,
                    boxShadow:
                      step.status === 'active'
                        ? '0 0 0 4px rgba(212,115,110,0.25)'
                        : '0 0 0 0px rgba(0,0,0,0)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: colors.text }} />
                </motion.div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color:
                      step.status === 'inactive'
                        ? '#9ca3af'
                        : step.status === 'active'
                        ? '#D4736E'
                        : '#374151',
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 rounded-full mx-3 mt-[-1.5rem]"
                  style={{ backgroundColor: connectorColor(step.status) }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* What's Next */}
      <div className="bg-rose-50 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
            What's Next
          </p>
          <p className="text-gray-800 font-medium">{nextAction.message}</p>
        </div>
        <button
          onClick={() => navigate(nextAction.href)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:opacity-90 shrink-0"
          style={{ backgroundColor: '#D4736E' }}
        >
          {nextAction.buttonLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default PlanningJourney;
