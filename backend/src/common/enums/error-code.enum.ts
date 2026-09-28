export const ErrorCode = {
  EMAIL_ALREADY_EXISTS: {
    error: 'EMAIL_ALREADY_EXISTS',
    message: 'Email đã tồn tại trên hệ thống',
  },
  USERNAME_ALREADY_EXISTS: {
    error: 'USERNAME_ALREADY_EXISTS',
    message: 'Username đã tồn tại trên hệ thống',
  },
  USER_ALREADY_EXISTS: {
    error: 'USER_ALREADY_EXISTS',
    message: 'Email hoặc username đã tồn tại trên hệ thống',
  },
  OTP_EXPIRED_OR_NOT_FOUND: {
    error: 'OTP_EXPIRED_OR_NOT_FOUND',
    message: 'Mã OTP đã hết hạn hoặc chưa được gửi',
  },
  INVALID_OTP: {
    error: 'INVALID_OTP',
    message: 'Mã OTP không chính xác',
  },
  REGISTRATION_NOT_FOUND: {
    error: 'REGISTRATION_NOT_FOUND',
    message: 'Không tìm thấy yêu cầu đăng ký cho email này hoặc OTP đã hết hạn',
  },
  MAIL_SENDING_FAILED: {
    error: 'MAIL_SENDING_FAILED',
    message: 'Gửi email xác thực thất bại, vui lòng thử lại sau',
  },
  DUPLICATE_KEY_ERROR: {
    error: 'DUPLICATE_KEY_ERROR',
    message: 'Email hoặc username đã được đăng ký',
  },
  TOO_MANY_REQUESTS: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút',
  },
  INTERNAL_SERVER_ERROR: {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Đã có lỗi xảy ra trên hệ thống',
  },
};