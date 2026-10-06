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
  INVALID_CREDENTIALS: {
    error: 'INVALID_CREDENTIALS',
    message: 'Email hoặc mật khẩu không chính xác',
  },
  INVALID_GOOGLE_TOKEN: {
    error: 'INVALID_GOOGLE_TOKEN',
    message: 'Token xác thực Google không hợp lệ hoặc đã hết hạn',
  },
  GOOGLE_EMAIL_NOT_VERIFIED: {
    error: 'GOOGLE_EMAIL_NOT_VERIFIED',
    message: 'Email Google chưa được xác thực',
  },
  ACCOUNT_REGISTERED_WITH_GOOGLE: {
    error: 'ACCOUNT_REGISTERED_WITH_GOOGLE',
    message: 'Tài khoản này được đăng ký bằng Google, vui lòng đăng nhập bằng Google',
  },
  ACCOUNT_SUSPENDED: {
    error: 'ACCOUNT_SUSPENDED',
    message: 'Tài khoản của bạn đã bị tạm khóa',
  },
  ACCOUNT_BANNED: {
    error: 'ACCOUNT_BANNED',
    message: 'Tài khoản của bạn đã bị vô hiệu hóa',
  },
  USER_NOT_FOUND: {
    error: 'USER_NOT_FOUND',
    message: 'Không tìm thấy người dùng',
  },
  INVALID_REFRESH_TOKEN: {
    error: 'INVALID_REFRESH_TOKEN',
    message: 'Refresh token không hợp lệ hoặc đã bị thu hồi',
  },
  REFRESH_TOKEN_EXPIRED: {
    error: 'REFRESH_TOKEN_EXPIRED',
    message: 'Refresh token đã hết hạn, vui lòng đăng nhập lại',
  },
  UNAUTHORIZED: {
    error: 'UNAUTHORIZED',
    message: 'Vui lòng đăng nhập để tiếp tục',
  },
  TOKEN_REVOKED: {
    error: 'TOKEN_REVOKED',
    message: 'Phiên đăng nhập đã bị thu hồi hoặc đã đăng xuất',
  },
  TOKEN_EXPIRED: {
    error: 'TOKEN_EXPIRED',
    message: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất từ thiết bị khác, vui lòng đăng nhập lại',
  },
  FORBIDDEN_RESOURCE: {
    error: 'FORBIDDEN_RESOURCE',
    message: 'Bạn không có quyền truy cập tài nguyên này',
  },
  ALREADY_AUTHOR: {
    error: 'ALREADY_AUTHOR',
    message: 'Tài khoản của bạn đã là tác giả hoặc cấp quản lý',
  },
  AUTHOR_REQUEST_PENDING: {
    error: 'AUTHOR_REQUEST_PENDING',
    message: 'Bạn đã có một yêu cầu nâng cấp tác giả đang chờ xét duyệt',
  },
  AUTHOR_REQUEST_NOT_FOUND: {
    error: 'AUTHOR_REQUEST_NOT_FOUND',
    message: 'Không tìm thấy yêu cầu nâng cấp tác giả',
  },
  AUTHOR_REQUEST_ALREADY_PROCESSED: {
    error: 'AUTHOR_REQUEST_ALREADY_PROCESSED',
    message: 'Yêu cầu nâng cấp này đã được xử lý trước đó',
  },
  PEN_NAME_ALREADY_EXISTS: {
    error: 'PEN_NAME_ALREADY_EXISTS',
    message: 'Bút danh này đã được sử dụng bởi tác giả khác',
  },
  AUTHOR_REQUEST_CANNOT_EDIT: {
    error: 'AUTHOR_REQUEST_CANNOT_EDIT',
    message: 'Yêu cầu đã được phê duyệt, không thể chỉnh sửa',
  },
  AUTHOR_PROFILE_NOT_FOUND: {
    error: 'AUTHOR_PROFILE_NOT_FOUND',
    message: 'Không tìm thấy hồ sơ tác giả',
  },
  OLD_PASSWORD_INCORRECT: {
    error: 'OLD_PASSWORD_INCORRECT',
    message: 'Mật khẩu cũ không chính xác',
  },
  NEW_PASSWORD_SAME_AS_OLD: {
    error: 'NEW_PASSWORD_SAME_AS_OLD',
    message: 'Mật khẩu mới không được trùng với mật khẩu cũ',
  },
  CONFIRM_PASSWORD_MISMATCH: {
    error: 'CONFIRM_PASSWORD_MISMATCH',
    message: 'Mật khẩu xác nhận không khớp với mật khẩu mới',
  },
  CANNOT_MODIFY_SELF_STATUS: {
    error: 'CANNOT_MODIFY_SELF_STATUS',
    message: 'Không thể tự thay đổi trạng thái tài khoản của chính mình',
  },
  CANNOT_MODIFY_ADMIN: {
    error: 'CANNOT_MODIFY_ADMIN',
    message: 'Không thể thay đổi trạng thái hoặc quyền của tài khoản Quản trị viên',
  },
  CANNOT_MODIFY_SELF_ROLE: {
    error: 'CANNOT_MODIFY_SELF_ROLE',
    message: 'Không thể tự thay đổi vai trò của chính mình',
  },
  INVALID_ROLE_TRANSITION: {
    error: 'INVALID_ROLE_TRANSITION',
    message: 'Vai trò chỉ định không hợp lệ hoặc không được phép chuyển đổi',
  },
  AUTHOR_ROLE_USE_REQUEST_FLOW: {
    error: 'AUTHOR_ROLE_USE_REQUEST_FLOW',
    message: 'Vai trò Tác giả (AUTHOR) được xét duyệt riêng qua chức năng duyệt yêu cầu tác giả, không thể gán trực tiếp',
  },
  MANAGER_PERMISSION_DENIED: {
    error: 'MANAGER_PERMISSION_DENIED',
    message: 'Quản lý chỉ có quyền thao tác trên tài khoản Người dùng và Tác giả',
  },
  INVALID_OBJECT_ID: {
    error: 'INVALID_OBJECT_ID',
    message: 'Mã ID không hợp lệ',
  },
  CATEGORY_NOT_FOUND: {
    error: 'CATEGORY_NOT_FOUND',
    message: 'Không tìm thấy thể loại',
  },
  CATEGORY_NAME_EXISTS: {
    error: 'CATEGORY_NAME_EXISTS',
    message: 'Tên thể loại đã tồn tại trên hệ thống',
  },
  CATEGORY_SLUG_EXISTS: {
    error: 'CATEGORY_SLUG_EXISTS',
    message: 'Slug thể loại đã tồn tại trên hệ thống',
  },
  TAG_NOT_FOUND: {
    error: 'TAG_NOT_FOUND',
    message: 'Không tìm thấy tag',
  },
  TAG_NAME_EXISTS: {
    error: 'TAG_NAME_EXISTS',
    message: 'Tên tag đã tồn tại trên hệ thống',
  },
  TAG_SLUG_EXISTS: {
    error: 'TAG_SLUG_EXISTS',
    message: 'Slug tag đã tồn tại trên hệ thống',
  },
  STORY_NOT_FOUND: {
    error: 'STORY_NOT_FOUND',
    message: 'Không tìm thấy tác phẩm',
  },
  STORY_FORBIDDEN: {
    error: 'STORY_FORBIDDEN',
    message: 'Bạn không có quyền thao tác trên tác phẩm này',
  },
  STORY_SLUG_EXISTS: {
    error: 'STORY_SLUG_EXISTS',
    message: 'Đường dẫn (slug) tác phẩm đã tồn tại trên hệ thống',
  },
  STORY_ALREADY_PROCESSED: {
    error: 'STORY_ALREADY_PROCESSED',
    message: 'Tác phẩm này đã được xử lý duyệt trước đó',
  },
  REJECT_REASON_REQUIRED: {
    error: 'REJECT_REASON_REQUIRED',
    message: 'Vui lòng cung cấp lý do từ chối tác phẩm',
  },
  STORY_NOT_REJECTED: {
    error: 'STORY_NOT_REJECTED',
    message: 'Chỉ tác phẩm đang ở trạng thái bị từ chối mới có thể gửi phản hồi khiếu nại',
  },
  APPEAL_FEEDBACK_REQUIRED: {
    error: 'APPEAL_FEEDBACK_REQUIRED',
    message: 'Vui lòng nhập nội dung phản hồi / giải trình của bạn',
  },
};