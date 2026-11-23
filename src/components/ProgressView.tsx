import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { SUBJECTS_BY_LEVEL } from '../data/seedData';
import {
  AcademicLevel,
  ExamGoal,
  FlashcardDeck,
  QuickNote,
  StudySessionLog,
} from '../types/studymate';

interface ProgressViewProps {
  selectedLevel: AcademicLevel | 'All';
  onSelectLevel: (level: AcademicLevel | 'All') => void;
  logs: StudySessionLog[];
  decks: FlashcardDeck[];
  goals: ExamGoal[];
  notes: QuickNote[];
  onLogStudy: (subject: string, level: AcademicLevel, minutes: number, cardsReviewed: number) => void;
  onToggleTask: (goalId: string, taskId: string) => void;
  onAddGoal: (goal: Omit<ExamGoal, 'id' | 'completedHours' | 'tasks'>) => void;
  onAddTaskToGoal: (goalId: string, title: string) => void;
  onAddNote: (note: Omit<QuickNote, 'id' | 'updatedAt'>) => void;
}

type TimerMode = 'focus' | 'short' | 'long';

const TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

export function ProgressView({
  selectedLevel,
  onSelectLevel,
  logs,
  decks,
  goals,
  notes,
  onLogStudy,
  onToggleTask,
  onAddGoal,
  onAddTaskToGoal,
  onAddNote,
}: ProgressViewProps) {
  // Pomodoro Focus Timer State
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(TIMER_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [focusLevel, setFocusLevel] = useState<AcademicLevel>(
    selectedLevel === 'All' ? 'SHS' : selectedLevel,
  );
  const [focusSubject, setFocusSubject] = useState(
    SUBJECTS_BY_LEVEL[selectedLevel === 'All' ? 'SHS' : selectedLevel][0],
  );
  const [timerMessage, setTimerMessage] = useState<string | null>(null);

  // Add Goal State
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalLevel, setGoalLevel] = useState<AcademicLevel>('SHS');
  const [goalSubject, setGoalSubject] = useState(SUBJECTS_BY_LEVEL.SHS[0]);
  const [goalDate, setGoalDate] = useState('2026-12-20');
  const [goalHours, setGoalHours] = useState(20);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

  // Quick Note Form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteLevel, setNoteLevel] = useState<AcademicLevel>('SHS');
  const [noteSubject, setNoteSubject] = useState(SUBJECTS_BY_LEVEL.SHS[0]);
  const [noteFormula, setNoteFormula] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (timerMode === 'focus') {
            onLogStudy(focusSubject, focusLevel, 25, 0);
            setTimerMessage(`Completed 25m focus session on ${focusSubject} (${focusLevel}).`);
          } else {
            setTimerMessage('Break finished. Ready for the next study block.');
          }
          return TIMER_DURATIONS[timerMode];
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, timerMode, focusSubject, focusLevel, onLogStudy]);

  const handleSwitchTimerMode = (next: TimerMode) => {
    setIsRunning(false);
    setTimerMode(next);
    setSecondsLeft(TIMER_DURATIONS[next]);
    setTimerMessage(null);
  };

  const handleLogManualBlock = () => {
    const elapsedSeconds = TIMER_DURATIONS.focus - secondsLeft;
    const mins = Math.max(15, Math.round(elapsedSeconds / 60));
    onLogStudy(focusSubject, focusLevel, mins, 0);
    setTimerMessage(`Logged ${mins} minutes for ${focusSubject} (${focusLevel}).`);
    setIsRunning(false);
    setSecondsLeft(TIMER_DURATIONS[timerMode]);
  };

  const filteredLogs =
    selectedLevel === 'All' ? logs : logs.filter((l) => l.level === selectedLevel);
  const filteredDecks =
    selectedLevel === 'All' ? decks : decks.filter((d) => d.level === selectedLevel);
  const filteredGoals =
    selectedLevel === 'All' ? goals : goals.filter((g) => g.level === selectedLevel);
  const filteredNotes =
    selectedLevel === 'All' ? notes : notes.filter((n) => n.level === selectedLevel);

  // Weekly 7-day chart data (Nov 17 – Nov 23, 2026)
  const last7Days = useMemo(() => {
    const days = [
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
    ];
    return days.map((dateStr) => {
      const dayLogs = filteredLogs.filter((l) => l.date === dateStr);
      const mins = dayLogs.reduce((acc, l) => acc + l.minutes, 0);
      const label = new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
      });
      return { dateStr, label, mins };
    });
  }, [filteredLogs]);

  const maxMinutes = Math.max(60, ...last7Days.map((d) => d.mins));

  // Subject mastery breakdown
  const subjectStats = useMemo(() => {
    const map = new Map<
      string,
      { level: AcademicLevel; totalCards: number; mastered: number; minutes: number }
    >();
    filteredDecks.forEach((d) => {
      const existing = map.get(d.subject) || {
        level: d.level,
        totalCards: 0,
        mastered: 0,
        minutes: 0,
      };
      existing.totalCards += d.cards.length;
      existing.mastered += d.cards.filter((c) => c.mastery === 'mastered').length;
      map.set(d.subject, existing);
    });
    filteredLogs.forEach((l) => {
      const existing = map.get(l.subject) || {
        level: l.level,
        totalCards: 0,
        mastered: 0,
        minutes: 0,
      };
      existing.minutes += l.minutes;
      map.set(l.subject, existing);
    });
    return Array.from(map.entries()).map(([subject, data]) => {
      const pct =
        data.totalCards > 0 ? Math.round((data.mastered / data.totalCards) * 100) : 0;
      const statusText =
        pct >= 75 ? 'Mastered' : pct >= 40 ? 'In Progress' : 'Needs Focus';
      return { subject, ...data, pct, statusText };
    });
  }, [filteredDecks, filteredLogs]);

  const totalMinutes = filteredLogs.reduce((acc, l) => acc + l.minutes, 0);
  const totalCardsReviewed = filteredLogs.reduce((acc, l) => acc + l.cardsReviewed, 0);
  const quizScores = filteredLogs
    .map((l) => l.quizScore)
    .filter((s): s is number => typeof s === 'number');
  const avgQuizScore =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

  const formattedClock = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60,
  ).padStart(2, '0')}`;

  const handleExportCsv = () => {
    const header = 'Date,Level,Subject,Minutes,CardsReviewed,QuizScore,ActivityType\n';
    const rows = logs
      .map(
        (l) =>
          `${l.date},${l.level},"${l.subject}",${l.minutes},${l.cardsReviewed},${l.quizScore ?? ''},${l.activityType}`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'studymate-progress-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    onAddGoal({
      title: goalTitle.trim(),
      level: goalLevel,
      subject: goalSubject,
      examDate: goalDate,
      targetHours: Number(goalHours) || 15,
    });
    setGoalTitle('');
    setShowAddGoal(false);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    onAddNote({
      title: noteTitle.trim(),
      level: noteLevel,
      subject: noteSubject,
      formulaOrKeyPoint: noteFormula.trim() || 'Key Study Principle',
      content: noteContent.trim(),
    });
    setNoteTitle('');
    setNoteFormula('');
    setNoteContent('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Personalized Progress Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor study hours, subject mastery, Pomodoro focus blocks, exam milestones, and
            formula notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(['All', 'JHS', 'SHS', 'University'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onSelectLevel(lvl)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl === 'All' ? 'All Levels' : lvl}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Study Time Logged</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900 tabular-nums">
            {(totalMinutes / 60).toFixed(1)} hrs
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">{totalMinutes} total minutes</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Flashcards Reviewed</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900 tabular-nums">
            {totalCardsReviewed}
          </p>
          <p className="mt-1 text-xs text-slate-500">Spaced-repetition review sessions</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Average Quiz Accuracy</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900 tabular-nums">
            {avgQuizScore > 0 ? `${avgQuizScore}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {quizScores.length} completed practice quizzes
          </p>
        </div>
      </div>

      {/* Weekly Activity Chart + Built-in Pomodoro Focus Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Weekly Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Weekly Study Activity
                </h2>
                <p className="text-xs text-slate-500">Minutes studied per day (Nov 17 – Nov 23)</p>
              </div>
              <span className="font-mono text-xs text-slate-600 tabular-nums">
                Target: 60 min/day
              </span>
            </div>

            <div className="grid grid-cols-7 gap-3 items-end h-48 pt-6">
              {last7Days.map((day) => {
                const heightPct = Math.round((day.mins / maxMinutes) * 100);
                return (
                  <div key={day.dateStr} className="flex flex-col items-center h-full justify-end">
                    <span className="text-[11px] font-mono text-slate-600 tabular-nums mb-1.5">
                      {day.mins}m
                    </span>
                    <div className="w-full max-w-[40px] flex-1 flex items-end bg-slate-100 rounded-md overflow-hidden">
                      <div
                        className="w-full bg-blue-700 rounded-t-md transition-all duration-300"
                        style={{ height: `${Math.max(day.mins > 0 ? 8 : 0, heightPct)}%` }}
                      />
                    </div>
                    <span className="mt-2 text-xs font-medium text-slate-600">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pomodoro Focus Timer */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-700" />
              <h2 className="font-display text-lg font-bold text-slate-900">Focus Timer</h2>
            </div>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {(
                [
                  { id: 'focus', label: '25m' },
                  { id: 'short', label: '5m' },
                  { id: 'long', label: '15m' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSwitchTimerMode(m.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    timerMode === m.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="py-3 text-center bg-slate-50 border border-slate-200 rounded-xl">
            <p className="font-mono text-4xl sm:text-5xl font-semibold text-slate-900 tabular-nums tracking-tight">
              {formattedClock}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {timerMode === 'focus' ? `Focusing on ${focusSubject}` : 'Scheduled rest interval'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={focusLevel}
              onChange={(e) => {
                const lvl = e.target.value as AcademicLevel;
                setFocusLevel(lvl);
                setFocusSubject(SUBJECTS_BY_LEVEL[lvl][0]);
              }}
              aria-label="Focus academic level"
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            >
              <option value="JHS">JHS</option>
              <option value="SHS">SHS</option>
              <option value="University">University</option>
            </select>
            <select
              value={focusSubject}
              onChange={(e) => setFocusSubject(e.target.value)}
              aria-label="Focus subject"
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            >
              {SUBJECTS_BY_LEVEL[focusLevel].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {timerMessage && (
            <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {timerMessage}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRunning((prev) => !prev)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(TIMER_DURATIONS[timerMode]);
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleLogManualBlock}
              className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              + Log Session
            </button>
          </div>
        </div>
      </div>

      {/* Subject Mastery Breakdown & Exam Countdown Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subject Mastery */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Subject Mastery Breakdown
          </h2>
          <div className="space-y-4">
            {subjectStats.map((item) => (
              <div key={item.subject} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {item.subject} <span className="font-normal text-slate-500">· {item.level}</span>
                  </span>
                  <span className="tabular-nums text-slate-600">
                    {item.pct}% ·{' '}
                    <strong
                      className={
                        item.statusText === 'Mastered'
                          ? 'text-emerald-700'
                          : item.statusText === 'In Progress'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                      }
                    >
                      {item.statusText}
                    </strong>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.statusText === 'Mastered'
                        ? 'bg-emerald-600'
                        : item.statusText === 'In Progress'
                          ? 'bg-blue-700'
                          : 'bg-amber-600'
                    }`}
                    style={{ width: `${Math.max(4, item.pct)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  {item.mastered}/{item.totalCards} flashcards mastered · {item.minutes} min logged
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Countdown & Tasks */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Exam Countdown & Revision Checklists
              </h2>
              <p className="text-xs text-slate-500">
                Track BECE, WASSCE, and semester exam milestones
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddGoal((prev) => !prev)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Exam Target</span>
            </button>
          </div>

          {showAddGoal && (
            <form
              onSubmit={handleCreateGoalSubmit}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Exam title (e.g. WASSCE Core Maths Mock)"
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={goalLevel}
                  onChange={(e) => {
                    const lvl = e.target.value as AcademicLevel;
                    setGoalLevel(lvl);
                    setGoalSubject(SUBJECTS_BY_LEVEL[lvl][0]);
                  }}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  <option value="JHS">JHS</option>
                  <option value="SHS">SHS</option>
                  <option value="University">University</option>
                </select>
                <select
                  value={goalSubject}
                  onChange={(e) => setGoalSubject(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  {SUBJECTS_BY_LEVEL[goalLevel].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={2}
                  max={200}
                  value={goalHours}
                  onChange={(e) => setGoalHours(Number(e.target.value))}
                  placeholder="Target hours"
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg tabular-nums"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-lg cursor-pointer"
                >
                  Save Goal
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {filteredGoals.map((goal) => {
              const daysRemaining = Math.max(
                0,
                Math.ceil(
                  (new Date(goal.examDate).getTime() - new Date('2026-11-23').getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              );
              const pct = Math.min(100, Math.round((goal.completedHours / goal.targetHours) * 100));
              const draftTask = newTaskInputs[goal.id] || '';
              return (
                <div
                  key={goal.id}
                  className="p-4 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        {goal.level} · {goal.subject}
                      </p>
                      <h3 className="font-display text-sm font-bold text-slate-900">
                        {goal.title}
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                      {daysRemaining} days left ({goal.examDate})
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-700 rounded-full" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="space-y-1.5">
                    {goal.tasks.map((task) => (
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

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!draftTask.trim()) return;
                      onAddTaskToGoal(goal.id, draftTask.trim());
                      setNewTaskInputs((prev) => ({ ...prev, [goal.id]: '' }));
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={draftTask}
                      onChange={(e) =>
                        setNewTaskInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))
                      }
                      placeholder="Add revision task..."
                      className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-700"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Notes & Formula Vault */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Formula Sheet & Quick Study Notes
          </h2>
          <p className="text-xs text-slate-500">
            Keep essential formulas, legal citations, and science definitions ready alongside your
            flashcards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
              >
                <p className="text-xs text-slate-500">
                  {note.level} · {note.subject}
                </p>
                <h3 className="font-display text-sm font-bold text-slate-900">{note.title}</h3>
                <p className="font-mono text-xs text-blue-800 bg-white border border-slate-200 rounded-md px-2.5 py-1.5">
                  {note.formulaOrKeyPoint}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{note.content}</p>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddNoteSubmit}
            className="lg:col-span-5 p-4 border border-slate-200 rounded-xl space-y-3"
          >
            <h3 className="text-sm font-semibold text-slate-900">Save Formula or Note</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={noteLevel}
                onChange={(e) => {
                  const lvl = e.target.value as AcademicLevel;
                  setNoteLevel(lvl);
                  setNoteSubject(SUBJECTS_BY_LEVEL[lvl][0]);
                }}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <option value="JHS">JHS</option>
                <option value="SHS">SHS</option>
                <option value="University">University</option>
              </select>
              <select
                value={noteSubject}
                onChange={(e) => setNoteSubject(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                {SUBJECTS_BY_LEVEL[noteLevel].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              required
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title (e.g. Ohm's Law)"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              value={noteFormula}
              onChange={(e) => setNoteFormula(e.target.value)}
              placeholder="Key formula or citation (e.g. V = I × R)"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
            />
            <textarea
              rows={2}
              required
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Short study explanation..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
            >
              Save to Notes Vault
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
