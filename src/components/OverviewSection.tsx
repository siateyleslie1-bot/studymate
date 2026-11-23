import { ArrowRight, BookOpen, CheckCircle2, Clock, Layers, Users } from 'lucide-react';
import {
  CAMPUS_FOCUS_IMAGE,
  FLASHCARD_STUDIO_IMAGE,
  HERO_COLLAB_IMAGE,
  MOMO_MERCHANT_NUMBER,
} from '../data/seedData';
import {
  AcademicLevel,
  ExamGoal,
  FlashcardDeck,
  NavSection,
  StudyGroup,
  StudySessionLog,
  SubscriptionRecord,
} from '../types/studymate';
import { ResilientImage } from './ResilientImage';

interface OverviewSectionProps {
  selectedLevel: AcademicLevel | 'All';
  onSelectLevel: (level: AcademicLevel | 'All') => void;
  groups: StudyGroup[];
  decks: FlashcardDeck[];
  logs: StudySessionLog[];
  goals: ExamGoal[];
  activeSubscription: SubscriptionRecord | null;
  onNavigate: (section: NavSection) => void;
  onStartDeck: (deckId: string) => void;
  onOpenGroup: (groupId: string) => void;
  onToggleTask: (goalId: string, taskId: string) => void;
}

const LEVEL_OPTIONS: { value: AcademicLevel | 'All'; label: string }[] = [
  { value: 'All', label: 'All Levels' },
  { value: 'JHS', label: 'JHS (BECE)' },
  { value: 'SHS', label: 'SHS (WASSCE)' },
  { value: 'University', label: 'University' },
];

