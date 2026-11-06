import React, { useState } from 'react';
import { X, Settings, Key, Calendar, MapPin, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { EventConfig } from '../types';
import { saveEventConfigToFirestore } from '../services/applicantDb';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventConfig;
  onConfigUpdated: (newConfig: EventConfig) => void;
  adminToken: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  adminToken,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  // Event info state
  const [title, setTitle] = useState(config.title);
  const [subtitle, setSubtitle] = useState(config.subtitle || '');
  const [eventDate, setEventDate] = useState(config.eventDate);
  const [location, setLocation] = useState(config.location);
  const [maxCapacity, setMaxCapacity] = useState(config.maxCapacity);
  const [organizer, setOrganizer] = useState(config.organizer);
  const [contactEmail, setContactEmail] = useState(config.contactEmail);
  const [isOpenReg, setIsOpenReg] = useState(config.isOpen);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updatedConfig: EventConfig = {
        title,
        subtitle,
        description: config.description,
        eventDate,
        location,
        maxCapacity: Number(maxCapacity),
        organizer,
        contactEmail,
        isOpen: isOpenReg,
      };

      await saveEventConfigToFirestore(updatedConfig);
      onConfigUpdated(updatedConfig);
      setMessage({ type: 'ok', text: '이벤트 설정 정보가 Firestore에 실시간 저장되었습니다.' });
    } catch (err: unknown) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : '저장 중 오류 발생' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setMessage({ type: 'err', text: '새 비밀번호는 최소 4자 이상이어야 합니다.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'err', text: '새 비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '비밀번호 변경 실패');

      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'ok', text: '관리자 비밀번호가 안전하게 변경되었습니다.' });
    } catch (err: unknown) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : '오류 발생' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">이벤트 및 관리자 설정</h3>
              <p className="text-xs text-slate-500">행사 정보 및 관리자 보안 설정</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('info');
                setMessage(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'info'
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              행사 정보 수정
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('security');
                setMessage(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'security'
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              비밀번호 변경
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'ok'
                  ? 'bg-teal-50 border border-teal-200 text-teal-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === 'info' ? (
            <form onSubmit={handleSaveInfo} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">행사명</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">한 줄 소개</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">일시</label>
                  <input
                    type="text"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">최대 정원 (명)</label>
                  <input
                    type="number"
                    min={1}
                    value={maxCapacity}
                    onChange={e => setMaxCapacity(parseInt(e.target.value, 10) || 100)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">장소</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">주최/주관</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={e => setOrganizer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">문의 이메일</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-700">신청 접수 허용 상태</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOpenReg}
                    onChange={e => setIsOpenReg(e.target.checked)}
                    className="w-4 h-4 text-teal-700 rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-900">
                    {isOpenReg ? '접수 진행 중' : '접수 마감/중지'}
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-800 disabled:opacity-60"
                >
                  {loading ? '저장 중...' : '설정 저장'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="font-semibold text-slate-800">관리자 비밀번호 변경</p>
                <p className="text-slate-500 text-[11px]">
                  새로운 관리자 비밀번호를 입력하여 보안을 강화하세요.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">새 비밀번호 (4자 이상)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-800 disabled:opacity-60"
                >
                  {loading ? '변경 중...' : '비밀번호 변경하기'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
