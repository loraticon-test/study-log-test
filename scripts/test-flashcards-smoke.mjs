import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const appSource = fs.readFileSync(new URL('../study-timer/assets/js/flashcards-app.js', import.meta.url), 'utf8');
function runApp(search) {
  const storage = new Map();
  const root = { innerHTML:'', querySelectorAll:() => [], querySelector:() => null };
  const classList = { add() {}, remove() {}, toggle() {} };
  const document = {
    documentElement: { dataset:{}, classList },
    getElementById: id => id === 'root' ? root : null,
    addEventListener() {},
  };
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  };
  const context = {
    console, URLSearchParams, Intl, Date, Math, Map, Set, Promise,
    location:{ search }, localStorage, document,
    matchMedia:() => ({ matches:false }), alert:() => {}, setTimeout, clearTimeout,
  };
  context.window = context;
  vm.runInNewContext(appSource, context, { filename:'flashcards-app.js' });
  return { root, context };
}

const { root, context } = runApp('?demo=1');

assert.match(root.innerHTML, /단어카드/);
assert.match(root.innerHTML, /단어 세트 선택/);
assert.match(root.innerHTML, /전체 과목/);
assert.match(root.innerHTML, /테스트 기록에는 반영하지 않고/);
assert.match(root.innerHTML, /header-kicker/);
assert.match(root.innerHTML, /data-action="refresh"/);
assert.match(root.innerHTML, /data-action="toggle-dark"/);
assert.match(root.innerHTML, /primary-icon-button/);
assert.ok(context.CozyFlashcards, '공개 앱 핸들이 생성되어야 합니다.');

const listPreview = runApp('?demo=1&view=list');
assert.match(listPreview.root.innerHTML, /data-action="view-cards"/);
assert.match(listPreview.root.innerHTML, /data-action="view-list"/);
assert.match(listPreview.root.innerHTML, /목록 보기/);
assert.match(listPreview.root.innerHTML, /list-search-form/);
assert.match(listPreview.root.innerHTML, /단어·뜻·설명 검색/);
assert.match(listPreview.root.innerHTML, /context/);
assert.match(listPreview.root.innerHTML, /문맥, 맥락/);
assert.match(listPreview.root.innerHTML, /카드로 보기/);
assert.match(listPreview.root.innerHTML, /관련 학습 노트|독해 지문 07/);

const disconnected = runApp('');
assert.match(disconnected.root.innerHTML, /단어카드 위젯 설정/);
assert.match(disconnected.root.innerHTML, /URL 파라미터가 필요합니다/);
assert.match(disconnected.root.innerHTML, /연결된 DB 목록/);
assert.match(disconnected.root.innerHTML, /단어장 DB/);
assert.match(disconnected.root.innerHTML, /과목 DB/);
assert.match(disconnected.root.innerHTML, /학습 노트 DB/);
assert.match(disconnected.root.innerHTML, /데이터 새로고침/);
assert.doesNotMatch(disconnected.root.innerHTML, /Cloudflare Worker 주소|WIDGET_TOKEN|data-config=|<input/);

console.log('flashcards demo and setup smoke tests passed');
