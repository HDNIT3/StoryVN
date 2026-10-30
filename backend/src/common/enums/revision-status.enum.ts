export enum RevisionStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const ACTIVE_REVISION_STATUSES = [
  RevisionStatus.DRAFT,
  RevisionStatus.PENDING_REVIEW,
  RevisionStatus.REJECTED,
];

export const MAX_REVISIONS_PER_DOCUMENT = 50;
