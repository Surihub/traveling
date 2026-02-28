import { useState } from 'react';

interface Phrase {
  italian: string;
  korean: string;
  pronunciation: string;
}

// ── 내장 표현 ──
const BUILT_IN: Record<string, Phrase[]> = {
  greeting: [
    { italian: 'Ciao!', korean: '안녕하세요 / 안녕히 가세요', pronunciation: '챠오' },
    { italian: 'Buongiorno!', korean: '좋은 아침이에요', pronunciation: '부온조르노' },
    { italian: 'Buonasera!', korean: '좋은 저녁이에요', pronunciation: '부오나세라' },
    { italian: 'Grazie mille!', korean: '정말 감사합니다', pronunciation: '그라찌에 밀레' },
    { italian: 'Prego!', korean: '천만에요 / 어서오세요', pronunciation: '프레고' },
    { italian: 'Per favore', korean: '부탁드려요', pronunciation: '페르 파보레' },
    { italian: 'Mi scusi', korean: '실례합니다 (저기요)', pronunciation: '미 스쿠지' },
    { italian: 'Parla inglese?', korean: '영어 하세요?', pronunciation: '파를라 잉글레제?' },
    { italian: 'Piacere', korean: '만나서 반가워요', pronunciation: '피아체레' },
    { italian: 'Sì / No', korean: '네 / 아니오', pronunciation: '씨 / 노' },
  ],
  food: [
    { italian: 'Il menù, per favore', korean: '메뉴판 주세요', pronunciation: '일 메뉴, 페르 파보레' },
    { italian: 'Vorrei ordinare', korean: '주문하고 싶어요', pronunciation: '보레이 오르디나레' },
    { italian: 'Il conto, per favore', korean: '계산서 주세요', pronunciation: '일 콘토, 페르 파보레' },
    { italian: 'Acqua naturale / frizzante', korean: '생수 / 탄산수', pronunciation: '아쿠아 나투랄레 / 프리찬테' },
    { italian: 'Un bicchiere di vino rosso / bianco', korean: '레드 / 화이트 와인 한 잔', pronunciation: '운 비키에레 디 비노 로쏘 / 비앙코' },
    { italian: 'Senza sale, per favore', korean: '소금은 빼주세요', pronunciation: '센차 살레, 페르 파보레' },
    { italian: 'È delizioso!', korean: '정말 맛있어요!', pronunciation: '에 델리찌오소' },
    { italian: "Dov'è il bagno?", korean: '화장실이 어디인가요?', pronunciation: '도베 일 반뇨?' },
    { italian: 'Posso pagare con carta?', korean: '카드로 계산해도 될까요?', pronunciation: '포소 파가레 콘 카르타?' },
    { italian: 'Prenotazione per due', korean: '2인 예약했습니다', pronunciation: '프레노타찌오네 페르 두에' },
    { italian: 'Posso avere un tavolo vicino alla finestra?', korean: '창가 자리에 앉을 수 있을까요?', pronunciation: '포소 아베레 운 타볼로 비치노 알라 피네스트라?' },
    { italian: 'Portate il conto, per favore', korean: '계산서 가져다주세요', pronunciation: '포르타테 일 콘토, 페르 파보레' },
  ],
  shopping: [
    { italian: 'Quanto costa?', korean: '얼마예요?', pronunciation: '콴토 코스타?' },
    { italian: 'Posso provare?', korean: '입어봐도 될까요?', pronunciation: '포소 프로바레?' },
    { italian: 'Lo prendo', korean: '이걸로 살게요', pronunciation: '로 프렌도' },
    { italian: 'Sconto, per favore?', korean: '할인 좀 해주시겠어요?', pronunciation: '스콘토, 페르 파보레?' },
    { italian: 'È troppo caro', korean: '너무 비싸요', pronunciation: '에 트로포 카로' },
    { italian: 'Busta, per favore', korean: '봉투 하나 주세요', pronunciation: '부스타, 페르 파보레' },
    { italian: 'Tax Free, per favore', korean: '텍스 리펀 받을 수 있을까요?', pronunciation: '텍스 프리, 페르 파보레' },
    { italian: 'A che ora chiude?', korean: '몇 시에 문 닫아요?', pronunciation: '아 케 오라 키우데?' },
    { italian: 'Posso pagare in contanti?', korean: '현금으로 계산해도 돼요?', pronunciation: '포소 파가레 인 콘탄티?' },
  ],
  transport: [
    { italian: "Dov'è la stazione?", korean: '역이 어디에 있나요?', pronunciation: '도베 라 스타찌오네?' },
    { italian: 'Un biglietto per...', korean: '...행 표 한 장 주세요', pronunciation: '운 빌리에토 페르' },
    { italian: 'Dove posso prendere il taxi?', korean: '택시 어디서 타나요?', pronunciation: '도베 포소 프렌데레 일 탁시?' },
    { italian: 'Andata e ritorno', korean: '왕복 티켓', pronunciation: '안다타 에 리토르노' },
    { italian: 'A che ora parte?', korean: '몇 시에 출발하나요?', pronunciation: '아 케 오라 파르테?' },
    { italian: 'Binario', korean: '플랫폼', pronunciation: '비나리오' },
    { italian: 'Uscita', korean: '출구', pronunciation: '우쉬타' },
    { italian: 'Dritto / A destra / A sinistra', korean: '직진 / 오른쪽 / 왼쪽', pronunciation: '드리토 / 아 데스트라 / 아 시니스트라' },
    { italian: 'Quanto tempo ci vuole?', korean: '시간이 얼마나 걸려요?', pronunciation: '콴토 템포 치 보레?' },
  ],
  emergency: [
    { italian: 'Aiuto!', korean: '도와주세요!', pronunciation: '아이우토!' },
    { italian: 'Ho perso il passaporto', korean: '여권을 잃어버렸어요', pronunciation: '오 페르소 일 파싸포르토' },
    { italian: 'Chiamate la polizia!', korean: '경찰 불러주세요!', pronunciation: '키아마테 라 폴리찌아!' },
    { italian: 'Mi hanno rubato la borsa', korean: '가방을 도둑맞았어요', pronunciation: '미 안노 루바토 라 보르사' },
    { italian: "Dov'è la farmacia?", korean: '약국이 어디 있나요?', pronunciation: '도베 라 파르마치아?' },
    { italian: 'Mi sono perso/a', korean: '길을 잃었어요', pronunciation: '미 소노 페르소/아' },
    { italian: 'Non sto bene', korean: '몸이 안 좋아요', pronunciation: '논 스토 베네' },
    { italian: 'Serve un dottore', korean: '의사가 필요해요', pronunciation: '세르베 운 도토레' },
    { italian: "C'è un ospedale qui vicino?", korean: '이 근처에 병원이 있나요?', pronunciation: '체 운 오스페달레 쿠이 비치노?' },
  ],
  hotel: [
    { italian: 'Ho una prenotazione', korean: '예약이 되어 있어요', pronunciation: '오 우나 프레노타치오네' },
    { italian: 'Vorrei fare il check-in', korean: '체크인하고 싶어요', pronunciation: '보레이 파레 일 체크인' },
    { italian: 'Vorrei fare il check-out', korean: '체크아웃하고 싶어요', pronunciation: '보레이 파레 일 체크아웃' },
    { italian: 'A che ora è la colazione?', korean: '아침 식사는 몇 시인가요?', pronunciation: '아 케 오라 에 라 콜라치오네?' },
    { italian: 'Può chiamarmi un taxi?', korean: '택시 불러주실 수 있나요?', pronunciation: '푸오 키아마르미 운 택시?' },
    { italian: "C'è il Wi-Fi gratuito?", korean: '와이파이 무료인가요?', pronunciation: '체 일 와이파이 그라투이토?' },
    { italian: 'La chiave della camera, per favore', korean: '객실 키 주세요', pronunciation: '라 키아베 델라 카메라, 페르 파보레' },
    { italian: "Non funziona l'aria condizionata", korean: '에어컨이 작동하지 않아요', pronunciation: '논 푼치오나 라리아 콘디치오나타' },
  ],
  sightseeing: [
    { italian: "Dov'è il museo?", korean: '박물관이 어디 있나요?', pronunciation: '도베 일 무제오?' },
    { italian: 'Quanto costa il biglietto?', korean: '입장료는 얼마예요?', pronunciation: '콴토 코스타 일 빌리에토?' },
    { italian: 'È aperto oggi?', korean: '오늘 열려 있나요?', pronunciation: '에 아페르토 오지?' },
    { italian: 'Posso fare una foto?', korean: '사진 찍어도 될까요?', pronunciation: '포소 파레 우나 포토?' },
    { italian: 'Che bello!', korean: '멋지네요!', pronunciation: '케 벨로!' },
    { italian: 'Mi piace molto!', korean: '정말 마음에 들어요!', pronunciation: '미 피아체 몰토' },
    { italian: 'Ci sono visite guidate?', korean: '가이드 투어가 있나요?', pronunciation: '치 소노 비지테 구이다테?' },
  ],
  cafe: [
    { italian: 'Un caffè, per favore', korean: '에스프레소 한 잔 주세요', pronunciation: '운 카페, 페르 파보레' },
    { italian: 'Un cappuccino', korean: '카푸치노 주세요', pronunciation: '운 카푸치노' },
    { italian: 'Un cornetto, per favore', korean: '크루아상 하나 주세요', pronunciation: '운 코르네토, 페르 파보레' },
    { italian: 'Da portare via', korean: '테이크아웃이에요', pronunciation: '다 포르타레 비아' },
    { italian: 'Posso sedermi qui?', korean: '여기 앉아도 될까요?', pronunciation: '포소 세데르미 쿠이?' },
  ],
  weather: [
    { italian: 'Che tempo fa oggi?', korean: '오늘 날씨 어때요?', pronunciation: '케 템포 파 오지?' },
    { italian: 'Fa caldo', korean: '더워요', pronunciation: '파 칼도' },
    { italian: 'Fa freddo', korean: '추워요', pronunciation: '파 프레도' },
    { italian: 'È soleggiato', korean: '맑아요', pronunciation: '에 솔레지아토' },
    { italian: 'Piove', korean: '비가 와요', pronunciation: '피오베' },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  greeting: '인사',
  food: '음식/레스토랑',
  shopping: '쇼핑',
  transport: '교통',
  emergency: '긴급상황',
  hotel: '호텔',
  sightseeing: '관광',
  cafe: '카페',
  weather: '날씨',
};

// 모든 표현 목록 (검색용)
const ALL_PHRASES: (Phrase & { category: string })[] = Object.entries(BUILT_IN).flatMap(
  ([cat, phrases]) => phrases.map((p) => ({ ...p, category: cat }))
);

export function ItalianHelper() {
  const [activeCategory, setActiveCategory] = useState<string>('greeting');
  const [selected, setSelected] = useState<Phrase | null>(null);
  const [query, setQuery] = useState('');

  const isSearching = query.trim().length > 0;
  const q = query.trim().toLowerCase();

  const searchResults = isSearching
    ? ALL_PHRASES.filter(
        (p) =>
          p.italian.toLowerCase().includes(q) ||
          p.korean.includes(q) ||
          p.pronunciation.toLowerCase().includes(q)
      )
    : [];

  const phrases = BUILT_IN[activeCategory] ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* 검색창 */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색 (한국어, 이탈리아어, 발음)"
            className="w-full pl-9 pr-9 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 탭 (검색 중엔 숨김) */}
      {!isSearching && (
        <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {Object.keys(BUILT_IN).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-slate-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* 표현 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 mt-2">
        {isSearching ? (
          searchResults.length > 0 ? (
            searchResults.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelected(p)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:border-blue-300 hover:shadow transition-all active:scale-[0.98]"
              >
                <p className="text-[10px] text-gray-400 font-medium mb-1">{CATEGORY_LABELS[p.category] ?? p.category}</p>
                <p className="text-base font-semibold text-gray-900">{p.italian}</p>
                <p className="text-sm text-blue-500 mt-0.5">{p.pronunciation}</p>
                <p className="text-sm text-gray-500 mt-0.5">{p.korean}</p>
              </button>
            ))
          ) : (
            <p className="text-center text-gray-400 text-sm py-10">검색 결과가 없어요</p>
          )
        ) : (
          phrases.map((p, i) => (
            <button
              key={i}
              onClick={() => setSelected(p)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:border-blue-300 hover:shadow transition-all active:scale-[0.98]"
            >
              <p className="text-base font-semibold text-gray-900">{p.italian}</p>
              <p className="text-sm text-blue-500 mt-0.5">{p.pronunciation}</p>
              <p className="text-sm text-gray-500 mt-0.5">{p.korean}</p>
            </button>
          ))
        )}
      </div>

      {/* 크게 보기 오버레이 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center px-6"
          onClick={() => setSelected(null)}
        >
          <div className="text-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl font-bold text-white leading-tight mb-4">{selected.italian}</p>
            <p className="text-xl text-blue-300 mb-3">{selected.pronunciation}</p>
            <p className="text-lg text-slate-300">{selected.korean}</p>
            <button
              onClick={() => setSelected(null)}
              className="mt-10 px-8 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
