/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ApplyView } from './components/ApplyView';
import { AdminView } from './components/AdminView';
import { InfoView } from './components/InfoView';
import { Applicant, EventConfig } from './types';

const DEFAULT_CONFIG: EventConfig = {
  title: '2026 AI 테크 & 글로벌 이노베이션 컨퍼런스',
  subtitle: '디지털 전환 시대를 선도하는 기술 트렌드와 네트워킹의 장',
  description: 'AI, 클라우드, 데이터 기술의 최신 혁신 사례를 공유하고 업계 실무자 및 리더들과 교류하는 네트워킹 이벤트입니다.',
  eventDate: '2026년 11월 20일 (금) 14:00 ~ 18:00',
  location: '서울 코엑스 그랜드볼룸 & 온라인 동시 진행',
  maxCapacity: 200,
  isOpen: true,
  organizer: '테크이노베이션 포럼 사무국',
  contactEmail: 'contact@techevent2026.org',
};

const TOKEN_KEY = 'event_mgr_admin_token';

import { subscribeApplicants, subscribeEventConfig } from './services/applicantDb';

const getInitialTab = (): 'apply' | 'admin' | 'info' => {
  if (typeof window === 'undefined') return 'apply';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace('#', '');
  if (path.startsWith('/admin') || hash === 'admin') return 'admin';
  if (path.startsWith('/info') || hash === 'info') return 'info';
  return 'apply';
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'apply' | 'admin' | 'info'>(getInitialTab);
  const [config, setConfig] = useState<EventConfig>(DEFAULT_CONFIG);
  const [applicantCount, setApplicantCount] = useState<number>(0);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  // Sync pathname and hash routing
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase().replace('#', '');
      let tab: 'apply' | 'admin' | 'info' = 'apply';
      if (path.startsWith('/admin') || hash === 'admin') {
        tab = 'admin';
      } else if (path.startsWith('/info') || hash === 'info') {
        tab = 'info';
      } else {
        tab = 'apply';
      }
      setCurrentTab(tab);
      document.title =
        tab === 'admin'
          ? '관리자페이지 · 이벤트 참가 신청 및 DB 관리'
          : tab === 'info'
          ? '행사 안내 · 이벤트 참가 신청'
          : '신청페이지 · 이벤트 참가 신청';
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleTabChange = (tab: 'apply' | 'admin' | 'info') => {
    setCurrentTab(tab);
    const targetPath = tab === 'admin' ? '/admin' : tab === 'info' ? '/info' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    document.title =
      tab === 'admin'
        ? '관리자페이지 · 이벤트 참가 신청 및 DB 관리'
        : tab === 'info'
        ? '행사 안내 · 이벤트 참가 신청'
        : '신청페이지 · 이벤트 참가 신청';
  };

  // Real-time Firestore subscriptions for global count & configuration
  useEffect(() => {
    const unsubApplicants = subscribeApplicants(items => {
      setApplicantCount(items.length);
    });

    const unsubConfig = subscribeEventConfig(updatedConfig => {
      setConfig(updatedConfig);
    });

    return () => {
      unsubApplicants();
      unsubConfig();
    };
  }, []);

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  };

  const handleApplySuccess = (_applicant: Applicant) => {
    // Real-time listener automatically updates applicantCount
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-[#19242F]">
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        isAdminLoggedIn={Boolean(adminToken)}
        onAdminLogout={handleLogout}
        applicantCount={applicantCount}
        maxCapacity={config.maxCapacity}
      />

      <main className="flex-1">
        {currentTab === 'apply' && (
          <ApplyView
            config={config}
            onSubmitSuccess={handleApplySuccess}
            applicantCount={applicantCount}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView
            config={config}
            onConfigUpdated={newCfg => setConfig(newCfg)}
            adminToken={adminToken}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        )}

        {currentTab === 'info' && (
          <InfoView
            config={config}
            onGoToApply={() => handleTabChange('apply')}
            applicantCount={applicantCount}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">이벤트 접수 및 DB 관리 시스템</span>
            <span>·</span>
            <span>{config.organizer}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>문의: </span>
            <a
              href={`mailto:${config.contactEmail}`}
              className="text-teal-700 hover:underline font-mono"
            >
              {config.contactEmail}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
