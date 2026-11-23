import { useEffect, useState } from 'react';
import { FlashcardsView } from './components/FlashcardsView';
import { Header } from './components/Header';
import { OverviewSection } from './components/OverviewSection';
import { PlansCheckoutView } from './components/PlansCheckoutView';
import { ProgressView } from './components/ProgressView';
import { StudyGroupsView } from './components/StudyGroupsView';
import {
  INITIAL_DECKS,
  INITIAL_EXAM_GOALS,
  INITIAL_QUICK_NOTES,
  INITIAL_STUDY_GROUPS,
  INITIAL_STUDY_LOGS,
  MOMO_MERCHANT_NUMBER,
} from './data/seedData';
import {
  AcademicLevel,
  CardMastery,
  ExamGoal,
  Flashcard,
  FlashcardDeck,
  NavSection,
  QuickNote,
  StudyGroup,
  StudySessionLog,
  SubscriptionRecord,
} from './types/studymate';

const STORAGE_KEY = 'studymate_gh_state_v1';

interface PersistedState {
  selectedLevel: AcademicLevel | 'All';
  groups: StudyGroup[];
  decks: FlashcardDeck[];
  logs: StudySessionLog[];
  goals: ExamGoal[];
  notes: QuickNote[];
  subscriptions: SubscriptionRecord[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed && Array.isArray(parsed.groups) && Array.isArray(parsed.decks)) {
        return {
          selectedLevel: parsed.selectedLevel || 'All',
          groups: parsed.groups,
          decks: parsed.decks,
          logs: Array.isArray(parsed.logs) ? parsed.logs : INITIAL_STUDY_LOGS,
          goals: Array.isArray(parsed.goals) ? parsed.goals : INITIAL_EXAM_GOALS,
          notes: Array.isArray(parsed.notes) ? parsed.notes : INITIAL_QUICK_NOTES,
          subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
        };
      }
    }
  } catch {
    // Ignore storage read errors and fall back to seed data
  }
  return {
    selectedLevel: 'All',
    groups: INITIAL_STUDY_GROUPS,
    decks: INITIAL_DECKS,
    logs: INITIAL_STUDY_LOGS,
    goals: INITIAL_EXAM_GOALS,
    notes: INITIAL_QUICK_NOTES,
    subscriptions: [],
  };
}

