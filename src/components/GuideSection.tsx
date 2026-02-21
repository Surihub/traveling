import { useState } from 'react';

interface GuideItem {
  title: string;
  desc: string;
}

interface Section {
  emoji: string;
  label: string;
  items: GuideItem[];
}

const sections: Section[] = [
  {
    emoji: '✈️',
    label: '개요 탭',
    items: [
      { title: '항공편 정보', desc: '인천↔로마 항공편 출발·도착 시간, 편명, 좌석 정보를 한눈에 확인할 수 있어요.' },
      { title: '사용 설명서', desc: '바로 이 화면이에요. 각 탭의 기능을 설명해 두었으니 처음 사용하실 때 참고하세요.' },
    ],
  },
  {
    emoji: '📅',
    label: '일정 탭',
    items: [
      { title: '일자별 일정 카드', desc: '여행 날짜별로 카드가 표시됩니다. 카드를 탭하면 그날의 세부 일정(숙소·관광·교통·식사 등)을 확인하고 편집할 수 있어요.' },
      { title: '들러야 할 곳', desc: '메모 탭에서 #관광지 태그를 달아 등록한 장소들이 여기에 표시됩니다. 각 장소 옆 "일정에 추가" 버튼으로 원하는 날짜와 순서를 선택해 일정에 바로 할당할 수 있어요.' },
      { title: '장소 바로 추가', desc: '"+ 장소 추가" 버튼으로 일정 탭에서 직접 장소를 등록할 수도 있어요. 메모 탭에 #관광지 태그로 자동 저장됩니다.' },
      { title: '세부 일정 편집', desc: '일정 카드를 탭하면 날짜별 상세 화면이 열립니다. 숙소 배정, 관광지·교통·식사 항목 추가, 구글 지도 연동이 가능해요.' },
    ],
  },
  {
    emoji: '🗺️',
    label: '현지투어 탭',
    items: [
      { title: '예약 투어 관리', desc: '남부투어 1박, 토스카나 와이너리 투어, 바티칸 투어 등 예약한 현지 투어를 관리해요.' },
      { title: '집합 정보', desc: '투어별 집합 장소, 집합 시간, 예약 번호, 투어 업체 정보를 저장해 두면 현지에서 바로 꺼내볼 수 있어요.' },
      { title: '예약 상태', desc: '계획중 → 예약완료 → 완료 순으로 상태를 관리할 수 있어요.' },
    ],
  },
  {
    emoji: '🏨',
    label: '숙소 탭',
    items: [
      { title: '숙소 후보 관리', desc: '도시별 숙소 후보를 등록하고 체크인·체크아웃 날짜, 예약 상태, 지도 링크를 관리해요.' },
      { title: '일정 연동', desc: '숙소 탭에서 등록된 숙소는 일정 세부 화면에서 해당 날짜에 배정할 수 있어요. 체크인 날짜 카드에만 숙소 이름이 표시돼요.' },
    ],
  },
  {
    emoji: '🛍️',
    label: '쇼핑 탭',
    items: [
      { title: '쇼핑 리스트', desc: '브랜드·아이템별로 쇼핑 목록을 관리해요. 구매 완료 시 체크 처리하면 취소선으로 표시됩니다.' },
    ],
  },
  {
    emoji: '🚆',
    label: '교통 탭',
    items: [
      { title: '기차·이동 예약', desc: '도시 간 이동 기차 예약 정보를 날짜순으로 정리해요. 열차 번호, 출발·도착 시간, 좌석, 예약 코드를 한눈에 확인할 수 있어요.' },
      { title: '예약 상태', desc: '계획중 / 예약완료 / 완료로 상태를 관리할 수 있어요.' },
    ],
  },
  {
    emoji: '📝',
    label: '메모 탭',
    items: [
      { title: '자유 메모', desc: '링크, 태그와 함께 여행 관련 정보를 자유롭게 저장해요. 나중에 태그로 필터링해서 빠르게 찾을 수 있어요.' },
      { title: '#관광지 태그', desc: '"관광지" 태그를 달아 메모를 저장하면 일정 탭의 "들러야 할 곳" 목록에 자동으로 나타나요. 들러야 할 모든 관광지를 여기에 미리 정리해 두고, 일정이 확정되면 해당 날짜에 할당하세요.' },
    ],
  },
  {
    emoji: '🇮🇹',
    label: '이탈리아어 탭',
    items: [
      { title: '한국어 검색', desc: '상단 검색창에 한국어로 입력하면 전체 표현에서 일치하는 문장을 찾아줘요. "감사합니다", "계산서" 등으로 검색해보세요.' },
      { title: '카테고리별 표현', desc: '인사·음식·쇼핑·교통·긴급 카테고리로 구분된 표현들을 탭하면 큰 화면으로 표시돼 현지에서 직접 보여줄 수 있어요.' },
    ],
  },
  {
    emoji: '💶',
    label: '환율 탭',
    items: [
      { title: '유로 환산기', desc: '유로(€) 금액을 입력하면 한국 원화로 실시간 환산해줘요. 쇼핑할 때 가격을 바로 확인하세요.' },
    ],
  },
  {
    emoji: '🔒',
    label: '편집 모드',
    items: [
      { title: '비밀번호 잠금', desc: '여행관리 탭은 비밀번호로 잠겨 있어요. 헤더 우측에서 잠금을 해제하면 1시간 동안 편집이 가능해요.' },
      { title: '동기화', desc: '헤더의 동기화 버튼으로 구글 시트와 데이터를 주고받을 수 있어요. "앱→시트"는 수정 모드 없이도 가능, "시트→앱"은 수정 모드가 필요해요.' },
    ],
  },
];

export function GuideSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📖</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">앱 사용 설명서</p>
            <p className="text-xs text-gray-400 mt-0.5">수빈이네 in Italy 기능 가이드</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-5">
          <p className="text-sm text-gray-500 leading-relaxed">
            수석빈 in Italy는 우리 둘만의 이탈리아 여행을 위한 전용 앱이에요.
            아래에서 각 탭의 기능을 확인하세요.
          </p>

          {sections.map((section) => (
            <div key={section.label}>
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mb-2">
                <span>{section.emoji}</span>
                {section.label}
              </h3>
              <div className="space-y-2 pl-1">
                {section.items.map((item) => (
                  <div key={item.title}>
                    <p className="text-xs font-semibold text-gray-600">{item.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mt-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              💡 <span className="font-semibold text-slate-600">Tip.</span> 이탈리아어 탭에서 표현을 탭하면 큰 화면으로 표시돼요 — 현지에서 직접 보여주면 의사소통이 훨씬 쉬워져요!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
