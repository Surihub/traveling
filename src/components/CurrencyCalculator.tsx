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
      const res = await fetch(
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`
      );
      if (!res.ok) throw new Error('API 오류');
      const data = await res.json();
      const baseRates: Record<string, number> = data[base.toLowerCase()];

      setRates(baseRates);
      setLastUpdated(data.date);

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
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">💶 실시간 환율 계산기</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? '환율 정보 불러오는 중...' : lastUpdated ? `마지막 업데이트: ${lastUpdated}` : ''}
        </p>
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
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="0"
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
