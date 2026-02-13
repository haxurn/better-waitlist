export type WaitlistStatus = "pending" | "approved" | "rejected";

export interface WaitlistEntry {
  id: string;
  email: string;
  status: WaitlistStatus;
  position: number;
  userId: string | null;
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

export interface WaitlistPluginOptions {
  /**
   * Whether admin endpoints (list, approve, reject) require authentication.
   * @default true
   */
  requireAdmin?: boolean;
}
