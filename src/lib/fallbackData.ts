type FallbackModerator = {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: string;
  hoursPerWeek: number;
  status: 'ACTIVE';
  createdAt: string;
};

type FallbackQueueItem = {
  id: string;
  text: string;
  source: string;
  status: 'PENDING' | 'SAFE' | 'FLAGGED' | 'ESCALATED';
  createdAt: string;
  updatedAt: string;
};

type FallbackDecision = {
  id: string;
  contentId: string;
  moderatorId: string;
  decision: 'SAFE' | 'FLAGGED' | 'ESCALATED';
  reason: string | null;
  createdAt: string;
};

type FallbackStore = {
  moderators: FallbackModerator[];
  queue: FallbackQueueItem[];
  decisions: FallbackDecision[];
};

declare global {
  var safenetFallbackStore: FallbackStore | undefined;
}

function createInitialStore(): FallbackStore {
  const now = new Date().toISOString();
  return {
    moderators: [
      {
        id: 'fallback-mod-1',
        name: 'Safety Lead - Women Helpline Desk',
        email: 'women-safety-demo@safenet.ai',
        phone: '+91-90000-00000',
        language: 'English',
        hoursPerWeek: 20,
        status: 'ACTIVE',
        createdAt: now,
      },
    ],
    queue: [
      {
        id: 'fallback-content-1',
        text: 'I know where you travel every day. Share your location now.',
        source: 'women-community-chat',
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'fallback-content-2',
        text: 'Send private photos or I will leak your old images online.',
        source: 'safety-report-feed',
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      },
    ],
    decisions: [],
  };
}

function store(): FallbackStore {
  if (!global.safenetFallbackStore) {
    global.safenetFallbackStore = createInitialStore();
  }
  return global.safenetFallbackStore;
}

export function canUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getFallbackModerators() {
  return store().moderators;
}

export function addFallbackModerator(input: {
  name: string;
  email: string;
  phone: string;
  language: string;
  hoursPerWeek: number;
}) {
  const moderator: FallbackModerator = {
    id: `fallback-mod-${Date.now()}`,
    name: input.name,
    email: input.email,
    phone: input.phone,
    language: input.language,
    hoursPerWeek: input.hoursPerWeek,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  store().moderators.unshift(moderator);
  return moderator;
}

export function getFallbackPendingQueue() {
  return store().queue.filter((item) => item.status === 'PENDING');
}

export function addFallbackContent(input: {
  text: string;
  source: string;
  status: 'PENDING' | 'SAFE';
}) {
  const now = new Date().toISOString();
  const item: FallbackQueueItem = {
    id: `fallback-content-${Date.now()}`,
    text: input.text,
    source: input.source,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };

  store().queue.unshift(item);
  return item;
}

export function submitFallbackDecision(input: {
  contentId: string;
  moderatorId: string;
  decision: 'SAFE' | 'FLAGGED' | 'ESCALATED';
  reason: string | null;
}) {
  const target = store().queue.find((item) => item.id === input.contentId);
  if (target) {
    target.status = input.decision;
    target.updatedAt = new Date().toISOString();
  }

  const decision: FallbackDecision = {
    id: `fallback-decision-${Date.now()}`,
    contentId: input.contentId,
    moderatorId: input.moderatorId,
    decision: input.decision,
    reason: input.reason,
    createdAt: new Date().toISOString(),
  };

  store().decisions.unshift(decision);

  return {
    content: target || {
      id: input.contentId,
      status: input.decision,
    },
    moderationDecision: decision,
  };
}

export function getFallbackOverview() {
  const s = store();
  const avgReviewMinutes = getFallbackAverageReviewMinutes();
  const slaBreaches = getFallbackSlaBreaches();

  return {
    moderators: s.moderators.length,
    pending: s.queue.filter((item) => item.status === 'PENDING').length,
    flagged: s.queue.filter((item) => item.status === 'FLAGGED').length,
    escalated: s.queue.filter((item) => item.status === 'ESCALATED').length,
    reviewed: s.decisions.length,
    avgReviewMinutes,
    slaBreaches,
  };
}

export function getFallbackSnapshot() {
  const s = store();
  return {
    moderators: s.moderators,
    queue: s.queue,
    decisions: s.decisions,
  };
}

export function getFallbackAudit(limit = 25) {
  const s = store();
  const modMap = new Map(s.moderators.map((m) => [m.id, m]));

  return s.decisions.slice(0, limit).map((d) => ({
    id: d.id,
    decision: d.decision,
    reason: d.reason,
    createdAt: d.createdAt,
    contentId: d.contentId,
    moderatorId: d.moderatorId,
    moderatorName: modMap.get(d.moderatorId)?.name || 'Unknown Moderator',
  }));
}

function getFallbackAverageReviewMinutes() {
  const s = store();
  if (s.decisions.length === 0) return 0;

  const queueMap = new Map(s.queue.map((q) => [q.id, q]));
  const durations = s.decisions
    .map((d) => {
      const q = queueMap.get(d.contentId);
      if (!q) return null;
      const created = new Date(q.createdAt).getTime();
      const decided = new Date(d.createdAt).getTime();
      const minutes = Math.max(0, Math.round((decided - created) / 60000));
      return Number.isFinite(minutes) ? minutes : null;
    })
    .filter((value): value is number => value !== null);

  if (durations.length === 0) return 0;
  return Number((durations.reduce((sum, item) => sum + item, 0) / durations.length).toFixed(1));
}

function getFallbackSlaBreaches() {
  const s = store();
  const queueMap = new Map(s.queue.map((q) => [q.id, q]));
  return s.decisions.filter((d) => {
    const q = queueMap.get(d.contentId);
    if (!q) return false;

    const created = new Date(q.createdAt).getTime();
    const decided = new Date(d.createdAt).getTime();
    const minutes = Math.max(0, Math.round((decided - created) / 60000));
    const sla = d.decision === 'ESCALATED' ? 15 : d.decision === 'FLAGGED' ? 60 : 240;
    return minutes > sla;
  }).length;
}

export function getFallbackEvidence(limit = 50) {
  const s = store();
  const modMap = new Map(s.moderators.map((m) => [m.id, m]));
  const queueMap = new Map(s.queue.map((q) => [q.id, q]));

  return s.decisions
    .filter((d) => d.decision === 'ESCALATED' || d.decision === 'FLAGGED')
    .slice(0, limit)
    .map((d) => {
      const item = queueMap.get(d.contentId);
      const moderator = modMap.get(d.moderatorId);
      return {
        decisionId: d.id,
        contentId: d.contentId,
        decision: d.decision,
        reason: d.reason,
        decisionAt: d.createdAt,
        contentText: item?.text || 'Unavailable in fallback snapshot',
        source: item?.source || 'unknown',
        reportedAt: item?.createdAt || null,
        moderator: {
          id: d.moderatorId,
          name: moderator?.name || 'Unknown Moderator',
          email: moderator?.email || 'unknown@safenet.ai',
        },
      };
    });
}
