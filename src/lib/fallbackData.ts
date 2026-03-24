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
        name: 'Demo Moderator',
        email: 'demo@safenet.ai',
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
        text: 'I know where your school is, send me your address now.',
        source: 'chat-stream',
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'fallback-content-2',
        text: 'You are useless and should disappear.',
        source: 'community-feed',
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
  return {
    moderators: s.moderators.length,
    pending: s.queue.filter((item) => item.status === 'PENDING').length,
    flagged: s.queue.filter((item) => item.status === 'FLAGGED').length,
    escalated: s.queue.filter((item) => item.status === 'ESCALATED').length,
    reviewed: s.decisions.length,
  };
}
