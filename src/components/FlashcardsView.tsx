import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  HelpCircle,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react';
import { SUBJECTS_BY_LEVEL } from '../data/seedData';
import { AcademicLevel, CardMastery, Flashcard, FlashcardDeck } from '../types/studymate';

interface FlashcardsViewProps {
  decks: FlashcardDeck[];
  selectedLevel: AcademicLevel | 'All';
  onSelectLevel: (level: AcademicLevel | 'All') => void;
  activeDeckId: string | null;
  onSelectDeck: (deckId: string | null) => void;
  onCreateDeck: (
    deck: Omit<FlashcardDeck, 'id' | 'shareCode' | 'updatedAt'>,
  ) => string;
  onAddCard: (deckId: string, card: Omit<Flashcard, 'id' | 'mastery'>) => void;
  onDeleteCard: (deckId: string, cardId: string) => void;
  onRateCard: (deckId: string, cardId: string, mastery: CardMastery) => void;
  onLogStudy: (subject: string, level: AcademicLevel, minutes: number, cardsReviewed: number, quizScore?: number) => void;
}

type StudioMode = 'study' | 'quiz' | 'manage';

interface QuizQuestion {
  cardId: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
}

export function FlashcardsView({
  decks,
  selectedLevel,
  onSelectLevel,
  activeDeckId,
  onSelectDeck,
  onCreateDeck,
  onAddCard,
  onDeleteCard,
  onRateCard,
  onLogStudy,
}: FlashcardsViewProps) {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<StudioMode>('study');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<string[] | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reviewedCountThisRun, setReviewedCountThisRun] = useState(0);

  // Import code state
  const [importCode, setImportCode] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Create deck modal
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLevel, setNewLevel] = useState<AcademicLevel>('SHS');
  const [newSubject, setNewSubject] = useState(SUBJECTS_BY_LEVEL.SHS[0]);
  const [newDescription, setNewDescription] = useState('');
  const [newShared, setNewShared] = useState(true);

  // Add card form
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardHint, setCardHint] = useState('');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const matchesLevel = selectedLevel === 'All' || deck.level === selectedLevel;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        deck.title.toLowerCase().includes(q) ||
        deck.subject.toLowerCase().includes(q) ||
        deck.shareCode.toLowerCase().includes(q);
      return matchesLevel && matchesQuery;
    });
  }, [decks, selectedLevel, search]);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || filteredDecks[0] || null;

  const orderedCards = useMemo(() => {
    if (!activeDeck) return [];
    if (!shuffledOrder) return activeDeck.cards;
    const map = new Map(activeDeck.cards.map((c) => [c.id, c]));
    const mapped = shuffledOrder.map((id) => map.get(id)).filter(Boolean) as Flashcard[];
    const missing = activeDeck.cards.filter((c) => !shuffledOrder.includes(c.id));
    return [...mapped, ...missing];
  }, [activeDeck, shuffledOrder]);

  const currentCard = orderedCards[cardIndex] || orderedCards[0] || null;

  useEffect(() => {
    setCardIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setShuffledOrder(null);
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizCorrectCount(0);
    setQuizFinished(false);
  }, [activeDeck?.id]);

  // Keyboard support in study mode
  useEffect(() => {
    if (mode !== 'study' || !currentCard || showCreateDeck) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        setCardIndex((prev) => Math.min(orderedCards.length - 1, prev + 1));
        setIsFlipped(false);
        setShowHint(false);
      } else if (e.code === 'ArrowLeft') {
        setCardIndex((prev) => Math.max(0, prev - 1));
        setIsFlipped(false);
        setShowHint(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, currentCard, orderedCards.length, showCreateDeck]);

  // Quiz question builder
  const quizQuestions: QuizQuestion[] = useMemo(() => {
    if (!activeDeck || activeDeck.cards.length === 0) return [];
    const fallbackPool = decks
      .filter((d) => d.id !== activeDeck.id)
      .flatMap((d) => d.cards.map((c) => c.back));

    return activeDeck.cards.map((card, idx) => {
      const sameDeckOthers = activeDeck.cards
        .filter((c) => c.id !== card.id)
        .map((c) => c.back);
      const distractors = [...sameDeckOthers, ...fallbackPool].slice(0, 3);
      while (distractors.length < 3) {
        distractors.push(`Alternative definition option ${distractors.length + 1}`);
      }
      const rawOptions = [card.back, ...distractors];
      // Deterministic rotation based on card index so options do not jump on render
      const shift = idx % rawOptions.length;
      const options = [...rawOptions.slice(shift), ...rawOptions.slice(0, shift)];
      return {
        cardId: card.id,
        prompt: card.front,
        correctAnswer: card.back,
        options,
      };
    });
  }, [activeDeck, decks]);

  const handleShuffle = () => {
    if (!activeDeck) return;
    const ids = [...activeDeck.cards.map((c) => c.id)];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffledOrder(ids);
    setCardIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleRate = (mastery: CardMastery) => {
    if (!activeDeck || !currentCard) return;
    onRateCard(activeDeck.id, currentCard.id, mastery);
    const nextReviewed = reviewedCountThisRun + 1;
    setReviewedCountThisRun(nextReviewed);
    if (nextReviewed % 3 === 0) {
      onLogStudy(activeDeck.subject, activeDeck.level, 5, 3);
    }
    if (cardIndex < orderedCards.length - 1) {
      setCardIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setIsFlipped(false);
      setShowHint(false);
      setCardIndex(0);
    }
  };

  const handleCopyShareCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    }
  };

  const handleExportDeck = (deck: FlashcardDeck) => {
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.shareCode.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = importCode.trim().toUpperCase();
    if (!trimmed) return;
    const found = decks.find((d) => d.shareCode.toUpperCase() === trimmed);
    if (found) {
      onSelectDeck(found.id);
      setMode('study');
      setImportNotice(`Loaded shared deck "${found.title}" (${found.shareCode}).`);
      setImportCode('');
    } else {
      setImportNotice(`No shared deck found for code "${trimmed}". Try SM-JHS-SCI01 or SM-SHS-BIO01.`);
    }
  };

  const handleCreateDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const starterCard: Flashcard = {
      id: `card-${Date.now()}`,
      front: cardFront.trim() || `Key concept 1 in ${newSubject}`,
      back: cardBack.trim() || 'Edit this card in Manage Cards to add your study notes.',
      hint: cardHint.trim() || undefined,
      mastery: 'new',
    };
    const createdId = onCreateDeck({
      title: newTitle.trim(),
      level: newLevel,
      subject: newSubject,
      author: 'You',
      isShared: newShared,
      description: newDescription.trim() || `${newLevel} revision deck for ${newSubject}.`,
      cards: [starterCard],
    });
    onSelectDeck(createdId);
    setMode('manage');
    setNewTitle('');
    setNewDescription('');
    setCardFront('');
    setCardBack('');
    setCardHint('');
    setShowCreateDeck(false);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeck || !cardFront.trim() || !cardBack.trim()) return;
    onAddCard(activeDeck.id, {
      front: cardFront.trim(),
      back: cardBack.trim(),
      hint: cardHint.trim() || undefined,
    });
    setCardFront('');
    setCardBack('');
    setCardHint('');
  };

  const handleSelectQuizOption = (option: string) => {
    if (selectedOption !== null || !activeDeck) return;
    const currentQ = quizQuestions[quizIndex];
    setSelectedOption(option);
    if (option === currentQ.correctAnswer) {
      setQuizCorrectCount((c) => c + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (!activeDeck) return;
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      const finalScore = Math.round((quizCorrectCount / quizQuestions.length) * 100);
      setQuizFinished(true);
      onLogStudy(activeDeck.subject, activeDeck.level, 10, quizQuestions.length, finalScore);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Shared Flashcard Studio
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create decks, share via invite codes, practice 3D spaced-repetition flips, and run
            instant multiple-choice quizzes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleImportByCode} className="flex items-center gap-2">
            <input
              type="text"
              value={importCode}
              onChange={(e) => {
                setImportCode(e.target.value);
                setImportNotice(null);
              }}
              placeholder="Deck code (SM-UNI-DSA01)"
              aria-label="Open deck by share code"
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700 w-48 font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Load Code
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowCreateDeck(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Flashcard Deck</span>
          </button>
        </div>
      </div>

      {importNotice && (
        <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-800 flex items-center justify-between">
          <span>{importNotice}</span>
          <button
            type="button"
            onClick={() => setImportNotice(null)}
            className="text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Level Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flashcard decks by subject or title..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
          />
        </div>

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
      </div>

      {/* Main Split: Deck Selector + Interactive Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Deck List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {filteredDecks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700">No flashcard decks found.</p>
              <button
                type="button"
                onClick={() => setShowCreateDeck(true)}
                className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                Create your first deck
              </button>
            </div>
          ) : (
            filteredDecks.map((deck) => {
              const isSelected = activeDeck?.id === deck.id;
              const mastered = deck.cards.filter((c) => c.mastery === 'mastered').length;
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => onSelectDeck(deck.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>
                      <strong className="text-slate-800">{deck.level}</strong> · {deck.subject}
                    </span>
                    <span className="tabular-nums font-medium">
                      {mastered}/{deck.cards.length} mastered
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-semibold text-slate-900">
                    {deck.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 font-mono">
                    {deck.shareCode} · {deck.isShared ? 'Shared' : 'Private'}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Active Studio */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {activeDeck ? (
            <>
              {/* Deck Header + Controls */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-blue-700">{activeDeck.level}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeDeck.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>By {activeDeck.author}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{activeDeck.cards.length} cards</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    {activeDeck.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyShareCode(activeDeck.shareCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedCode === activeDeck.shareCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="font-mono">
                      {copiedCode === activeDeck.shareCode ? 'Copied!' : activeDeck.shareCode}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportDeck(activeDeck)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Studio Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  {(
                    [
                      { id: 'study', label: 'Flashcard Flip' },
                      { id: 'quiz', label: 'Practice Quiz' },
                      { id: 'manage', label: 'Manage Cards' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMode(tab.id)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        mode === tab.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {mode === 'study' && orderedCards.length > 1 && (
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Shuffle Deck</span>
                  </button>
                )}
              </div>

              {/* MODE 1: 3D FLASHCARD STUDY PLAYER */}
              {mode === 'study' && (
                <div className="space-y-5">
                  {currentCard ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                        <span>
                          Card {cardIndex + 1} of {orderedCards.length}
                        </span>
                        <span>
                          Status:{' '}
                          <strong className="text-slate-800 capitalize">
                            {currentCard.mastery}
                          </strong>
                        </span>
                      </div>

                      {/* 3D Flip Card */}
                      <div
                        className="perspective-1000 w-full cursor-pointer"
                        onClick={() => setIsFlipped((prev) => !prev)}
                        role="button"
                        tabIndex={0}
                        aria-label="Flip flashcard"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setIsFlipped((prev) => !prev);
                          }
                        }}
                      >
                        <div
                          className={`relative w-full min-h-[260px] transition-transform duration-300 preserve-3d ${
                            isFlipped ? 'rotate-y-180' : ''
                          }`}
                        >
                          {/* Front Face */}
                          <div className="absolute inset-0 backface-hidden bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Prompt / Question</span>
                              <span>Click or press Space to reveal answer</span>
                            </div>
                            <p className="font-display text-lg sm:text-xl font-semibold text-slate-900 leading-snug text-center my-auto px-4">
                              {currentCard.front}
                            </p>
                            <div className="text-center text-xs text-slate-500">
                              {showHint && currentCard.hint ? (
                                <span className="text-blue-700 font-medium">
                                  Hint: {currentCard.hint}
                                </span>
                              ) : (
                                <span>{activeDeck.subject}</span>
                              )}
                            </div>
                          </div>

                          {/* Back Face */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-blue-50/40 border border-blue-200 rounded-xl p-8 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
                              <span>Answer & Explanation</span>
                              <span>Rate recall confidence below</span>
                            </div>
                            <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed text-center my-auto px-4">
                              {currentCard.back}
                            </p>
                            <div className="text-center text-xs text-slate-500">
                              Click card to return to question
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Navigation + Hint + Rating Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={cardIndex === 0}
                            onClick={() => {
                              setCardIndex((prev) => Math.max(0, prev - 1));
                              setIsFlipped(false);
                              setShowHint(false);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Prev</span>
                          </button>
                          <button
                            type="button"
                            disabled={cardIndex >= orderedCards.length - 1}
                            onClick={() => {
                              setCardIndex((prev) => Math.min(orderedCards.length - 1, prev + 1));
                              setIsFlipped(false);
                              setShowHint(false);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg cursor-pointer"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          {currentCard.hint && (
                            <button
                              type="button"
                              onClick={() => setShowHint((prev) => !prev)}
                              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRate('learning')}
                            className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Needs Review
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRate('mastered')}
                            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Mark Mastered
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">
                      This deck has no cards yet. Switch to Manage Cards to add your first card.
                    </p>
                  )}
                </div>
              )}

              {/* MODE 2: PRACTICE QUIZ */}
              {mode === 'quiz' && (
                <div className="space-y-5">
                  {quizQuestions.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Add at least 1 card to start a practice quiz.
                    </p>
                  ) : quizFinished ? (
                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-4">
                      <p className="text-xs font-semibold text-blue-700">Quiz Completed</p>
                      <h3 className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                        {quizCorrectCount} / {quizQuestions.length} Correct (
                        {Math.round((quizCorrectCount / quizQuestions.length) * 100)}%)
                      </h3>
                      <p className="text-sm text-slate-600">
                        Your quiz score and reviewed cards have been recorded in Progress Tracking.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuizIndex(0);
                          setSelectedOption(null);
                          setQuizCorrectCount(0);
                          setQuizFinished(false);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Retake Quiz</span>
                      </button>
                    </div>
                  ) : (
                    (() => {
                      const q = quizQuestions[quizIndex];
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                            <span>
                              Question {quizIndex + 1} of {quizQuestions.length}
                            </span>
                            <span>Score: {quizCorrectCount}</span>
                          </div>
                          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="font-display text-base font-semibold text-slate-900">
                              {q.prompt}
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            {q.options.map((opt, idx) => {
                              const isChosen = selectedOption === opt;
                              const isCorrect = opt === q.correctAnswer;
                              let btnClass =
                                'bg-white border-slate-200 text-slate-800 hover:border-blue-400';
                              if (selectedOption !== null) {
                                if (isCorrect) {
                                  btnClass =
                                    'bg-emerald-50 border-emerald-400 text-emerald-900 font-medium';
                                } else if (isChosen) {
                                  btnClass = 'bg-rose-50 border-rose-400 text-rose-900';
                                } else {
                                  btnClass = 'bg-slate-50 border-slate-200 text-slate-500';
                                }
                              }
                              return (
                                <button
                                  key={`${q.cardId}-${idx}`}
                                  type="button"
                                  disabled={selectedOption !== null}
                                  onClick={() => handleSelectQuizOption(opt)}
                                  className={`w-full text-left p-4 border rounded-lg text-sm transition-colors cursor-pointer ${btnClass}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <span>{opt}</span>
                                    {selectedOption !== null && isCorrect && (
                                      <span className="text-xs font-semibold text-emerald-700 shrink-0">
                                        Correct
                                      </span>
                                    )}
                                    {selectedOption !== null && isChosen && !isCorrect && (
                                      <span className="text-xs font-semibold text-rose-700 shrink-0">
                                        Incorrect
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {selectedOption !== null && (
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={handleNextQuizQuestion}
                                className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                              >
                                {quizIndex < quizQuestions.length - 1
                                  ? 'Next Question'
                                  : 'Finish & Save Score'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* MODE 3: MANAGE CARDS */}
              {mode === 'manage' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleAddCardSubmit}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">
                      Add New Flashcard to Deck
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={cardFront}
                        onChange={(e) => setCardFront(e.target.value)}
                        placeholder="Front (Question or Term)"
                        className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                      />
                      <input
                        type="text"
                        required
                        value={cardBack}
                        onChange={(e) => setCardBack(e.target.value)}
                        placeholder="Back (Answer or Formula)"
                        className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={cardHint}
                        onChange={(e) => setCardHint(e.target.value)}
                        placeholder="Optional study hint"
                        className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Card</span>
                      </button>
                    </div>
                  </form>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                    {activeDeck.cards.map((card, index) => (
                      <div
                        key={card.id}
                        className="p-4 flex items-start justify-between gap-4 bg-white first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs text-slate-500 tabular-nums">
                            Card {index + 1} · Status: <span className="capitalize">{card.mastery}</span>
                          </p>
                          <p className="text-sm font-semibold text-slate-900">{card.front}</p>
                          <p className="text-sm text-slate-600">{card.back}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteCard(activeDeck.id, card.id)}
                          aria-label="Delete flashcard"
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-700">Select or create a flashcard deck</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Deck Modal */}
      {showCreateDeck && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-deck-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="create-deck-title" className="font-display text-lg font-bold text-slate-900">
                Create Shared Flashcard Deck
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateDeck(false)}
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeckSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deck Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. WASSCE Physics: Waves & Optics"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Level
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => {
                      const next = e.target.value as AcademicLevel;
                      setNewLevel(next);
                      setNewSubject(SUBJECTS_BY_LEVEL[next][0]);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  >
                    <option value="JHS">JHS (BECE)</option>
                    <option value="SHS">SHS (WASSCE)</option>
                    <option value="University">University</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  >
                    {SUBJECTS_BY_LEVEL[newLevel].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Card Question (Front)
                </label>
                <input
                  type="text"
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  placeholder="e.g. State Snell's Law of Refraction"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Card Answer (Back)
                </label>
                <input
                  type="text"
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  placeholder="e.g. n1 sin(θ1) = n2 sin(θ2)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Briefly describe what this deck prepares students for..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newShared}
                  onChange={(e) => setNewShared(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700"
                />
                <span>Generate shareable deck code for study group peers</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDeck(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  Create Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
