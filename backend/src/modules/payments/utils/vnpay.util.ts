import * as crypto from 'node:crypto';
import qs from 'qs';

/**
 * Định dạng thời gian YYYYMMDDHHmmss theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7)
 * Đảm bảo 100% chuẩn xác dù máy chủ VPS đặt ở múi giờ UTC hay bất kỳ quốc gia nào
 */
export function formatVnpayDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date).reduce(
    (acc, part) => {
      acc[part.type] = part.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

/**
 * Sắp xếp các tham số VNPay theo bảng chữ cái và mã hóa ký tự URL theo chuẩn VNPay
 */
export function sortObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const str: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (let i = 0; i < str.length; i++) {
    const originalKey = decodeURIComponent(str[i]);
    const val = obj[originalKey];
    if (val !== undefined && val !== null && val !== '') {
      sorted[originalKey] = encodeURIComponent(String(val)).replace(/%20/g, '+');
    }
  }
  return sorted;
}

/**
 * Tạo chữ ký HMAC-SHA512 theo chuẩn VNPay
 */
export function createVnpaySignature(params: Record<string, any>, secretKey: string): string {
  const sorted = sortObject(params);
  const signData = qs.stringify(sorted, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

/**
 * Kiểm tra tính hợp lệ của chữ ký phản hồi từ VNPay
 */
export function verifyVnpaySignature(query: Record<string, any>, secretKey: string): boolean {
  if (!secretKey || !query) return false;
  const secureHash = query['vnp_SecureHash'] || query['vnp_securehash'];
  if (!secureHash) return false;

  const params: Record<string, any> = {};
  for (const key of Object.keys(query)) {
    if (
      key.startsWith('vnp_') &&
      key !== 'vnp_SecureHash' &&
      key !== 'vnp_SecureHashType' &&
      key !== 'vnp_securehash' &&
      key !== 'vnp_securehashtype'
    ) {
      params[key] = query[key];
    }
  }

  const calculatedHash = createVnpaySignature(params, secretKey);
  return String(secureHash).toLowerCase() === calculatedHash.toLowerCase();
}

/**
 * Lấy IP của người dùng một cách an toàn
 */
export function getClientIp(req: any): string {
  let ip =
    (req.headers?.['x-forwarded-for'] as string) ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    '127.0.0.1';

  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Chuẩn hóa IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  return ip;
}

