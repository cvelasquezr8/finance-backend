import { Injectable, NotFoundException } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { UserRepository } from '@domain/repositories/user.repository'
import { NotificationRepository } from '@domain/repositories/notification.repository'
import { NotificationEntity, NotificationType } from '@domain/entities/notification.entity'
import { paginate, PaginateOptions } from '@shared/pagination/paginate'
import {
  NOTIFICATION_EVENTS,
  ParticipantInvitedEvent,
  ParticipantRespondedEvent,
  EventClosedEvent,
  EventReopenedEvent,
  AccountInvitedEvent,
  AccountBlockedEvent,
  MonthlySummaryEvent,
} from './notification.events'

interface NotificationDto {
  id: string
  type: string
  title: string
  message: string | null
  relatedId: string | null
  read: boolean
  createdAt: string
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly userRepo: UserRepository
  ) {}

  // ─── Queries ────────────────────────────────────────────────────────────────

  async list(userId: string, query: PaginateOptions = {}) {
    const rows = await this.notifications.findByUserId(userId)
    const dtos = rows.map(NotificationService.toDto)
    const page = paginate(dtos as unknown as Record<string, unknown>[], {
      ...query,
      limit: query.limit ?? 50,
    })
    const unreadCount = await this.notifications.countUnread(userId)
    return { ...page, unreadCount }
  }

  async markRead(userId: string, id: string) {
    await this.assertOwned(userId, id)
    await this.notifications.markRead(id)
  }

  async markAllRead(userId: string) {
    await this.notifications.markAllRead(userId)
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id)
    await this.notifications.delete(id)
  }

  private async assertOwned(userId: string, id: string) {
    const n = await this.notifications.findByIdForUser(userId, id)
    if (!n) throw new NotFoundException('Notification not found')
  }

  async createForUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string | null,
    relatedId: string | null
  ) {
    await this.notifications.create({ userId, type, title, message, relatedId })
  }

  private async langOf(userId: string): Promise<'es' | 'en'> {
    const user = await this.userRepo.findById(userId)
    return user?.language === 'en' ? 'en' : 'es'
  }

  // ─── Event listeners (decoupled via EventEmitter2) ────────────────────────────

  @OnEvent(NOTIFICATION_EVENTS.participantInvited)
  async onParticipantInvited(e: ParticipantInvitedEvent) {
    const en = (await this.langOf(e.recipientUserId)) === 'en'
    await this.createForUser(
      e.recipientUserId,
      'event_invitation',
      en ? 'New event invitation' : 'Nueva invitación a evento',
      en
        ? `You were invited to "${e.eventTitle}" (${e.assignedPct}%).`
        : `Te invitaron a "${e.eventTitle}" (${e.assignedPct}%).`,
      e.eventId
    )
  }

  @OnEvent(NOTIFICATION_EVENTS.participantResponded)
  async onParticipantResponded(e: ParticipantRespondedEvent) {
    const en = (await this.langOf(e.recipientUserId)) === 'en'
    const accepted = e.status === 'CONFIRMED'
    await this.createForUser(
      e.recipientUserId,
      'invitation_response',
      en ? 'Invitation response' : 'Respuesta a invitación',
      en
        ? `@${e.responderAlias} ${accepted ? 'accepted' : 'declined'} "${e.eventTitle}".`
        : `@${e.responderAlias} ${accepted ? 'aceptó' : 'rechazó'} "${e.eventTitle}".`,
      e.eventId
    )
  }

  @OnEvent(NOTIFICATION_EVENTS.eventClosed)
  async onEventClosed(e: EventClosedEvent) {
    const en = (await this.langOf(e.recipientUserId)) === 'en'
    await this.createForUser(
      e.recipientUserId,
      'event_closed',
      en ? 'Event closed' : 'Evento cerrado',
      en
        ? `"${e.eventTitle}" was closed by @${e.closedByAlias}.`
        : `"${e.eventTitle}" fue cerrado por @${e.closedByAlias}.`,
      e.eventId
    )
  }

  @OnEvent(NOTIFICATION_EVENTS.eventReopened)
  async onEventReopened(e: EventReopenedEvent) {
    const en = (await this.langOf(e.recipientUserId)) === 'en'
    await this.createForUser(
      e.recipientUserId,
      'event_reopened',
      en ? 'Event reopened' : 'Evento reabierto',
      en
        ? `"${e.eventTitle}" was reopened by @${e.reopenedByAlias}.`
        : `"${e.eventTitle}" fue reabierto por @${e.reopenedByAlias}.`,
      e.eventId
    )
  }

  @OnEvent(NOTIFICATION_EVENTS.accountInvited)
  async onAccountInvited(e: AccountInvitedEvent) {
    const en = (await this.langOf(e.recipientUserId)) === 'en'
    await this.createForUser(
      e.recipientUserId,
      'account_invited',
      en ? 'Welcome to Finance App' : 'Bienvenido a Finance App',
      en
        ? 'Your account was created. Please change your temporary password.'
        : 'Tu cuenta fue creada. Cambia tu contraseña temporal.',
      null
    )
  }

  @OnEvent(NOTIFICATION_EVENTS.accountBlocked)
  async onAccountBlocked(e: AccountBlockedEvent) {
    const en = (await this.langOf(e.recipientUserId)) === 'en'
    await this.createForUser(
      e.recipientUserId,
      'account_blocked',
      en ? 'Account blocked' : 'Cuenta bloqueada',
      en
        ? 'Your account has been blocked by an administrator.'
        : 'Un administrador bloqueó tu cuenta.',
      null
    )
  }

  @OnEvent(NOTIFICATION_EVENTS.monthlySummary)
  async onMonthlySummary(e: MonthlySummaryEvent) {
    const en = (await this.langOf(e.recipientUserId)) === 'en'
    await this.createForUser(
      e.recipientUserId,
      'monthly_summary',
      en ? 'Monthly summary' : 'Resumen mensual',
      en
        ? `Your ${e.month}/${e.year} summary is ready.`
        : `Tu resumen de ${e.month}/${e.year} está listo.`,
      null
    )
  }

  private static toDto(n: NotificationEntity): NotificationDto {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      relatedId: n.relatedId,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }
  }
}
