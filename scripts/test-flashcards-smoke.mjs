import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const appSource = fs.readFileSync(new URL('../study-timer/assets/js/flashcards-app.js', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../study-timer/assets/css/flashcards.css', import.meta.url), 'utf8');
assert.match(cssSource, /\.notion-icon-image-wrap > span \{[^}]*visibility: hidden/);
assert.match(appSource, /fallback\.style\.visibility = 'visible'/);
function runApp(search, testHooks = false, initialStorage = {}) {
  const storage = new Map(Object.entries(initialStorage));
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
  const source = testHooks
    ? appSource.replace('window.CozyFlashcards = { reload:loadData };', 'window.CozyFlashcards = { reload:loadData, startSet, makeSet, completeSet, dismissRecentSet, parseNotionIcon, flagEmojiAsset };')
    : appSource;
  vm.runInNewContext(source, context, { filename:'flashcards-app.js' });
  return { root, context, storage };
}

function summaryValue(html, kind) {
  const match = html.match(new RegExp(`data-summary-kind="${kind}" data-summary-value="(\\d+)"`));
  return match ? Number(match[1]) : null;
}

const { root, context } = runApp('?demo=1');

assert.match(root.innerHTML, /단어 카드/);
assert.match(root.innerHTML, /단어 세트 선택/);
assert.match(root.innerHTML, /전체 과목/);
assert.doesNotMatch(root.innerHTML, /개 단어 · \d+개 학습 노트/);
assert.doesNotMatch(root.innerHTML, /테스트 기록에는 반영하지 않고/);
assert.match(root.innerHTML, /header-kicker/);
assert.match(root.innerHTML, /data-action="refresh"/);
assert.match(root.innerHTML, /data-action="toggle-dark"/);
assert.match(root.innerHTML, /primary-icon-button/);
assert.match(root.innerHTML, /class="summary-cards"/);
assert.equal((root.innerHTML.match(/class="summary-card"/g) || []).length, 3, '상단 요약은 세 개의 카드로 표시되어야 합니다.');
assert.match(root.innerHTML, /전체 단어/);
assert.match(root.innerHTML, /학습 노트 연결 단어/);
assert.match(root.innerHTML, /학습 노트와 연결된 단어/);
assert.equal(summaryValue(root.innerHTML, 'words'), 7);
assert.equal(summaryValue(root.innerHTML, 'notes'), 3);
assert.equal(summaryValue(root.innerHTML, 'connected-words'), 5);
assert.doesNotMatch(root.innerHTML, /개 연결됨/);
assert.match(root.innerHTML, /notion-icon-flag/);
assert.match(root.innerHTML, /twemoji@17\.0\.3\/assets\/svg\/1f1ec-1f1e7\.svg/);
assert.doesNotMatch(root.innerHTML, /notion-icon-emoji[^>]*>🇬🇧/);
assert.match(root.innerHTML, /notion-icon-emoji[^>]*>🔬/);
assert.match(root.innerHTML, /notion-icon-fallback[^>]*>📖/);
assert.ok(context.CozyFlashcards, '공개 앱 핸들이 생성되어야 합니다.');

const iconParser = runApp('?demo=1', true).context.CozyFlashcards.parseNotionIcon;
const flagEmojiAsset = runApp('?demo=1', true).context.CozyFlashcards.flagEmojiAsset;
assert.equal(iconParser({ type:'emoji', emoji:'📈' }).value, '📈');
assert.equal(iconParser({ type:'external', external:{ url:'https://example.com/icon.png' } }).value, 'https://example.com/icon.png');
assert.equal(iconParser({ type:'icon', icon:{ name:'book-open', color:'blue' } }).value, 'https://www.notion.so/icons/book-open_blue.svg');
assert.equal(flagEmojiAsset('🇬🇧'), 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.3/assets/svg/1f1ec-1f1e7.svg');
assert.equal(flagEmojiAsset('📈'), '');

const notesPreview = runApp('?demo=1&view=notes');
assert.equal(summaryValue(notesPreview.root.innerHTML, 'words'), 5);
assert.equal(summaryValue(notesPreview.root.innerHTML, 'notes'), 2);
assert.equal(summaryValue(notesPreview.root.innerHTML, 'connected-words'), 4);
assert.match(notesPreview.root.innerHTML, /영어 단어/);
assert.match(notesPreview.root.innerHTML, /영어 학습 노트/);
assert.match(notesPreview.root.innerHTML, /영어 단어 중 연결됨/);
assert.match(notesPreview.root.innerHTML, /class="note-search-form"/);
assert.match(notesPreview.root.innerHTML, /placeholder="학습 노트 검색"/);
assert.match(notesPreview.root.innerHTML, /이 과목의 모든 단어/);
assert.match(notesPreview.root.innerHTML, /id="note-sort-select"/);
assert.match(notesPreview.root.innerHTML, /최근 등록순/);
assert.match(notesPreview.root.innerHTML, /오래된 등록순/);
assert.match(notesPreview.root.innerHTML, /가나다·ABC순/);
assert.ok(notesPreview.root.innerHTML.indexOf('이 과목의 모든 단어') < notesPreview.root.innerHTML.indexOf('note-sort-row'), '학습 노트 정렬은 전체 단어 블록 바로 아래에 있어야 합니다.');
assert.match(notesPreview.root.innerHTML, /notion-icon-emoji[^>]*>📄/);
assert.match(notesPreview.root.innerHTML, /notion-icon-emoji[^>]*>📚/);

const oldestNotesPreview = runApp('?demo=1&view=notes', false, {
  cozy_flashcards_prefs: JSON.stringify({ noteSort:'created-asc' }),
});
assert.ok(oldestNotesPreview.root.innerHTML.indexOf('수능 영단어 3강') < oldestNotesPreview.root.innerHTML.indexOf('독해 지문 07'), '오래된 등록순 정렬이 적용되어야 합니다.');

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
assert.match(listPreview.root.innerHTML, /data-list-layout="grid"/);
assert.match(listPreview.root.innerHTML, /data-list-layout="wide"/);
assert.doesNotMatch(listPreview.root.innerHTML, /data-list-layout="compact"|간단 목록형/);
assert.match(listPreview.root.innerHTML, /layout-wide/);
assert.doesNotMatch(listPreview.root.innerHTML, /열람 기록만 저장되며 테스트 통계에는 반영되지 않아요/);
assert.match(listPreview.root.innerHTML, /상세 내용 모두 보기/);
assert.match(listPreview.root.innerHTML, /role="switch" aria-checked="false"/);
assert.doesNotMatch(listPreview.root.innerHTML, /항목을 누르면 상세 내용을 볼 수 있어요/);

const gridPreview = runApp('?demo=1&view=list', false, {
  cozy_flashcards_prefs: JSON.stringify({ listLayout:'grid' }),
});
assert.match(gridPreview.root.innerHTML, /word-list layout-grid/);
assert.match(gridPreview.root.innerHTML, /layout-switch-button is-active[^>]*data-list-layout="grid"/);

const legacyCompactPreview = runApp('?demo=1&view=list', false, {
  cozy_flashcards_prefs: JSON.stringify({ listLayout:'compact' }),
});
assert.match(legacyCompactPreview.root.innerHTML, /word-list layout-wide/);
assert.doesNotMatch(legacyCompactPreview.root.innerHTML, /layout-compact|data-list-layout="compact"/);

const detailsPreview = runApp('?demo=1&view=list', false, {
  cozy_flashcards_prefs: JSON.stringify({ showListDetails:true }),
});
assert.match(detailsPreview.root.innerHTML, /role="switch" aria-checked="true"/);
assert.match(detailsPreview.root.innerHTML, /<details class="word-list-item" open>/);

const lastCard = runApp('?demo=1&view=cards-last');
assert.match(lastCard.root.innerHTML, /data-action="complete-set"/);
assert.match(lastCard.root.innerHTML, />완료<\/button>/);
assert.doesNotMatch(lastCard.root.innerHTML, /data-action="next"[^>]*disabled/);

const completion = runApp('?demo=1', true);
const completionSet = completion.context.CozyFlashcards.makeSet('__all__', 'all');
completion.context.CozyFlashcards.startSet(completionSet);
assert.ok(completion.storage.has('cozy_flashcards_session'), '세트 열람 중에는 최근 세트가 저장되어야 합니다.');
completion.context.CozyFlashcards.completeSet();
assert.equal(completion.storage.has('cozy_flashcards_session'), false, '완료하면 최근 세트가 삭제되어야 합니다.');
assert.match(completion.root.innerHTML, /단어 세트 선택/);
assert.doesNotMatch(completion.root.innerHTML, /최근에 본 세트/);

const recentSession = JSON.stringify({
  set:{ subjectId:'__all__', kind:'all', noteId:null, title:'전체 과목 · 전체 단어' },
  index:0,
  viewMode:'list',
});
const dismissRecent = runApp('?demo=1', true, { cozy_flashcards_session:recentSession });
assert.match(dismissRecent.root.innerHTML, /data-action="dismiss-recent"/);
assert.match(dismissRecent.root.innerHTML, /aria-label="최근에 본 세트 닫기"/);
dismissRecent.context.CozyFlashcards.dismissRecentSet();
assert.equal(dismissRecent.storage.has('cozy_flashcards_session'), false, '닫기 버튼을 누르면 최근 세트 기록이 삭제되어야 합니다.');
assert.doesNotMatch(dismissRecent.root.innerHTML, /최근에 본 세트/);

const disconnected = runApp('');
assert.match(disconnected.root.innerHTML, /단어 카드 위젯 설정/);
assert.match(disconnected.root.innerHTML, /URL 파라미터가 필요합니다/);
assert.match(disconnected.root.innerHTML, /연결된 DB 목록/);
assert.match(disconnected.root.innerHTML, /단어장 DB/);
assert.match(disconnected.root.innerHTML, /과목 DB/);
assert.match(disconnected.root.innerHTML, /학습 노트 DB/);
assert.match(disconnected.root.innerHTML, /데이터 새로고침/);
assert.doesNotMatch(disconnected.root.innerHTML, /Cloudflare Worker 주소|WIDGET_TOKEN|data-config=|<input/);

console.log('flashcards demo, list, setup, and completion smoke tests passed');
