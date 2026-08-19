(() => {
  'use strict';

  const root = document.getElementById('root');
  const LS_CONFIG = 'cozy_flashcards_config';
  const LS_PREFS = 'cozy_flashcards_prefs';
  const LS_SESSION = 'cozy_flashcards_session';
  const NOTION_VERSION = '2022-06-28';
  const THEMES = {
    latte: { name: '카페 라떼', color: '#A67B5B' },
    matcha: { name: '말차 라떼', color: '#849F71' },
    choco: { name: '초코 라떼', color: '#72523A' },
    berry: { name: '딸기 라떼', color: '#D98891' },
    milkTea: { name: '밀크티', color: '#D4A373' },
    blue: { name: '블루라떼', color: '#79ABC2' },
  };
  const icons = {
    settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>',
    refresh: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
    book: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    database: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"></ellipse><path d="M4 5v7c0 1.66 3.58 3 8 3s8-1.34 8-3V5"></path><path d="M4 12v7c0 1.66 3.58 3 8 3s8-1.34 8-3v-7"></path></svg>',
    note: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6M8 13h8M8 17h6"></path></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg>',
  };

  const defaultPrefs = { theme: 'latte', dark: false, sort: 'created', direction: 'term-first' };
  const state = {
    view: 'loading',
    config: loadConfig(),
    prefs: loadJson(LS_PREFS, defaultPrefs),
    words: [],
    subjects: [],
    subjectMap: new Map(),
    notes: [],
    noteMap: new Map(),
    pickerSubject: null,
    activeSet: null,
    index: 0,
    flipped: false,
    randomIds: [],
    settingsOpen: false,
    loading: false,
    error: '',
    demo: new URLSearchParams(location.search).get('demo') === '1',
  };

  function loadJson(key, fallback) {
    try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; }
    catch { return { ...fallback }; }
  }

  function clean(value) { return String(value || '').trim(); }
  function normalizeId(value) { return clean(value).replace(/-/g, ''); }
  function normalizeName(value) { return clean(value).replace(/[\s\u200B-\u200D\uFEFF_-]/g, '').toLowerCase(); }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }
  function notionUrl(id) { return `https://www.notion.so/${normalizeId(id)}`; }
  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', { month:'short', day:'numeric' }).format(date);
  }

  function loadConfig() {
    const fallback = { proxyUrl:'', apiKey:'', vocabDbId:'', subjectDbId:'', noteDbId:'', saved:false };
    try {
      if (window.STUDY_INSTALL_CONFIG) {
        const installed = { ...window.STUDY_INSTALL_CONFIG, saved:true, fromInstall:true };
        localStorage.setItem(LS_CONFIG, JSON.stringify(installed));
        return installed;
      }
      const params = new URLSearchParams(location.search);
      const direct = {
        proxyUrl: clean(params.get('proxy') || params.get('proxyUrl')),
        apiKey: clean(params.get('key') || params.get('apiKey')),
        vocabDbId: clean(params.get('vocab') || params.get('vocabDbId')),
        subjectDbId: clean(params.get('subject') || params.get('subjectDbId')),
        noteDbId: clean(params.get('note') || params.get('noteDbId')),
      };
      if (direct.proxyUrl && direct.apiKey && direct.vocabDbId) {
        const config = { ...direct, saved:true, fromUrl:true };
        localStorage.setItem(LS_CONFIG, JSON.stringify(config));
        return config;
      }
      return { ...fallback, ...JSON.parse(localStorage.getItem(LS_CONFIG) || '{}') };
    } catch { return fallback; }
  }

  function savePrefs() {
    localStorage.setItem(LS_PREFS, JSON.stringify(state.prefs));
    applyPrefs();
  }
  function applyPrefs() {
    document.documentElement.dataset.theme = state.prefs.theme || 'latte';
    document.documentElement.classList.toggle('dark', Boolean(state.prefs.dark));
  }

  function findProperty(props, names, types = []) {
    const wanted = names.map(normalizeName);
    const entries = Object.entries(props || {});
    for (const [name, prop] of entries) {
      if (wanted.includes(normalizeName(name)) && (!types.length || types.includes(prop?.type))) return prop;
    }
    for (const [name, prop] of entries) {
      if (wanted.some(target => normalizeName(name).includes(target)) && (!types.length || types.includes(prop?.type))) return prop;
    }
    return null;
  }

  function propertyText(prop) {
    if (!prop) return '';
    if (Array.isArray(prop)) return prop.map(propertyText).filter(Boolean).join('\n');
    if (typeof prop === 'string' || typeof prop === 'number') return String(prop);
    if (prop.plain_text) return prop.plain_text;
    if (prop.title) return prop.title.map(item => item.plain_text || '').join('').trim();
    if (prop.rich_text) return prop.rich_text.map(item => item.plain_text || '').join('').trim();
    if (prop.select?.name) return prop.select.name;
    if (prop.multi_select) return prop.multi_select.map(item => item.name).filter(Boolean).join(', ');
    if (prop.formula) return propertyText(prop.formula);
    if (prop.rollup) {
      if (prop.rollup.type === 'array') return propertyText(prop.rollup.array);
      return propertyText(prop.rollup[prop.rollup.type]);
    }
    if (prop.array) return propertyText(prop.array);
    if (prop.string) return prop.string;
    return '';
  }

  function relationIds(prop) {
    if (!prop) return [];
    if (Array.isArray(prop)) return prop.flatMap(relationIds);
    if (prop.type === 'relation' || prop.relation) return (prop.relation || []).map(item => item.id).filter(Boolean);
    if (prop.type === 'rollup' || prop.rollup) {
      const rollup = prop.rollup || prop;
      if (rollup.type === 'array' || rollup.array) return relationIds(rollup.array || []);
      return relationIds(rollup[rollup.type]);
    }
    if (prop.array) return relationIds(prop.array);
    return [];
  }

  function allRelationIds(props) {
    return [...new Set(Object.values(props || {}).flatMap(relationIds))];
  }

  async function api(path, options = {}) {
    const response = await fetch(`${state.config.proxyUrl.replace(/\/+$/, '')}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.config.apiKey,
        'x-notion-version': NOTION_VERSION,
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `Notion 요청 오류 (${response.status})`);
    return data;
  }

  async function queryAll(databaseId, limit = 5000) {
    if (!databaseId) return [];
    const rows = [];
    let cursor;
    let hasMore = true;
    while (hasMore && rows.length < limit) {
      const body = { page_size:100, ...(cursor ? { start_cursor:cursor } : {}) };
      const data = await api(`/v1/databases/${databaseId}/query`, { method:'POST', body:JSON.stringify(body) });
      rows.push(...(data.results || []));
      hasMore = Boolean(data.has_more && data.next_cursor);
      cursor = data.next_cursor;
    }
    return rows.slice(0, limit);
  }

  function pageTitle(page) {
    const title = Object.values(page.properties || {}).find(prop => prop.type === 'title');
    return propertyText(title) || '제목 없음';
  }

  function extractSubjectIds(props, subjectMap) {
    const knownIds = new Set(subjectMap.keys());
    const preferredNames = ['직접 과목', '직접과목', '과목 (노트X)', '과목', '하위 과목', 'subject'];
    const preferred = [];
    preferredNames.forEach(name => {
      const prop = findProperty(props, [name], ['relation', 'rollup']);
      if (prop) preferred.push(...relationIds(prop));
    });
    const preferredKnown = [...new Set(preferred.filter(id => knownIds.has(id)))];
    if (preferredKnown.length) return preferredKnown;
    return [...new Set(allRelationIds(props).filter(id => knownIds.has(id)))];
  }

  function parseSubjects(pages) {
    const raw = pages.map(page => {
      const props = page.properties || {};
      const parentProp = findProperty(props, ['상위 항목', '상위항목', '부모', 'parent'], ['relation']);
      return { id:page.id, name:pageTitle(page), parentId:relationIds(parentProp)[0] || null };
    });
    const map = new Map(raw.map(item => [item.id, item]));
    raw.forEach(item => { item.parentName = item.parentId && map.get(item.parentId) ? map.get(item.parentId).name : null; });
    return { list:raw, map };
  }

  function parseNotes(pages, subjectMap) {
    return pages.map(page => ({
      id: page.id,
      title: pageTitle(page),
      createdTime: page.created_time,
      subjectIds: extractSubjectIds(page.properties || {}, subjectMap),
      relatedIds: new Set(allRelationIds(page.properties || {})),
    }));
  }

  function parseWords(pages, subjectMap, notes) {
    const noteMap = new Map(notes.map(note => [note.id, note]));
    const noteIds = new Set(noteMap.keys());
    return pages.map(page => {
      const props = page.properties || {};
      const relations = allRelationIds(props);
      const relatedNoteIds = relations.filter(id => noteIds.has(id));
      notes.forEach(note => { if (note.relatedIds.has(page.id) && !relatedNoteIds.includes(note.id)) relatedNoteIds.push(note.id); });
      const meaning = propertyText(findProperty(props, ['요약', '뜻', '의미', 'definition', 'meaning'], ['rich_text', 'title', 'rollup', 'formula']));
      const detail = propertyText(findProperty(props, ['설명', '예문', '내용', 'example', 'description'], ['rich_text', 'title', 'rollup', 'formula']));
      let subjectIds = extractSubjectIds(props, subjectMap);
      if (!subjectIds.length) {
        subjectIds = [...new Set(relatedNoteIds.flatMap(id => noteMap.get(id)?.subjectIds || []))];
      }
      return {
        id: page.id,
        title: pageTitle(page),
        meaning,
        detail,
        createdTime: page.created_time,
        subjectIds,
        relatedNoteIds,
      };
    }).filter(word => word.title && word.title !== '제목 없음');
  }

  function hasCoreConnection() {
    const config = state.config;
    return Boolean(config.proxyUrl && config.apiKey && config.vocabDbId && config.subjectDbId && config.noteDbId);
  }

  async function loadData({ keepSettings = false } = {}) {
    state.loading = true;
    if (!keepSettings) state.view = 'loading';
    state.error = '';
    render();
    try {
      const subjectPages = state.config.subjectDbId ? await queryAll(state.config.subjectDbId) : [];
      const parsedSubjects = parseSubjects(subjectPages);
      state.subjects = parsedSubjects.list;
      state.subjectMap = parsedSubjects.map;
      const [notePages, vocabPages] = await Promise.all([
        state.config.noteDbId ? queryAll(state.config.noteDbId) : Promise.resolve([]),
        queryAll(state.config.vocabDbId),
      ]);
      state.notes = parseNotes(notePages, state.subjectMap);
      state.noteMap = new Map(state.notes.map(note => [note.id, note]));
      state.words = parseWords(vocabPages, state.subjectMap, state.notes);
      state.view = 'library';
      state.pickerSubject = null;
    } catch (error) {
      state.error = error.message || '단어장을 불러오지 못했습니다.';
      state.view = 'error';
    }
    state.loading = false;
    render();
  }

  function loadDemo() {
    const now = Date.now();
    state.subjects = [
      { id:'subject-en', name:'영어', parentId:null, parentName:null },
      { id:'subject-science', name:'과학', parentId:null, parentName:null },
    ];
    state.subjectMap = new Map(state.subjects.map(item => [item.id, item]));
    state.notes = [
      { id:'note-reading', title:'독해 지문 07', createdTime:new Date(now - 86400000).toISOString(), subjectIds:['subject-en'], relatedIds:new Set(['word-1','word-2','word-3']) },
      { id:'note-vocab', title:'수능 영단어 3강', createdTime:new Date(now - 172800000).toISOString(), subjectIds:['subject-en'], relatedIds:new Set(['word-4','word-5']) },
      { id:'note-biology', title:'세포의 구조', createdTime:new Date(now - 259200000).toISOString(), subjectIds:['subject-science'], relatedIds:new Set(['word-6']) },
    ];
    state.noteMap = new Map(state.notes.map(item => [item.id, item]));
    state.words = [
      { id:'word-1', title:'context', meaning:'문맥, 맥락', detail:'You can guess the meaning from the context.', createdTime:new Date(now).toISOString(), subjectIds:['subject-en'], relatedNoteIds:['note-reading'] },
      { id:'word-2', title:'interpret', meaning:'해석하다, 이해하다', detail:'Different readers may interpret the passage differently.', createdTime:new Date(now - 1000).toISOString(), subjectIds:['subject-en'], relatedNoteIds:['note-reading'] },
      { id:'word-3', title:'significant', meaning:'중요한, 상당한', detail:'a significant change in results', createdTime:new Date(now - 2000).toISOString(), subjectIds:['subject-en'], relatedNoteIds:['note-reading'] },
      { id:'word-4', title:'acquire', meaning:'습득하다, 얻다', detail:'acquire a new skill', createdTime:new Date(now - 3000).toISOString(), subjectIds:['subject-en'], relatedNoteIds:['note-vocab'] },
      { id:'word-5', title:'precise', meaning:'정확한, 정밀한', detail:'Please give a precise answer.', createdTime:new Date(now - 4000).toISOString(), subjectIds:['subject-en'], relatedNoteIds:[] },
      { id:'word-6', title:'미토콘드리아', meaning:'세포 호흡을 통해 에너지를 생산하는 세포 소기관', detail:'세포의 발전소라고도 불린다.', createdTime:new Date(now - 5000).toISOString(), subjectIds:['subject-science'], relatedNoteIds:['note-biology'] },
      { id:'word-7', title:'archive', meaning:'보관하다; 기록 보관소', detail:'', createdTime:new Date(now - 6000).toISOString(), subjectIds:[], relatedNoteIds:[] },
    ];
    state.view = 'library';
  }

  function subjectLabel(id) {
    const subject = state.subjectMap.get(id);
    if (!subject) return '미분류';
    return subject.parentName ? `${subject.parentName} · ${subject.name}` : subject.name;
  }

  function baseWordsForSubject(subjectId) {
    if (subjectId === '__all__') return state.words;
    if (subjectId === '__uncategorized__') return state.words.filter(word => !word.subjectIds.length);
    const included = new Set([subjectId]);
    let changed = true;
    while (changed) {
      changed = false;
      state.subjects.forEach(subject => {
        if (subject.parentId && included.has(subject.parentId) && !included.has(subject.id)) {
          included.add(subject.id);
          changed = true;
        }
      });
    }
    return state.words.filter(word => word.subjectIds.some(id => included.has(id)));
  }

  function getSetWords(set) {
    if (!set) return [];
    const base = baseWordsForSubject(set.subjectId);
    if (set.kind === 'note') return base.filter(word => word.relatedNoteIds.includes(set.noteId));
    if (set.kind === 'unlinked') return base.filter(word => word.relatedNoteIds.length === 0);
    return base;
  }

  function setKey(set) { return `${set.subjectId}:${set.kind}:${set.noteId || ''}`; }

  function saveSession() {
    if (!state.activeSet) return;
    localStorage.setItem(LS_SESSION, JSON.stringify({
      set: state.activeSet,
      index: state.index,
      sort: state.prefs.sort,
      direction: state.prefs.direction,
      randomIds: state.randomIds,
    }));
  }

  function loadSession() {
    try {
      const session = JSON.parse(localStorage.getItem(LS_SESSION) || 'null');
      if (!session?.set || getSetWords(session.set).length === 0) return null;
      return session;
    } catch { return null; }
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function orderedWords() {
    const words = getSetWords(state.activeSet);
    if (state.prefs.sort === 'name') {
      return [...words].sort((a, b) => a.title.localeCompare(b.title, 'ko-KR', { sensitivity:'base', numeric:true }) || new Date(b.createdTime) - new Date(a.createdTime));
    }
    if (state.prefs.sort === 'random') {
      const ids = new Set(words.map(word => word.id));
      const valid = state.randomIds.filter(id => ids.has(id));
      const missing = words.map(word => word.id).filter(id => !valid.includes(id));
      if (valid.length !== words.length) state.randomIds = [...valid, ...shuffle(missing)];
      const order = new Map(state.randomIds.map((id, index) => [id, index]));
      return [...words].sort((a, b) => order.get(a.id) - order.get(b.id));
    }
    return [...words].sort((a, b) => new Date(b.createdTime || 0) - new Date(a.createdTime || 0));
  }

  function makeSet(subjectId, kind, noteId = null) {
    let subjectName = subjectId === '__all__' ? '전체 과목' : subjectId === '__uncategorized__' ? '미분류' : subjectLabel(subjectId);
    let title = `${subjectName} · 전체 단어`;
    if (kind === 'unlinked') title = `${subjectName} · 학습 노트 미연결`;
    if (kind === 'note') title = state.noteMap.get(noteId)?.title || '학습 노트';
    return { subjectId, kind, noteId, title };
  }

  function startSet(set, resume = false) {
    const words = getSetWords(set);
    if (!words.length) return;
    const session = resume ? loadSession() : null;
    state.activeSet = set;
    state.view = 'cards';
    state.flipped = false;
    if (session && setKey(session.set) === setKey(set)) {
      state.prefs.sort = session.sort || state.prefs.sort;
      state.prefs.direction = session.direction || state.prefs.direction;
      state.randomIds = Array.isArray(session.randomIds) ? session.randomIds : [];
      state.index = Math.min(Math.max(0, Number(session.index) || 0), words.length - 1);
    } else {
      state.index = 0;
      state.randomIds = state.prefs.sort === 'random' ? shuffle(words.map(word => word.id)) : [];
    }
    savePrefs();
    saveSession();
    render();
  }

  function moveCard(delta) {
    const words = orderedWords();
    const next = Math.min(Math.max(0, state.index + delta), words.length - 1);
    if (next === state.index) return;
    state.index = next;
    state.flipped = false;
    saveSession();
    render();
  }

  function flipCard() {
    if (state.view !== 'cards') return;
    state.flipped = !state.flipped;
    const card = root.querySelector('.flashcard');
    if (card) {
      card.classList.toggle('is-flipped', state.flipped);
      card.setAttribute('aria-label', state.flipped ? '카드 앞면 보기' : '카드 뒷면 보기');
    }
  }

  function renderHeader(title = '단어카드') {
    const subtitle = state.words.length ? `${state.words.length}개 단어 · ${state.notes.length}개 학습 노트` : 'Notion 단어장을 카드로 펼쳐보세요';
    const canRefresh = state.demo || Boolean(state.config.proxyUrl && state.config.apiKey && state.config.vocabDbId);
    return `
      <header class="app-header widget-header">
        <div class="brand widget-heading">
          <div class="header-kicker">${icons.book}<span>Flashcards</span></div>
          <h1 class="widget-title">${escapeHtml(title)}</h1>
          <p class="widget-subtitle">${escapeHtml(subtitle)}</p>
        </div>
        <div class="header-actions">
          <button class="icon-button" type="button" data-action="refresh" title="새로고침" aria-label="단어장 새로고침" ${canRefresh ? '' : 'disabled'}>${icons.refresh}</button>
          <button class="icon-button" type="button" data-action="toggle-dark" title="${state.prefs.dark ? '라이트모드' : '다크모드'}" aria-label="${state.prefs.dark ? '라이트모드' : '다크모드'}">${state.prefs.dark ? icons.sun : icons.moon}</button>
          <button class="icon-button primary-icon-button" type="button" data-action="open-settings" title="설정" aria-label="단어카드 설정">${icons.settings}</button>
        </div>
      </header>`;
  }

  function renderLibrary() {
    const recent = loadSession();
    const recentWords = recent ? getSetWords(recent.set) : [];
    const connectedNotes = state.words.filter(word => word.relatedNoteIds.length).length;
    let content = `${renderHeader()}<p class="intro">테스트 기록에는 반영하지 않고, 단어장을 과목과 학습 노트별로 편하게 넘겨보세요.</p>`;
    if (!hasCoreConnection() && !state.demo) {
      content += `<div class="empty-state"><strong>단어장 연결이 필요해요.</strong><span>통합 설정에서 만든 단어카드 URL을 사용해 주세요.</span><div class="empty-actions"><button class="primary-button" type="button" data-action="open-settings">설정 열기</button></div></div>`;
      return `<div class="app-shell">${content}</div>`;
    }
    content += `<div class="summary-strip"><strong>${state.words.length}개</strong><span>전체 단어</span><span class="summary-dot"></span><strong>${state.notes.length}개</strong><span>학습 노트</span><span class="summary-dot"></span><span>${connectedNotes}개 연결됨</span></div>`;
    if (recent && recentWords.length) {
      const position = Math.min((Number(recent.index) || 0) + 1, recentWords.length);
      content += `
        <section class="recent-set">
          <div class="row-between">
            <div>
              <div class="recent-label">최근에 본 세트</div>
              <div class="recent-title">${escapeHtml(recent.set.title)}</div>
              <div class="recent-meta">${position} / ${recentWords.length}번째 카드</div>
            </div>
            <button class="primary-button" type="button" data-action="continue-set">이어서 보기</button>
          </div>
        </section>`;
    }
    content += state.pickerSubject === null ? renderSubjectPicker() : renderSetPicker(state.pickerSubject);
    return `<div class="app-shell">${content}</div>`;
  }

  function renderSubjectPicker() {
    const subjectCards = state.subjects
      .filter(subject => !subject.parentId || !state.subjectMap.has(subject.parentId))
      .map(subject => {
        const count = baseWordsForSubject(subject.id).length;
        return `<button class="choice-card" type="button" data-subject="${escapeHtml(subject.id)}" ${count ? '' : 'disabled'}><span class="choice-icon">📘</span><span class="choice-title">${escapeHtml(subjectLabel(subject.id))}</span><span class="choice-meta">${count}개 단어</span></button>`;
      }).join('');
    const uncategorized = baseWordsForSubject('__uncategorized__').length;
    return `
      <section class="section">
        <div class="section-heading"><div><h2>단어 세트 선택</h2><p>먼저 과목을 선택해 주세요.</p></div></div>
        <div class="grid-list">
          <button class="choice-card is-wide" type="button" data-subject="__all__"><span class="choice-icon">🗂️</span><span class="choice-title">전체 과목</span><span class="choice-meta">${state.words.length}개 단어</span></button>
          ${subjectCards}
          ${uncategorized ? `<button class="choice-card" type="button" data-subject="__uncategorized__"><span class="choice-icon">📎</span><span class="choice-title">미분류</span><span class="choice-meta">${uncategorized}개 단어</span></button>` : ''}
        </div>
      </section>`;
  }

  function renderSetPicker(subjectId) {
    const base = baseWordsForSubject(subjectId);
    const noteRows = state.notes.map(note => ({ note, count:base.filter(word => word.relatedNoteIds.includes(note.id)).length })).filter(item => item.count > 0);
    const unlinked = base.filter(word => word.relatedNoteIds.length === 0).length;
    const noteCards = noteRows.map(({ note, count }) => `<button class="choice-card" type="button" data-set-kind="note" data-note-id="${escapeHtml(note.id)}"><span class="choice-icon">📖</span><span class="choice-title">${escapeHtml(note.title)}</span><span class="choice-meta">${count}개 단어${formatDate(note.createdTime) ? ` · ${escapeHtml(formatDate(note.createdTime))}` : ''}</span></button>`).join('');
    const currentLabel = subjectId === '__all__' ? '전체 과목' : subjectId === '__uncategorized__' ? '미분류' : subjectLabel(subjectId);
    return `
      <div class="breadcrumb"><button type="button" data-action="back-subjects">과목</button><span>›</span><span>${escapeHtml(currentLabel)}</span></div>
      <section class="section">
        <div class="section-heading"><div><h2>${escapeHtml(currentLabel)}</h2><p>전체 단어나 특정 학습 노트를 선택해 주세요.</p></div><button class="ghost-button" type="button" data-action="back-subjects">과목 변경</button></div>
        ${base.length ? `<div class="grid-list">
          <button class="choice-card is-wide" type="button" data-set-kind="all"><span class="choice-icon">🃏</span><span class="choice-title">이 과목의 모든 단어</span><span class="choice-meta">${base.length}개 단어</span></button>
          ${noteCards}
          ${unlinked ? `<button class="choice-card" type="button" data-set-kind="unlinked"><span class="choice-icon">🔗</span><span class="choice-title">학습 노트 미연결</span><span class="choice-meta">${unlinked}개 단어</span></button>` : ''}
        </div>` : `<div class="empty-state"><strong>이 과목에는 단어가 없어요.</strong><span>다른 과목을 선택해 주세요.</span></div>`}
      </section>`;
  }

  function wordFace(word) {
    const subjects = word.subjectIds.length ? word.subjectIds.map(subjectLabel).join(' · ') : '미분류';
    return `<div class="face-label">단어</div><div class="word-text">${escapeHtml(word.title)}</div><div class="subject-chip">${escapeHtml(subjects)}</div><div class="flip-hint">카드를 눌러 뒤집기 · Space</div>`;
  }

  function meaningFace(word) {
    return `<div class="face-label">뜻 · 설명</div><div class="meaning-scroll"><div class="meaning-primary">${escapeHtml(word.meaning || '뜻이 입력되지 않았어요.')}</div>${word.detail ? `<div class="meaning-detail">${escapeHtml(word.detail)}</div>` : ''}</div><div class="flip-hint">카드를 눌러 뒤집기 · Space</div>`;
  }

  function renderNotePanel(word) {
    const notes = word.relatedNoteIds.map(id => state.noteMap.get(id)).filter(Boolean);
    if (!notes.length) return `<div class="note-panel"><div class="unlinked-note" style="padding-top:14px">연결된 학습 노트가 없습니다.</div></div>`;
    return `<details class="note-panel"><summary>관련 학습 노트 ${notes.length}개</summary><div class="note-list">${notes.map(note => `<a class="note-link" href="${notionUrl(note.id)}" target="_blank" rel="noopener noreferrer">${escapeHtml(note.title)} ↗</a>`).join('')}</div></details>`;
  }

  function renderCards() {
    const words = orderedWords();
    if (!words.length) {
      state.view = 'library';
      state.activeSet = null;
      return renderLibrary();
    }
    state.index = Math.min(state.index, words.length - 1);
    const word = words[state.index];
    const front = state.prefs.direction === 'term-first' ? wordFace(word) : meaningFace(word);
    const back = state.prefs.direction === 'term-first' ? meaningFace(word) : wordFace(word);
    const progress = ((state.index + 1) / words.length) * 100;
    return `<div class="app-shell">
      <header class="card-header">
        <button class="back-button" type="button" data-action="back-library" aria-label="세트 선택으로 돌아가기">←</button>
        <div class="card-header-main"><p class="eyebrow">FLASHCARD SET</p><div class="set-title">${escapeHtml(state.activeSet.title)}</div><div class="set-meta">열람 기록만 저장되며 테스트 통계에는 반영되지 않아요.</div></div>
        <div class="header-actions"><button class="icon-button" type="button" data-action="toggle-dark" title="${state.prefs.dark ? '라이트모드' : '다크모드'}" aria-label="${state.prefs.dark ? '라이트모드' : '다크모드'}">${state.prefs.dark ? icons.sun : icons.moon}</button><button class="icon-button primary-icon-button" type="button" data-action="open-settings" title="설정" aria-label="단어카드 설정">${icons.settings}</button></div>
      </header>
      <div class="controls">
        <div class="select-wrap"><label for="sort-select">카드 순서</label><select id="sort-select"><option value="created" ${state.prefs.sort === 'created' ? 'selected' : ''}>등록순</option><option value="name" ${state.prefs.sort === 'name' ? 'selected' : ''}>가나다·ABC순</option><option value="random" ${state.prefs.sort === 'random' ? 'selected' : ''}>랜덤</option></select></div>
        <div class="select-wrap"><label for="direction-select">카드 방향</label><select id="direction-select"><option value="term-first" ${state.prefs.direction === 'term-first' ? 'selected' : ''}>단어 → 뜻</option><option value="meaning-first" ${state.prefs.direction === 'meaning-first' ? 'selected' : ''}>뜻 → 단어</option></select></div>
        <button class="shuffle-button" type="button" data-action="reshuffle" aria-label="카드 다시 섞기" title="카드 다시 섞기" ${state.prefs.sort === 'random' ? '' : 'disabled'}>↻</button>
      </div>
      <div class="progress-row"><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><div class="progress-count">${state.index + 1} / ${words.length}</div></div>
      <div class="flashcard-scene">
        <div class="flashcard ${state.flipped ? 'is-flipped' : ''}" role="button" tabindex="0" aria-label="${state.flipped ? '카드 앞면 보기' : '카드 뒷면 보기'}">
          <div class="flashcard-face flashcard-front">${front}</div>
          <div class="flashcard-face flashcard-back">${back}</div>
        </div>
      </div>
      <div class="navigation">
        <button class="nav-button" type="button" data-action="previous" ${state.index === 0 ? 'disabled' : ''}>← 이전</button>
        <button class="flip-button" type="button" data-action="flip" aria-label="카드 뒤집기">↺</button>
        <button class="nav-button next" type="button" data-action="next" ${state.index === words.length - 1 ? 'disabled' : ''}>다음 →</button>
      </div>
      ${renderNotePanel(word)}
    </div>`;
  }

  function renderSetup() {
    const installError = window.STUDY_INSTALL_ERROR?.message;
    const connected = hasCoreConnection();
    const urlConnected = Boolean(state.config.fromUrl || state.config.fromInstall);
    const theme = THEMES[state.prefs.theme] || THEMES.latte;
    const connectionRows = [
      { label:'단어장 DB', icon:icons.database, connected:Boolean(state.config.vocabDbId), desc:'단어, 뜻, 설명과 등록일을 불러옵니다.' },
      { label:'과목 DB', icon:icons.book, connected:Boolean(state.config.subjectDbId), desc:'단어를 과목별로 나누어 보여줍니다.' },
      { label:'학습 노트 DB', icon:icons.note, connected:Boolean(state.config.noteDbId), desc:'학습 노트별 단어 세트를 구성합니다.' },
    ];
    const statusTitle = urlConnected && connected ? 'URL로 연결됨' : connected ? '저장된 설정으로 연결됨' : 'URL 파라미터가 필요합니다';
    const statusText = connected
      ? '설정값은 이 화면에서 다시 입력하지 않고, 임베드 URL에서 자동으로 읽어옵니다.'
      : '위젯통합설정 페이지에서 생성한 단어카드 링크를 노션 임베드에 붙여넣어 주세요.';
    return `<div class="setup-screen"><section class="setup-panel" aria-labelledby="settings-title">
      <header class="setup-header">
        <div><div class="setup-kicker">Flashcard Settings</div><h1 class="setup-title" id="settings-title">${icons.settings}<span>단어카드 위젯 설정</span></h1><p class="setup-subtitle">이 위젯은 URL 파라미터로 Notion DB 설정값을 불러옵니다.</p></div>
        <button class="setup-icon-button" type="button" data-action="close-setup" title="닫기" aria-label="설정 닫기">×</button>
      </header>
      <div class="connection-alert ${connected ? 'is-connected' : 'is-waiting'}">
        <div class="connection-alert-icon">${connected ? '✓' : '!'}</div><div><strong>${statusTitle}</strong><p>${statusText}</p></div>
      </div>
      <section class="setup-section theme-section">
        <div class="setup-section-head"><div><h2>색상 테마</h2></div><span class="theme-name">${escapeHtml(theme.name)}</span></div>
        <div class="setup-theme-row">${Object.entries(THEMES).map(([id, item]) => `<button class="setup-theme-option ${state.prefs.theme === id ? 'is-active' : ''}" type="button" data-theme-id="${id}" style="--swatch:${item.color}" title="${item.name}" aria-label="${item.name} 테마 적용"></button>`).join('')}</div>
      </section>
      <section class="db-section"><h2>연결된 DB 목록</h2><div class="db-list">${connectionRows.map(row => `<div class="db-row"><div class="db-icon">${row.icon}</div><div class="db-copy"><div class="db-row-head"><strong>${row.label}</strong><span class="db-status ${row.connected ? 'is-connected' : ''}">${row.connected ? '연결됨' : '대기'}</span></div><p>${row.desc}</p></div></div>`).join('')}</div></section>
      <section class="setup-section setup-guide"><h2>화면 표시 안내</h2><p>데이터가 바로 보이지 않으면 아래 새로고침 버튼으로 Notion 데이터를 다시 불러오세요. 카드 순서, 카드 방향, 색상 테마와 다크모드 상태는 브라우저에 저장됩니다. 이 위젯은 읽기 전용이며 테스트 일정과 통계를 변경하지 않습니다.</p></section>
      ${installError || state.error ? `<div class="setup-error">${escapeHtml(installError || state.error)}</div>` : ''}
      <div class="setup-actions"><button class="setup-refresh-button" type="button" data-action="refresh-settings" ${connected && !state.loading ? '' : 'disabled'}>${state.loading ? '불러오는 중...' : '데이터 새로고침'}</button><button class="setup-close-button" type="button" data-action="close-setup">닫기</button></div>
    </section></div>`;
  }

  function renderError() {
    return `<div class="app-shell">${renderHeader()}<div class="empty-state"><strong>단어장을 불러오지 못했어요.</strong><span>${escapeHtml(state.error)}</span><div class="empty-actions"><button class="secondary-button" type="button" data-action="open-settings">연결 설정</button><button class="primary-button" type="button" data-action="retry">다시 시도</button></div></div></div>`;
  }

  function render() {
    if (state.settingsOpen || state.view === 'setup') root.innerHTML = renderSetup();
    else if (state.view === 'loading') root.innerHTML = '<div class="loading-state"><span class="spinner" aria-hidden="true"></span><span>단어장을 펼치고 있어요</span></div>';
    else if (state.view === 'error') root.innerHTML = renderError();
    else if (state.view === 'cards') root.innerHTML = renderCards();
    else root.innerHTML = renderLibrary();
    bindEvents();
  }

  function bindEvents() {
    root.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', event => {
        const action = button.dataset.action;
        if (action === 'toggle-dark') { state.prefs.dark = !state.prefs.dark; savePrefs(); render(); }
        if (action === 'refresh' && !button.disabled) { if (state.demo) { loadDemo(); render(); } else { loadData(); } }
        if (action === 'open-settings') { state.settingsOpen = true; render(); }
        if (action === 'close-setup') { state.settingsOpen = false; if (state.view === 'setup') state.view = 'library'; render(); }
        if (action === 'refresh-settings' && !button.disabled) {
          if (state.demo) { loadDemo(); render(); }
          else loadData({ keepSettings:true });
        }
        if (action === 'retry') loadData();
        if (action === 'back-subjects') { state.pickerSubject = null; render(); }
        if (action === 'back-library') { state.view = 'library'; state.flipped = false; render(); }
        if (action === 'continue-set') { const session = loadSession(); if (session) startSet(session.set, true); }
        if (action === 'previous') moveCard(-1);
        if (action === 'next') moveCard(1);
        if (action === 'flip') flipCard();
        if (action === 'reshuffle' && state.prefs.sort === 'random') {
          state.randomIds = shuffle(getSetWords(state.activeSet).map(word => word.id));
          state.index = 0; state.flipped = false; saveSession(); render();
        }
      });
    });

    root.querySelectorAll('[data-theme-id]').forEach(button => button.addEventListener('click', () => {
      state.prefs.theme = button.dataset.themeId; savePrefs(); render();
    }));
    root.querySelectorAll('[data-subject]').forEach(button => button.addEventListener('click', () => {
      if (button.disabled) return;
      state.pickerSubject = button.dataset.subject;
      render();
    }));
    root.querySelectorAll('[data-set-kind]').forEach(button => button.addEventListener('click', () => {
      startSet(makeSet(state.pickerSubject, button.dataset.setKind, button.dataset.noteId || null));
    }));

    const sortSelect = root.querySelector('#sort-select');
    if (sortSelect) sortSelect.addEventListener('change', () => {
      state.prefs.sort = sortSelect.value;
      state.index = 0;
      state.flipped = false;
      state.randomIds = sortSelect.value === 'random' ? shuffle(getSetWords(state.activeSet).map(word => word.id)) : [];
      savePrefs(); saveSession(); render();
    });
    const directionSelect = root.querySelector('#direction-select');
    if (directionSelect) directionSelect.addEventListener('change', () => {
      state.prefs.direction = directionSelect.value;
      state.flipped = false;
      savePrefs(); saveSession(); render();
    });

    const card = root.querySelector('.flashcard');
    if (card) {
      let startX = 0;
      let startY = 0;
      let suppressClick = false;
      card.addEventListener('pointerdown', event => { startX = event.clientX; startY = event.clientY; });
      card.addEventListener('pointerup', event => {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
          suppressClick = true;
          moveCard(dx < 0 ? 1 : -1);
          setTimeout(() => { suppressClick = false; }, 0);
        }
      });
      card.addEventListener('click', () => { if (!suppressClick) flipCard(); });
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); flipCard(); }
      });
    }
  }

  document.addEventListener('keydown', event => {
    if (state.view !== 'cards' || state.settingsOpen) return;
    if (['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(event.target.tagName)) return;
    if (event.code === 'Space') { event.preventDefault(); flipCard(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveCard(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveCard(1); }
    if (event.key === 'Escape') { state.view = 'library'; state.flipped = false; render(); }
  });

  async function boot() {
    applyPrefs();
    if (state.demo) { loadDemo(); render(); return; }
    if (!hasCoreConnection()) {
      state.view = 'setup';
      render();
      return;
    }
    await loadData();
  }

  window.CozyFlashcards = { reload:loadData };
  boot();
})();
