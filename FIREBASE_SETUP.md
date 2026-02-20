# Firebase 프로젝트 설정 가이드

## Step 1: Firebase 프로젝트 생성

1. https://console.firebase.google.com 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `italy-travel-planner` (또는 원하는 이름)
4. Google Analytics는 선택사항 (비활성화해도 됨)
5. "프로젝트 만들기" 클릭

## Step 2: Authentication 설정

1. 왼쪽 메뉴에서 **"Authentication"** 클릭
2. **"시작하기"** 버튼 클릭
3. **"Sign-in method"** 탭 선택
4. **"Google"** 항목 클릭
5. **"사용 설정"** 토글 ON
6. 프로젝트 지원 이메일 선택 (본인 이메일)
7. **"저장"** 클릭

## Step 3: Firestore Database 생성

1. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. **"테스트 모드에서 시작"** 선택
4. 위치: **asia-northeast3 (서울)** 선택
5. **"사용 설정"** 클릭

### 보안 규칙 설정 (선택사항)
테스트 후 운영 시에는 Firestore > 규칙에서 아래처럼 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /trips/{tripId} {
      allow read, write: if request.auth != null;
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## Step 4: 웹 앱 추가

1. 프로젝트 설정 (톱니바퀴 아이콘) > **"일반"**
2. "내 앱" 섹션에서 **"앱 추가"** > 웹 아이콘 (`</>`) 클릭
3. 앱 닉네임: `travel-planner-web`
4. "Firebase 호스팅 설정"은 체크 해제
5. **"앱 등록"** 클릭
6. Firebase SDK 설정 정보가 표시됨 - 복사!

## Step 5: 코드에 config 입력

`src/firebase.ts` 파일을 열고, 아래 값들을 Firebase 콘솔에서 복사한 값으로 교체:

```typescript
const firebaseConfig = {
  apiKey: "여기에_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## Step 6: 테스트

```bash
npm run dev
```

1. 브라우저에서 http://localhost:5173 접속
2. Google 로그인 버튼 클릭
3. Google 계정으로 로그인
4. 일정 추가/수정/삭제 테스트

## Step 7: Vercel 배포

1. GitHub에 코드 푸시
2. https://vercel.com 에서 프로젝트 import
3. 배포 완료 후 URL 복사

### Firebase에 배포 도메인 추가

1. Firebase 콘솔 > Authentication > Settings
2. "승인된 도메인" 섹션
3. **"도메인 추가"** 클릭
4. Vercel 배포 URL 추가 (예: `your-app.vercel.app`)

## 문제 해결

### "auth/unauthorized-domain" 에러
- Firebase 콘솔 > Authentication > Settings > 승인된 도메인에 현재 도메인 추가

### Firestore 권한 에러
- Firebase 콘솔 > Firestore > 규칙에서 테스트 모드 규칙 확인
- 테스트 모드 만료 시 규칙 업데이트 필요

### Google 로그인 팝업이 안 뜸
- 브라우저 팝업 차단 확인
- Firebase 콘솔에서 Google 로그인이 활성화되어 있는지 확인
