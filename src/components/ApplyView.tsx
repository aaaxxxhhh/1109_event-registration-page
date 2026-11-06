import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Building2, User, Phone, Mail, FileText, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Applicant, EventConfig, GenderType } from '../types';
import {
  sanitizeName,
  sanitizeOrg,
  sanitizePhone,
  validateForm,
  formatPhone,
} from '../utils/validation';
import { saveApplicantToFirestore } from '../services/applicantDb';

interface ApplyViewProps {
  config: EventConfig;
  onSubmitSuccess: (applicant: Applicant) => void;
  applicantCount: number;
}

export const ApplyView: React.FC<ApplyViewProps> = ({
  config,
  onSubmitSuccess,
  applicantCount,
}) => {
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<GenderType | ''>('');
  const [consent, setConsent] = useState(false);

  // Field warning/blocked states
  const [blockedNotes, setBlockedNotes] = useState<{ [key: string]: string }>({});
  // Track which inputs have been interacted with
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedApplicant, setCompletedApplicant] = useState<Applicant | null>(null);

  // Validate on the fly
  const formErrors = validateForm({
    name,
    org,
    phone,
    email,
    gender,
    consent,
  });

  // Sequential unlock order as per prototype
  const isNameValid = !formErrors.name;
  const isOrgValid = !formErrors.org;
  const isPhoneValid = isNameValid && !formErrors.phone;
  const isEmailValid = isPhoneValid && !formErrors.email;
  const isGenderValid = isEmailValid && !formErrors.gender;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { clean, warning } = sanitizeName(e.target.value);
    setName(clean);
    setBlockedNotes(prev => ({ ...prev, name: warning }));
    setTouched(prev => ({ ...prev, name: true }));
  };

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { clean, warning } = sanitizeOrg(e.target.value);
    setOrg(clean);
    setBlockedNotes(prev => ({ ...prev, org: warning }));
    setTouched(prev => ({ ...prev, org: true }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { clean, warning } = sanitizePhone(e.target.value);
    setPhone(clean);
    setBlockedNotes(prev => ({ ...prev, phone: warning }));
    setTouched(prev => ({ ...prev, phone: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      org: true,
      phone: true,
      email: true,
      gender: true,
      consent: true,
    });

    const currentErrors = validateForm({
      name,
      org,
      phone,
      email,
      gender,
      consent,
    });

    if (Object.keys(currentErrors).length > 0) {
      setSubmitError('입력 정보에 오류가 있습니다. 붉은색 표시 항목을 확인해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const applicant = await saveApplicantToFirestore({
        name: name.trim(),
        org: org.trim(),
        phone,
        email: email.trim(),
        gender: gender as GenderType,
        consent: true,
      });

      setCompletedApplicant(applicant);
      onSubmitSuccess(applicant);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '신청 등록 중 오류가 발생했습니다.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setOrg('');
    setPhone('');
    setEmail('');
    setGender('');
    setConsent(false);
    setTouched({});
    setBlockedNotes({});
    setSubmitError(null);
    setCompletedApplicant(null);
  };

  // If completed, render success receipt view
  if (completedApplicant) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-teal-700" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            참가 신청이 완료되었습니다!
          </h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            <span className="font-semibold text-slate-900">{completedApplicant.name}</span>님, 접수가 정상적으로 처리되었습니다.
            <br />
            입력하신 이메일(<span className="font-mono text-teal-700 font-semibold">{completedApplicant.email}</span>)로 세부 안내를 전달해 드립니다.
          </p>

          {/* Receipt Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 text-left space-y-3 text-sm">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-medium">접수 번호</span>
              <span className="font-mono font-semibold text-slate-800">{completedApplicant.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">참가자명</span>
              <span className="font-semibold text-slate-900">{completedApplicant.name}</span>
            </div>
            {completedApplicant.org && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">소속</span>
                <span className="text-slate-800">{completedApplicant.org}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">연락처</span>
              <span className="font-mono text-slate-800">{formatPhone(completedApplicant.phone)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">성별</span>
              <span className="text-slate-800">{completedApplicant.gender}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
              <span className="text-slate-500 font-medium">신청 상태</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                {completedApplicant.status}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-8 py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 transition-colors shadow-sm text-sm"
            >
              새 신청서 작성하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isFull = applicantCount >= config.maxCapacity;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Event Header Banner */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-100 text-teal-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-teal-700" />
          <span>공식 이벤트 접수처</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
          {config.title}
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
          {config.subtitle || config.description}
        </p>

        {/* Quick event meta cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div>
            <span className="text-slate-400 font-medium">일시: </span>
            <span className="font-semibold text-slate-800">{config.eventDate}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium">장소: </span>
            <span className="font-semibold text-slate-800">{config.location}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium">주최: </span>
            <span className="text-slate-800">{config.organizer}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium">정원: </span>
            <span className="font-mono text-teal-700 font-semibold">{applicantCount}</span>
            <span className="text-slate-400"> / {config.maxCapacity}명 접수 중</span>
          </div>
        </div>
      </div>

      {/* Main Registration Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6" noValidate>
        {isFull && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">신청 정원이 마감되었습니다.</p>
              <p className="text-xs text-amber-700 mt-0.5">
                현재 추가 접수는 취소자 발생 시 예비 번호로 대기 등록 처리됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 1. Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="flex items-center justify-between text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-700" />
              이름
              <span className="text-xs px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-medium">필수</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">{name.length}/15</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            placeholder="한글 또는 영문, 공백 없이 15자 이내"
            maxLength={15}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all ${
              (touched.name && formErrors.name) || blockedNotes.name
                ? 'border-red-400 bg-red-50/20'
                : 'border-slate-300'
            }`}
          />
          {blockedNotes.name && (
            <p className="text-xs text-amber-600 font-medium">{blockedNotes.name}</p>
          )}
          {touched.name && formErrors.name && !blockedNotes.name && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formErrors.name}
            </p>
          )}
        </div>

        {/* 2. Organization (Optional) */}
        <div className="space-y-1.5">
          <label htmlFor="org" className="flex items-center justify-between text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              소속 / 회사 / 학교
              <span className="text-xs px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">선택</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">{org.length}/30</span>
          </label>
          <input
            id="org"
            type="text"
            value={org}
            onChange={handleOrgChange}
            onBlur={() => setTouched(prev => ({ ...prev, org: true }))}
            placeholder="예) 시넥스에듀 기획팀, 한국대학교 AI랩"
            maxLength={30}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all ${
              (touched.org && formErrors.org) || blockedNotes.org
                ? 'border-red-400 bg-red-50/20'
                : 'border-slate-300'
            }`}
          />
          {blockedNotes.org && (
            <p className="text-xs text-amber-600 font-medium">{blockedNotes.org}</p>
          )}
          {touched.org && formErrors.org && !blockedNotes.org && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formErrors.org}
            </p>
          )}
        </div>

        {/* 3. Phone */}
        <div className="space-y-1.5">
          <label htmlFor="phone" className="flex items-center justify-between text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-teal-700" />
              연락처 (휴대폰)
              <span className="text-xs px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-medium">필수</span>
            </span>
            {phone && (
              <span className="text-xs text-teal-700 font-mono font-medium">
                {formatPhone(phone)}
              </span>
            )}
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
            placeholder="숫자만 입력 예) 01012345678"
            maxLength={11}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all ${
              (touched.phone && formErrors.phone) || blockedNotes.phone
                ? 'border-red-400 bg-red-50/20'
                : 'border-slate-300'
            }`}
          />
          {blockedNotes.phone && (
            <p className="text-xs text-amber-600 font-medium">{blockedNotes.phone}</p>
          )}
          {touched.phone && formErrors.phone && !blockedNotes.phone && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formErrors.phone}
            </p>
          )}
          <p className="text-[12px] text-slate-500">
            기호(-) 없이 숫자만 입력해 주세요. 당첨 발표 및 입장 QR 코드가 카카오 알림톡/SMS로 발송됩니다.
          </p>
        </div>

        {/* 4. Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="flex items-center justify-between text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-teal-700" />
              이메일 주소
              <span className="text-xs px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-medium">필수</span>
            </span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              setTouched(prev => ({ ...prev, email: true }));
            }}
            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
            placeholder="예) name@example.com"
            maxLength={80}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all ${
              touched.email && formErrors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
            }`}
          />
          {touched.email && formErrors.email && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formErrors.email}
            </p>
          )}
          <p className="text-[12px] text-slate-500">
            아이디@도메인 형식으로 입력해 주세요. 발표 및 참여 링크가 이 주소로 전송됩니다.
          </p>
        </div>

        {/* 5. Gender */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">
            성별
            <span className="text-xs px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-medium ml-1.5">필수</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['남성', '여성', '선택 안 함'] as GenderType[]).map(g => (
              <label
                key={g}
                className={`flex items-center justify-center py-2.5 px-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                  gender === g
                    ? 'bg-teal-50 border-teal-700 text-teal-800 font-semibold shadow-xs'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={gender === g}
                  onChange={() => {
                    setGender(g);
                    setTouched(prev => ({ ...prev, gender: true }));
                  }}
                  className="sr-only"
                />
                <span>{g}</span>
              </label>
            ))}
          </div>
          {touched.gender && formErrors.gender && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formErrors.gender}
            </p>
          )}
        </div>

        {/* 6. Consent Policy Agreement */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              개인정보 수집 및 이용 동의
              <span className="text-xs px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-medium">필수</span>
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <th className="w-28 sm:w-32 bg-slate-50 text-slate-600 px-3.5 py-2.5 font-medium align-top">
                    수집 항목
                  </th>
                  <td className="px-3.5 py-2.5 text-slate-800 leading-relaxed">
                    <span className="font-semibold text-teal-800">(필수)</span> 이름, 연락처, 이메일, 성별
                    <br />
                    <span className="text-slate-500">(선택)</span> 소속
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <th className="bg-slate-50 text-slate-600 px-3.5 py-2.5 font-medium align-top">
                    수집 목적
                  </th>
                  <td className="px-3.5 py-2.5 text-slate-800 leading-relaxed">
                    행사 참가 자격 확인, 당첨자 추첨 및 공지, 입장권 발송, 행사 관련 안내
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <th className="bg-slate-50 text-slate-600 px-3.5 py-2.5 font-medium align-top">
                    보유 기간
                  </th>
                  <td className="px-3.5 py-2.5 text-slate-800 leading-relaxed">
                    행사 종료 후 <strong className="font-semibold text-teal-800">1개월 이내 안전하게 파기</strong>
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-50 text-slate-600 px-3.5 py-2.5 font-medium align-top">
                    거부 권리
                  </th>
                  <td className="px-3.5 py-2.5 text-slate-500 leading-relaxed">
                    수집 동의를 거부할 권리가 있으며, 거부 시 본 행사 신청 및 참가가 불가합니다.
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => {
                    setConsent(e.target.checked);
                    setTouched(prev => ({ ...prev, consent: true }));
                  }}
                  className="mt-0.5 w-4 h-4 rounded text-teal-700 focus:ring-teal-700/20 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-900">
                  [필수] 개인정보 수집 및 이용 목적을 확인하였으며 이에 동의합니다.
                </span>
              </label>
            </div>
          </div>

          {touched.consent && formErrors.consent && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formErrors.consent}
            </p>
          )}
        </div>

        {submitError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2 text-base cursor-pointer"
        >
          {isSubmitting ? (
            <span>신청 접수 처리 중...</span>
          ) : (
            <>
              <span>참가 신청 완료하기</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500 pt-2">
          문의 사항은 행사 운영국({config.contactEmail})으로 연락 주시기 바랍니다.
        </p>
      </form>
    </div>
  );
};
