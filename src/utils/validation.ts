import { Applicant } from '../types';

export const NAME_REGEX = /^[가-힣a-zA-Z]{1,15}$/;
export const PHONE_RAW_REGEX = /^01[016789][1-9]\d{6,7}$/;
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function sanitizeName(val: string): { clean: string; warning: string } {
  let warning = '';
  if (/\d/.test(val)) warning = '이름에는 숫자를 입력할 수 없어요.';
  else if (/\s/.test(val)) warning = '이름에는 공백을 입력할 수 없어요.';
  else if (/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z]/.test(val)) warning = '이름은 한글 또는 영문만 입력할 수 있어요.';

  const clean = Array.from(val)
    .filter(ch => /[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z]/.test(ch))
    .slice(0, 15)
    .join('');

  return { clean, warning };
}

export function sanitizeOrg(val: string): { clean: string; warning: string } {
  let warning = '';
  if (/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]/.test(val)) {
    warning = '소속은 한글, 영문, 숫자, 공백만 입력할 수 있어요.';
  }
  const clean = Array.from(val)
    .filter(ch => /[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]/.test(ch))
    .slice(0, 30)
    .join('');

  return { clean, warning };
}

export function sanitizePhone(val: string): { clean: string; warning: string } {
  let warning = '';
  if (/\s/.test(val)) warning = '연락처에는 공백을 입력할 수 없어요. 숫자만 입력해 주세요.';
  else if (/[^\d]/.test(val)) warning = '연락처에는 기호(- 등)를 제외한 숫자만 입력해 주세요.';

  const clean = val.replace(/\D/g, '').slice(0, 11);
  return { clean, warning };
}

export function validateForm(data: {
  name: string;
  org?: string;
  phone: string;
  email: string;
  gender?: string;
  consent: boolean;
}): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  // Name
  if (!data.name.trim()) {
    errors.name = '이름을 입력해 주세요.';
  } else if (/[ㄱ-ㅎㅏ-ㅣ]/.test(data.name)) {
    errors.name = '한글 이름을 완성된 글자로 입력해 주세요.';
  } else if (!NAME_REGEX.test(data.name.trim())) {
    errors.name = '이름은 공백 없이 한글 또는 영문 15자 이내로 입력해 주세요.';
  }

  // Org (optional)
  if (data.org && data.org.trim()) {
    if (/[ㄱ-ㅎㅏ-ㅣ]/.test(data.org)) {
      errors.org = '소속을 완성된 글자로 입력해 주세요.';
    }
  }

  // Phone
  const rawPhone = data.phone.replace(/\D/g, '');
  if (!rawPhone) {
    errors.phone = '연락처를 입력해 주세요.';
  } else if (!/^01[016789]/.test(rawPhone)) {
    errors.phone = '휴대폰 번호는 010, 011, 016, 017, 018, 019로 시작해야 해요.';
  } else if (rawPhone.length > 3 && rawPhone[3] === '0') {
    errors.phone = '010 다음 자리는 0으로 시작할 수 없어요. 예) 01012345678';
  } else if (!PHONE_RAW_REGEX.test(rawPhone)) {
    errors.phone = '휴대폰 번호를 끝까지 올바르게 입력해 주세요. 예) 01012345678';
  }

  // Email
  const cleanEmail = data.email.trim();
  if (!cleanEmail) {
    errors.email = '이메일을 입력해 주세요.';
  } else if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.email = '올바른 이메일 형식이 아니에요. 예) name@example.com';
  }

  // Gender
  if (!data.gender) {
    errors.gender = '성별을 선택해 주세요.';
  }

  // Consent
  if (!data.consent) {
    errors.consent = '개인정보 수집·이용 동의는 필수예요. 동의해야 신청할 수 있어요.';
  }

  return errors;
}

export function formatPhone(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export function maskName(name: string): string {
  const chars = Array.from(String(name || '').trim());
  if (chars.length <= 1) return chars.join('');
  if (chars.length === 2) return `${chars[0]}*`;
  return chars[0] + '*'.repeat(chars.length - 2) + chars[chars.length - 1];
}

export function maskPhone(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 8) return digits;
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export function maskEmail(email: string): string {
  const [user, domain] = String(email || '').split('@');
  if (!domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function escapeCsvCell(val: unknown): string {
  let str = String(val == null ? '' : val);
  // Protect against Excel formula injection
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(applicants: Applicant[]): string {
  const headers = [
    '신청일시',
    '이름',
    '소속',
    '연락처',
    '이메일',
    '성별',
    '개인정보 동의',
    '동의일시',
    '상태',
    '메모',
    '추첨일시',
  ];

  const rows = applicants.map(r => [
    formatDate(r.submittedAt),
    r.name,
    r.org || '',
    formatPhone(r.phone),
    r.email,
    r.gender,
    r.consent ? '동의' : '미동의',
    formatDate(r.consentAt),
    r.status || '접수',
    r.memo || '',
    r.drawnAt ? formatDate(r.drawnAt) : '',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map(row => row.map(escapeCsvCell).join(','))
      .join('\r\n');

  return csvContent;
}

export function downloadCsv(applicants: Applicant[], filenamePrefix = '이벤트_신청자_명단'): void {
  const csv = generateCsv(applicants);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
