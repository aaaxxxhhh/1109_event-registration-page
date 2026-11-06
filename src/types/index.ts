export type ApplicantStatus = '접수' | '확인' | '당첨' | '취소';
export type GenderType = '남성' | '여성' | '선택 안 함';

export interface Applicant {
  id: string;
  name: string;
  org?: string;
  phone: string;
  email: string;
  gender: GenderType;
  consent: boolean;
  consentAt: string;
  submittedAt: string;
  status: ApplicantStatus;
  memo: string;
  drawnAt?: string;
}

export interface EventConfig {
  title: string;
  subtitle: string;
  description: string;
  eventDate: string;
  location: string;
  maxCapacity: number;
  isOpen: boolean;
  organizer: string;
  contactEmail: string;
  hasCustomPassword?: boolean;
}

export interface AdminStats {
  total: number;
  received: number; // 접수
  confirmed: number; // 확인
  won: number; // 당첨
  cancelled: number; // 취소
}
