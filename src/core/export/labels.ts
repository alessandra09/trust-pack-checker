import type { Answer, Status } from '../types.ts'

// Export labels mirror the UI labels (SPEC 6.3); kept here because /core cannot import UI strings.
export const STATUS_LABEL: Record<Status, string> = {
  FOUND: 'Found in text',
  PARTIAL: 'Partly found',
  NOT_FOUND: 'Not found in text',
  CONFLICT: 'Conflict',
  NEEDS_HUMAN: 'Needs your review',
}
export const REVIEW_LABEL: Record<Answer['reviewed'], string> = {
  pending: 'not reviewed',
  accepted: 'accepted',
  edited: 'edited',
  rejected: 'rejected',
}
export const DISCLAIMER = 'Draft for human review. Not legal advice.'
