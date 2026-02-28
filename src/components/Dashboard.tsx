import { useState, useEffect } from 'react';
import { useTrip } from '../hooks/useTrip';
import { ItalianHelper } from './ItalianHelper';
import { CurrencyCalculator } from './CurrencyCalculator';

type MainTab = 'currency' | 'italian' | 'emergency';

interface DashboardProps {
  canEdit: boolean;
  onRequestEdit: () => void;
  onLogout: () => void;
  getRemainingTime: () => number;
}
// ── 긴급 연락처 ──
const EMERGENCY_CONTACTS = [
  { emoji: '🚨', name: '긴급구조 / 경찰', number: '112', tel: 'tel:112' },
  { emoji: '🚑', name: '앰뷸런스', number: '118', tel: 'tel:118' },
  { emoji: '🔥', name: '소방서', number: '115', tel: 'tel:115' },
  {
    emoji: '🏛️',
    name: '한국 대사관 (대표)',
    number: '+39-06-420-402-1',
    tel: 'tel:+390642040221',
    description: '근무시간 내 · 월-금 09:30-12:00, 14:00-16:30',
    mapsUrl: 'https://maps.app.goo.gl/tWvqXsMzDNe325wf8',
    websiteUrl: 'https://it.mofa.go.kr/it-ko/index.do',
  },
  { emoji: '🆘', name: '대사관 긴급전화', number: '+39-335-185-0499', tel: 'tel:+393351850499', description: '근무시간 외 긴급 시' },
  { emoji: '🌐', name: '영사안전콜센터', number: '+82-2-3210-0404', tel: 'tel:+82232100404', description: '사건사고 · 24시간 운영' },
  { emoji: '💳', name: 'KB국민카드', number: '+82-2-6300-7300', tel: 'tel:+82263007300' },
  { emoji: '💳', name: '신한카드', number: '+82-2-3420-7000', tel: 'tel:+82234207000' },
  { emoji: '💳', name: '우리카드', number: '+82-2-6958-9000', tel: 'tel:+82269589000' },
  { emoji: '💳', name: '하나카드', number: '+82-1800-1111', tel: 'tel:+8218001111' },
  { emoji: '💳', name: '현대카드', number: '+82-2-3015-9000', tel: 'tel:+82230159000' },
  { emoji: '💳', name: '씨티카드', number: '+82-2-2004-1004', tel: 'tel:+82220041004' },
  { 
    emoji: '👛', 
    name: '트래블월렛', 
    number: '앱/이메일 신고', 
    tel: 'mailto:support@travel-wallet.com',
    description: '앱(마이 > 카드 관리)에서 즉시 정지 가능.'
  },
];

