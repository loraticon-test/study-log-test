(() => {
  'use strict';

  const CONFIG_KEY = 'cozy_dday_config';
  const SETTINGS_KEY = 'cozy_dday_settings';
  const NOTION_VERSION = '2022-06-28';
  const root = document.getElementById('root');

  const THEMES = {
    latte: { name: '카페 라떼', color: '#A67B5B' },
    matcha: { name: '말차 라떼', color: '#849F71' },
    choco: { name: '초코 라떼', color: '#72523A' },
    berry: { name: '딸기 라떼', color: '#D98891' },
    milkTea: { name: '밀크티', color: '#D4A373' },
    blue: { name: '블루라떼', color: '#79ABC2' }
  };

  const DEFAULT_SETTINGS = {
    layout: 'small',
    format: 'compact',
    sort: 'urgency',
    theme: 'latte',
    style: 'cream',
    dark: false,
    fields: { title: true, type: false, status: false, date: false, subject: false },
    selectedIds: null,
    manualOrder: []
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
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      layout: params.get('layout') || saved.layout || DEFAULT_SETTINGS.layout,
      format: params.get('format') || saved.format || DEFAULT_SETTINGS.format,
      theme: params.get('colorTheme') || saved.theme || DEFAULT_SETTINGS.theme,
      fields: { ...DEFAULT_SETTINGS.fields, ...(saved.fields || {}) },
      selectedIds: selectedFromUrl.length ? selectedFromUrl : (Array.isArray(saved.selectedIds) ? saved.selectedIds : null),
      manualOrder: Array.isArray(saved.manualOrder) ? saved.manualOrder : []
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
      const subjectKey = findSchemaKey(props, key => key.includes('관련과목') || key.includes('과목') || key.includes('subject'), ['relation']);
      if (!titleKey) throw new Error('목표 DB에서 제목 속성을 찾지 못했어요.');
      if (!dateKey) throw new Error('목표 DB에서 날짜 속성을 찾지 못했어요. 속성명에 “목표 날짜” 또는 “날짜”를 포함해 주세요.');

      const pages = await fetchDatabasePages(state.config.goalDbId, { sorts: [{ property: dateKey, direction: 'ascending' }] }, 500);
      const rawGoals = pages.map(page => {
        const pageProps = page.properties || {};
        const date = pageProps[dateKey]?.date || null;
        const subjects = subjectKey ? relationIds(pageProps[subjectKey]) : [];
        return {
          id: page.id,
          title: richText(pageProps[titleKey]) || '이름 없는 목표',
          type: typeKey ? richText(pageProps[typeKey]) : '',
          status: statusKey ? richText(pageProps[statusKey]) : '',
          startDate: date?.start || null,
          endDate: date?.end || null,
          targetDate: date?.end || date?.start || null,
          subjectIds: subjects,
          subject: ''
        };
      });
      const subjectMap = await fetchSubjectMap(rawGoals.flatMap(goal => goal.subjectIds));
      state.goals = rawGoals.map(goal => ({ ...goal, subject: goal.subjectIds.map(id => subjectMap[id]).filter(Boolean).join(', ') }));

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
    if (state.settings.layout === 'list') {
      return `<article class="goal-card"><div class="goal-copy">${title}${goalMeta(goal, true)}</div>${countdownHtml}</article>`;
    }
    if (state.settings.layout === 'long') {
      return `<article class="goal-card"><div class="goal-copy">${title}${goalMeta(goal)}</div>${countdownHtml}</article>`;
    }
    return `<article class="goal-card"><div class="goal-copy">${title}${goalMeta(goal)}</div>${countdownHtml}</article>`;
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
    return `<section class="widget-shell layout-${escapeHtml(state.settings.layout)} format-${escapeHtml(state.settings.format)} style-${escapeHtml(state.settings.style)}${singleGoalClass}">
      <header class="widget-header">
        <div class="widget-heading"><span class="eyebrow">Goal D-Day</span><h1 class="widget-title">목표 디데이</h1><p class="widget-subtitle">${escapeHtml(countText)}</p></div>
        <div class="header-actions">
          <button class="icon-button${state.loading ? ' loading' : ''}" data-action="refresh" title="목표 새로고침" aria-label="목표 새로고침">${icons.refresh}</button>
          <button class="icon-button" data-action="open-settings" title="디데이 설정" aria-label="디데이 설정">${icons.settings}</button>
        </div>
      </header>
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

  function goalSelectionHtml() {
    if (state.loading) return '<div class="initial-loader"><span class="spinner"></span><span>목표 목록을 불러오는 중이에요</span></div>';
    if (!state.goals.length) return '<div class="param-help">연결 후 목표 목록이 여기에 표시됩니다.</div>';
    const selected = new Set(state.settings.selectedIds || []);
    return `<div class="goal-tools"><input id="goal-search" class="search-input" type="search" placeholder="목표명 검색" aria-label="목표명 검색"><button class="tiny-button" data-action="select-all">전체 선택</button><button class="tiny-button" data-action="clear-selection">해제</button></div>
      <div class="goal-select-list">${sortGoals(state.goals, 'dateAsc').map(goal => {
        const meta = [goal.type, goal.status, goal.subject].filter(Boolean).join(' · ') || formatDate(goal.targetDate) || '날짜 없음';
        return `<label class="goal-select-row${selected.has(goal.id) ? ' is-selected' : ''}" data-search="${escapeHtml(goal.title.toLowerCase())}"><input type="checkbox" data-goal-id="${escapeHtml(goal.id)}" ${selected.has(goal.id) ? 'checked' : ''}><span class="goal-select-copy"><strong>${escapeHtml(goal.title)}</strong><span>${escapeHtml(meta)}</span></span><span class="goal-select-dday">${escapeHtml(formatCountdown(goal, 'compact'))}</span></label>`;
      }).join('')}</div>`;
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
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">색상과 스타일</h3></div></div><div class="theme-row">${Object.entries(THEMES).map(([key,theme]) => `<button class="theme-swatch${state.settings.theme === key ? ' selected' : ''}" data-theme-choice="${key}" style="background:${theme.color}" title="${theme.name}" aria-label="${theme.name}"></button>`).join('')}</div><div class="style-row">${[['cream','크림 카드'],['soft','소프트 컬러'],['outline','라인 미니멀']].map(([key,label]) => `<button class="style-choice${state.settings.style === key ? ' selected' : ''}" data-style-choice="${key}">${label}</button>`).join('')}</div><div class="dark-row"><span>다크 모드</span><button class="switch${state.settings.dark ? ' on' : ''}" data-action="toggle-dark" role="switch" aria-checked="${state.settings.dark}" aria-label="다크 모드"></button></div></section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">카드 형태</h3><p class="section-hint">좁은 Notion 칼럼에는 작은 카드형, 넓은 영역에는 긴 카드형을 추천해요.</p></div></div><div class="option-grid">${optionButton('small','작은 카드형','2열 카드')}${optionButton('long','긴 카드형','가로 카드')}${optionButton('list','리스트형','한 줄 목록')}</div></section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">디데이 표시 방식</h3></div></div><div class="format-grid">${formatButton('compact','D-31',true)}${formatButton('remaining','31일 남음')}${formatButton('until','목표까지 31일')}${formatButton('number','31일')}</div></section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">표시할 정보</h3><p class="section-hint">디데이는 항상 표시되며, 기본값은 목표명만 켜져 있습니다.</p></div></div><div class="toggle-grid">
            ${[['title','목표명'],['type','목표유형'],['status','상태'],['date','목표 날짜'],['subject','관련 과목']].map(([key,label]) => `<label class="check-option"><input type="checkbox" data-field="${key}" ${state.settings.fields[key] ? 'checked' : ''}>${label}</label>`).join('')}
          </div></section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">정렬 순서</h3><p class="section-hint">가까운 목표순은 오늘과 다가오는 목표를 먼저, 지난 목표와 완료 목표를 뒤에 둡니다.</p></div></div><select class="select-input" data-setting-select="sort" aria-label="정렬 순서"><option value="urgency" ${state.settings.sort === 'urgency' ? 'selected' : ''}>가까운 목표순 (추천)</option><option value="dateAsc" ${state.settings.sort === 'dateAsc' ? 'selected' : ''}>목표 날짜 빠른순</option><option value="dateDesc" ${state.settings.sort === 'dateDesc' ? 'selected' : ''}>목표 날짜 늦은순</option><option value="manual" ${state.settings.sort === 'manual' ? 'selected' : ''}>직접 정렬</option></select>${manualOrderHtml()}</section>
          <section class="settings-section"><div class="section-title-row"><div><h3 class="section-title">표시할 목표</h3><p class="section-hint">여러 개를 선택할 수 있어요.</p></div><span class="recommended">${selectedCount}개 선택</span></div>${goalSelectionHtml()}</section>
        </div>
        <footer class="settings-footer"><button class="secondary-button" data-action="refresh">데이터 새로고침</button><button class="primary-button" data-action="close-settings">설정 완료</button></footer>
      </section>
    </div>`;
  }

  function render() {
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.classList.toggle('dark', state.settings.dark);
    root.innerHTML = mainHtml() + settingsHtml() + (state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : '');
    bindEvents();
  }

  function bindEvents() {
    root.querySelectorAll('[data-action]').forEach(element => element.addEventListener('click', event => {
      const action = element.dataset.action;
      if (action === 'backdrop-close' && event.target !== element) return;
      if (action === 'open-settings') { state.settingsOpen = true; render(); }
      if (action === 'close-settings' || action === 'backdrop-close') { if (state.config.saved || state.goals.length) { state.settingsOpen = false; render(); } }
      if (action === 'refresh') loadGoals(true);
      if (action === 'toggle-dark') patchSettings({ dark: !state.settings.dark });
      if (action === 'select-all') patchSettings({ selectedIds: state.goals.map(goal => goal.id), manualOrder: state.goals.map(goal => goal.id) });
      if (action === 'clear-selection') patchSettings({ selectedIds: [], manualOrder: [] });
    }));
    root.querySelectorAll('[data-setting]').forEach(button => button.addEventListener('click', () => patchSettings({ [button.dataset.setting]: button.dataset.value })));
    root.querySelectorAll('[data-setting-select]').forEach(select => select.addEventListener('change', () => patchSettings({ [select.dataset.settingSelect]: select.value })));
    root.querySelectorAll('[data-field]').forEach(input => input.addEventListener('change', () => patchSettings({ fields: { ...state.settings.fields, [input.dataset.field]: input.checked } })));
    root.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => patchSettings({ theme: button.dataset.themeChoice })));
    root.querySelectorAll('[data-style-choice]').forEach(button => button.addEventListener('click', () => patchSettings({ style: button.dataset.styleChoice })));
    root.querySelectorAll('[data-goal-id][type="checkbox"]').forEach(input => input.addEventListener('change', () => {
      const selected = new Set(state.settings.selectedIds || []);
      if (input.checked) selected.add(input.dataset.goalId); else selected.delete(input.dataset.goalId);
      const selectedIds = [...selected];
      const manualOrder = [...state.settings.manualOrder.filter(id => selected.has(id)), ...selectedIds.filter(id => !state.settings.manualOrder.includes(id))];
      patchSettings({ selectedIds, manualOrder });
    }));
    root.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => {
      const ordered = sortGoals(state.goals.filter(goal => (state.settings.selectedIds || []).includes(goal.id)), 'manual').map(goal => goal.id);
      const index = ordered.indexOf(button.dataset.goalId);
      const nextIndex = button.dataset.move === 'up' ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
      [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
      patchSettings({ manualOrder: ordered });
    }));
    const search = root.querySelector('#goal-search');
    search?.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      root.querySelectorAll('.goal-select-row').forEach(row => { row.hidden = Boolean(query && !row.dataset.search.includes(query)); });
    });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && state.settingsOpen && (state.config.saved || state.goals.length)) { state.settingsOpen = false; render(); }
    }, { once: true });
  }

  function toast(message) {
    state.toast = message;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { state.toast = ''; render(); }, 2200);
  }

  state.settingsOpen = !state.config.saved;
  saveSettings();
  render();
  if (state.config.saved) loadGoals();
})();
