import { useState, useMemo, useEffect } from 'react';

interface Phrase {
  italian: string;
  korean: string;
  pronunciation: string;
}

interface CustomPhrase extends Phrase {
  id: string;
  category: string;
}

// ── 내장 표현 ──

const BUILT_IN: Record<string, Phrase[]> = {
  greeting: [
    { italian: 'Ciao!', korean: '안녕하세요 / 안녕히 가세요', pronunciation: '챠오' },
    { italian: 'Buongiorno!', korean: '좋은 아침이에요', pronunciation: '부온조르노' },
    { italian: 'Buonasera!', korean: '좋은 저녁이에요', pronunciation: '부오나세라' },
    { italian: 'Grazie!', korean: '감사합니다', pronunciation: '그라찌에' },
    { italian: 'Prego!', korean: '천만에요 / 어서오세요', pronunciation: '프레고' },
    { italian: 'Per favore', korean: '부탁드려요', pronunciation: '페르 파보레' },
    { italian: 'Mi scusi', korean: '실례합니다', pronunciation: '미 스쿠지' },
    { italian: 'Parla inglese?', korean: '영어 하세요?', pronunciation: '파를라 잉글레제?' },
    { italian: 'Non capisco', korean: '이해 못 해요', pronunciation: '논 카피스코' },
    { italian: 'Sì / No', korean: '네 / 아니오', pronunciation: '씨 / 노' },
  ],
  food: [
    { italian: 'Il menù, per favore', korean: '메뉴판 주세요', pronunciation: '일 메뉴, 페르 파보레' },
    { italian: 'Vorrei...', korean: '...을/를 원합니다', pronunciation: '보레이' },
    { italian: 'Il conto, per favore', korean: '계산서 주세요', pronunciation: '일 콘토, 페르 파보레' },
    { italian: 'È delizioso!', korean: '맛있어요!', pronunciation: '에 델리찌오소' },
    { italian: 'Un caffè, per favore', korean: '커피 한 잔 주세요', pronunciation: '운 카페, 페르 파보레' },
    { italian: 'Acqua naturale / frizzante', korean: '생수 / 탄산수', pronunciation: '아쿠아 나투랄레 / 프리찬테' },
    { italian: 'Sono allergico a...', korean: '...에 알레르기 있어요', pronunciation: '소노 알레르지코 아' },
    { italian: 'Senza glutine', korean: '글루텐 없이', pronunciation: '센차 글루티네' },
    { italian: 'Prenotazione per due', korean: '2인 예약했어요', pronunciation: '프레노타찌오네 페르 두에' },
  ],
  shopping: [
    { italian: 'Quanto costa?', korean: '얼마예요?', pronunciation: '콴토 코스타?' },
    { italian: 'È troppo caro', korean: '너무 비싸요', pronunciation: '에 트로포 카로' },
    { italian: 'Posso provare?', korean: '입어봐도 될까요?', pronunciation: '포소 프로바레?' },
    { italian: 'Che taglia è?', korean: '사이즈가 어떻게 돼요?', pronunciation: '케 탈리아 에?' },
    { italian: 'Accettate carte di credito?', korean: '카드 되나요?', pronunciation: '아체타테 카르테 디 크레디토?' },
    { italian: 'Posso avere uno sconto?', korean: '할인 가능한가요?', pronunciation: '포소 아베레 우노 스콘토?' },
    { italian: 'Vorrei restituire questo', korean: '이것을 반품하고 싶어요', pronunciation: '보레이 레스티투이레 퀘스토' },
  ],
  transport: [
    { italian: "Dov'è la stazione?", korean: '역이 어디에 있나요?', pronunciation: '도베 라 스타찌오네?' },
    { italian: 'Un biglietto per...', korean: '...행 표 한 장 주세요', pronunciation: '운 빌리에토 페르' },
    { italian: 'Dove posso prendere il taxi?', korean: '택시 어디서 잡나요?', pronunciation: '도베 포소 프렌데레 일 탁시?' },
    { italian: 'A destra / A sinistra', korean: '오른쪽 / 왼쪽', pronunciation: '아 데스트라 / 아 시니스트라' },
    { italian: 'Dritto', korean: '직진', pronunciation: '드리토' },
    { italian: "Dov'è il bagno?", korean: '화장실이 어디에 있나요?', pronunciation: '도베 일 반뇨?' },
    { italian: 'Aeroporto', korean: '공항', pronunciation: '아에로포르토' },
  ],
  emergency: [
    { italian: 'Aiuto!', korean: '도와주세요!', pronunciation: '아이우토!' },
    { italian: 'Chiamate la polizia!', korean: '경찰 불러주세요!', pronunciation: '키아마테 라 폴리찌아!' },
    { italian: "Chiamate un'ambulanza!", korean: '구급차 불러주세요!', pronunciation: '키아마테 운암불란차!' },
    { italian: 'Mi hanno rubato il portafoglio', korean: '지갑을 도둑맞았어요', pronunciation: '미 안노 루바토 일 포르타폴리오' },
    { italian: 'Ho bisogno di un medico', korean: '의사가 필요해요', pronunciation: '오 비조뇨 디 운 메디코' },
    { italian: "Dov'è l'ospedale?", korean: '병원이 어디에 있나요?', pronunciation: '도베 로스페달레?' },
    { italian: 'Mi sono perso/a', korean: '길을 잃었어요', pronunciation: '미 소노 페르소/아' },
    { italian: 'Non sto bene', korean: '몸이 좋지 않아요', pronunciation: '논 스토 베네' },
  ],
};

