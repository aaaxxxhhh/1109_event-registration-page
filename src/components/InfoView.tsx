import React from 'react';
import { Calendar, MapPin, Users, Mail, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { EventConfig } from '../types';

interface InfoViewProps {
  config: EventConfig;
  onGoToApply: () => void;
  applicantCount: number;
}

export const InfoView: React.FC<InfoViewProps> = ({
  config,
  onGoToApply,
  applicantCount,
}) => {
  const scheduleItems = [
    { time: '13:30 ~ 14:00', title: '참가자 등록 및 네트워킹', desc: '현장 명찰 수령 및 웰컴 키트 배부' },
    { time: '14:00 ~ 14:15', title: '개회사 및 오프닝 키노트', desc: '디지털 혁신과 미래 테크 로드맵' },
    { time: '14:15 ~ 15:30', title: 'Session 1: 생성형 AI & 데이터 인프라', desc: '현업 실무진이 공유하는 프로덕션 레벨 아키텍처' },
    { time: '15:30 ~ 16:00', title: 'Coffee Break & 스폰서 부스 투어', desc: '자유로운 질의응답 및 다과 시간' },
    { time: '16:00 ~ 17:15', title: 'Session 2: 클라우드 네이티브 & 스케일업', desc: '트래픽 급증 대응 및 비용 최적화 사례' },
    { time: '17:15 ~ 18:00', title: '패널 토크 & 럭키드로우 경품 추첨', desc: '연사 Q&A 및 참가자 경품 추첨식' },
  ];

  const faqs = [
    {
      q: '참가 비용이 있나요?',
      a: '본 컨퍼런스는 사전 신청 후 최종 승인/당첨된 분들에 한해 전액 무료로 진행됩니다.',
    },
    {
      q: '온라인 스트리밍도 함께 제공되나요?',
      a: '네, 사전 신청 시 기재해 주신 이메일로 행사 1일 전 유튜브 라이브 비공개 링크를 발송해 드립니다.',
    },
    {
      q: '신청 정보 수정이나 취소는 어떻게 하나요?',
      a: '동일한 휴대폰 번호로 다시 신청서를 작성하시면 기존 정보가 갱신되며, 취소를 원하실 경우 문의 이메일로 접수해 주시면 즉시 처리해 드립니다.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Hero Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-xs font-semibold mb-3">
          <span>EVENT INFORMATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
          {config.title}
        </h1>
        <p className="text-slate-600 text-base mt-2 leading-relaxed">
          {config.subtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">일시</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{config.eventDate}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">장소</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{config.location}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">정원 및 현황</div>
              <div className="text-sm font-semibold text-teal-800 mt-0.5 font-mono tabular-nums">
                {applicantCount}명 신청 중 / 정원 {config.maxCapacity}명
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={onGoToApply}
            className="w-full sm:w-auto px-6 py-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            <span>지금 참가 신청하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Program Schedule */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-700" />
          <span>프로그램 타임테이블</span>
        </h2>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
          {scheduleItems.map((item, idx) => (
            <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors">
              <div className="w-36 shrink-0 font-mono text-xs font-semibold text-teal-800">
                {item.time}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-700" />
          <span>자주 묻는 질문 (FAQ)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{faq.q}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-600">
        <p className="font-semibold text-slate-800 mb-1">행사 운영 및 제휴 문의</p>
        <p>주최: {config.organizer} · 이메일: <a href={`mailto:${config.contactEmail}`} className="text-teal-700 underline font-mono">{config.contactEmail}</a></p>
      </div>
    </div>
  );
};