export function OverviewSection({
  selectedLevel,
  onSelectLevel,
  groups,
  decks,
  logs,
  goals,
  activeSubscription,
  onNavigate,
  onStartDeck,
  onOpenGroup,
  onToggleTask,
}: OverviewSectionProps) {
  const filteredGroups =
    selectedLevel === 'All' ? groups : groups.filter((g) => g.level === selectedLevel);
  const filteredDecks =
    selectedLevel === 'All' ? decks : decks.filter((d) => d.level === selectedLevel);
  const filteredLogs =
    selectedLevel === 'All' ? logs : logs.filter((l) => l.level === selectedLevel);
  const filteredGoals =
    selectedLevel === 'All' ? goals : goals.filter((g) => g.level === selectedLevel);

  const totalMinutes = filteredLogs.reduce((acc, item) => acc + item.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalCards = filteredDecks.reduce((acc, d) => acc + d.cards.length, 0);
  const masteredCards = filteredDecks.reduce(
    (acc, d) => acc + d.cards.filter((c) => c.mastery === 'mastered').length,
    0,
  );
  const joinedGroupsCount = groups.filter((g) => g.joined).length;

  const uniqueStudyDays = new Set(logs.map((l) => l.date)).size;

  return (
    <div className="space-y-10">
      {/* Workspace Toolbar: Level Switcher + Subscription Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Curriculum Focus:</span>
          <div
            role="group"
            aria-label="Filter by academic level"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
          >
            {LEVEL_OPTIONS.map((opt) => {
              const active = selectedLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectLevel(opt.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          {activeSubscription ? (
            <>
              <span className="font-semibold text-emerald-700">
                Active · {activeSubscription.planName}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-xs tabular-nums">
                Ref {activeSubscription.referenceCode}
              </span>
            </>
          ) : (
            <>
              <span>Flexible plans from GH₵ 10/hr</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigate('plans')}
                className="font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Activate via MoMo ({MOMO_MERCHANT_NUMBER})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-blue-700 mb-3">
              JHS (BECE) · SHS (WASSCE) · University Coursework
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.15] text-balance max-w-2xl">
              Learn together, master flashcards, and track every study hour.
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
              StudyMate brings peer study circles, shared spaced-repetition flashcard decks,
              exam countdown planners, and clear progress metrics into one calm workspace built
              for Ghanaian students.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (filteredDecks[0]) {
                  onStartDeck(filteredDecks[0].id);
                } else {
                  onNavigate('flashcards');
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Study Flashcards Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('groups')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Browse Study Groups</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 bg-white min-h-[260px]">
          <ResilientImage
            src={HERO_COLLAB_IMAGE}
            alt="Students studying collaboratively at a bright library table with textbooks and laptops"
            fallbackLabel="Collaborative Study Circle"
            className="w-full h-full lg:h-full object-cover"
          />
        </div>
      </section>

      {/* Full-Width 4-Column KPI Strip */}
      <section
        aria-label="Personal learning summary"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Logged Study Time</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {totalHours} hrs
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedLevel === 'All' ? 'Across all levels' : `${selectedLevel} focus`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Flashcards Mastered</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {masteredCards} / {totalCards}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {totalCards > 0 ? `${Math.round((masteredCards / totalCards) * 100)}% mastery rate` : 'No cards yet'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Study Groups Joined</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {joinedGroupsCount} / {groups.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Peer circles active this week</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Active Study Streak</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {uniqueStudyDays} days
          </p>
          <p className="mt-1 text-xs text-slate-500">Consistent daily review habit</p>
        </div>
      </section>

      {/* Featured Decks + Study Groups Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Shared Flashcard Decks */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Shared Flashcard Decks
              </h2>
              <p className="text-sm text-slate-600">
                Pick a peer-reviewed deck to flip cards or generate a practice quiz.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('flashcards')}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              All Decks
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
            {filteredDecks.slice(0, 3).map((deck) => {
              const mastered = deck.cards.filter((c) => c.mastery === 'mastered').length;
              return (
                <div
                  key={deck.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">{deck.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{deck.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{deck.cards.length} cards</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-slate-900 truncate">
                      {deck.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 tabular-nums">
                      Mastered {mastered} of {deck.cards.length} · Shared by {deck.author}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartDeck(deck.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Study Deck</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Study Groups */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Active Study Groups
              </h2>
              <p className="text-sm text-slate-600">
                Collaborate on past questions, shared notes, and live review sessions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('groups')}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              All Groups
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
            {filteredGroups.slice(0, 3).map((group) => (
              <div
                key={group.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">{group.level}</span>
                    <span aria-hidden="true">·</span>
                    <span>{group.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {group.membersCount}/{group.maxMembers} members
                    </span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900 truncate">
                    {group.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {group.schedule} · {group.joined ? 'Member' : 'Open to join'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenGroup(group.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Open Group</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Readiness & Editorial Study Spaces */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Upcoming Exam Milestones
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('progress')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Full Tracker
              </button>
            </div>

            <div className="space-y-5">
              {filteredGoals.slice(0, 2).map((goal) => {
                const pct = Math.min(
                  100,
                  Math.round((goal.completedHours / goal.targetHours) * 100),
                );
                return (
                  <div key={goal.id} className="pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>
                        {goal.level} · {goal.subject}
                      </span>
                      <span className="font-mono tabular-nums">{goal.examDate}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                    <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-700 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                      <span>
                        {goal.completedHours} / {goal.targetHours} hrs completed
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {goal.tasks.slice(0, 2).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onToggleTask(goal.id, task.id)}
                          className="w-full flex items-center gap-2 text-left text-xs text-slate-700 hover:text-slate-900 py-0.5 cursor-pointer"
                        >
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 ${
                              task.completed ? 'text-emerald-600' : 'text-slate-300'
                            }`}
                          />
                          <span className={task.completed ? 'line-through text-slate-400' : ''}>
                            {task.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="aspect-4/3 overflow-hidden bg-slate-100">
              <ResilientImage
                src={FLASHCARD_STUDIO_IMAGE}
                alt="Minimalist desk flat-lay with biology study flashcards and grid notebook"
                fallbackLabel="Flashcard Studio"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Spaced Repetition & Auto-Quizzes
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Flip peer-shared decks, reveal formula hints, and test yourself with instant
                  multiple-choice drills.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('flashcards')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Flashcard Studio</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="aspect-4/3 overflow-hidden bg-slate-100">
              <ResilientImage
                src={CAMPUS_FOCUS_IMAGE}
                alt="Quiet library study desk with reference textbooks and open study planner"
                fallbackLabel="Flexible Study Plans"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Pay-As-You-Learn Study Plans
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Choose GH₵ 10/hour cram passes, GH₵ 100/month scholar access, or GH₵ 1,000/year
                  mastery via MoMo {MOMO_MERCHANT_NUMBER}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('plans')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>View GH₵ Plans & MoMo Checkout</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
