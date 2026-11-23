export type AcademicLevel = 'JHS' | 'SHS' | 'University';

export type NavSection = 'overview' | 'groups' | 'flashcards' | 'progress' | 'plans';

export interface GroupPost {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
  attachedDeckId?: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  level: AcademicLevel;
  subject: string;
  description: string;
  schedule: string;
  meetingMode: string;
  membersCount: number;
  maxMembers: number;
  joined: boolean;
  inviteCode: string;
  hostName: string;
  sharedDeckIds: string[];
  posts: GroupPost[];
}

export type CardMastery = 'new' | 'learning' | 'mastered';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  mastery: CardMastery;
  lastReviewedAt?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  level: AcademicLevel;
  subject: string;
  author: string;
  isShared: boolean;
  shareCode: string;
  description: string;
  updatedAt: string;
  cards: Flashcard[];
}

export interface StudySessionLog {
  id: string;
  date: string; // YYYY-MM-DD
  subject: string;
  level: AcademicLevel;
  minutes: number;
  cardsReviewed: number;
  quizScore?: number;
  activityType: 'flashcards' | 'quiz' | 'group' | 'focus';
}

export interface StudyTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ExamGoal {
  id: string;
  title: string;
  level: AcademicLevel;
  subject: string;
  examDate: string; // YYYY-MM-DD
  targetHours: number;
  completedHours: number;
  tasks: StudyTask[];
}

export interface QuickNote {
  id: string;
  title: string;
  level: AcademicLevel;
  subject: string;
  formulaOrKeyPoint: string;
  content: string;
  updatedAt: string;
}

export type PlanId = 'hourly' | 'monthly' | 'annual';

export type MoMoNetwork = 'MTN Mobile Money' | 'Telecel Cash' | 'AT Money';

export interface PaymentPlan {
  id: PlanId;
  name: string;
  audienceLabel: string;
  priceGhs: number;
  cadenceLabel: string;
  summary: string;
  highlights: string[];
  recommended?: boolean;
}

export interface SubscriptionRecord {
  id: string;
  planId: PlanId;
  planName: string;
  amountGhs: number;
  hoursPurchased?: number;
  network: MoMoNetwork;
  payerNumber: string;
  recipientNumber: string;
  referenceCode: string;
  transactionId: string;
  status: 'Active' | 'Expired';
  purchasedAt: string;
  expiresAt: string;
}