// ── 시간 포맷 헬퍼 ──
function formatClock(date: Date, tz: string) {
  const time = new Intl.DateTimeFormat('ko-KR', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
  const dateStr = new Intl.DateTimeFormat('ko-KR', {
    timeZone: tz, month: 'numeric', day: 'numeric', weekday: 'short',
  }).format(date);
  return { time, date: dateStr };
}

const MAIN_TABS: { key: MainTab; label: string; emoji: string }[] = [
  { key: 'currency', label: '환율', emoji: '💶' },
  { key: 'italian', label: '이탈리아어', emoji: '🇮🇹' },
  { key: 'emergency', label: '긴급연락처', emoji: '🆘' },
];

export function Dashboard({ canEdit, onRequestEdit, onLogout, getRemainingTime }: DashboardProps) {
  const { trip } = useTrip();
  const [mainTab, setMainTab] = useState<MainTab>('currency');
  const [remainingTime, setRemainingTime] = useState(0);

  // 실시간 시계
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const italy = formatClock(now, 'Europe/Rome');
  const korea = formatClock(now, 'Asia/Seoul');

  useEffect(() => {
    if (canEdit) {
      const interval = setInterval(() => setRemainingTime(getRemainingTime()), 1000);
      setRemainingTime(getRemainingTime());
      return () => clearInterval(interval);
    }
  }, [canEdit, getRemainingTime]);

  const formatRemainingTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateDDay = () => {
    if (!trip?.startDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(trip.startDate);
    startDate.setHours(0, 0, 0, 0);
    return Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  const dDay = calculateDDay();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        {/* 실시간 시차 바 */}
        <div className="bg-slate-800 text-white">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center leading-tight">
              <span className="text-[10px] text-slate-400 font-medium">🇮🇹 이탈리아</span>
              <span className="text-lg font-bold tabular-nums tracking-tight">{italy.time}</span>
              <span className="text-[10px] text-slate-400">{italy.date}</span>
            </div>
            <div className="flex flex-col items-center text-slate-500">
              <span className="text-xs font-medium">시차</span>
              <span className="text-sm font-bold text-slate-300">-8h</span>
            </div>
            <div className="flex flex-col items-center leading-tight">
              <span className="text-[10px] text-slate-400 font-medium">🇰🇷 한국</span>
              <span className="text-lg font-bold tabular-nums tracking-tight">{korea.time}</span>
              <span className="text-[10px] text-slate-400">{korea.date}</span>
            </div>
          </div>
        </div>

        {/* 앱 타이틀 + 컨트롤 */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-8 overflow-hidden rounded-sm shadow-sm flex-shrink-0">
                <div className="flex-1 bg-[#009246]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#ce2b37]" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">
                  {trip?.title || '수빈이네 in Italy'}
                </h1>
                {dDay !== null && (
                  <p className="text-xs leading-tight">
                    {dDay > 0
                      ? <span className="text-rose-500 font-semibold">D-{dDay}</span>
                      : dDay === 0
                        ? <span className="text-rose-600 font-bold">D-Day! 🎉</span>
                        : <span className="text-gray-400">D+{Math.abs(dDay)}</span>}
                    {trip?.startDate && trip?.endDate && (
                      <span className="ml-1.5 text-gray-400">
                        {trip.startDate.replace(/-/g, '.')} ~ {trip.endDate.replace(/-/g, '.')}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href="https://docs.google.com/spreadsheets/d/1wPtSsr8AKYPM9kDSRGBWR18FpfClp3jVSwaiC1YpeN4/edit?gid=996931468#gid=996931468"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-full hover:bg-gray-100"
              >
                시트
              </a>
              {canEdit ? (
                <>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                    🔓 {formatRemainingTime(remainingTime)}
                  </span>
                  <button onClick={onLogout} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-full hover:bg-gray-100">
                    잠금
                  </button>
                </>
              ) : (
                <button
                  onClick={onRequestEdit}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-full hover:bg-gray-100"
                >
                  편집
                </button>
              )}
            </div>
          </div>

          {/* 메인 탭 */}
          <div className="flex gap-0">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all border-b-2 ${
                  mainTab === tab.key
                    ? 'border-slate-700 text-slate-800'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── 콘텐츠 ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full overflow-y-auto">
        {mainTab === 'currency' && (
          <div className="px-4">
            <div className="pt-4 flex justify-end">
              <a
                href="https://g.co/finance/EUR-KRW"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                구글 EUR/KRW 환율 보기
              </a>
            </div>
            <CurrencyCalculator />
          </div>
        )}

        {mainTab === 'italian' && <ItalianHelper />}

        {mainTab === 'emergency' && (
          <div className="px-4 py-5 space-y-3">
            <p className="text-xs text-gray-400 text-center">번호를 누르면 바로 전화할 수 있어요</p>
            {EMERGENCY_CONTACTS.map((c) => (
              <div key={c.name} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <a
                  href={c.tel}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-rose-50 active:scale-[0.98] transition-all"
                >
                  <span className="text-4xl flex-shrink-0">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xl font-bold text-rose-600 mt-0.5">{c.number}</p>
                    {'description' in c && c.description && (
                      <p className="text-xs text-gray-400 mt-1 leading-snug">{c.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-rose-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </a>
                {'websiteUrl' in c && c.websiteUrl && (
                  <a
                    href={c.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    대사관 홈페이지 바로가기
                  </a>
                )}
                {'mapsUrl' in c && c.mapsUrl && (
                  <a
                    href={c.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 border-t border-blue-100 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    구글 지도에서 위치 보기
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
