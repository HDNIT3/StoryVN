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

  async sendStoryApproved(to: string, displayName: string, storyTitle: string) {
    const subject = `StoryVN - Tác phẩm "${storyTitle}" đã được phê duyệt`;
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #2b6cb0;">Chúc mừng bạn! Tác phẩm đã được xuất bản</h2>
      <p>Xin chào <strong>${displayName}</strong>,</p>
      <p>Tác phẩm <strong>"${storyTitle}"</strong> của bạn đã được Ban quản trị StoryVN kiểm duyệt và phê duyệt xuất bản công khai thành công.</p>
      <p>Độc giả hiện đã có thể tìm kiếm, theo dõi và đọc các chương truyện của bạn trên hệ thống.</p>
      <p>Chúc bạn có thêm nhiều cảm hứng sáng tác và gặt hái nhiều thành công trên StoryVN!</p>
    </div>`;

    return this.sendMail(to, subject, html);
  }

  async sendStoryRejected(
    to: string,
    displayName: string,
    storyTitle: string,
    reason: string,
  ) {
    const subject = `StoryVN - Kết quả kiểm duyệt tác phẩm "${storyTitle}"`;
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #c53030;">Thông báo kết quả kiểm duyệt tác phẩm</h2>
      <p>Xin chào <strong>${displayName}</strong>,</p>
      <p>Rất tiếc, tác phẩm <strong>"${storyTitle}"</strong> của bạn chưa đáp ứng đủ tiêu chuẩn để xuất bản công khai tại thời điểm này.</p>
      <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 0; font-weight: bold; color: #c53030;">Lý do từ chối:</p>
        <p style="margin: 8px 0 0 0; color: #4a5568;">${reason}</p>
      </div>
      <p><strong>Bạn có thể:</strong></p>
      <ul>
        <li>Chỉnh sửa lại thông tin tác phẩm (tiêu đề, ảnh bìa, văn án, thể loại...) và gửi lại yêu cầu kiểm duyệt.</li>
        <li>Hoặc gửi phản hồi giải trình trực tiếp trên trang quản lý tác phẩm nếu bạn cho rằng lý do từ chối chưa thỏa đáng. Ban quản trị sẽ tiếp nhận và xem xét lại.</li>
      </ul>
      <p>Cảm ơn sự đóng góp của bạn cho cộng đồng StoryVN!</p>
    </div>`;

    return this.sendMail(to, subject, html);
  }
}
