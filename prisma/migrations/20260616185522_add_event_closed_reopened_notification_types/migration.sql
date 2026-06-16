-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('event_invitation', 'invitation_response', 'event_closed', 'event_reopened', 'account_invited', 'account_blocked', 'monthly_summary') NOT NULL;
