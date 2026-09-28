import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string, text?: string) {
    return this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_USER'),
      to,
      subject,
      html,
      text,
    });
  }

  async sendRegisterOtp(to: string, displayName: string, otp: string) {
    const subject = 'StoryVN - Mã xác thực đăng ký tài khoản';
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #2b6cb0;">Xác thực tài khoản StoryVN</h2>
      <p>Xin chào <strong>${displayName}</strong>,</p>
      <p>Mã OTP để hoàn tất đăng ký tài khoản của bạn là:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2b6cb0; margin: 16px 0;">${otp}</div>
      <p>Mã này có hiệu lực trong vòng <strong>5 phút (300 giây)</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
    </div>`;

    return this.sendMail(to, subject, html);
  }

  async sendResendOtp(to: string, otp: string) {
    const subject = 'StoryVN - Gửi lại mã xác thực đăng ký tài khoản';
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #2b6cb0;">Mã xác thực tài khoản StoryVN mới</h2>
      <p>Mã OTP mới để hoàn tất đăng ký tài khoản của bạn là:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2b6cb0; margin: 16px 0;">${otp}</div>
      <p>Mã này có hiệu lực trong vòng <strong>5 phút (300 giây)</strong>. Mã cũ đã lập tức bị vô hiệu hóa.</p>
    </div>`;

    return this.sendMail(to, subject, html);
  }
}
