import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Key,
  Search,
  Filter,
  Download,
  Trophy,
  UserPlus,
  MessageSquare,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Applicant, ApplicantStatus, EventConfig, AdminStats } from '../types';
import {
  formatDate,
  formatPhone,
  maskName,
  maskPhone,
  maskEmail,
  downloadCsv,
} from '../utils/validation';
import { DrawModal } from './DrawModal';
import { DirectAddModal } from './DirectAddModal';
import { MessageTemplateModal } from './MessageTemplateModal';
import { SettingsModal } from './SettingsModal';
import { ApplicantDetailModal } from './ApplicantDetailModal';
import {
  subscribeApplicants,
  updateApplicantInFirestore,
  deleteApplicantFromFirestore,
  batchUpdateApplicantsInFirestore,
  batchDeleteApplicantsInFirestore,
  seedInitialApplicants,
  resetAllApplicantsInFirestore,
} from '../services/applicantDb';

interface AdminViewProps {
  config: EventConfig;
  onConfigUpdated: (newConfig: EventConfig) => void;
  adminToken: string | null;
  onLoginSuccess: (token: string) => void;
  onLogout: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  config,
  onConfigUpdated,
  adminToken,
  onLoginSuccess,
  onLogout,
}) => {
  // Login form state
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Applicants & data state
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    received: 0,
    confirmed: 0,
    won: 0,
    cancelled: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [maskPrivacy, setMaskPrivacy] = useState(true);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const [isDirectAddOpen, setIsDirectAddOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [detailApplicant, setDetailApplicant] = useState<Applicant | null>(null);

  // Arm delete trackers for 2-step deletion
  const [armedDeleteId, setArmedDeleteId] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Real-time Firestore subscription for applicants
  useEffect(() => {
    if (!adminToken) return;

    setIsLoading(true);
    const unsubscribe = subscribeApplicants(
      items => {
        setApplicants(items);
        setStats({
          total: items.length,
          received: items.filter(a => a.status === '접수').length,
          confirmed: items.filter(a => a.status === '확인').length,
          won: items.filter(a => a.status === '당첨').length,
          cancelled: items.filter(a => a.status === '취소').length,
        });
        setIsLoading(false);
      },
      err => {
        console.error('Firestore subscription error:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [adminToken]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setLoginError('관리자 비밀번호를 입력해 주세요.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '비밀번호가 일치하지 않습니다.');
      }
      onLoginSuccess(data.token);
      setPassword('');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : '로그인 실패');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Inline update status via Firestore
  const handleStatusChange = async (id: string, newStatus: ApplicantStatus) => {
    if (!adminToken) return;
    try {
      await updateApplicantInFirestore(id, { status: newStatus });
      showNotice(`상태가 '${newStatus}'(으)로 Firestore에 실시간 반영되었습니다.`);
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  // Inline update memo via Firestore
  const handleMemoBlur = async (id: string, newMemo: string) => {
    if (!adminToken) return;
    try {
      await updateApplicantInFirestore(id, { memo: newMemo });
    } catch (err) {
      console.error('Memo update failed', err);
    }
  };

  // Single delete via Firestore
  const handleDeleteApplicant = async (id: string) => {
    if (!adminToken) return;
    try {
      await deleteApplicantFromFirestore(id);
      setSelectedIds(prev => prev.filter(selId => selId !== id));
      showNotice('신청자가 Firestore에서 삭제되었습니다.');
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Batch status change via Firestore
  const handleBatchStatus = async (newStatus: ApplicantStatus) => {
    if (!adminToken || selectedIds.length === 0) return;
    try {
      await batchUpdateApplicantsInFirestore(selectedIds, newStatus);
      showNotice(`선택된 ${selectedIds.length}명의 상태가 '${newStatus}'(으)로 변경되었습니다.`);
      setSelectedIds([]);
    } catch (err) {
      console.error('Batch status failed', err);
    }
  };

  // Batch delete via Firestore
  const handleBatchDelete = async () => {
    if (!adminToken || selectedIds.length === 0) return;
    if (!confirm(`선택한 ${selectedIds.length}명의 신청자를 영구 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await batchDeleteApplicantsInFirestore(selectedIds);
      showNotice(`선택된 ${selectedIds.length}명의 신청자가 삭제되었습니다.`);
      setSelectedIds([]);
    } catch (err) {
      console.error('Batch delete failed', err);
    }
  };

  // Seed sample realistic data to Firestore
  const handleSeedData = async () => {
    if (!adminToken) return;
    try {
      await seedInitialApplicants();
      showNotice('샘플 신청자가 Firestore에 성공적으로 생성되었습니다.');
    } catch (err) {
      console.error('Seed failed', err);
    }
  };

  // Reset all applicants in Firestore
  const handleResetData = async () => {
    if (!adminToken) return;
    if (!confirm('모든 신청자 데이터를 영구 삭제하시겠습니까? (되돌릴 수 없습니다)')) return;
    try {
      await resetAllApplicantsInFirestore(applicants);
      showNotice('모든 신청자 데이터가 Firestore에서 초기화되었습니다.');
      setSelectedIds([]);
    } catch (err) {
      console.error('Reset failed', err);
    }
  };

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter(a => {
      // Status filter
      if (statusFilter && a.status !== statusFilter) return false;
      // Gender filter
      if (genderFilter && a.gender !== genderFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesOrg = a.org ? a.org.toLowerCase().includes(q) : false;
        const matchesPhone = a.phone.includes(q) || formatPhone(a.phone).includes(q);
        const matchesEmail = a.email.toLowerCase().includes(q);
        const matchesMemo = a.memo ? a.memo.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesOrg && !matchesPhone && !matchesEmail && !matchesMemo) {
          return false;
        }
      }
      return true;
    });
  }, [applicants, statusFilter, genderFilter, searchQuery]);

  // Handle multi-select toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredApplicants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplicants.map(a => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // ============================================
  // Screen 1: Password Gate (When not logged in)
  // ============================================
  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">관리자 인증</h2>
            <p className="text-xs text-slate-500 mt-1">
              신청자 명단 및 개인정보 열람을 위해 비밀번호를 입력해 주세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="pw" className="block text-xs font-semibold text-slate-700 mb-1">
                관리자 비밀번호
              </label>
              <div className="relative">
                <input
                  id="pw"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  autoFocus
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 disabled:opacity-60 transition-all text-sm shadow-sm cursor-pointer"
            >
              {isLoggingIn ? '인증 확인 중...' : '관리자 화면 로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================
  // Screen 2: Authenticated Admin Dashboard
  // ============================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Toast notice banner */}
      {noticeMessage && (
        <div className="p-3.5 bg-teal-700 text-white rounded-xl shadow-md text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-white/80 hover:text-white text-xs font-normal"
          >
            닫기
          </button>
        </div>
      )}

      {/* Admin Header with Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              신청자 데이터베이스 관리
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 bg-teal-50 text-teal-800 font-semibold rounded-md border border-teal-200">
              전체 {applicants.length}명
            </span>
            <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded-md border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Firebase Firestore 실시간 연동</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            실시간 참가 신청 내역 확인, 상태 수정, 무작위 당첨 추첨 및 엑셀 다운로드를 진행할 수 있습니다.
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDrawOpen(true)}
            className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="당첨자 무작위 추첨"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>랜덤 추첨기</span>
          </button>

          <button
            onClick={() => setIsDirectAddOpen(true)}
            className="px-3 py-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold hover:bg-teal-100 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="현장/유선 접수자 직접 등록"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-700" />
            <span>신청자 직접 등록</span>
          </button>

          <button
            onClick={() => setIsTemplateOpen(true)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            title="알림톡/SMS 발송 문구"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>발송 템플릿</span>
          </button>

          <button
            onClick={() => downloadCsv(applicants, `${config.title}_참가자명단`)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            title="엑셀 호환 CSV 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV 다운로드</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            title="이벤트 및 비밀번호 설정"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip (Tabular Figures) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === ''
              ? 'bg-white border-teal-600 ring-2 ring-teal-600/10 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] text-slate-500 font-medium">전체 신청</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {stats.total}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('접수')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === '접수'
              ? 'bg-white border-teal-600 ring-2 ring-teal-600/10 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] text-slate-500 font-medium">접수 대기</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-700 font-mono tabular-nums mt-0.5">
            {stats.received}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('확인')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === '확인'
              ? 'bg-white border-teal-600 ring-2 ring-teal-600/10 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] text-teal-700 font-medium">확인 완료</div>
          <div className="text-xl sm:text-2xl font-bold text-teal-800 font-mono tabular-nums mt-0.5">
            {stats.confirmed}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('당첨')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === '당첨'
              ? 'bg-white border-amber-500 ring-2 ring-amber-500/10 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] text-amber-700 font-medium">최종 당첨</div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 font-mono tabular-nums mt-0.5">
            {stats.won}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('취소')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === '취소'
              ? 'bg-white border-red-500 ring-2 ring-red-500/10 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] text-red-600 font-medium">참가 취소</div>
          <div className="text-xl sm:text-2xl font-bold text-red-600 font-mono tabular-nums mt-0.5">
            {stats.cancelled}
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="이름, 소속, 연락처, 이메일, 메모 검색..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          {/* Status select filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-700"
            >
              <option value="">전체 상태</option>
              <option value="접수">접수</option>
              <option value="확인">확인</option>
              <option value="당첨">당첨</option>
              <option value="취소">취소</option>
            </select>

            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-700"
            >
              <option value="">성별 전체</option>
              <option value="남성">남성</option>
              <option value="여성">여성</option>
              <option value="선택 안 함">선택 안 함</option>
            </select>
          </div>
        </div>

        {/* Right side controls: Mask toggle & demo buttons */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            type="button"
            onClick={() => setMaskPrivacy(!maskPrivacy)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              maskPrivacy
                ? 'bg-teal-50 border-teal-200 text-teal-800'
                : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}
            title="개인정보 마스킹 여부 토글"
          >
            {maskPrivacy ? <EyeOff className="w-3.5 h-3.5 text-teal-700" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{maskPrivacy ? '마스킹 켬' : '전체 표시'}</span>
          </button>

          <button
            type="button"
            onClick={() => showNotice('Firebase Firestore 실시간 동기화 연결 상태입니다.')}
            disabled={isLoading}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100"
            title="실시간 상태 확인"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-700' : ''}`} />
          </button>

          {applicants.length === 0 && (
            <button
              type="button"
              onClick={handleSeedData}
              className="px-3 py-2 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold hover:bg-teal-100"
            >
              샘플 데이터 채우기
            </button>
          )}
        </div>
      </div>

      {/* Batch Operations Toolbar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-teal-900 text-white p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-fadeIn text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold">{selectedIds.length}개</span>
            <span className="text-teal-200">항목이 선택되었습니다.</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-teal-200 font-medium">선택 항목 상태 일괄 변경:</span>
            {(['접수', '확인', '당첨', '취소'] as ApplicantStatus[]).map(st => (
              <button
                key={st}
                onClick={() => handleBatchStatus(st)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md font-semibold transition-colors"
              >
                {st}
              </button>
            ))}

            <button
              onClick={() => {
                const selectedList = applicants.filter(a => selectedIds.includes(a.id));
                downloadCsv(selectedList, '선택_참가자_명단');
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md font-semibold"
            >
              선택 CSV 저장
            </button>

            <button
              onClick={handleBatchDelete}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold ml-1"
            >
              선택 삭제
            </button>
          </div>
        </div>
      )}

      {/* Main Applicants Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredApplicants.length > 0 &&
                      selectedIds.length === filteredApplicants.length
                    }
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 text-teal-700 rounded border-slate-300"
                  />
                </th>
                <th className="py-3 px-3 w-32">신청일시</th>
                <th className="py-3 px-3 w-28">이름</th>
                <th className="py-3 px-3">소속</th>
                <th className="py-3 px-3 w-32">연락처</th>
                <th className="py-3 px-3">이메일</th>
                <th className="py-3 px-2 w-16 text-center">성별</th>
                <th className="py-3 px-3 w-28">상태</th>
                <th className="py-3 px-3 min-w-[160px]">메모 (인라인 저장)</th>
                <th className="py-3 px-3 w-24 text-right">관리</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">
                      {applicants.length === 0
                        ? '아직 접수된 신청 내역이 없습니다.'
                        : '검색 조건에 맞는 신청자가 없습니다.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {applicants.length === 0
                        ? "'신청하기' 탭에서 참가 신청을 받거나 샘플 데이터를 추가해 보세요."
                        : '검색어나 상태 필터를 변경해 보세요.'}
                    </p>
                    {applicants.length === 0 && (
                      <button
                        onClick={handleSeedData}
                        className="mt-3 px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-semibold hover:bg-teal-800"
                      >
                        테스트용 샘플 데이터 생성
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredApplicants.map(applicant => {
                  const isSelected = selectedIds.includes(applicant.id);
                  const isArmed = armedDeleteId === applicant.id;

                  return (
                    <tr
                      key={applicant.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-teal-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(applicant.id)}
                          className="w-3.5 h-3.5 text-teal-700 rounded border-slate-300"
                        />
                      </td>

                      {/* Submitted date */}
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(applicant.submittedAt)}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        <button
                          onClick={() => setDetailApplicant(applicant)}
                          className="hover:text-teal-700 hover:underline text-left"
                        >
                          {maskPrivacy ? maskName(applicant.name) : applicant.name}
                        </button>
                      </td>

                      {/* Organization */}
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                        {applicant.org || <span className="text-slate-300">-</span>}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-mono text-slate-800 whitespace-nowrap">
                        {maskPrivacy
                          ? maskPhone(applicant.phone)
                          : formatPhone(applicant.phone)}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 font-mono text-slate-600 truncate max-w-[160px]">
                        {maskPrivacy ? maskEmail(applicant.email) : applicant.email}
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-2 text-center text-slate-500">
                        {applicant.gender}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-3">
                        <select
                          value={applicant.status}
                          onChange={e =>
                            handleStatusChange(applicant.id, e.target.value as ApplicantStatus)
                          }
                          className={`w-full py-1 px-2 rounded-lg font-semibold text-xs border focus:outline-none cursor-pointer ${
                            applicant.status === '당첨'
                              ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                              : applicant.status === '확인'
                              ? 'bg-teal-50 text-teal-900 border-teal-300'
                              : applicant.status === '취소'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="접수">접수</option>
                          <option value="확인">확인</option>
                          <option value="당첨">당첨</option>
                          <option value="취소">취소</option>
                        </select>
                      </td>

                      {/* Memo inline input */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          defaultValue={applicant.memo || ''}
                          onBlur={e => handleMemoBlur(applicant.id, e.target.value.trim())}
                          placeholder="메모 입력"
                          className="w-full px-2 py-1 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-teal-700 rounded text-slate-800 text-xs focus:outline-none transition-colors"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailApplicant(applicant)}
                            className="px-2 py-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded text-xs font-medium"
                            title="상세보기"
                          >
                            상세
                          </button>

                          <button
                            onClick={() => {
                              if (!isArmed) {
                                setArmedDeleteId(applicant.id);
                                setTimeout(() => {
                                  setArmedDeleteId(prev => (prev === applicant.id ? null : prev));
                                }, 3500);
                              } else {
                                handleDeleteApplicant(applicant.id);
                                setArmedDeleteId(null);
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                              isArmed
                                ? 'bg-red-600 text-white'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={isArmed ? '한 번 더 누르면 삭제' : '삭제'}
                          >
                            {isArmed ? '확인' : '삭제'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with counts and data maintenance */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span>표시 중: </span>
            <strong className="text-slate-800 font-mono">{filteredApplicants.length}</strong>
            <span> / 전체 </span>
            <strong className="text-slate-800 font-mono">{applicants.length}</strong>명
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedData}
              className="text-teal-700 hover:underline font-medium"
            >
              샘플 데이터 추가
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={handleResetData}
              className="text-red-600 hover:underline font-medium"
            >
              전체 데이터 초기화
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DrawModal
        isOpen={isDrawOpen}
        onClose={() => setIsDrawOpen(false)}
        applicants={applicants}
        adminToken={adminToken}
        onDrawSuccess={count => {
          showNotice(`${count}명의 당첨자가 성공적으로 추첨되었습니다!`);
        }}
      />

      <DirectAddModal
        isOpen={isDirectAddOpen}
        onClose={() => setIsDirectAddOpen(false)}
        adminToken={adminToken}
        onSuccess={() => {
          showNotice('새 신청자가 성공적으로 등록되었습니다.');
        }}
      />

      <MessageTemplateModal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        config={config}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        adminToken={adminToken}
        onConfigUpdated={newConfig => {
          onConfigUpdated(newConfig);
          showNotice('이벤트 설정이 성공적으로 업데이트되었습니다.');
        }}
      />

      <ApplicantDetailModal
        isOpen={!!detailApplicant}
        applicant={detailApplicant}
        onClose={() => setDetailApplicant(null)}
        adminToken={adminToken}
        onUpdate={updated => {
          setApplicants(prev => prev.map(a => (a.id === updated.id ? updated : a)));
          setDetailApplicant(updated);
          showNotice('신청자 정보가 수정되었습니다.');
        }}
        onDelete={id => {
          handleDeleteApplicant(id);
          setDetailApplicant(null);
        }}
      />
    </div>
  );
};