const CATEGORIES = [
  { key: 'greeting', label: '인사', emoji: '👋' },
  { key: 'food', label: '음식·식당', emoji: '🍝' },
  { key: 'shopping', label: '쇼핑', emoji: '🛍️' },
  { key: 'transport', label: '교통', emoji: '🚆' },
  { key: 'emergency', label: '긴급', emoji: '🚨' },
  { key: 'custom', label: '내 표현', emoji: '⭐' },
];

const STORAGE_KEY = 'italian_custom_phrases';

function loadCustom(): CustomPhrase[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCustom(list: CustomPhrase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ── 표현 카드 ──

function PhraseCard({
  phrase,
  catLabel,
  isCustom,
  onTap,
  onDelete,
}: {
  phrase: Phrase;
  catLabel?: string;
  isCustom?: boolean;
  onTap: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onTap}
        className={`w-full text-left rounded-2xl px-4 py-3 transition-all active:scale-[0.98] shadow-sm ${
          isCustom
            ? 'bg-amber-50 border border-amber-100 hover:bg-amber-100/60'
            : 'bg-white border border-gray-100 hover:border-green-300 hover:bg-green-50/50'
        }`}
      >
        {catLabel && (
          <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">{catLabel}</span>
        )}
        {isCustom && !catLabel && (
          <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide">⭐ 내 표현</span>
        )}
        <p className="font-semibold text-gray-800 text-base mt-0.5">{phrase.italian}</p>
        <p className="text-sm text-gray-500 mt-0.5">{phrase.korean}</p>
        {phrase.pronunciation && (
          <p className="text-xs text-gray-400 mt-0.5">[{phrase.pronunciation}]</p>
        )}
      </button>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-400 hover:bg-red-200 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="삭제"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── 추가 폼 ──

function AddPhraseForm({
  onAdd,
  onClose,
  defaultCategory,
}: {
  onAdd: (p: CustomPhrase) => void;
  onClose: () => void;
  defaultCategory: string;
}) {
  const [italian, setItalian] = useState('');
  const [korean, setKorean] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [category, setCategory] = useState(
    defaultCategory === 'custom' ? 'greeting' : defaultCategory
  );

  const canSubmit = italian.trim() && korean.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({
      id: `custom-${Date.now()}`,
      italian: italian.trim(),
      korean: korean.trim(),
      pronunciation: pronunciation.trim(),
      category,
    });
    onClose();
  };

  return (
    <div className="mt-4 bg-white rounded-2xl shadow-md border border-amber-100 overflow-hidden">
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
        <p className="text-sm font-bold text-amber-700">새 표현 추가</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            이탈리아어 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={italian}
            onChange={(e) => setItalian(e.target.value)}
            placeholder="예: Dov'è il bagno?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            한국어 뜻 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={korean}
            onChange={(e) => setKorean(e.target.value)}
            placeholder="예: 화장실이 어디에 있나요?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            발음 <span className="text-gray-300 font-normal">(선택)</span>
          </label>
          <input
            type="text"
            value={pronunciation}
            onChange={(e) => setPronunciation(e.target.value)}
            placeholder="예: 도베 일 반뇨?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
          >
            {CATEGORIES.filter((c) => c.key !== 'custom').map((c) => (
              <option key={c.key} value={c.key}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 transition-colors"
          >
            추가
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──

export function ItalianHelper() {
  const [activeCategory, setActiveCategory] = useState('greeting');
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customPhrases, setCustomPhrases] = useState<CustomPhrase[]>(loadCustom);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    saveCustom(customPhrases);
  }, [customPhrases]);

  const handleAdd = (p: CustomPhrase) => {
    setCustomPhrases((prev) => [p, ...prev]);
    // 추가 후 해당 카테고리로 이동
    setActiveCategory(p.category);
  };

  const handleDelete = (id: string) => {
    setCustomPhrases((prev) => prev.filter((p) => p.id !== id));
  };

  // 내장 + 커스텀 합쳐서 검색
  const allForSearch = useMemo(() => {
    const builtIn = Object.entries(BUILT_IN).flatMap(([cat, list]) =>
      list.map((p) => ({ ...p, cat, isCustom: false, id: '' }))
    );
    const custom = customPhrases.map((p) => ({ ...p, cat: p.category, isCustom: true }));
    return [...builtIn, ...custom];
  }, [customPhrases]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return allForSearch.filter(
      (p) =>
        p.korean.includes(q) ||
        p.italian.toLowerCase().includes(q.toLowerCase()) ||
        p.pronunciation.includes(q)
    );
  }, [searchQuery, allForSearch]);

  const isSearching = searchQuery.trim().length > 0;

  // 현재 카테고리의 커스텀 표현
  const customInCategory = customPhrases.filter((p) => p.category === activeCategory);

  return (
    <div className="py-5">
      {/* 검색창 */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="한국어로 검색  예: 감사합니다, 계산서"
          className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-9 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isSearching ? (
        /* 검색 결과 */
        <div>
          <p className="text-xs text-gray-400 mb-3">
            검색 결과 <span className="font-semibold text-gray-600">{searchResults.length}개</span>
          </p>
          {searchResults.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">일치하는 표현이 없어요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((p, i) => {
                const cat = CATEGORIES.find((c) => c.key === p.cat);
                return (
                  <PhraseCard
                    key={i}
                    phrase={p}
                    catLabel={cat ? `${cat.emoji} ${cat.label}` : undefined}
                    isCustom={p.isCustom}
                    onTap={() => setSelectedPhrase(p)}
                    onDelete={p.isCustom ? () => handleDelete(p.id) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 카테고리 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setShowAddForm(false); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? cat.key === 'custom'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-green-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
                {cat.key === 'custom' && customPhrases.length > 0 && (
                  <span className={`text-[10px] font-bold ml-0.5 ${activeCategory === 'custom' ? 'text-white/80' : 'text-amber-500'}`}>
                    {customPhrases.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 내 표현 탭 */}
          {activeCategory === 'custom' ? (
            <div>
              <div className="space-y-2">
                {customPhrases.length === 0 && !showAddForm ? (
                  <div className="text-center py-12 text-gray-400 space-y-2">
                    <p className="text-3xl">⭐</p>
                    <p className="text-sm font-medium">아직 추가한 표현이 없어요</p>
                    <p className="text-xs text-gray-300">아래 버튼으로 나만의 표현을 저장해보세요</p>
                  </div>
                ) : (
                  customPhrases.map((p) => (
                    <PhraseCard
                      key={p.id}
                      phrase={p}
                      catLabel={CATEGORIES.find((c) => c.key === p.category)?.label}
                      isCustom
                      onTap={() => setSelectedPhrase(p)}
                      onDelete={() => handleDelete(p.id)}
                    />
                  ))
                )}
              </div>
              {showAddForm ? (
                <AddPhraseForm
                  onAdd={handleAdd}
                  onClose={() => setShowAddForm(false)}
                  defaultCategory={activeCategory}
                />
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full mt-4 py-3.5 border-2 border-dashed border-amber-200 rounded-2xl text-amber-500 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  새 표현 추가
                </button>
              )}
            </div>
          ) : (
            /* 일반 카테고리 */
            <div>
              <div className="space-y-2">
                {/* 내장 표현 */}
                {(BUILT_IN[activeCategory] ?? []).map((phrase, i) => (
                  <PhraseCard key={i} phrase={phrase} onTap={() => setSelectedPhrase(phrase)} />
                ))}
                {/* 해당 카테고리에 추가된 커스텀 표현 */}
                {customInCategory.map((p) => (
                  <PhraseCard
                    key={p.id}
                    phrase={p}
                    isCustom
                    onTap={() => setSelectedPhrase(p)}
                    onDelete={() => handleDelete(p.id)}
                  />
                ))}
              </div>

              {/* 추가 폼 or 추가 버튼 */}
              {showAddForm ? (
                <AddPhraseForm
                  onAdd={handleAdd}
                  onClose={() => setShowAddForm(false)}
                  defaultCategory={activeCategory}
                />
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  이 카테고리에 표현 추가
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* 전체화면 표시 모달 */}
      {selectedPhrase && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-green-600 cursor-pointer p-8"
          onClick={() => setSelectedPhrase(null)}
        >
          <p className="text-white/60 text-sm mb-8 tracking-wide">탭하여 닫기</p>
          <p
            className="text-white font-bold text-center leading-tight"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)' }}
          >
            {selectedPhrase.italian}
          </p>
          <p className="text-green-100 text-2xl mt-6 text-center">{selectedPhrase.korean}</p>
          {selectedPhrase.pronunciation && (
            <p className="text-green-200 text-lg mt-3 text-center">[{selectedPhrase.pronunciation}]</p>
          )}
        </div>
      )}
    </div>
  );
}
