export type WaitlistStatus = "pending" | "approved" | "rejected";

export interface WaitlistEntry {
  id: string;
  email: string;
  status: WaitlistStatus;
  position: number;
  userId: string | null;
  invitedAt: Date | null;
  createdAt: Date;
}

export interface WaitlistEntryInput {
  email: string;
  userId?: string;
}

export interface WaitlistPositionResponse {
  email: string;
  position: number;
  status: WaitlistStatus;
}

export interface WaitlistStatusResponse {
  email: string;
  status: WaitlistStatus;
  position?: number;
  createdAt: Date;
}

export interface WaitlistListOptions {
  status?: WaitlistStatus;
  limit?: number;
  offset?: number;
}

export interface WaitlistListResponse {
  entries: WaitlistEntry[];
  total: number;
}

export interface WaitlistStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface WaitlistPluginOptions {
  requireAdmin?: boolean;
  maxEntries?: number;
  enabled?: boolean;
  allowStatusCheck?: boolean;
  showPosition?: boolean;
  markInvitedOnApprove?: boolean;
  recalculatePositionOnApprove?: boolean;
  onJoin?: (entry: WaitlistEntry) => void | Promise<void>;
  onApprove?: (entry: WaitlistEntry) => void | Promise<void>;
  onReject?: (entry: WaitlistEntry) => void | Promise<void>;
  onComplete?: (entry: WaitlistEntry) => void | Promise<void>;
}
