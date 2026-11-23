import { useState } from 'react';
import { BookOpen, Calendar, Layers, Plus, Search, Send, Users, X } from 'lucide-react';
import { SUBJECTS_BY_LEVEL } from '../data/seedData';
import { AcademicLevel, FlashcardDeck, StudyGroup } from '../types/studymate';

interface StudyGroupsViewProps {
  groups: StudyGroup[];
  decks: FlashcardDeck[];
  selectedLevel: AcademicLevel | 'All';
  onSelectLevel: (level: AcademicLevel | 'All') => void;
  activeGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onToggleJoin: (groupId: string) => void;
  onCreateGroup: (newGroup: Omit<StudyGroup, 'id' | 'membersCount' | 'joined' | 'posts' | 'sharedDeckIds'>) => void;
  onAddPost: (groupId: string, content: string, attachedDeckId?: string) => void;
  onJoinByCode: (code: string) => { ok: boolean; message: string };
  onOpenDeck: (deckId: string) => void;
}

export function StudyGroupsView({
  groups,
  decks,
  selectedLevel,
  onSelectLevel,
  activeGroupId,
  onSelectGroup,
  onToggleJoin,
  onCreateGroup,
  onAddPost,
  onJoinByCode,
  onOpenDeck,
}: StudyGroupsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Create group form state
  const [name, setName] = useState('');
  const [level, setLevel] = useState<AcademicLevel>('SHS');
  const [subject, setSubject] = useState(SUBJECTS_BY_LEVEL.SHS[0]);
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('Mon, Wed · 5:00 PM');
  const [meetingMode, setMeetingMode] = useState('Audio Room + Shared Board');
  const [maxMembers, setMaxMembers] = useState(25);
  const [hostName, setHostName] = useState('You');

  // Post composer state
  const [postText, setPostText] = useState('');
  const [attachedDeckId, setAttachedDeckId] = useState('');

  const filteredGroups = groups.filter((group) => {
    const matchesLevel = selectedLevel === 'All' || group.level === selectedLevel;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      group.name.toLowerCase().includes(q) ||
      group.subject.toLowerCase().includes(q) ||
      group.description.toLowerCase().includes(q);
    return matchesLevel && matchesSearch;
  });

  const activeGroup = groups.find((g) => g.id === activeGroupId) || filteredGroups[0] || null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    const code = `${level}-${subject.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`;
    onCreateGroup({
      name: name.trim(),
      level,
      subject,
      description: description.trim(),
      schedule: schedule.trim() || 'Flexible Weekly',
      meetingMode,
      maxMembers: Number(maxMembers) || 25,
      inviteCode: code,
      hostName: hostName.trim() || 'Student Lead',
    });
    setName('');
    setDescription('');
    setShowCreateModal(false);
  };

  const handleJoinCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    const result = onJoinByCode(inviteInput.trim());
    setInviteFeedback(result.message);
    if (result.ok) setInviteInput('');
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !postText.trim()) return;
    onAddPost(activeGroup.id, postText.trim(), attachedDeckId || undefined);
    setPostText('');
    setAttachedDeckId('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Study Groups
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Organize peer circles for BECE (JHS), WASSCE (SHS), and University courses. Share
            decks and post discussion notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleJoinCodeSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => {
                setInviteInput(e.target.value);
                setInviteFeedback(null);
              }}
              placeholder="Invite code (e.g. SHS-BIO-88)"
              aria-label="Join group by invite code"
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700 w-48 font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Join Code
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Study Group</span>
          </button>
        </div>
      </div>

      {inviteFeedback && (
        <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-800 flex items-center justify-between">
          <span>{inviteFeedback}</span>
          <button
            type="button"
            onClick={() => setInviteFeedback(null)}
            className="text-slate-500 hover:text-slate-800 cursor-pointer"
            aria-label="Dismiss message"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups by subject, topic, or exam..."
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

      {/* Main Two-Column Directory + Active Group Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Group List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700">No study groups match your filter.</p>
              <p className="mt-1 text-xs text-slate-500">
                Try another academic level or create a new study circle.
              </p>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isSelected = activeGroup?.id === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => onSelectGroup(group.id)}
                  className={`w-full text-left p-5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                    <span>
                      <strong className="text-slate-800">{group.level}</strong> · {group.subject}
                    </span>
                    <span className="tabular-nums font-medium">
                      {group.joined ? 'Joined' : `${group.membersCount}/${group.maxMembers}`}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {group.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{group.description}</p>
                  <p className="mt-2 text-xs text-slate-500">{group.schedule}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Active Group Room */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {activeGroup ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <span className="font-semibold text-blue-700">{activeGroup.level}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeGroup.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>Lead: {activeGroup.hostName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">Code: {activeGroup.inviteCode}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    {activeGroup.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">{activeGroup.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleJoin(activeGroup.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeGroup.joined
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`}
                >
                  {activeGroup.joined ? 'Leave Group' : 'Join Group'}
                </button>
              </div>

              {/* Group Metadata Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-slate-200 text-sm">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{activeGroup.schedule}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{activeGroup.meetingMode}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 tabular-nums">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {activeGroup.membersCount} / {activeGroup.maxMembers} students
                  </span>
                </div>
              </div>

              {/* Shared Decks Linked to Group */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Shared Group Flashcard Decks
                </h3>
                {activeGroup.sharedDeckIds.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No flashcard decks attached yet. Attach one below when posting a study note.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeGroup.sharedDeckIds.map((deckId) => {
                      const deck = decks.find((d) => d.id === deckId);
                      if (!deck) return null;
                      return (
                        <div
                          key={deck.id}
                          className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {deck.title}
                            </p>
                            <p className="text-xs text-slate-500 tabular-nums">
                              {deck.cards.length} cards · Code {deck.shareCode}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenDeck(deck.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-slate-200 hover:border-blue-300 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Practice</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group Discussion & Study Feed */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Group Study Feed</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {activeGroup.posts.map((post) => {
                    const attachedDeck = post.attachedDeckId
                      ? decks.find((d) => d.id === post.attachedDeckId)
                      : null;
                    return (
                      <div
                        key={post.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                          <span>
                            <strong className="text-slate-900">{post.author}</strong> · {post.role}
                          </span>
                          <span>{post.createdAt}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
                        {attachedDeck && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-600 truncate">
                              Attached Deck: {attachedDeck.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenDeck(attachedDeck.id)}
                              className="text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Open Deck
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Post Composer */}
                <form onSubmit={handlePostSubmit} className="pt-3 border-t border-slate-200 space-y-3">
                  <textarea
                    rows={2}
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder={
                      activeGroup.joined
                        ? 'Post a study question, past-paper tip, or revision note...'
                        : 'Join this group to share notes and flashcards with members...'
                    }
                    disabled={!activeGroup.joined}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <select
                      value={attachedDeckId}
                      onChange={(e) => setAttachedDeckId(e.target.value)}
                      disabled={!activeGroup.joined}
                      aria-label="Attach flashcard deck"
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-700 max-w-xs"
                    >
                      <option value="">Optional: Attach a flashcard deck</option>
                      {decks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.level} · {d.title}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      disabled={!activeGroup.joined || !postText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post to Group</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a study group to view details.</p>
          )}
        </div>
      </div>

      {/* Create Study Group Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-group-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 id="create-group-title" className="font-display text-lg font-bold text-slate-900">
                Create New Study Group
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. WASSCE Elective Maths Circle"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => {
                      const next = e.target.value as AcademicLevel;
                      setLevel(next);
                      setSubject(SUBJECTS_BY_LEVEL[next][0]);
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
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  >
                    {SUBJECTS_BY_LEVEL[level].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Schedule
                  </label>
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="Tue, Thu · 6:00 PM"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Members
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={100}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Display Name
                  </label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Session Format
                  </label>
                  <input
                    type="text"
                    value={meetingMode}
                    onChange={(e) => setMeetingMode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Study Focus & Goals
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe topics, past papers, or course modules this group will cover..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
