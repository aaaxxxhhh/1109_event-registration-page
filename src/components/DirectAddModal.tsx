import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { GenderType, ApplicantStatus } from '../types';
import { sanitizeName, sanitizeOrg, sanitizePhone, validateForm } from '../utils/validation';
import { saveApplicantToFirestore, updateApplicantInFirestore } from '../services/applicantDb';

interface DirectAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminToken: string;
}

export const DirectAddModal: React.FC<DirectAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  adminToken,
}) => {
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<GenderType>('남성');
  const [status, setStatus] = useState<ApplicantStatus>('확인');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm({
      name,
      org,
      phone,
      email,
      gender,
      consent: true,
    });

    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create applicant directly in Firestore
      const newApplicant = await saveApplicantToFirestore({
        name: name.trim(),
        org: org.trim(),
        phone,
        email: email.trim(),
        gender,
        consent: true,
      });

      // Update status or memo if specified
      if (status !== '접수' || memo) {
        await updateApplicantInFirestore(newApplicant.id, {
          status,
          memo: memo.trim(),
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl border border-slate-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">신청자 직접 등록</h3>
              <p className="text-xs text-slate-500">현장 접수 또는 유선 접수자를 추가합니다</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">이름 (필수)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(sanitizeName(e.target.value).clean)}
              placeholder="홍길동"
              maxLength={15}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">소속 (선택)</label>
            <input
              type="text"
              value={org}
              onChange={e => setOrg(sanitizeOrg(e.target.value).clean)}
              placeholder="예) 테크기업 기획팀"
              maxLength={30}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">연락처 (숫자만)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(sanitizePhone(e.target.value).clean)}
                placeholder="01012345678"
                maxLength={11}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-teal-700"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">성별</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as GenderType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
              >
                <option value="남성">남성</option>
                <option value="여성">여성</option>
                <option value="선택 안 함">선택 안 함</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">이메일 (필수)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              maxLength={80}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">초기 상태</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ApplicantStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-teal-700"
              >
                <option value="접수">접수</option>
                <option value="확인">확인</option>
                <option value="당첨">당첨</option>
                <option value="취소">취소</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">관리자 메모</label>
              <input
                type="text"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="현장 접수 등"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-teal-700 text-white rounded-xl font-bold hover:bg-teal-800 disabled:opacity-60"
            >
              {loading ? '등록 중...' : '신청자 추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
