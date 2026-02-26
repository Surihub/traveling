import { useState, useEffect, useMemo, useCallback } from 'react';

const MAJOR_CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'GBP', 'CNY', 'AUD', 'CAD', 'HKD', 'SGD', 'TWD', 'THB', 'VND'];
const QUICK_AMOUNTS = [1, 5, 10, 20, 50, 100, 200, 500];

export function CurrencyCalculator() {
  const [amount, setAmount] = useState(10);
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('KRW');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [currencies, setCurrencies] = useState(MAJOR_CURRENCIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchRates = useCallback(async (base: string) => {
    setLoading(true);
    setError(null);
    try {
      // 오늘 날짜 기준 URL → Cloudflare Pages → jsDelivr 순서로 시도
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const urls = [
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${today}/v1/currencies/${base.toLowerCase()}.json`,
        `https://latest.currency-api.pages.dev/v1/currencies/${base.toLowerCase()}.json`,
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`,
      ];

      let data: Record<string, unknown> | null = null;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) { data = await res.json(); break; }
        } catch { /* 다음 URL 시도 */ }
      }
      if (!data) throw new Error('모든 API 실패');

      const baseRates = data[base.toLowerCase()] as Record<string, number>;
      setRates(baseRates);
      setLastUpdated(typeof data.date === 'string' ? data.date : today);

      const all = Object.keys(baseRates).map((c) => c.toUpperCase());
      setCurrencies([
        ...MAJOR_CURRENCIES.filter((c) => all.includes(c)),
        ...all.filter((c) => !MAJOR_CURRENCIES.includes(c)),
      ]);
    } catch {
      setError('환율 정보를 불러오지 못했습니다. 네트워크를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates(fromCurrency);
  }, [fromCurrency, fetchRates]);

  const convertedAmount = useMemo(() => {
    const rate = rates[toCurrency.toLowerCase()];
    if (!rate) return null;
    return amount * rate;
  }, [amount, rates, toCurrency]);

  const eurToKrw = useMemo(() => {
    if (fromCurrency === 'EUR') return rates['krw'] ?? null;
    const eurRate = rates['eur'];
    const krwRate = rates['krw'];
    if (!eurRate || !krwRate) return null;
    return krwRate / eurRate;
  }, [rates, fromCurrency]);

  const fmt = (value: number, currency: string) => {
    try {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2,
      }).format(value);
    } catch {
      const decimals = currency === 'KRW' || currency === 'JPY' ? 0 : 2;
      return `${value.toLocaleString('ko-KR', { maximumFractionDigits: decimals })} ${currency}`;
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const currentRate = rates[toCurrency.toLowerCase()];

  return (
    <div className="py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">💶 실시간 환율 계산기</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? '환율 정보 불러오는 중...'
              : lastUpdated
                ? <span>기준일: <span className="font-semibold text-gray-700">{lastUpdated}</span></span>
                : ''}
          </p>
        </div>
        <button
          onClick={() => fetchRates(fromCurrency)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-40"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.01M20 20v-5h-.01M4 9a9 9 0 0115-4.47M20 15a9 9 0 01-15 4.47" />
          </svg>
          새로고침
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
        {/* 보내는 금액 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">보내는 금액</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={amount === 0 ? '' : String(amount)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, '');
                const num = raw === '' ? 0 : parseFloat(raw);
                if (!isNaN(num)) setAmount(num);
              }}
              placeholder="0"
              className="flex-1 text-2xl font-bold border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-24 bg-gray-100 border border-gray-200 rounded-xl px-2 py-2 font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {/* +1 / +5 / +10 빠른 추가 버튼 */}
          <div className="flex gap-2 mt-2">
            {[1, 5, 10].map((delta) => (
              <button
                key={delta}
                onClick={() => setAmount((prev) => prev + delta)}
                className="flex-1 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                +{delta}
              </button>
            ))}
            <button
              onClick={() => setAmount(0)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 스왑 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="w-10 h-10 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-blue-500 text-lg hover:bg-gray-50 hover:shadow-md transition-all"
            title="통화 바꾸기"
          >
            ⇅
          </button>
        </div>

        {/* 받는 금액 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">받는 금액</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-blue-50 border-2 border-blue-100 rounded-xl px-3 py-2 flex items-center">
              <span className="text-2xl font-bold text-blue-700 truncate">
                {loading ? '...' : convertedAmount != null ? fmt(convertedAmount, toCurrency) : '-'}
              </span>
            </div>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-24 bg-gray-100 border border-gray-200 rounded-xl px-2 py-2 font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 현재 환율 */}
        {!loading && !error && currentRate && (
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <p className="text-xs text-gray-500">현재 적용 환율</p>
            <p className="font-semibold text-gray-700 mt-0.5">
              1 {fromCurrency} = {currentRate.toFixed(4)} {toCurrency}
            </p>
          </div>
        )}
      </div>

      {/* EUR → KRW 빠른 환산표 */}
      {!loading && !error && eurToKrw && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">
            🇮🇹 현지용 빠른 환산표 (EUR → KRW)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <div
                key={amt}
                className="bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between border border-gray-100"
              >
                <span className="font-semibold text-gray-600 text-sm">€{amt}</span>
                <span className="font-bold text-blue-600 text-sm">
                  {fmt(amt * eurToKrw, 'KRW')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
