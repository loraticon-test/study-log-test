(() => {
  'use strict';

  const CONFIG_KEY = 'cozy_dday_config';
  const SETTINGS_KEY = 'cozy_dday_settings';
  const NOTION_VERSION = '2022-06-28';
  const root = document.getElementById('root');

  const THEMES = {
    latte: {
      name: '카페 라떼', color: '#A67B5B', textColor: '#5C3A21',
      goalColors: ['#F4F0EA', '#D1CBBF', '#CAB09D', '#A67B5B', '#8B664B']
    },
    matcha: {
      name: '말차 라떼', color: '#849F71', textColor: '#425B37',
      goalColors: ['#EEF4E9', '#C9D6BF', '#A6BA97', '#849F71', '#738C62']
    },
    choco: {
      name: '초코 라떼', color: '#72523A', textColor: '#3D291C',
      goalColors: ['#F4ECE4', '#C6B6A9', '#9C8370', '#72523A', '#5C3A21']
    },
    berry: {
      name: '딸기 라떼', color: '#D98891', textColor: '#8F4F58',
      goalColors: ['#FCECEF', '#F0C9CE', '#E4A8AF', '#D98891', '#C2737D']
    },
    milkTea: {
      name: '밀크티', color: '#D4A373', textColor: '#7B5738',
      goalColors: ['#F7ECDD', '#EBD2B8', '#DFBA95', '#D4A373', '#B88B5E']
    },
    blue: {
      name: '블루라떼', color: '#79ABC2', textColor: '#466B7C',
      goalColors: ['#EAF5FA', '#C2DBE6', '#9DC3D4', '#79ABC2', '#6395AC']
    }
  };

  const DEFAULT_SETTINGS = {
    layout: 'small',
    format: 'compact',
    sort: 'urgency',
    theme: 'latte',
    style: 'cream',
    dark: false,
    showFrame: true,
    fields: { title: true, type: false, status: false, date: false, subject: false },
    selectedIds: null,
    manualOrder: [],
    goalColors: {},
    goalTextColors: {}
  };

  const icons = {
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9c.25.63.87 1.04 1.56 1.04H21a2 2 0 1 1 0 4h-.09c-.68 0-1.29.4-1.51.96z"></path></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="3"></rect><path d="M8 2.5v4M16 2.5v4M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"></path></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0z"></path><path d="M12 9v4M12 17h.01"></path></svg>'
  };

  const state = {
    config: readConfig(),
    settings: readSettings(),
    goals: [],
    loading: false,
    error: '',
    settingsOpen: false,
    goalSearch: '',
    goalListLimit: 60,
    toast: '',
    toastTimer: null
  };

  function safeJson(value, fallback) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function extractNotionId(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const matches = raw.match(/[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g);
    return matches?.length ? matches[matches.length - 1].replace(/-/g, '') : raw.replace(/-/g, '');
  }

  function readConfig() {
    const params = new URLSearchParams(location.search);
    const stored = safeJson(localStorage.getItem(CONFIG_KEY) || '{}', {});
    const installed = window.STUDY_INSTALL_CONFIG || {};
    const proxyUrl = (params.get('proxy') || params.get('proxyUrl') || installed.proxyUrl || stored.proxyUrl || '').trim().replace(/\/+$/, '');
    const apiKey = (params.get('key') || params.get('apiKey') || installed.apiKey || installed.widgetToken || stored.apiKey || '').trim();
    const goalDbId = extractNotionId(params.get('goal') || params.get('goals') || params.get('goalDbId') || installed.goalDbId || stored.goalDbId || '');
    const subjectDbId = extractNotionId(params.get('subject') || params.get('subjectDbId') || installed.subjectDbId || stored.subjectDbId || '');
    const config = { proxyUrl, apiKey, goalDbId, subjectDbId, saved: Boolean(proxyUrl && apiKey && goalDbId) };
    if (config.saved) localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return config;
  }

  function readSettings() {
    const saved = safeJson(localStorage.getItem(SETTINGS_KEY) || '{}', {});
    const params = new URLSearchParams(location.search);
    const selectedFromUrl = (params.get('showGoals') || params.get('selectedGoals') || '').split(',').map(extractNotionId).filter(Boolean);
    const requestedTheme = params.get('colorTheme') || saved.theme || DEFAULT_SETTINGS.theme;
    const requestedStyle = saved.style === 'outline' ? 'cream' : (saved.style || DEFAULT_SETTINGS.style);
    const savedGoalColors = saved.goalColors && typeof saved.goalColors === 'object' ? saved.goalColors : {};
    const savedGoalTextColors = saved.goalTextColors && typeof saved.goalTextColors === 'object' ? saved.goalTextColors : {};
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      layout: params.get('layout') || saved.layout || DEFAULT_SETTINGS.layout,
      format: params.get('format') || saved.format || DEFAULT_SETTINGS.format,
      theme: THEMES[requestedTheme] ? requestedTheme : DEFAULT_SETTINGS.theme,
      style: ['cream', 'soft', 'colorBox'].includes(requestedStyle) ? requestedStyle : DEFAULT_SETTINGS.style,
      fields: { ...DEFAULT_SETTINGS.fields, ...(saved.fields || {}) },
      selectedIds: selectedFromUrl.length ? selectedFromUrl : (Array.isArray(saved.selectedIds) ? saved.selectedIds : null),
      manualOrder: Array.isArray(saved.manualOrder) ? saved.manualOrder : [],
      goalColors: Object.fromEntries(Object.entries(savedGoalColors).filter(([, color]) => normalizeHexColor(color))),
      goalTextColors: Object.fromEntries(Object.entries(savedGoalTextColors).filter(([, color]) => normalizeHexColor(color)))
    };
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.classList.toggle('dark', state.settings.dark);
  }

  function patchSettings(patch, shouldRender = true) {
    state.settings = { ...state.settings, ...patch };
    saveSettings();
    if (shouldRender) render();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }

  function normalizeHexColor(value) {
    const color = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : '';
  }

  function normalizeEditableHexColor(value) {
    let color = String(value || '').trim();
    if (!color.startsWith('#')) color = `#${color}`;
    if (/^#[0-9a-f]{3}$/i.test(color)) color = `#${color.slice(1).split('').map(char => char + char).join('')}`;
    return normalizeHexColor(color);
  }

  function automaticGoalColor(goal) {
    const palette = (THEMES[state.settings.theme] || THEMES.latte).goalColors;
    const selected = new Set(state.settings.selectedIds || []);
    const displayedGoals = sortGoals(state.goals.filter(item => selected.has(item.id)));
    let index = displayedGoals.findIndex(item => item.id === goal.id);
    if (index < 0) index = sortGoals(state.goals).findIndex(item => item.id === goal.id);
    return palette[Math.max(0, index) % palette.length];
  }

  function goalColor(goal) {
    return normalizeHexColor(state.settings.goalColors?.[goal.id]) || automaticGoalColor(goal);
  }

  function customGoalTextColor(goal) {
    return normalizeHexColor(state.settings.goalTextColors?.[goal.id]);
  }

  function defaultGoalTextColor() {
    if (state.settings.dark) return state.settings.style === 'colorBox' ? '#F3F4F6' : '#F3E6D6';
    if (state.settings.style === 'colorBox') return '#1F2937';
    return (THEMES[state.settings.theme] || THEMES.latte).textColor;
  }

  function goalTextPickerColor(goal) {
    return customGoalTextColor(goal) || defaultGoalTextColor();
  }

  function normalizeKey(value) {
    return String(value || '').replace(/[\s\u200B-\u200D\uFEFF_-]/g, '').toLowerCase();
  }

  function richText(prop) {
    if (!prop) return '';
    if (typeof prop === 'string') return prop;
    if (Array.isArray(prop)) return prop.map(richText).filter(Boolean).join(', ');
    if (prop.plain_text) return prop.plain_text;
    if (prop.name) return prop.name;
    if (prop.title) return prop.title.map(item => item.plain_text || '').join('').trim();
    if (prop.rich_text) return prop.rich_text.map(item => item.plain_text || '').join('').trim();
    if (prop.select?.name) return prop.select.name;
    if (prop.status?.name) return prop.status.name;
    if (prop.multi_select) return prop.multi_select.map(item => item.name).filter(Boolean).join(', ');
    if (prop.formula) return richText(prop.formula[prop.formula.type]);
    if (prop.rollup) return richText(prop.rollup[prop.rollup.type]);
    if (prop.array) return richText(prop.array);
    return '';
  }

  function relationIds(prop) {
    if (!prop) return [];
    if (Array.isArray(prop)) return prop.flatMap(relationIds);
    if (prop.relation) return prop.relation.map(item => item.id).filter(Boolean);
    if (prop.rollup) return relationIds(prop.rollup[prop.rollup.type]);
    if (prop.array) return relationIds(prop.array);
    return [];
  }

  async function notion(path, options = {}) {
    const response = await fetch(`${state.config.proxyUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.config.apiKey,
        'x-notion-version': NOTION_VERSION,
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `Notion API 오류 (${response.status})`);
    return data;
  }

  async function fetchDatabasePages(dbId, body = {}, limit = 500) {
    const pages = [];
    let cursor = null;
    do {
      const payload = { ...body, page_size: Math.min(100, limit - pages.length) };
      if (cursor) payload.start_cursor = cursor;
      const data = await notion(`/v1/databases/${dbId}/query`, { method: 'POST', body: JSON.stringify(payload) });
      pages.push(...(data.results || []));
      cursor = data.has_more && pages.length < limit ? data.next_cursor : null;
    } while (cursor);
    return pages.slice(0, limit);
  }

  function findSchemaKey(properties, matcher, types) {
    const keys = Object.keys(properties || {});
    return keys.find(key => matcher(normalizeKey(key)) && (!types || types.includes(properties[key].type))) || null;
  }

  async function fetchSubjectMap(subjectIds) {
    const map = {};
    if (!subjectIds.length) return map;
    if (state.config.subjectDbId) {
      try {
        const pages = await fetchDatabasePages(state.config.subjectDbId, {}, 500);
        pages.forEach(page => {
          const title = Object.values(page.properties || {}).find(prop => prop.type === 'title');
          map[page.id] = richText(title) || '이름 없는 과목';
        });
        return map;
      } catch (error) {
        console.warn('과목 DB를 한 번에 불러오지 못해 관계 페이지를 조회합니다.', error);
      }
    }
    const unique = [...new Set(subjectIds)];
    for (let index = 0; index < unique.length; index += 8) {
      const batch = unique.slice(index, index + 8);
      const results = await Promise.all(batch.map(async id => {
        try {
          const page = await notion(`/v1/pages/${id}`, { method: 'GET' });
          const title = Object.values(page.properties || {}).find(prop => prop.type === 'title');
          return [id, richText(title) || '이름 없는 과목'];
        } catch (_) { return [id, '과목 연결됨']; }
      }));
      results.forEach(([id, name]) => { map[id] = name; });
    }
    return map;
  }

  async function loadGoals(showToast = false) {
    if (!state.config.saved) {
      state.settingsOpen = true;
      render();
      return;
    }
    state.loading = true;
    state.error = '';
    render();
    try {
      const schema = await notion(`/v1/databases/${state.config.goalDbId}`, { method: 'GET' });
      const props = schema.properties || {};
      const titleKey = Object.keys(props).find(key => props[key].type === 'title');
      const typeKey = findSchemaKey(props, key => key.includes('목표유형') || key.includes('유형') || key.includes('goaltype'), ['select','multi_select']);
      const statusKey = findSchemaKey(props, key => key.includes('상태') || key.includes('status'), ['status','select']);
      const dateKey = findSchemaKey(props, key => key.includes('목표날짜') || key.includes('마감') || key.includes('날짜') || key.includes('date'), ['date']);
      const subjectKey = findSchemaKey(props, key => key.includes('관련과목') || key.includes('과목') || key.includes('subject'), ['rollup','relation','formula','rich_text','multi_select','select']);
      if (!titleKey) throw new Error('목표 DB에서 제목 속성을 찾지 못했어요.');
      if (!dateKey) throw new Error('목표 DB에서 날짜 속성을 찾지 못했어요. 속성명에 “목표 날짜” 또는 “날짜”를 포함해 주세요.');

      const pages = await fetchDatabasePages(state.config.goalDbId, { sorts: [{ property: dateKey, direction: 'ascending' }] }, 500);
      const rawGoals = pages.map(page => {
        const pageProps = page.properties || {};
        const date = pageProps[dateKey]?.date || null;
        const subjectProp = subjectKey ? pageProps[subjectKey] : null;
        const subjects = relationIds(subjectProp);
        return {
          id: page.id,
          title: richText(pageProps[titleKey]) || '이름 없는 목표',
          type: typeKey ? richText(pageProps[typeKey]) : '',
          status: statusKey ? richText(pageProps[statusKey]) : '',
          startDate: date?.start || null,
          endDate: date?.end || null,
          targetDate: date?.end || date?.start || null,
          subjectIds: subjects,
          subjectText: richText(subjectProp),
          subject: ''
        };
      });
      const subjectMap = await fetchSubjectMap(rawGoals.flatMap(goal => goal.subjectIds));
      state.goals = rawGoals.map(goal => {
        const subjectNames = [goal.subjectText, ...goal.subjectIds.map(id => subjectMap[id])]
          .flatMap(value => String(value || '').split(',').map(item => item.trim()))
          .filter(Boolean);
        return { ...goal, subject: [...new Set(subjectNames)].join(', ') };
      });

      if (state.settings.selectedIds === null) {
        const first = sortGoals(state.goals, 'urgency')[0];
        patchSettings({ selectedIds: first ? [first.id] : [], manualOrder: first ? [first.id] : [] }, false);
      } else {
        const validIds = new Set(state.goals.map(goal => goal.id));
        const selectedIds = state.settings.selectedIds.filter(id => validIds.has(id));
        const manualOrder = [...state.settings.manualOrder.filter(id => validIds.has(id)), ...selectedIds.filter(id => !state.settings.manualOrder.includes(id))];
        patchSettings({ selectedIds, manualOrder }, false);
      }
      if (showToast) toast('목표를 새로 불러왔어요.');
    } catch (error) {
      state.error = error.message || '목표를 불러오지 못했어요.';
      console.error(error);
    } finally {
      state.loading = false;
      render();
    }
  }

  function dateParts(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? { year: +match[1], month: +match[2], day: +match[3] } : null;
  }

  function daySerial(value) {
    const parts = dateParts(value);
    return parts ? Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000 : null;
  }

  function todaySerial() {
    const now = new Date();
    return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000;
  }

  function dayDiff(value) {
    const serial = daySerial(value);
    return serial == null ? null : serial - todaySerial();
  }

  function isCompleted(status) {
    const value = String(status || '').trim().toLowerCase();
    return new Set(['완료', '완료됨', '목표 완료', '목표 달성', '달성', '종료', '마감', 'done', 'complete', 'completed', 'closed', 'archived']).has(value);
  }

  function sortGoals(goals, mode = state.settings.sort) {
    const copy = [...goals];
    if (mode === 'manual') {
      const order = new Map(state.settings.manualOrder.map((id, index) => [id, index]));
      return copy.sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999) || a.title.localeCompare(b.title, 'ko'));
    }
    if (mode === 'dateDesc') return copy.sort((a, b) => (daySerial(b.targetDate) ?? -Infinity) - (daySerial(a.targetDate) ?? -Infinity));
    if (mode === 'dateAsc') return copy.sort((a, b) => (daySerial(a.targetDate) ?? Infinity) - (daySerial(b.targetDate) ?? Infinity));
    return copy.sort((a, b) => {
      const rank = goal => {
        const days = dayDiff(goal.targetDate);
        if (days == null) return [4, Infinity];
        if (isCompleted(goal.status)) return [3, Math.abs(days)];
        if (days >= 0) return [0, days];
        return [2, Math.abs(days)];
      };
      const ar = rank(a), br = rank(b);
      return ar[0] - br[0] || ar[1] - br[1] || a.title.localeCompare(b.title, 'ko');
    });
  }

  function formatCountdown(goal, format = state.settings.format) {
    const days = dayDiff(goal.targetDate);
    if (days == null) return '날짜 없음';
    if (format === 'remaining') return days > 0 ? `${days}일 남음` : days === 0 ? '오늘' : `${Math.abs(days)}일 지남`;
    if (format === 'until') return days > 0 ? `목표까지 ${days}일` : days === 0 ? '목표일' : `목표 후 ${Math.abs(days)}일`;
    if (format === 'number') return days >= 0 ? `${days}일` : `+${Math.abs(days)}일`;
    return days > 0 ? `D-${days}` : days === 0 ? 'D-Day' : `D+${Math.abs(days)}`;
  }

  function formatDate(value) {
    const parts = dateParts(value);
    if (!parts) return '';
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(parts.year, parts.month - 1, parts.day));
  }

  function countdownClass(goal) {
    const days = dayDiff(goal.targetDate);
    return days === 0 ? ' is-today' : days != null && days < 0 ? ' is-past' : '';
  }

  function selectedGoals() {
    const selected = new Set(state.settings.selectedIds || []);
    return sortGoals(state.goals.filter(goal => selected.has(goal.id)));
  }

  function goalMeta(goal, listMode = false) {
    const fields = state.settings.fields;
    const items = [];
    if (fields.type && goal.type) items.push(`<span class="${items.length ? 'meta-item meta-dot' : 'meta-item'}">${escapeHtml(goal.type)}</span>`);
    if (fields.status && goal.status) items.push(`<span class="status-chip">${escapeHtml(goal.status)}</span>`);
    if (fields.date && goal.targetDate) items.push(`<span class="${items.length ? 'meta-item meta-dot' : 'meta-item'}">${escapeHtml(formatDate(goal.targetDate))}</span>`);
    if (fields.subject && goal.subject) items.push(`<span class="${items.length ? 'meta-item meta-dot' : 'meta-item'}">${escapeHtml(goal.subject)}</span>`);
    return items.length ? `<div class="goal-meta${listMode ? ' is-list' : ''}">${items.join('')}</div>` : '';
  }

  function renderGoal(goal) {
    const title = state.settings.fields.title ? `<h3 class="goal-name" title="${escapeHtml(goal.title)}">${escapeHtml(goal.title)}</h3>` : '';
    const countdown = formatCountdown(goal);
    const countdownHtml = `<div class="countdown${countdownClass(goal)}${goal.targetDate ? '' : ' no-date'}">${escapeHtml(countdown)}</div>`;
    const textColor = customGoalTextColor(goal);
    const cardOpen = `<article class="goal-card" style="--goal-color:${goalColor(goal)}${textColor ? `;--goal-text-color:${textColor}` : ''}">`;
    if (state.settings.layout === 'list') {
      return `${cardOpen}<div class="goal-copy">${title}${goalMeta(goal, true)}</div>${countdownHtml}</article>`;
    }
    if (state.settings.layout === 'long') {
      return `${cardOpen}<div class="goal-copy">${title}${goalMeta(goal)}</div>${countdownHtml}</article>`;
    }
    return `${cardOpen}<div class="goal-copy">${title}${goalMeta(goal)}</div>${countdownHtml}</article>`;
  }

  function emptyState() {
    if (state.loading) return `<div class="empty-card"><span class="spinner" aria-hidden="true"></span><strong>목표를 불러오는 중이에요</strong></div>`;
    if (!state.config.saved) return `<div class="empty-card">${icons.link}<strong>목표 DB를 연결해 주세요</strong><p>통합 설정에서 만든 임베드 URL을 사용하면 자동으로 연결돼요.</p><button class="primary-button" data-action="open-settings">연결 안내 보기</button></div>`;
    if (!state.goals.length) return `<div class="empty-card">${icons.calendar}<strong>표시할 목표가 없어요</strong><p>목표 DB에 날짜가 있는 목표를 추가한 뒤 새로고침해 주세요.</p><button class="tiny-button" data-action="refresh">새로고침</button></div>`;
    return `<div class="empty-card">${icons.calendar}<strong>표시할 목표를 선택해 주세요</strong><p>여러 목표를 골라 한 위젯에서 함께 볼 수 있어요.</p><button class="primary-button" data-action="open-settings">목표 선택하기</button></div>`;
  }

  function mainHtml() {
    const goals = selectedGoals();
    const countText = goals.length ? `${goals.length}개의 목표` : '표시할 목표를 선택해 주세요';
    const singleGoalClass = goals.length === 1 && state.settings.layout === 'small' ? ' single-goal' : '';
    const frameClass = state.settings.showFrame ? ' frame-visible' : ' frame-hidden';
    const actionButtons = `<button class="icon-button${state.loading ? ' loading' : ''}" data-action="refresh" title="목표 새로고침" aria-label="목표 새로고침">${icons.refresh}</button><button class="icon-button" data-action="open-settings" title="디데이 설정" aria-label="디데이 설정">${icons.settings}</button>`;
    const header = state.settings.showFrame ? `<header class="widget-header">
        <div class="widget-heading"><span class="eyebrow">Goal D-Day</span><h1 class="widget-title">목표 디데이</h1><p class="widget-subtitle">${escapeHtml(countText)}</p></div>
        <div class="header-actions">${actionButtons}</div>
      </header>` : `<div class="floating-actions" aria-label="위젯 도구">${actionButtons}</div>`;
    return `<section class="widget-shell layout-${escapeHtml(state.settings.layout)} format-${escapeHtml(state.settings.format)} style-${escapeHtml(state.settings.style)}${singleGoalClass}${frameClass}">
      ${header}
      ${state.error ? `<div class="error-banner">${icons.alert}<span>${escapeHtml(state.error)}</span></div>` : ''}
      <div class="goal-grid">${goals.length ? goals.map(renderGoal).join('') : emptyState()}</div>
    </section>`;
  }

  function optionButton(value, label, hint) {
    return `<button class="option-button${state.settings.layout === value ? ' selected' : ''}" data-setting="layout" data-value="${value}"><strong>${label}</strong><span>${hint}</span></button>`;
  }

  function formatButton(value, sample, recommended = false) {
    return `<button class="format-button${state.settings.format === value ? ' selected' : ''}" data-setting="format" data-value="${value}"><strong>${sample}</strong>${recommended ? '<span class="recommended">추천</span>' : ''}</button>`;
  }

  function goalListContentHtml() {
    const query = state.goalSearch.trim().toLowerCase();
    const matches = sortGoals(state.goals, 'dateAsc').filter(goal => !query || goal.title.toLowerCase().includes(query));
    const visible = matches.slice(0, state.goalListLimit);
    const selected = new Set(state.settings.selectedIds || []);
    if (!visible.length) return '<div class="param-help">검색 결과가 없어요.</div>';
    const rows = visible.map(goal => {
      const meta = [goal.type, goal.status, goal.subject].filter(Boolean).join(' · ') || formatDate(goal.targetDate) || '날짜 없음';
      const safeId = escapeHtml(goal.id);
      const color = goalColor(goal);
      const textColor = goalTextPickerColor(goal);
      return `<div class="goal-select-row${selected.has(goal.id) ? ' is-selected' : ''}" style="--goal-color:${color};--goal-text-color:${textColor}"><input id="goal-check-${safeId}" type="checkbox" data-goal-id="${safeId}" ${selected.has(goal.id) ? 'checked' : ''}><label class="goal-select-copy" for="goal-check-${safeId}"><strong>${escapeHtml(goal.title)}</strong><span>${escapeHtml(meta)}</span></label><button class="goal-text-color-picker" type="button" data-color-editor-kind="text" data-color-goal-id="${safeId}" title="${escapeHtml(goal.title)} 디데이 글자색 선택" aria-label="${escapeHtml(goal.title)} 디데이 글자색 선택"><span class="goal-text-color-glyph" aria-hidden="true">A</span></button><button class="goal-color-picker" type="button" data-color-editor-kind="background" data-color-goal-id="${safeId}" title="${escapeHtml(goal.title)} 배경색 선택" aria-label="${escapeHtml(goal.title)} 배경색 선택"></button><span class="goal-select-dday">${escapeHtml(formatCountdown(goal, 'compact'))}</span></div>`;
    }).join('');
    const remaining = matches.length - visible.length;
    return `<div class="goal-select-list">${rows}</div>${remaining > 0 ? `<div class="goal-list-footer"><button class="tiny-button" data-action="show-more-goals">더 보기 (${remaining}개 남음)</button></div>` : ''}`;
  }

  function goalSelectionHtml() {
    if (state.loading) return '<div class="initial-loader"><span class="spinner"></span><span>목표 목록을 불러오는 중이에요</span></div>';
    if (!state.goals.length) return '<div class="param-help">연결 후 목표 목록이 여기에 표시됩니다.</div>';
    return `<div class="goal-tools"><input id="goal-search" class="search-input" type="search" value="${escapeHtml(state.goalSearch)}" placeholder="목표명 검색" aria-label="목표명 검색"><button class="tiny-button" data-action="select-all">전체 선택</button><button class="tiny-button" data-action="clear-selection">해제</button></div><div id="goal-list-content">${goalListContentHtml()}</div>`;
  }

  function manualOrderHtml() {
    if (state.settings.sort !== 'manual') return '';
    const ordered = sortGoals(state.goals.filter(goal => (state.settings.selectedIds || []).includes(goal.id)), 'manual');
    if (ordered.length < 2) return '<p class="section-hint">목표를 2개 이상 선택하면 순서를 직접 바꿀 수 있어요.</p>';
    return `<div class="manual-order">${ordered.map((goal, index) => `<div class="manual-row"><span>${index + 1}. ${escapeHtml(goal.title)}</span><button class="order-button" data-move="up" data-goal-id="${escapeHtml(goal.id)}" ${index === 0 ? 'disabled' : ''} aria-label="위로 이동">↑</button><button class="order-button" data-move="down" data-goal-id="${escapeHtml(goal.id)}" ${index === ordered.length - 1 ? 'disabled' : ''} aria-label="아래로 이동">↓</button></div>`).join('')}</div>`;
  }

  function settingsHtml() {
    if (!state.settingsOpen) return '';
    const connected = state.config.saved;
    const selectedCount = (state.settings.selectedIds || []).length;
    return `<div class="modal-backdrop" data-action="backdrop-close">
      <section class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header class="settings-head"><div><span class="eyebrow">D-Day Settings</span><h2 id="settings-title">디데이 위젯 설정</h2><p>표시할 목표와 카드 모양을 골라 나만의 디데이를 만들어 보세요.</p></div><button class="icon-button" data-action="close-settings" aria-label="설정 닫기">${icons.close}</button></header>
        <div class="settings-scroll">
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">Notion 연결</h3><p class="section-hint">목표 DB는 필수, 과목 DB는 과목명 표시를 위해 권장합니다.</p></div></div>
            <div class="connection-card"><span class="connection-icon">${icons.link}</span><span class="connection-copy"><strong>${connected ? '목표 DB가 연결되어 있어요' : '목표 DB 연결이 필요해요'}</strong><span>${connected ? `목표 DB ${state.config.goalDbId.slice(0, 6)}… · 과목 DB ${state.config.subjectDbId ? '연결됨' : '관계 페이지로 조회'}` : '통합 설정 또는 URL 파라미터로 연결해 주세요.'}</span></span><span class="connection-pill${connected ? '' : ' missing'}">${connected ? '연결됨' : '필수 누락'}</span></div>
          </section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">색상과 스타일</h3></div></div><div class="theme-row">${Object.entries(THEMES).map(([key,theme]) => `<button class="theme-swatch${state.settings.theme === key ? ' selected' : ''}" data-theme-choice="${key}" style="background:${theme.color}" title="${theme.name}" aria-label="${theme.name}"></button>`).join('')}</div><div class="style-row">${[['cream','라인 미니멀'],['soft','배경 투명'],['colorBox','컬러 박스']].map(([key,label]) => `<button class="style-choice${state.settings.style === key ? ' selected' : ''}" data-style-choice="${key}">${label}</button>`).join('')}</div><div class="dark-row"><span>다크 모드</span><button class="switch${state.settings.dark ? ' on' : ''}" data-action="toggle-dark" role="switch" aria-checked="${state.settings.dark}" aria-label="다크 모드"></button></div></section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">카드 형태</h3><p class="section-hint">좁은 Notion 칼럼에는 작은 카드형, 넓은 영역에는 긴 카드형을 추천해요.</p></div></div><div class="option-grid">${optionButton('small','작은 카드형','2열 카드')}${optionButton('long','긴 카드형','가로 카드')}${optionButton('list','리스트형','한 줄 목록')}</div></section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">디데이 표시 방식</h3></div></div><div class="format-grid">${formatButton('compact','D-31',true)}${formatButton('remaining','31일 남음')}${formatButton('until','목표까지 31일')}${formatButton('number','31일')}</div></section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">표시할 정보</h3><p class="section-hint">제목·외곽 프레임을 끄면 디데이 카드만 표시됩니다.</p></div></div><div class="toggle-grid">
            <label class="check-option"><input type="checkbox" data-display-setting="showFrame" ${state.settings.showFrame ? 'checked' : ''}>제목·외곽 프레임</label>
            ${[['title','목표명'],['type','목표유형'],['status','상태'],['date','목표 날짜'],['subject','관련 과목']].map(([key,label]) => `<label class="check-option"><input type="checkbox" data-field="${key}" ${state.settings.fields[key] ? 'checked' : ''}>${label}</label>`).join('')}
          </div></section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">정렬 순서</h3><p class="section-hint">가까운 목표순은 오늘과 다가오는 목표를 먼저, 지난 목표와 완료 목표를 뒤에 둡니다.</p></div></div><select class="select-input" data-setting-select="sort" aria-label="정렬 순서"><option value="urgency" ${state.settings.sort === 'urgency' ? 'selected' : ''}>가까운 목표순 (추천)</option><option value="dateAsc" ${state.settings.sort === 'dateAsc' ? 'selected' : ''}>목표 날짜 빠른순</option><option value="dateDesc" ${state.settings.sort === 'dateDesc' ? 'selected' : ''}>목표 날짜 늦은순</option><option value="manual" ${state.settings.sort === 'manual' ? 'selected' : ''}>직접 정렬</option></select>${manualOrderHtml()}</section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">표시할 목표</h3><p class="section-hint">A는 디데이 글자색, 컬러칩은 배경색을 설정합니다.</p></div><div class="section-actions"><button type="button" class="tiny-button" data-action="apply-theme-colors">전체 테마색 적용</button><span id="selected-goal-count" class="recommended">${selectedCount}개 선택</span></div></div>${goalSelectionHtml()}</section>
        </div>
        <footer class="settings-footer"><button class="secondary-button" data-action="refresh">데이터 새로고침</button><button class="primary-button" data-action="close-settings">설정 완료</button></footer>
      </section>
      <div id="goal-color-editor" class="goal-color-editor" role="dialog" aria-modal="false" aria-labelledby="goal-color-editor-title" hidden>
        <div class="color-editor-head"><strong id="goal-color-editor-title">색상 선택</strong><button type="button" class="color-editor-close" data-action="close-color-editor" aria-label="색상 선택 닫기">×</button></div>
        <label class="color-editor-hex"><span>HEX</span><input id="goal-color-hex" type="text" maxlength="7" inputmode="text" autocomplete="off" spellcheck="false" placeholder="#1F2937" aria-label="HEX 색상 코드"></label>
        <p id="goal-color-error" class="color-editor-error" hidden>HEX 코드를 확인해 주세요.</p>
        <div class="color-editor-actions"><label class="color-editor-palette"><input id="goal-color-native" type="color" aria-label="팔레트에서 색상 선택"><span>팔레트</span></label><button type="button" class="color-editor-apply" data-action="apply-goal-color">적용</button><button type="button" class="color-editor-reset" data-action="reset-goal-color">기본값으로 초기화</button></div>
      </div>
    </div>`;
  }

  function ensureMounts() {
    if (root.querySelector('#widget-main')) return;
    root.innerHTML = '<div id="widget-main"></div><div id="settings-root"></div><div id="toast-root"></div>';
  }

  function renderMain() {
    ensureMounts();
    root.querySelector('#widget-main').innerHTML = mainHtml();
  }

  function renderSettings() {
    ensureMounts();
    const mount = root.querySelector('#settings-root');
    const previousScroll = mount.querySelector('.settings-scroll')?.scrollTop || 0;
    mount.innerHTML = settingsHtml();
    const nextScroll = mount.querySelector('.settings-scroll');
    if (nextScroll) nextScroll.scrollTop = previousScroll;
  }

  function renderToast() {
    ensureMounts();
    root.querySelector('#toast-root').innerHTML = state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : '';
  }

  function renderGoalListContent(preserveScroll = true) {
    const content = root.querySelector('#goal-list-content');
    if (!content) return;
    const previousScroll = preserveScroll ? content.querySelector('.goal-select-list')?.scrollTop || 0 : 0;
    content.innerHTML = goalListContentHtml();
    const nextList = content.querySelector('.goal-select-list');
    if (nextList) nextList.scrollTop = previousScroll;
  }

  function updateSelectedCount() {
    const badge = root.querySelector('#selected-goal-count');
    if (badge) badge.textContent = `${(state.settings.selectedIds || []).length}개 선택`;
  }

  function closeGoalColorEditor() {
    const editor = root.querySelector('#goal-color-editor');
    if (!editor) return;
    editor.hidden = true;
    editor.style.visibility = '';
    delete editor.dataset.goalId;
    delete editor.dataset.colorKind;
  }

  function openGoalColorEditor(control) {
    const editor = root.querySelector('#goal-color-editor');
    const goal = state.goals.find(item => item.id === control.dataset.colorGoalId);
    if (!editor || !goal) return;
    const kind = control.dataset.colorEditorKind;
    const color = kind === 'text' ? goalTextPickerColor(goal) : goalColor(goal);
    const hexInput = editor.querySelector('#goal-color-hex');
    const nativeInput = editor.querySelector('#goal-color-native');
    const error = editor.querySelector('#goal-color-error');
    editor.dataset.goalId = goal.id;
    editor.dataset.colorKind = kind;
    editor.querySelector('#goal-color-editor-title').textContent = kind === 'text' ? '디데이 글자색' : '디데이 배경색';
    hexInput.value = color;
    nativeInput.value = color;
    editor.querySelector('.color-editor-reset').disabled = kind === 'text'
      ? !customGoalTextColor(goal)
      : !normalizeHexColor(state.settings.goalColors?.[goal.id]);
    error.hidden = true;
    hexInput.classList.remove('invalid');
    editor.hidden = false;
    editor.style.visibility = 'hidden';
    requestAnimationFrame(() => {
      const anchor = control.getBoundingClientRect();
      const popover = editor.getBoundingClientRect();
      const left = Math.max(8, Math.min(anchor.right - popover.width, window.innerWidth - popover.width - 8));
      const below = anchor.bottom + 7;
      const top = below + popover.height <= window.innerHeight - 8 ? below : Math.max(8, anchor.top - popover.height - 7);
      editor.style.left = `${left}px`;
      editor.style.top = `${top}px`;
      editor.style.visibility = 'visible';
      hexInput.focus();
      hexInput.select();
    });
  }

  function applyGoalColorEditor() {
    const editor = root.querySelector('#goal-color-editor');
    if (!editor || editor.hidden) return;
    const hexInput = editor.querySelector('#goal-color-hex');
    const error = editor.querySelector('#goal-color-error');
    const color = normalizeEditableHexColor(hexInput.value);
    if (!color) {
      error.hidden = false;
      hexInput.classList.add('invalid');
      hexInput.focus();
      return;
    }
    const goalId = editor.dataset.goalId;
    if (editor.dataset.colorKind === 'text') {
      state.settings = { ...state.settings, goalTextColors: { ...state.settings.goalTextColors, [goalId]: color } };
    } else {
      state.settings = { ...state.settings, goalColors: { ...state.settings.goalColors, [goalId]: color } };
    }
    saveSettings();
    closeGoalColorEditor();
    renderMain();
    renderGoalListContent();
  }

  function resetGoalColorEditor() {
    const editor = root.querySelector('#goal-color-editor');
    if (!editor || editor.hidden) return;
    const goalId = editor.dataset.goalId;
    if (editor.dataset.colorKind === 'text') {
      const goalTextColors = { ...state.settings.goalTextColors };
      delete goalTextColors[goalId];
      state.settings = { ...state.settings, goalTextColors };
    } else {
      const goalColors = { ...state.settings.goalColors };
      delete goalColors[goalId];
      state.settings = { ...state.settings, goalColors };
    }
    saveSettings();
    closeGoalColorEditor();
    renderMain();
    renderGoalListContent();
    toast('기본 테마 색상으로 초기화했어요.');
  }

  function applyThemeColorsToAllGoals() {
    const hasCustomColors = Object.keys(state.settings.goalColors || {}).length || Object.keys(state.settings.goalTextColors || {}).length;
    if (!hasCustomColors) {
      toast('이미 전체 목표에 테마 색상이 적용되어 있어요.');
      return;
    }
    if (!window.confirm('모든 목표의 사용자 지정 글자색과 배경색을 지우고 현재 테마 색상을 적용할까요?')) return;
    state.settings = { ...state.settings, goalColors: {}, goalTextColors: {} };
    saveSettings();
    renderMain();
    renderGoalListContent();
    toast('전체 목표에 현재 테마 색상을 적용했어요.');
  }

  function render() {
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.classList.toggle('dark', state.settings.dark);
    renderMain();
    renderSettings();
    renderToast();
  }

  function bindEvents() {
    root.addEventListener('click', event => {
      const element = event.target.closest('[data-action], [data-setting], [data-theme-choice], [data-style-choice], [data-move], [data-color-editor-kind]');
      if (!element || !root.contains(element)) return;
      const action = element.dataset.action;
      if (action === 'backdrop-close' && event.target !== element) return;
      if (element.dataset.colorEditorKind) { openGoalColorEditor(element); return; }
      if (action === 'close-color-editor') { closeGoalColorEditor(); return; }
      if (action === 'apply-goal-color') { applyGoalColorEditor(); return; }
      if (action === 'reset-goal-color') { resetGoalColorEditor(); return; }
      if (action === 'apply-theme-colors') { applyThemeColorsToAllGoals(); return; }
      if (action === 'open-settings') {
        state.settingsOpen = true;
        state.goalSearch = '';
        state.goalListLimit = 60;
        renderSettings();
        return;
      }
      if (action === 'close-settings' || action === 'backdrop-close') {
        if (state.config.saved || state.goals.length) {
          state.settingsOpen = false;
          renderSettings();
        }
        return;
      }
      if (action === 'refresh') { loadGoals(true); return; }
      if (action === 'toggle-dark') { patchSettings({ dark: !state.settings.dark }); return; }
      if (action === 'select-all') { patchSettings({ selectedIds: state.goals.map(goal => goal.id), manualOrder: state.goals.map(goal => goal.id) }); return; }
      if (action === 'clear-selection') { patchSettings({ selectedIds: [], manualOrder: [] }); return; }
      if (action === 'show-more-goals') {
        state.goalListLimit += 60;
        renderGoalListContent();
        return;
      }
      if (element.dataset.setting) { patchSettings({ [element.dataset.setting]: element.dataset.value }); return; }
      if (element.dataset.themeChoice) { patchSettings({ theme: element.dataset.themeChoice }); return; }
      if (element.dataset.styleChoice) { patchSettings({ style: element.dataset.styleChoice }); return; }
      if (element.dataset.move) {
        const ordered = sortGoals(state.goals.filter(goal => (state.settings.selectedIds || []).includes(goal.id)), 'manual').map(goal => goal.id);
        const index = ordered.indexOf(element.dataset.goalId);
        const nextIndex = element.dataset.move === 'up' ? index - 1 : index + 1;
        if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
        [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
        patchSettings({ manualOrder: ordered });
      }
    });

    root.addEventListener('change', event => {
      const input = event.target;
      if (input.dataset.settingSelect) { patchSettings({ [input.dataset.settingSelect]: input.value }); return; }
      if (input.dataset.displaySetting) { patchSettings({ [input.dataset.displaySetting]: input.checked }); return; }
      if (input.dataset.field) { patchSettings({ fields: { ...state.settings.fields, [input.dataset.field]: input.checked } }); return; }
      if (input.dataset.goalTextColorId) {
        const color = normalizeHexColor(input.value);
        if (!color) return;
        state.settings = { ...state.settings, goalTextColors: { ...state.settings.goalTextColors, [input.dataset.goalTextColorId]: color } };
        saveSettings();
        input.closest('.goal-select-row')?.style.setProperty('--goal-text-color', color);
        renderMain();
        return;
      }
      if (input.dataset.goalColorId) {
        const color = normalizeHexColor(input.value);
        if (!color) return;
        state.settings = { ...state.settings, goalColors: { ...state.settings.goalColors, [input.dataset.goalColorId]: color } };
        saveSettings();
        input.closest('.goal-select-row')?.style.setProperty('--goal-color', color);
        renderMain();
        return;
      }
      if (input.matches('[data-goal-id][type="checkbox"]')) {
        const selected = new Set(state.settings.selectedIds || []);
        if (input.checked) selected.add(input.dataset.goalId); else selected.delete(input.dataset.goalId);
        const selectedIds = [...selected];
        const manualOrder = [...state.settings.manualOrder.filter(id => selected.has(id)), ...selectedIds.filter(id => !state.settings.manualOrder.includes(id))];
        state.settings = { ...state.settings, selectedIds, manualOrder };
        saveSettings();
        renderMain();
        if (state.settings.sort === 'manual') renderSettings();
        else {
          renderGoalListContent();
          updateSelectedCount();
        }
      }
    });

    root.addEventListener('input', event => {
      if (event.target.id === 'goal-color-hex') {
        const editor = event.target.closest('#goal-color-editor');
        const color = normalizeEditableHexColor(event.target.value);
        const error = editor?.querySelector('#goal-color-error');
        event.target.classList.toggle('invalid', Boolean(event.target.value) && !color);
        if (error) error.hidden = !event.target.value || Boolean(color);
        if (color) editor.querySelector('#goal-color-native').value = color;
        return;
      }
      if (event.target.id === 'goal-color-native') {
        const editor = event.target.closest('#goal-color-editor');
        editor.querySelector('#goal-color-hex').value = event.target.value.toUpperCase();
        editor.querySelector('#goal-color-hex').classList.remove('invalid');
        editor.querySelector('#goal-color-error').hidden = true;
        return;
      }
      if (event.target.id !== 'goal-search') return;
      state.goalSearch = event.target.value;
      state.goalListLimit = 60;
      renderGoalListContent(false);
    });

    root.addEventListener('keydown', event => {
      const editor = root.querySelector('#goal-color-editor');
      if (event.key === 'Enter' && event.target.id === 'goal-color-hex') {
        event.preventDefault();
        applyGoalColorEditor();
        return;
      }
      if (event.key === 'Escape' && editor && !editor.hidden) {
        event.preventDefault();
        closeGoalColorEditor();
        return;
      }
      if (event.key === 'Escape' && state.settingsOpen && (state.config.saved || state.goals.length)) {
        state.settingsOpen = false;
        renderSettings();
      }
    });
  }

  function toast(message) {
    state.toast = message;
    clearTimeout(state.toastTimer);
    renderToast();
    state.toastTimer = setTimeout(() => { state.toast = ''; renderToast(); }, 2200);
  }

  state.settingsOpen = !state.config.saved;
  saveSettings();
  bindEvents();
  render();
  if (state.config.saved) loadGoals();
})();