export default function App() {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(
    state.groups[0]?.id ?? null,
  );
  const [activeDeckId, setActiveDeckId] = useState<string | null>(
    state.decks[0]?.id ?? null,
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const activeSubscription =
    state.subscriptions.find((s) => new Date(s.expiresAt).getTime() > Date.now()) ||
    null;

  const handleSelectLevel = (level: AcademicLevel | 'All') => {
    setState((prev) => ({ ...prev, selectedLevel: level }));
  };

  const handleToggleJoinGroup = (groupId: string) => {
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => {
        if (g.id !== groupId) return g;
        const nextJoined = !g.joined;
        return {
          ...g,
          joined: nextJoined,
          membersCount: nextJoined
            ? Math.min(g.maxMembers, g.membersCount + 1)
            : Math.max(1, g.membersCount - 1),
        };
      }),
    }));
  };

  const handleCreateGroup = (
    newGroup: Omit<StudyGroup, 'id' | 'membersCount' | 'joined' | 'posts' | 'sharedDeckIds'>,
  ) => {
    const id = `grp-${Date.now()}`;
    const created: StudyGroup = {
      ...newGroup,
      id,
      membersCount: 1,
      joined: true,
      sharedDeckIds: [],
      posts: [
        {
          id: `post-${Date.now()}`,
          author: newGroup.hostName,
          role: 'Group Creator',
          content: `Created ${newGroup.name}. Invite classmates using code ${newGroup.inviteCode}.`,
          createdAt: 'Just now',
        },
      ],
    };
    setState((prev) => ({ ...prev, groups: [created, ...prev.groups] }));
    setActiveGroupId(id);
  };

  const handleAddGroupPost = (
    groupId: string,
    content: string,
    attachedDeckId?: string,
  ) => {
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => {
        if (g.id !== groupId) return g;
        const updatedDecks =
          attachedDeckId && !g.sharedDeckIds.includes(attachedDeckId)
            ? [...g.sharedDeckIds, attachedDeckId]
            : g.sharedDeckIds;
        return {
          ...g,
          sharedDeckIds: updatedDecks,
          posts: [
            {
              id: `post-${Date.now()}`,
              author: 'You',
              role: `${g.level} Student`,
              content,
              createdAt: 'Just now',
              attachedDeckId,
            },
            ...g.posts,
          ],
        };
      }),
    }));
  };

  const handleJoinByCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    const target = state.groups.find((g) => g.inviteCode.toUpperCase() === clean);
    if (!target) {
      return {
        ok: false,
        message: `No study group found for invite code "${clean}". Try JHS-SCI-24 or SHS-BIO-88.`,
      };
    }
    if (!target.joined) {
      handleToggleJoinGroup(target.id);
    }
    setActiveGroupId(target.id);
    return {
      ok: true,
      message: `Opened "${target.name}" (${target.inviteCode}).`,
    };
  };

  const handleCreateDeck = (
    deckInput: Omit<FlashcardDeck, 'id' | 'shareCode' | 'updatedAt'>,
  ) => {
    const id = `deck-${Date.now()}`;
    const shareCode = `SM-${deckInput.level.slice(0, 3).toUpperCase()}-${Math.floor(
      100 + Math.random() * 899,
    )}`;
    const newDeck: FlashcardDeck = {
      ...deckInput,
      id,
      shareCode,
      updatedAt: '2026-11-23',
    };
    setState((prev) => ({ ...prev, decks: [newDeck, ...prev.decks] }));
    return id;
  };

  const handleAddCard = (
    deckId: string,
    card: Omit<Flashcard, 'id' | 'mastery'>,
  ) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              updatedAt: '2026-11-23',
              cards: [...d.cards, { ...card, id: `card-${Date.now()}`, mastery: 'new' }],
            }
          : d,
      ),
    }));
  };

  const handleDeleteCard = (deckId: string, cardId: string) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) =>
        d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d,
      ),
    }));
  };

  const handleRateCard = (
    deckId: string,
    cardId: string,
    mastery: CardMastery,
  ) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) =>
                c.id === cardId
                  ? { ...c, mastery, lastReviewedAt: new Date().toISOString() }
                  : c,
              ),
            }
          : d,
      ),
    }));
  };

  const handleLogStudy = (
    subject: string,
    level: AcademicLevel,
    minutes: number,
    cardsReviewed: number,
    quizScore?: number,
  ) => {
    const entry: StudySessionLog = {
      id: `log-${Date.now()}`,
      date: '2026-11-23',
      subject,
      level,
      minutes,
      cardsReviewed,
      quizScore,
      activityType: typeof quizScore === 'number' ? 'quiz' : cardsReviewed > 0 ? 'flashcards' : 'focus',
    };
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, entry],
      goals: prev.goals.map((goal) =>
        goal.subject === subject && goal.level === level
          ? {
              ...goal,
              completedHours: Number((goal.completedHours + minutes / 60).toFixed(1)),
            }
          : goal,
      ),
    }));
  };

  const handleToggleGoalTask = (goalId: string, taskId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t,
              ),
            }
          : g,
      ),
    }));
  };

  const handleAddGoal = (
    goal: Omit<ExamGoal, 'id' | 'completedHours' | 'tasks'>,
  ) => {
    const newGoal: ExamGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      completedHours: 0,
      tasks: [{ id: `task-${Date.now()}`, title: `First revision block for ${goal.subject}`, completed: false }],
    };
    setState((prev) => ({ ...prev, goals: [newGoal, ...prev.goals] }));
  };

  const handleAddTaskToGoal = (goalId: string, title: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              tasks: [...g.tasks, { id: `task-${Date.now()}`, title, completed: false }],
            }
          : g,
      ),
    }));
  };

  const handleAddNote = (note: Omit<QuickNote, 'id' | 'updatedAt'>) => {
    const newNote: QuickNote = {
      ...note,
      id: `note-${Date.now()}`,
      updatedAt: '2026-11-23',
    };
    setState((prev) => ({ ...prev, notes: [newNote, ...prev.notes] }));
  };

  const handleActivatePlan = (
    record: Omit<SubscriptionRecord, 'id' | 'purchasedAt' | 'expiresAt' | 'status'>,
  ) => {
    const now = Date.now();
    const durationMs =
      record.planId === 'hourly'
        ? (record.hoursPurchased || 1) * 60 * 60 * 1000
        : record.planId === 'monthly'
          ? 30 * 24 * 60 * 60 * 1000
          : 365 * 24 * 60 * 60 * 1000;

    const newRecord: SubscriptionRecord = {
      ...record,
      id: `sub-${now}`,
      status: 'Active',
      purchasedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + durationMs).toISOString(),
    };
    setState((prev) => ({
      ...prev,
      subscriptions: [newRecord, ...prev.subscriptions],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeSection={activeSection}
        onNavigate={setActiveSection}
        hasActivePlan={Boolean(activeSubscription)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeSection === 'overview' && (
          <OverviewSection
            selectedLevel={state.selectedLevel}
            onSelectLevel={handleSelectLevel}
            groups={state.groups}
            decks={state.decks}
            logs={state.logs}
            goals={state.goals}
            activeSubscription={activeSubscription}
            onNavigate={setActiveSection}
            onStartDeck={(deckId) => {
              setActiveDeckId(deckId);
              setActiveSection('flashcards');
            }}
            onOpenGroup={(groupId) => {
              setActiveGroupId(groupId);
              setActiveSection('groups');
            }}
            onToggleTask={handleToggleGoalTask}
          />
        )}

        {activeSection === 'groups' && (
          <StudyGroupsView
            groups={state.groups}
            decks={state.decks}
            selectedLevel={state.selectedLevel}
            onSelectLevel={handleSelectLevel}
            activeGroupId={activeGroupId}
            onSelectGroup={setActiveGroupId}
            onToggleJoin={handleToggleJoinGroup}
            onCreateGroup={handleCreateGroup}
            onAddPost={handleAddGroupPost}
            onJoinByCode={handleJoinByCode}
            onOpenDeck={(deckId) => {
              setActiveDeckId(deckId);
              setActiveSection('flashcards');
            }}
          />
        )}

        {activeSection === 'flashcards' && (
          <FlashcardsView
            decks={state.decks}
            selectedLevel={state.selectedLevel}
            onSelectLevel={handleSelectLevel}
            activeDeckId={activeDeckId}
            onSelectDeck={setActiveDeckId}
            onCreateDeck={handleCreateDeck}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onRateCard={handleRateCard}
            onLogStudy={handleLogStudy}
          />
        )}

        {activeSection === 'progress' && (
          <ProgressView
            selectedLevel={state.selectedLevel}
            onSelectLevel={handleSelectLevel}
            logs={state.logs}
            decks={state.decks}
            goals={state.goals}
            notes={state.notes}
            onLogStudy={handleLogStudy}
            onToggleTask={handleToggleGoalTask}
            onAddGoal={handleAddGoal}
            onAddTaskToGoal={handleAddTaskToGoal}
            onAddNote={handleAddNote}
          />
        )}

        {activeSection === 'plans' && (
          <PlansCheckoutView
            subscriptions={state.subscriptions}
            activeSubscription={activeSubscription}
            onActivatePlan={handleActivatePlan}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>StudyMate · Built for JHS, SHS & University learners</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>
              MoMo Payments: <strong className="font-mono text-slate-700">{MOMO_MERCHANT_NUMBER}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>GH₵ 10/hr · GH₵ 100/mo · GH₵ 1,000/yr</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveSection('plans')}
              className="font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
            >
              View Plans
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
