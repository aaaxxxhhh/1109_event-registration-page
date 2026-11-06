import React from 'react';
import { Shield, CheckCircle, LogOut, Ticket } from 'lucide-react';

interface HeaderProps {
  currentTab: 'apply' | 'admin' | 'info';
  onTabChange: (tab: 'apply' | 'admin' | 'info') => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
  applicantCount?: number;
  maxCapacity?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  isAdminLoggedIn,
  onAdminLogout,
  applicantCount = 0,
  maxCapacity = 200,
}) => {
  const isAdmin = currentTab === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Shield className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                  이벤트 관리자 센터
                </div>
                <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                  Admin Management Console
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                  이벤트 참가 신청
                </div>
                <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                  Official Event Registration
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Zone (Strictly without any page navigation tabs) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Firebase 실시간 연동</span>
              </div>
              {isAdminLoggedIn && (
                <button
                  onClick={onAdminLogout}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>로그아웃</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono tabular-nums">
              <span className="text-slate-400 font-medium">접수 현황:</span>
              <span className="font-semibold text-teal-700">{applicantCount}</span>
              <span className="text-slate-400">/</span>
              <span>{maxCapacity}명</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
