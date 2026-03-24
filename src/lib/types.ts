export type ModeratorStatus = 'NEW' | 'ACTIVE';
export type ContentStatus = 'PENDING' | 'SAFE' | 'FLAGGED' | 'ESCALATED';

export type ApiError = {
  success: false;
  error: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};
