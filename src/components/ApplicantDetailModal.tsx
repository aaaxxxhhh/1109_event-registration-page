import React, { useState } from 'react';
import { X, User, Phone, Mail, Building2, Calendar, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { Applicant, ApplicantStatus, GenderType } from '../types';
import { formatDate, formatPhone } from '../utils/validation';
import { updateApplicantInFirestore } from '../services/applicantDb';

interface ApplicantDetailModalProps {
  applicant: Applicant | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Applicant) => void;
  onDelete: (id: string) => void;
  adminToken: string;
}

export const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({
  applicant,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  adminToken,
}) => {
  if (!isOpen || !applicant) return null;

  const [status, setStatus] = useState<ApplicantStatus>(applicant.status);
  const [memo, setMemo] = useState(applicant.memo || '');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(applicant.name);
  const [org, setOrg] = useState(applicant.org || '');
  const [phone, setPhone] = useState(applicant.phone);
  const [email, setEmail] = useState(applicant.email);
  const [gender, setGender] = useState<GenderType>(applicant.gender);

  const [saving, setSaving] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Partial<Applicant> = {
        status,
        memo,
        ...(isEditing ? { name, org, phone, email, gender } : {}),
      };

      await updateApplicantInFirestore(applicant.id, updates);

      const updatedRecord = { ...applicant, ...updates };
      onUpdate(updatedRecord);
      setIsEditing(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 4000);
      return;
    }
    onDelete(applicant.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">{applicant.name} 신청자 상세</h3>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                applicant.status === '당첨' ? 'bg-amber-100 text-amber-800' :
                applicant.status === '확인' ? 'bg-teal-100 text-teal-800' :
                applicant.status === '취소' ? 'bg-red-100 text-red-800' :
                'bg-slate-200 text-slate-700'
              }`}>
                {applicant.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">ID: {applicant.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Main applicant card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            {isEditing ? (
              <div className="space-y-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">이름</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">소속</label>
                  <input
                    type="text"
                    value={org}
                    onChange={e => setOrg(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">연락처</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">성별</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as GenderType)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="남성">남성</option>
                      <option value="여성">여성</option>
                      <option value="선택 안 함">선택 안 함</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-slate-400 block mb-0.5">이름 / 성별</span>
                  <span className="font-semibold text-slate-900 text-sm">{applicant.name}</span>
                  <span className="text-slate-500 ml-1.5">({applicant.gender})</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">소속</span>
                  <span className="font-medium text-slate-800">{applicant.org || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">연락처</span>
                  <span className="font-mono font-semibold text-teal-800">{formatPhone(applicant.phone)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">이메일</span>
                  <span className="font-mono text-slate-800">{applicant.email}</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <span>개인정보 수집 동의: {applicant.consent ? '✓ 동의 완료' : '미동의'}</span>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-teal-700 font-semibold hover:underline"
              >
                {isEditing ? '수정 취소' : '정보 수정'}
              </button>
            </div>
          </div>

          {/* Audit Timestamps */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 block">신청 접수 일시:</span>
              <span className="font-mono text-slate-800">{formatDate(applicant.submittedAt)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">개인정보 동의 일시:</span>
              <span className="font-mono text-slate-800">{formatDate(applicant.consentAt)}</span>
            </div>
            {applicant.drawnAt && (
              <div className="col-span-2 pt-1 border-t border-slate-200">
                <span className="text-slate-400 block">당첨 추첨 일시:</span>
                <span className="font-mono text-amber-700 font-semibold">{formatDate(applicant.drawnAt)}</span>
              </div>
            )}
          </div>

          {/* Status & Memo edit */}
          <div className="space-y-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">참가 상태 변경</label>
              <div className="flex gap-1.5">
                {(['접수', '확인', '당첨', '취소'] as ApplicantStatus[]).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`flex-1 py-2 rounded-lg font-semibold border transition-all ${
                      status === st
                        ? st === '당첨' ? 'bg-amber-100 border-amber-500 text-amber-900' :
                          st === '확인' ? 'bg-teal-100 border-teal-600 text-teal-900' :
                          st === '취소' ? 'bg-red-100 border-red-500 text-red-900' :
                          'bg-slate-200 border-slate-400 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">관리자 내부 메모</label>
              <textarea
                rows={3}
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="특이사항, 입장권 수령 여부, 문의 내용 등을 입력하세요"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleDelete}
              className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                deleteArmed
                  ? 'bg-red-600 text-white'
                  : 'text-red-600 hover:bg-red-50 border border-red-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleteArmed ? '한 번 더 누르면 즉시 삭제' : '신청자 삭제'}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 disabled:opacity-60 shadow-sm"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
