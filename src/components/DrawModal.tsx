import React, { useState } from 'react';
import { Sparkles, Trophy, X, Users, RefreshCw } from 'lucide-react';
import { Applicant } from '../types';
import { maskName, formatPhone } from '../utils/validation';
import { drawWinnersInFirestore } from '../services/applicantDb';

interface DrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicants: Applicant[];
  onDrawSuccess: (winnerCount: number) => void;
  adminToken: string;
}

export const DrawModal: React.FC<DrawModalProps> = ({
  isOpen,
  onClose,
  applicants,
  onDrawSuccess,
  adminToken,
}) => {
  const [count, setCount] = useState<number>(3);
  const [targetStatuses, setTargetStatuses] = useState<string[]>(['접수', '확인']);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState<Applicant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter pool
  const eligibleApplicants = applicants.filter(a => targetStatuses.includes(a.status));

  const handleToggleStatus = (status: string) => {
    if (targetStatuses.includes(status)) {
      if (targetStatuses.length > 1) {
        setTargetStatuses(targetStatuses.filter(s => s !== status));
      }
    } else {
      setTargetStatuses([...targetStatuses, status]);
    }
  };

  const handleExecuteDraw = async () => {
    if (eligibleApplicants.length === 0) {
      setError('추첨 대상 후보자가 없습니다.');
      return;
    }

    setIsDrawing(true);
    setError(null);
    setWinners(null);

    try {
      const selectedWinners = await drawWinnersInFirestore(applicants, count, targetStatuses);

      // Simulate a suspenseful 1.2s shuffle animation
      setTimeout(() => {
        setWinners(selectedWinners);
        setIsDrawing(false);
        onDrawSuccess(selectedWinners.length);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '추첨 중 오류 발생';
      setError(msg);
      setIsDrawing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">당첨자 랜덤 추첨기</h3>
              <p className="text-xs text-slate-500">신청자 명단 중 공정하게 무작위 추첨합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {winners ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
                🎉
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  총 {winners.length}명의 당첨자가 선정되었습니다!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  해당 참가자들의 상태가 '당첨'으로 자동 변경되었습니다.
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
                {winners.map((w, idx) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">{w.name}</span>
                        {w.org && <span className="text-slate-500 ml-1.5 font-normal">({w.org})</span>}
                      </div>
                    </div>
                    <div className="text-slate-600 font-mono">
                      {formatPhone(w.phone)}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setWinners(null);
                  onClose();
                }}
                className="w-full py-2.5 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 text-sm"
              >
                확인 및 닫기
              </button>
            </div>
          ) : (
            <>
              {/* Pool info */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>현재 추첨 가능 후보 풀:</span>
                </div>
                <span className="font-bold text-teal-700 text-sm font-mono tabular-nums">
                  {eligibleApplicants.length}명
                </span>
              </div>

              {/* Status selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  추첨 대상 상태 선택
                </label>
                <div className="flex gap-2">
                  {['접수', '확인'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleToggleStatus(st)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        targetStatuses.includes(st)
                          ? 'bg-teal-50 border-teal-700 text-teal-800 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ✓ {st} ({applicants.filter(a => a.status === st).length}명)
                    </button>
                  ))}
                </div>
              </div>

              {/* Winner count */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  추첨할 당첨자 수 (명)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, eligibleApplicants.length)}
                    value={count}
                    onChange={e => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-32 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-teal-700"
                  />
                  <div className="flex gap-1.5">
                    {[1, 3, 5, 10].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
                      >
                        {n}명
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  {error}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 text-sm"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDraw}
                  disabled={isDrawing || eligibleApplicants.length === 0}
                  className="flex-1 py-2.5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 disabled:opacity-50 text-sm flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isDrawing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>무작위 추첨 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{count}명 즉시 추첨하기</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
