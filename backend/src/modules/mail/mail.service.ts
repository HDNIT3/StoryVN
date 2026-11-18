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

  async sendForgotPasswordOtp(to: string, displayName: string, otp: string) {
    const subject = 'StoryVN - Mã xác thực đặt lại mật khẩu';
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #2b6cb0;">Đặt lại mật khẩu tài khoản StoryVN</h2>
      <p>Xin chào <strong>${displayName}</strong>,</p>
      <p>Bạn vừa gửi yêu cầu đặt lại mật khẩu cho tài khoản StoryVN của mình. Mã OTP xác thực là:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2b6cb0; margin: 16px 0;">${otp}</div>
      <p>Mã này có hiệu lực trong vòng <strong>5 phút (300 giây)</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và mật khẩu của bạn vẫn an toàn.</p>
    </div>`;

    return this.sendMail(to, subject, html);
  }

  async sendAuthorRequestApproved(to: string, displayName: string, penName: string) {
    const subject = 'StoryVN - Chúc mừng bạn đã trở thành Tác giả!';
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #2b6cb0;">Chúc mừng bạn đã được nâng cấp thành Tác giả StoryVN!</h2>
      <p>Xin chào <strong>${displayName}</strong>,</p>
      <p>Yêu cầu nâng cấp tác giả với bút danh <strong>${penName}</strong> của bạn đã được ban quản trị xét duyệt thành công.</p>
      <p>Tài khoản của bạn hiện đã được cấp quyền <strong>Tác giả (AUTHOR)</strong>. Bạn có thể bắt đầu đăng tải và quản lý các tác phẩm truyện của mình ngay hôm nay!</p>
      <p>Chúc bạn có những trải nghiệm tuyệt vời cùng cộng đồng độc giả StoryVN.</p>
    </div>`;

    return this.sendMail(to, subject, html);
  }

  async sendAuthorRequestRejected(
    to: string,
    displayName: string,
    penName: string,
    reason?: string,
  ) {
    const subject = 'StoryVN - Kết quả xét duyệt yêu cầu nâng cấp tác giả';
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #c53030;">Thông báo về yêu cầu nâng cấp tác giả StoryVN</h2>
      <p>Xin chào <strong>${displayName}</strong>,</p>
      <p>Rất tiếc, yêu cầu nâng cấp tác giả với bút danh <strong>${penName}</strong> của bạn chưa được chấp thuận tại thời điểm này.</p>
      ${
        reason
          ? `<p><strong>Lý do:</strong> ${reason}</p>`
          : '<p>Vui lòng kiểm tra lại thông tin hồ sơ và thử lại sau.</p>'
      }
      <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ đội ngũ hỗ trợ của chúng tôi.</p>
    </div>`;

    return this.sendMail(to, subject, html);
  }

  async sendGoogleAccountCreated(to: string, displayName: string, randomPassword: string) {
    const subject = 'StoryVN - Thông tin tài khoản đăng nhập';
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #2b6cb0;">Chào mừng bạn đến với StoryVN!</h2>
      <p>Xin chào <strong>${displayName}</strong>,</p>
      <p>Tài khoản StoryVN của bạn đã được liên kết và khởi tạo thành công thông qua đăng nhập Google.</p>
      <p>Ngoài việc đăng nhập bằng Google, bạn có thể sử dụng thông tin sau để đăng nhập trực tiếp bằng email & mật khẩu:</p>
      <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${to}</p>
        <p style="margin: 0;"><strong>Mật khẩu khởi tạo:</strong> <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #2b6cb0;">${randomPassword}</span></p>
      </div>
      <p><em>Khuyến nghị: Bạn có thể đổi lại mật khẩu này bất kỳ lúc nào trong phần Cài đặt tài khoản.</em></p>
      <p>Chúc bạn có những trải nghiệm đọc truyện tuyệt vời tại StoryVN!</p>
    </div>`;

    return this.sendMail(to, subject, html);
  }

  private escapeHtml(str: string): string {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async sendSupportTicketCreated(params: {
    to: string;
    senderName: string;
    ticketCode: string;
    topicLabel: string;
    subjectTitle: string;
    message: string;
    trackingUrl: string;
  }) {
    const subject = `[StoryVN #${params.ticketCode}] Đã tiếp nhận yêu cầu hỗ trợ của bạn`;
    const safeName = this.escapeHtml(params.senderName || 'Bạn');
    const safeTopic = this.escapeHtml(params.topicLabel);
    const safeSubject = this.escapeHtml(params.subjectTitle);
    const safeMessage = this.escapeHtml(params.message).replace(/\n/g, '<br/>');

    const html = `<div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 999px;">Mã phiếu: #${this.escapeHtml(params.ticketCode)}</span>
        <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 20px;">StoryVN đã tiếp nhận yêu cầu hỗ trợ</h2>
      </div>
      <p>Xin chào <strong>${safeName}</strong>,</p>
      <p>Cảm ơn bạn đã liên hệ Trung tâm Hỗ trợ StoryVN. Yêu cầu của bạn đã được chuyển tới Ban quản trị và sẽ được phản hồi trong thời gian sớm nhất.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0;">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;"><strong>Phân loại:</strong> ${safeTopic}</p>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a;"><strong>Tiêu đề:</strong> ${safeSubject}</p>
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 13px; color: #334155;">${safeMessage}</div>
      </div>
      <p style="margin: 20px 0;">
        <a href="${params.trackingUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 22px; border-radius: 10px;">Theo dõi trạng thái & Nhận phản hồi</a>
      </p>
      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Khi Ban quản trị phản hồi, nội dung giải đáp sẽ được gửi trực tiếp qua email này và cập nhật đồng thời trên trang Hỗ trợ StoryVN.</p>
    </div>`;

    return this.sendMail(params.to, subject, html);
  }

  async sendSupportTicketReply(params: {
    to: string;
    senderName: string;
    ticketCode: string;
    subjectTitle: string;
    originalMessage: string;
    replyContent: string;
    adminName: string;
    statusLabel: string;
    trackingUrl: string;
  }) {
    const subject = `[StoryVN #${params.ticketCode}] Phản hồi yêu cầu hỗ trợ: ${params.subjectTitle}`;
    const safeName = this.escapeHtml(params.senderName || 'Bạn');
    const safeAdmin = this.escapeHtml(params.adminName || 'Ban quản trị StoryVN');
    const safeStatus = this.escapeHtml(params.statusLabel);
    const safeSubject = this.escapeHtml(params.subjectTitle);
    const safeReply = this.escapeHtml(params.replyContent).replace(/\n/g, '<br/>');
    const safeOriginal = this.escapeHtml(params.originalMessage).replace(/\n/g, '<br/>');

    const html = `<div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="display: inline-block; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 999px;">#${this.escapeHtml(params.ticketCode)} · ${safeStatus}</span>
        <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 20px;">Phản hồi từ Ban quản trị StoryVN</h2>
        <p style="margin: 0; font-size: 13px; color: #64748b;">Chủ đề: <strong>${safeSubject}</strong></p>
      </div>
      <p>Xin chào <strong>${safeName}</strong>,</p>
      <p><strong>${safeAdmin}</strong> đã gửi phản hồi cho phiếu yêu cầu hỗ trợ của bạn:</p>
      <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 8px; padding: 16px; margin: 18px 0; color: #0f172a; font-size: 14px;">
        ${safeReply}
      </div>
      <div style="margin: 22px 0;">
        <a href="${params.trackingUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 22px; border-radius: 10px;">Xem chi tiết & Phản hồi tiếp trên StoryVN</a>
      </div>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-top: 20px;">
        <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;"><strong>Nội dung yêu cầu ban đầu của bạn:</strong></p>
        <div style="font-size: 12px; color: #475569;">${safeOriginal}</div>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">Trân trọng,<br/>Đội ngũ Hỗ trợ & Vận hành StoryVN</p>
    </div>`;

    return this.sendMail(params.to, subject, html);
  }
}
