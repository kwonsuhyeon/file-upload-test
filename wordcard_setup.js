// 입력 방식 선택
function selectMethod(method) {
    // 모든 버튼 비활성화
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 선택된 버튼 활성화
    document.querySelector(`[data-method="${method}"]`).classList.add('active');

    // 모든 입력 영역 숨기기
    document.querySelectorAll('.input-area').forEach(area => {
        area.classList.remove('show');
    });

    // 선택된 입력 영역 보이기
    setTimeout(() => {
        document.getElementById(`${method}-area`).classList.add('show');
    }, 100);
}
// 구글 시트 URL에서 시트 ID 추출하는 함수
function extractSheetId(url) {
    if (!url) {
        throw new Error('URL이 필요합니다.');
    }
    // 구글 시트 URL 패턴: https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        throw new Error('유효하지 않은 구글 시트 URL입니다.');
    }
    return match[1];
}

// 단어목록을 가져오는 메인 함수
async function fetchWordList(sheetUrl, appScriptUrl) {
    try {
        // 1. URL에서 시트 ID 추출
        const sheetId = extractSheetId(sheetUrl);
        console.log('시트 ID:', sheetId);

        // 2. 앱스크립트에 GET 요청 보내기
        const requestUrl = `${appScriptUrl}?sheetId=${sheetId}&menu=words`;

        console.log('요청 URL:', requestUrl);

        // 3. 실제 API 호출
        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode:'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`);
        }

        // 4. 응답 데이터 파싱
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || '데이터 조회에 실패했습니다.');
        }

        console.log('✅ 단어목록 조회 성공:', data.totalCount + '개');

        return {
            success: true,
            words: data.words,
            totalCount: data.totalCount,
            message: data.message
        };

    } catch (error) {
        console.error('❌ 단어목록 조회 실패:', error);

        return {
            success: false,
            error: error.message,
            words: []
        };
    }
}

// 단어목록을 사용자 친화적인 형태로 변환하는 함수
function formatWordsForDisplay(words) {
    if (!words || words.length === 0) {
        return [];
    }

    return words.map(word => ({
        id: word.id,
        display: `${word.english} / ${word.korean}`,
        english: word.english,
        korean: word.korean,
        difficulty: word.difficulty || '중급',
        category: word.category || '일반'
    }));
}

// 실제 사용 예시 함수
async function loadWordsFromGoogleSheet() {
    const sheetUrl = document.getElementById('sheetUrl').value;
    const appScriptUrl = 'https://script.google.com/macros/s/AKfycbwE4n2-R_OWxLOV6g-DRcQZvadkzmDJ6_LXsqUjDsSoI8bWQLiVwwIE0toEk9t6Tml1/exec'
    if (!sheetUrl) {
        alert('구글 시트 URL을 입력해주세요.');
        return;
    }
    try {
        // 로딩 표시
        console.log('📊 단어목록을 불러오는 중...');

        // 시뮬레이션 지연 (실제 API 호출 시간)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 단어목록 가져오기
        const result = await fetchWordList(sheetUrl, appScriptUrl);

        if (result.success) {
            // 성공한 경우
            const formattedWords = formatWordsForDisplay(result.words);

            console.log('불러온 단어목록:', formattedWords);

            // UI 업데이트 (예시)
            updateWordListUI(formattedWords);

            alert(`✅ ${result.totalCount}개의 단어를 성공적으로 불러왔습니다!`);

            return formattedWords;

        } else {
            // 실패한 경우
            throw new Error(result.error);
        }

    } catch (error) {
        console.error('단어 불러오기 실패:', error);
        alert(`❌ 단어 불러오기 실패: ${error.message}`);
        return [];
    }
}

// UI 업데이트 함수 (예시)
function updateWordListUI(words) {
    const wordListTextarea = document.getElementById('wordList');

    if (wordListTextarea && words.length > 0) {
        // 텍스트 영역에 단어 목록을 "영어 / 한글" 형태로 표시
        const wordText = words.map(word => word.display).join('\n');
        wordListTextarea.value = wordText;

        console.log('UI 업데이트 완료');
    }
}

// 테스트용 함수 (개발 중에만 사용)
async function testWordFetch() {
    const testSheetUrl = 'https://docs.google.com/spreadsheets/d/TEST_SHEET_ID/edit';
    const testAppScriptUrl = 'https://script.google.com/macros/s/TEST_SCRIPT_ID/exec';

    console.log('🧪 테스트 시작...');

    const result = await fetchWordList(testSheetUrl, testAppScriptUrl);

    console.log('테스트 결과:', result);

    return result;
}

// 에러 처리를 포함한 안전한 버전
async function safeLoadWords(sheetUrl, appScriptUrl, options = {}) {
    const {
        timeout = 10000, // 10초 타임아웃
        retries = 2, // 재시도 횟수
        showAlert = true // 알림 표시 여부
    } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`📊 단어목록 불러오기 시도 ${attempt}/${retries}`);

            // 타임아웃 설정
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const result = await fetchWordList(sheetUrl, appScriptUrl);

            clearTimeout(timeoutId);

            if (result.success) {
                if (showAlert) {
                    console.log(`✅ 성공: ${result.totalCount}개 단어 로드`);
                }
                return result;
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.warn(`❌ 시도 ${attempt} 실패:`, error.message);

            if (attempt === retries) {
                if (showAlert) {
                    alert(`단어 불러오기 실패: ${error.message}`);
                }
                return { success: false, error: error.message, words: [] };
            }

            // 재시도 전 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
// 구글 시트에서 단어 불러오기
async function loadWordsFromSheet(btn) {
    const originalText = btn.innerHTML;
    url = document.querySelector("#sheetUrl").value;
    // 로딩 상태
    btn.innerHTML = '<span>⏳</span> 불러오는 중...';
    btn.disabled = true;

    try {
        // 실제 구현시에는 여기서 Google Apps Script API 호출
        loadWordsFromGoogleSheet();

    } catch (error) {
        // 에러 처리
        btn.innerHTML = '<span>❌</span> 불러오기 실패';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);
        alert('단어를 불러오는데 실패했습니다. 다시 시도해주세요.');
    }
}

// 단어 개수 업데이트
function updateWordCount() {
    const textarea = document.getElementById('wordList');
    const lines = textarea.value.split('\n').filter(line => line.trim() && line.includes('/'));
    const count = lines.length;

    document.getElementById('count').textContent = count;
    document.getElementById('wordCount').classList.toggle('show', count > 0);
}

// 학습 시작
function startLearning() {
    const wordList = document.getElementById('wordList').value;
    if (!wordList.trim()) {
        alert('단어를 입력하거나 불러와주세요!');
        return;
    }

    const lines = wordList.split('\n').filter(line => line.trim() && line.includes('/'));
    if (lines.length === 0) {
        alert('올바른 형식의 단어가 없습니다. "영어 / 한글" 형식으로 입력해주세요.');
        return;
    }

    alert(`🎉 ${lines.length}개의 단어로 학습을 시작합니다!`);
}

// 페이지 로드시 단어 개수 업데이트
window.onload = function () {
    updateWordCount();
};