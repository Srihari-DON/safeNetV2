export const FALLBACK_MODERATORS = [
  {
    id: 'fallback-mod-1',
    name: 'Demo Moderator',
    email: 'demo@safenet.ai',
    phone: '+91-90000-00000',
    language: 'English',
    hoursPerWeek: 20,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

export const FALLBACK_QUEUE = [
  {
    id: 'fallback-content-1',
    text: 'I know where your school is, send me your address now.',
    source: 'chat-stream',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-content-2',
    text: 'You are useless and should disappear.',
    source: 'community-feed',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const FALLBACK_OVERVIEW = {
  moderators: 1,
  pending: FALLBACK_QUEUE.length,
  flagged: 0,
  escalated: 0,
  reviewed: 0,
};

export function canUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
