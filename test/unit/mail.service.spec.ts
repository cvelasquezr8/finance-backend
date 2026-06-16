import * as nodemailer from 'nodemailer'
import { ConfigService } from '@nestjs/config'
import { MailService } from '../../src/infrastructure/mail/mail.service'

jest.mock('nodemailer')

describe('MailService', () => {
  let sendMail: jest.Mock

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue({})
    ;(nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail })
  })

  function build(host?: string): MailService {
    const config = {
      get: jest.fn((k: string) => (k === 'SMTP_HOST' ? host : undefined)),
    } as unknown as ConfigService
    return new MailService(config)
  }

  it('uses jsonTransport in dev (no SMTP_HOST)', () => {
    build()
    expect(nodemailer.createTransport).toHaveBeenCalledWith({ jsonTransport: true })
  })

  it('sendInvitation emails the recipient with the temp password', async () => {
    const mail = build()
    await mail.sendInvitation('new@example.com', 'Nuevo User', 'TMP-123')
    expect(sendMail).toHaveBeenCalledTimes(1)
    const msg = sendMail.mock.calls[0][0]
    expect(msg.to).toBe('new@example.com')
    expect(msg.text).toContain('TMP-123')
  })
})
