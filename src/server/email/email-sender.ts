import "server-only";

export type EmailVerificationMessage = {
  to: string;
  verificationUrl: string;
};

export type PasswordResetEmailMessage = {
  to: string;
  resetUrl: string;
};

export interface EmailSender {
  sendEmailVerification(message: EmailVerificationMessage): Promise<void>;
}

export interface PasswordResetEmailSender {
  sendPasswordReset(message: PasswordResetEmailMessage): Promise<void>;
}

export class EmailDeliveryUnavailableError extends Error {
  constructor() {
    super("Email delivery is not configured.");
    this.name = "EmailDeliveryUnavailableError";
  }
}

export class UnconfiguredEmailSender implements EmailSender, PasswordResetEmailSender {
  async sendEmailVerification(_message: EmailVerificationMessage): Promise<void> {
    throw new EmailDeliveryUnavailableError();
  }

  async sendPasswordReset(_message: PasswordResetEmailMessage): Promise<void> {
    throw new EmailDeliveryUnavailableError();
  }
}

/** Local/test sender. It keeps messages in memory and never persists or logs raw tokens. */
export class InMemoryEmailSender implements EmailSender, PasswordResetEmailSender {
  readonly messages: EmailVerificationMessage[] = [];
  readonly passwordResetMessages: PasswordResetEmailMessage[] = [];

  async sendEmailVerification(message: EmailVerificationMessage): Promise<void> {
    this.messages.push({ ...message });
  }

  async sendPasswordReset(message: PasswordResetEmailMessage): Promise<void> {
    this.passwordResetMessages.push({ ...message });
  }
}
