import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Dashboard } from './components/Dashboard';
import { initAutoSheetSync } from './utils/autoSheetSync';

function App() {
  const { canEdit, loading, authenticate, logout, getRemainingTime } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const cleanup = initAutoSheetSync();
    return cleanup;
  }, []);

  const handleAuth = () => {
    if (authenticate(authCode)) {
      setShowAuthModal(false);
      setAuthCode('');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard
        canEdit={canEdit}
        onRequestEdit={() => setShowAuthModal(true)}
        onLogout={logout}
        getRemainingTime={getRemainingTime}
      />

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔒 비밀번호 입력</h2>
            <p className="text-gray-600 text-sm mb-4">
              여행 관리 탭은 수빈석빈만 편집가능합니다.
              <br />
              비밀번호를 입력하면 1시간 동안 편집이 가능해집니다.
            </p>
            <input
              type="password"
              value={authCode}
              onChange={(e) => {
                setAuthCode(e.target.value);
                setAuthError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              placeholder="인증코드"
              className={`w-full border-2 rounded-lg px-4 py-2 mb-2 ${
                authError ? 'border-red-400' : 'border-gray-200'
              }`}
              autoFocus
            />
            {authError && (
              <p className="text-red-500 text-sm mb-2">인증코드가 올바르지 않습니다.</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAuth}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                확인
              </button>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthCode('');
                  setAuthError(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
