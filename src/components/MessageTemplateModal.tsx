import React, { useState } from 'react';
import { X, MessageSquare, Copy, Check } from 'lucide-react';
import { EventConfig } from '../types';

interface MessageTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventConfig;
}

export const MessageTemplateModal: React.FC<MessageTemplateModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [selectedType, setSelectedType] = useState<'당첨안내' | '접수완료' | '리마인드'>('당첨안내');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const templates = {
    당첨안내: `[${config.title} 최종 참가 당첨 안내]

안녕하세요, {이름}님!
축하드립니다. ${config.title}의 최종 참가자로 선정되셨습니다.

■ 행사 일시: ${config.eventDate}
■ 행사 장소: ${config.location}
■ 주최/주관: ${config.organizer}

※ 유의사항
- 현장 등록 시 본 안내 문자 또는 신분증을 확인해 주시기 바랍니다.
- 부득이한 사정으로 참석이 어려운 경우 사전 취소 연락 부탁드립니다.

문의: ${config.contactEmail}`,

    접수완료: `[${config.title} 참가 신청 접수 완료]

안녕하세요, {이름}님.
${config.title} 신청서가 정상적으로 접수되었습니다.

■ 신청 일시: {신청일시}
■ 행사 일시: ${config.eventDate}
■ 결과 발표: 추후 문자 및 이메일 개별 공지

소중한 신청 감사드리며 좋은 결과 있으시길 바랍니다.
문의: ${config.contactEmail}`,

    리마인드: `[D-1 안내: ${config.title} 내일 개최]

안녕하세요, {이름}님.
내일 진행되는 ${config.title} 관련 최종 안내드립니다.

■ 일시: ${config.eventDate}
■ 장소: ${config.location}

현장에서 뵙기를 기대하겠습니다.
문의: ${config.contactEmail}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(templates[selectedType]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">발송용 메시지 템플릿</h3>
              <p className="text-xs text-slate-500">카카오 알림톡 및 단체 SMS 발송용 문구</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            {(['당첨안내', '접수완료', '리마인드'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  selectedType === type
                    ? 'bg-teal-50 border-teal-700 text-teal-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={11}
              value={templates[selectedType]}
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-sans leading-relaxed focus:outline-none select-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>클립보드에 복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>템플릿 문구 복사하기</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
