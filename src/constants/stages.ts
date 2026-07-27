/**
 * Centralized Stages and Status Definitions
 */

export const STAGES = {
  STAGE_1: 'Stage 1',
  NEGOTIATION: 'Negotiation',
  QUOTATION_SENT: 'Quotation Sent',
  ORDER_CLOSED: 'Order Closed',
  ORDER_RECEIVED: 'Order Received',
  ORDER_LOST: 'Order Lost / Cancelled',
  ON_HOLD: 'Customer Order Hold',
  PENDING: 'Pending',
} as const;

export const LEAD_STATUSES = {
  PENDING: 'Pending',
  EXPECTED: 'expected',
  YES: 'yes',
  NO: 'no',
  HOT: 'Hot',
  WARM: 'Warm',
  COLD: 'Cold',
} as const;

export const ENQUIRY_STATUSES = {
  NEW: 'New',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  HOLD: 'Hold',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const SALES_TYPES = {
  CRR: 'CRR',
  NBD_CRR: 'NBD_CRR',
  NBD: 'NBD',
} as const;

export type StageType = typeof STAGES[keyof typeof STAGES];
export type LeadStatusType = typeof LEAD_STATUSES[keyof typeof LEAD_STATUSES];
export type UserRoleType = typeof USER_ROLES[keyof typeof USER_ROLES];
