(() => {
  const script = document.currentScript;
  const app = script?.dataset?.app || "";
  const params = new URLSearchParams(window.location.search);
  const installId = (params.get("installId") || "").trim();
  const workerFromUrl = (params.get("workerUrl") || "").trim().replace(/\/+$/, "");
  const workerStorageKey = "study_install_worker_url";

  if (workerFromUrl) {
    try { localStorage.setItem(workerStorageKey, workerFromUrl); } catch {}
  }
  const workerUrl = workerFromUrl || (() => {
    try { return localStorage.getItem(workerStorageKey) || ""; } catch { return ""; }
  })();

  const manifestLink = document.getElementById("app-manifest");
  if (manifestLink && installId && workerUrl && app) {
    try {
      const manifestUrl = new URL(`${workerUrl}/v1/install-manifest/${encodeURIComponent(app)}`);
      manifestUrl.searchParams.set("installId", installId);
      manifestUrl.searchParams.set("appOrigin", window.location.origin);
      manifestLink.href = manifestUrl.href;
      manifestLink.crossOrigin = "anonymous";
    } catch (error) {
      console.error("설치 매니페스트 주소 생성 실패:", error);
    }
  }

  if (!installId) {
    window.STUDY_INSTALL_READY = Promise.resolve(null);
    return;
  }

  window.STUDY_INSTALL_READY = (async () => {
    if (!workerUrl) throw new Error("설정 Worker 주소가 없습니다. 설정 페이지에서 새 URL을 복사해 주세요.");
    const response = await fetch(`${workerUrl}/v1/install-config/${encodeURIComponent(installId)}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || `설치 설정 조회 실패 (${response.status})`);

    const config = { ...data, proxyUrl: data.proxyUrl || workerUrl, saved: true, fromInstall: true };
    delete config.createdAt;
    delete config.updatedAt;
    window.STUDY_INSTALL_CONFIG = config;

    const storageByApp = {
      dashboard: "cozy_dash_config",
      test: "cozy_test_config",
      timer: "cozy_timer_config",
      catClock: "nyan_clock_config",
      blankStudy: "cozy_blank_study_config",
      dday: "cozy_dday_config",
    };
    const storageKey = storageByApp[app];
    if (storageKey) {
      const appConfig = app === "blankStudy"
        ? { ...config, blankDbId: config.blankStudyDbId || config.blankDbId || "" }
        : config;
      localStorage.setItem(storageKey, JSON.stringify(appConfig));
    }
    return config;
  })().catch(error => {
    window.STUDY_INSTALL_ERROR = error;
    console.error("웹앱 설치 설정 불러오기 실패:", error);
    return null;
  });
})();
