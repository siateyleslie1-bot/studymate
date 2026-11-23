import { NavSection } from '../types/studymate';

interface HeaderProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  hasActivePlan: boolean;
}

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'groups', label: 'Study Groups' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'progress', label: 'Progress' },
  { id: 'plans', label: 'Plans' },
];

export function Header({ activeSection, onNavigate, hasActivePlan }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          StudyMate
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 ${
                  isActive
                    ? 'border-blue-700 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('plans')}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            {hasActivePlan ? 'Manage Plan' : 'Get Study Plan'}
          </button>
        </div>
      </div>

      {/* Mobile compact secondary row only under md */}
      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center gap-4 overflow-x-auto px-4 py-2 border-t border-slate-100 text-xs font-medium"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 ${
                isActive
                  ? 'border-blue-700 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
