import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { AppLogger } from '@shared/logger'

/**
 * Pluggable mailer. When SMTP_HOST is configured it sends through real SMTP;
 * otherwise (dev) it uses nodemailer's jsonTransport — nothing is sent over the
 * network and the message (including any temp password) is logged for inspection.
 */
@Injectable()
export class MailService {
  private readonly transporter: Transporter
  private readonly devMode: boolean
  private readonly from: string
  private readonly webUrl: string
  private readonly logger = new AppLogger()

  constructor(private readonly config: ConfigService) {
    this.logger.setContext('MailService')
    const host = this.config.get<string>('SMTP_HOST')
    this.from = this.config.get<string>('MAIL_FROM') ?? 'Finance App <no-reply@financeapp.local>'
    this.webUrl = this.config.get<string>('APP_WEB_URL') ?? 'http://localhost:3001'
    this.devMode = !host
    this.transporter = this.devMode
      ? nodemailer.createTransport({ jsonTransport: true })
      : nodemailer.createTransport({
          host,
          port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
          secure: String(this.config.get<string>('SMTP_SECURE') ?? 'false') === 'true',
          auth: {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASS'),
          },
        })
  }

  async sendInvitation(to: string, name: string, tempPassword: string): Promise<void> {
    const subject = 'Has sido invitado a Finance App'
    const text = [
      `Hola ${name},`,
      '',
      'Un administrador te ha invitado a Finance App.',
      `Ingresa en ${this.webUrl} con tu correo y esta contraseña temporal:`,
      '',
      `    ${tempPassword}`,
      '',
      'Por seguridad, deberás cambiarla en cuanto inicies sesión.',
    ].join('\n')

    await this.transporter.sendMail({ from: this.from, to, subject, text })

    if (this.devMode) {
      this.logger.log(
        `[DEV MAIL] Invitation for ${to} — temporary password: ${tempPassword} (no SMTP configured)`
      )
    }
  }
}
