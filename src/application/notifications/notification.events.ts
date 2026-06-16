/** Domain event names emitted across modules and consumed by NotificationService. */
export const NOTIFICATION_EVENTS = {
  participantInvited: 'event.participant_invited',
  participantResponded: 'event.participant_responded',
  eventClosed: 'event.closed',
  eventReopened: 'event.reopened',
  accountInvited: 'account.invited',
  accountBlocked: 'account.blocked',
  monthlySummary: 'summary.monthly',
} as const

export interface ParticipantInvitedEvent {
  recipientUserId: string
  eventId: string
  eventTitle: string
  assignedPct: number
}

export interface ParticipantRespondedEvent {
  recipientUserId: string
  eventId: string
  eventTitle: string
  responderAlias: string
  status: 'CONFIRMED' | 'DECLINED'
}

export interface AccountInvitedEvent {
  recipientUserId: string
}

export interface AccountBlockedEvent {
  recipientUserId: string
}

export interface EventClosedEvent {
  recipientUserId: string
  eventId: string
  eventTitle: string
  closedByAlias: string
}

export interface EventReopenedEvent {
  recipientUserId: string
  eventId: string
  eventTitle: string
  reopenedByAlias: string
}

export interface MonthlySummaryEvent {
  recipientUserId: string
  month: number
  year: number
}
