import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import "./NetworkDashboard.css";

const SECTIONS = [
  { id: "overview", label: "Обзор", mark: "OV" },
  { id: "interfaces", label: "Интерфейсы", mark: "IF" },
  { id: "traffic", label: "Трафик", mark: "TR" },
  { id: "anomalies", label: "Аномалии", mark: "AN" },
  { id: "incidents", label: "Инциденты", mark: "IN" },
  { id: "settings", label: "Пороги", mark: "CF" },
];

const TYPE_LABELS = {
  interface_down: "Интерфейс недоступен",
  traffic_spike: "Скачок трафика",
  high_traffic: "Длительная нагрузка",
  packet_errors: "Ошибки пакетов",
  packet_drops: "Потери пакетов",
};

const RANGE_OPTIONS = [
  { label: "1 ч", hours: 1 },
  { label: "6 ч", hours: 6 },
  { label: "24 ч", hours: 24 },
  { label: "7 д", hours: 168 },
];

function formatRate(value) {
  const rate = Number(value) || 0;
  if (rate >= 1024 ** 2) return `${(rate / 1024 ** 2).toFixed(2)} MB/s`;
  if (rate >= 1024) return `${(rate / 1024).toFixed(1)} KB/s`;
  return `${rate.toFixed(0)} B/s`;
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", options).format(new Date(value));
}

function Metric({ label, value, note, tone }) {
  return (
    <article className={`ops-metric ${tone || ""}`}>
      <span className="ops-metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function TrafficChart({ points }) {
  if (points.length < 2) {
    return <div className="ops-chart-empty">Собираются измерения. Для графика нужны как минимум две точки истории.</div>;
  }

  const maximum = Math.max(1, ...points.flatMap((point) => [point.rx, point.tx]));
  const pointList = (key) => points.map((point, index) => {
    const x = (index / (points.length - 1)) * 1000;
    const y = 206 - (point[key] / maximum) * 176;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="ops-chart-wrap">
      <svg className="ops-chart" viewBox="0 0 1000 230" preserveAspectRatio="none" role="img" aria-label="Скорости входящего и исходящего трафика">
        <path d="M0 206 H1000 M0 118 H1000 M0 30 H1000" className="ops-grid-line" />
        <polyline points={pointList("rx")} className="ops-line-rx" />
        <polyline points={pointList("tx")} className="ops-line-tx" />
      </svg>
      <div className="ops-chart-axis"><span>раньше</span><span>последние измерения</span><span>сейчас</span></div>
      <div className="ops-chart-legend"><span className="legend-rx">Входящий RX</span><span className="legend-tx">Исходящий TX</span></div>
    </div>
  );
}

function IncidentRow({ incident, onAcknowledge, compact = false }) {
  const typeLabel = TYPE_LABELS[incident.event_type] || incident.event_type;
  return (
    <details className={`ops-incident ${compact ? "compact" : ""}`}>
      <summary>
        <span className={`ops-severity ${incident.severity || "warning"}`} />
        <span className="ops-incident-name">{typeLabel}</span>
        <span className="ops-interface-tag">{incident.interface_name}</span>
        <span className={`ops-status-tag ${incident.status}`}>{incident.status === "open" ? "Открыт" : incident.status === "acknowledged" ? "Принят" : "Разрешён"}</span>
        <time>{formatDate(incident.opened_at, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
        <span className="ops-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="ops-incident-detail">
        <p>{incident.description}</p>
        <dl><div><dt>Возник</dt><dd>{formatDate(incident.opened_at)}</dd></div><div><dt>Последнее наблюдение</dt><dd>{formatDate(incident.last_seen_at)}</dd></div><div><dt>Разрешён</dt><dd>{formatDate(incident.resolved_at)}</dd></div></dl>
        {incident.details && Object.keys(incident.details).length > 0 ? <pre>{JSON.stringify(incident.details, null, 2)}</pre> : null}
        {incident.status === "open" ? <button type="button" className="ops-button subtle" onClick={() => onAcknowledge(incident.id)}>Принять в работу</button> : null}
      </div>
    </details>
  );
}

function InterfaceState({ item }) {
  const state = item.is_up ? "up" : item.is_admin_up === false ? "disabled" : "down";
  const label = item.is_up ? "Активен" : item.is_admin_up === false ? "Выключен" : item.carrier === false ? "Нет carrier" : item.operstate || "Недоступен";
  return <span className={`ops-interface-state ${state}`}><i />{label}</span>;
}

function SettingsField({ label, value, suffix, step = "any", onChange }) {
  return (
    <label className="ops-setting-field"><span>{label}</span><div><input type="number" min="0" step={step} value={value ?? ""} onChange={(event) => onChange(event.target.valueAsNumber)} required /><small>{suffix}</small></div></label>
  );
}

export default function NetworkDashboard() {
  const [view, setView] = useState("overview");
  const [interfaces, setInterfaces] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState({ activeCount: 0, byType: [] });
  const [settings, setSettings] = useState(null);
  const [selectedInterface, setSelectedInterface] = useState("all");
  const [rangeHours, setRangeHours] = useState(6);
  const [incidentFilter, setIncidentFilter] = useState("all");
  const [interfaceSearch, setInterfaceSearch] = useState("");
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let mounted = true;
    let requestRunning = false;
    let controller;

    async function refresh() {
      if (!mounted || requestRunning) return;
      requestRunning = true;
      controller = new AbortController();
      try {
        const options = { signal: controller.signal };
        const [interfaceData, metricData, anomalyData, incidentData, summaryData] = await Promise.all([
          apiFetch("/api/v1/network/interfaces", options),
          apiFetch("/api/v1/network/metrics/history?limit=1000", options),
          apiFetch("/api/v1/network/anomalies/current", options),
          apiFetch("/api/v1/network/incidents?limit=100", options),
          apiFetch("/api/v1/network/incidents/summary", options),
        ]);
        if (!mounted) return;
        setInterfaces(interfaceData.interfaces || []);
        setMetrics((metricData.history || []).reverse());
        setAnomalies(anomalyData.anomalies || []);
        setIncidents(incidentData.incidents || []);
        setSummary(summaryData.summary || { activeCount: 0, byType: [] });
        setLastUpdated(new Date());
        setError("");
      } catch (requestError) {
        if (mounted && requestError.name !== "AbortError") setError(requestError.message || "Не удалось загрузить локальную телеметрию");
      } finally {
        if (mounted) setLoadingData(false);
        requestRunning = false;
      }
    }

    refresh();
    const intervalId = window.setInterval(refresh, 10_000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      controller?.abort();
    };
  }, [refreshVersion]);

  useEffect(() => {
    if (view !== "settings") return undefined;
    const controller = new AbortController();
    apiFetch("/api/v1/network/settings", { signal: controller.signal })
      .then((result) => setSettings(result.settings || null))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message || "Не удалось загрузить пороги");
      });
    return () => controller.abort();
  }, [view, refreshVersion]);

  const visibleInterfaces = interfaces.filter((item) => !item.is_loopback);
  const activeInterfaces = visibleInterfaces.filter((item) => item.is_up);
  const latestByInterface = useMemo(() => {
    const latest = new Map();
    for (const metric of metrics) latest.set(metric.interface_name, metric);
    return latest;
  }, [metrics]);
  const rxTotal = activeInterfaces.reduce((sum, item) => sum + Number(latestByInterface.get(item.name)?.rx_bytes_per_sec || 0), 0);
  const txTotal = activeInterfaces.reduce((sum, item) => sum + Number(latestByInterface.get(item.name)?.tx_bytes_per_sec || 0), 0);
  const rangeStart = Date.now() - rangeHours * 60 * 60 * 1000;
  const rangeMetrics = metrics.filter((metric) => {
    const at = Date.parse(metric.collected_at);
    return Number.isFinite(at) && at >= rangeStart && (selectedInterface === "all" || metric.interface_name === selectedInterface);
  });
  const pointsByTime = new Map();
  for (const metric of rangeMetrics) {
    const point = pointsByTime.get(metric.collected_at) || { at: metric.collected_at, rx: 0, tx: 0 };
    point.rx += Number(metric.rx_bytes_per_sec) || 0;
    point.tx += Number(metric.tx_bytes_per_sec) || 0;
    pointsByTime.set(metric.collected_at, point);
  }
  const chartPoints = [...pointsByTime.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(-100);
  const filteredInterfaces = visibleInterfaces.filter((item) => `${item.name} ${item.ipv4_address || ""} ${item.ipv6_address || ""}`.toLowerCase().includes(interfaceSearch.toLowerCase()));
  const filteredIncidents = incidents.filter((incident) => incidentFilter === "all" || incident.status === incidentFilter);
  const currentSection = SECTIONS.find((section) => section.id === view) || SECTIONS[0];

  async function acknowledge(incidentId) {
    try {
      await apiFetch(`/api/v1/network/incidents/${incidentId}/acknowledge`, { method: "POST" });
      setRefreshVersion((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message || "Не удалось принять инцидент");
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSavingSettings(true);
    try {
      const result = await apiFetch("/api/v1/network/settings", { method: "PATCH", body: settings });
      setSettings(result.settings);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Не удалось сохранить пороги");
    } finally {
      setSavingSettings(false);
    }
  }

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function refreshNow() {
    setLoadingData(true);
    setRefreshVersion((value) => value + 1);
  }

  return (
    <main className="ops-app">
      <aside className="ops-sidebar">
        <div className="ops-brand"><span className="ops-brand-mark">HP</span><div><strong>HELPDESKPRIME</strong><small>NETWORK OPERATIONS</small></div></div>
        <div className="ops-node"><span className="node-glyph">⌘</span><div><small>ЛОКАЛЬНЫЙ УЗЕЛ</small><strong>Этот компьютер</strong></div><i className={error ? "offline" : "online"} /></div>
        <p className="ops-nav-label">МОНИТОРИНГ</p>
        <nav className="ops-nav" aria-label="Разделы мониторинга">
          {SECTIONS.map((section) => (
            <button type="button" key={section.id} className={view === section.id ? "active" : ""} onClick={() => setView(section.id)}>
              <span className="ops-nav-mark">{section.mark}</span><span>{section.label}</span>
              {section.id === "anomalies" && anomalies.length > 0 ? <b>{anomalies.length}</b> : null}
              {section.id === "incidents" && summary.activeCount > 0 ? <b>{summary.activeCount}</b> : null}
            </button>
          ))}
        </nav>
        <div className="ops-sidebar-spacer" />
        <div className="ops-sidebar-note"><span>ЛОКАЛЬНЫЙ СБОР</span><strong><i /> Linux interface telemetry</strong><small>Без внешней инфраструктуры</small></div>
        <div className="ops-user"><span className="ops-avatar">PC</span><div><strong>Локальный доступ</strong><small>Без учётной записи</small></div></div>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar">
          <div className="ops-breadcrumb"><span>HELPDESKPRIME</span><i>/</i><strong>{currentSection.label}</strong></div>
          <div className="ops-top-actions"><span className={`ops-connection ${error ? "lost" : ""}`}><i />{error ? "Нет связи с API" : "API подключён"}</span><span className="ops-last-update">Обновлено {lastUpdated ? formatDate(lastUpdated, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}</span><button type="button" className="ops-button refresh" onClick={refreshNow} disabled={loadingData} title="Обновить данные"><span className={loadingData ? "spin" : ""}>↻</span><span>Обновить</span></button></div>
        </header>

        <div className="ops-content">
          <div className="ops-page-heading"><div><p className="ops-eyebrow">СИСТЕМНЫЙ МОНИТОР / LOCAL</p><h1>{currentSection.label}</h1><p>{view === "overview" ? "Состояние сетевой подсистемы и недавняя активность." : view === "interfaces" ? "Состояние, адреса и счётчики Linux-интерфейсов." : view === "traffic" ? "История пропускной способности из сохранённых измерений." : view === "anomalies" ? "Условия, которые detector сейчас считает активными." : view === "incidents" ? "Жизненный цикл и история сетевых событий." : "Пороговые значения локального anomaly detector."}</p></div><span className="ops-polling"><i /> Опрос 10 сек</span></div>
          {error ? <div className="ops-error" role="alert"><strong>Не удалось обновить телеметрию</strong><span>{error}</span></div> : null}
          {loadingData && !interfaces.length ? <div className="ops-loading"><span className="loading-mark">HP</span><strong>Подключаем локальную телеметрию</strong><small>Ожидание ответа API и PostgreSQL</small></div> : null}

          {view === "overview" ? (
            <>
              <div className={`ops-health ${error ? "degraded" : activeInterfaces.length ? "healthy" : "unknown"}`}><span className="health-symbol">{error ? "!" : activeInterfaces.length ? "✓" : "–"}</span><div><strong>{error ? "Подключение ограничено" : activeInterfaces.length ? "Сетевая подсистема активна" : "Нет активных интерфейсов"}</strong><span>{activeInterfaces.length} активных из {visibleInterfaces.length} обнаруженных интерфейсов</span></div><span className="health-host">LOCAL HOST / LINUX</span></div>
              <div className="ops-metrics">
                <Metric label="ПРИЁМ / RX" value={formatRate(rxTotal)} note="Суммарная скорость активных интерфейсов" tone="rx" />
                <Metric label="ПЕРЕДАЧА / TX" value={formatRate(txTotal)} note="Суммарная скорость активных интерфейсов" tone="tx" />
                <Metric label="АКТИВНЫЕ АНОМАЛИИ" value={anomalies.length} note="Detector / текущие условия" tone="amber" />
                <Metric label="АКТИВНЫЕ ИНЦИДЕНТЫ" value={summary.activeCount} note="Открытые и принятые" tone="red" />
              </div>
              <div className="ops-overview-grid">
                <section className="ops-section traffic-overview"><div className="ops-section-heading"><div><span>ПРОПУСКНАЯ СПОСОБНОСТЬ</span><h2>Поток данных</h2></div><button type="button" onClick={() => setView("traffic")}>Открыть историю <span>→</span></button></div><div className="ops-current-rates"><div><small>RX СЕЙЧАС</small><strong>{formatRate(rxTotal)}</strong></div><div><small>TX СЕЙЧАС</small><strong>{formatRate(txTotal)}</strong></div></div><TrafficChart points={chartPoints.slice(-40)} /></section>
                <section className="ops-section overview-interfaces"><div className="ops-section-heading"><div><span>УСТРОЙСТВО</span><h2>Интерфейсы</h2></div><button type="button" onClick={() => setView("interfaces")}>Все <span>→</span></button></div>{visibleInterfaces.slice(0, 5).map((item) => <div className="ops-mini-interface" key={item.name}><div><strong>{item.name}</strong><span>{item.ipv4_address || item.ipv6_address || "Адрес недоступен"}</span></div><InterfaceState item={item} /></div>)}{!visibleInterfaces.length ? <p className="ops-empty">Интерфейсы появятся после первого сбора.</p> : null}</section>
              </div>
              <section className="ops-section overview-events"><div className="ops-section-heading"><div><span>ИНЦИДЕНТЫ</span><h2>Последние события</h2></div><button type="button" onClick={() => setView("incidents")}>Журнал событий <span>→</span></button></div>{incidents.slice(0, 5).map((incident) => <IncidentRow key={incident.id} incident={incident} onAcknowledge={acknowledge} compact />)}{!incidents.length ? <p className="ops-empty">Записей пока нет.</p> : null}</section>
            </>
          ) : null}

          {view === "interfaces" ? (
            <section className="ops-section full-section"><div className="ops-section-heading"><div><span>LINUX / SYSFS + PROCFS</span><h2>Сетевые интерфейсы <small>{visibleInterfaces.length}</small></h2></div><input className="ops-search" value={interfaceSearch} onChange={(event) => setInterfaceSearch(event.target.value)} placeholder="Поиск по имени или адресу" aria-label="Поиск интерфейсов" /></div><div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>ИНТЕРФЕЙС</th><th>СОСТОЯНИЕ</th><th>IPv4 / IPv6</th><th>MAC-АДРЕС</th><th>RX / TX</th><th>СКОРОСТЬ RX / TX</th><th>ОШИБКИ</th><th>DROPS</th></tr></thead><tbody>{filteredInterfaces.map((item) => { const metric = latestByInterface.get(item.name) || {}; return <tr key={item.name}><td><strong className="if-name">{item.name}</strong><small>{item.is_admin_up === false ? "административно выключен" : item.carrier === false ? "carrier отсутствует" : "локальный интерфейс"}</small></td><td><InterfaceState item={item} /></td><td>{item.ipv4_address || item.ipv6_address || "—"}</td><td className="mono">{item.mac_address || "—"}</td><td>{formatBytes(metric.rx_bytes)} <span className="table-separator">/</span> {formatBytes(metric.tx_bytes)}</td><td>{formatRate(metric.rx_bytes_per_sec)} <span className="table-separator">/</span> {formatRate(metric.tx_bytes_per_sec)}</td><td>{Number(metric.rx_errors || 0) + Number(metric.tx_errors || 0)}</td><td>{Number(metric.rx_dropped || 0) + Number(metric.tx_dropped || 0)}</td></tr>; })}</tbody></table></div>{!filteredInterfaces.length ? <p className="ops-empty">Совпадений нет.</p> : null}</section>
          ) : null}

          {view === "traffic" ? (
            <section className="ops-section full-section"><div className="ops-section-heading"><div><span>ИСТОРИЧЕСКИЕ ИЗМЕРЕНИЯ</span><h2>Входящий и исходящий поток</h2></div><div className="ops-chart-controls"><select value={selectedInterface} onChange={(event) => setSelectedInterface(event.target.value)} aria-label="Интерфейс"><option value="all">Все интерфейсы</option>{visibleInterfaces.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select><div className="ops-segmented" aria-label="Диапазон истории">{RANGE_OPTIONS.map((option) => <button key={option.hours} type="button" className={rangeHours === option.hours ? "selected" : ""} onClick={() => setRangeHours(option.hours)}>{option.label}</button>)}</div></div></div><TrafficChart points={chartPoints} /><div className="ops-chart-summary"><span>Точек в выбранном диапазоне <strong>{chartPoints.length}</strong></span><span>Последнее измерение <strong>{chartPoints.length ? formatDate(chartPoints.at(-1).at) : "—"}</strong></span><span>Выбранный период <strong>{RANGE_OPTIONS.find((option) => option.hours === rangeHours)?.label}</strong></span></div></section>
          ) : null}

          {view === "anomalies" ? (
            <section className="ops-section full-section"><div className="ops-section-heading"><div><span>DETECTOR / ACTIVE CONDITIONS</span><h2>Активные аномалии <small>{anomalies.length}</small></h2></div></div><div className="ops-rule-strip"><span>ПРАВИЛА</span>{Object.entries(TYPE_LABELS).map(([type, label]) => <span key={type}>{label}</span>)}</div>{anomalies.map((incident) => <IncidentRow key={incident.id} incident={incident} onAcknowledge={acknowledge} />)}{!anomalies.length ? <div className="ops-clear-state"><span>✓</span><strong>Активных условий нет</strong><small>Detector продолжает наблюдение по настроенным порогам.</small></div> : null}</section>
          ) : null}

          {view === "incidents" ? (
            <section className="ops-section full-section"><div className="ops-section-heading"><div><span>ЖУРНАЛ / LIFECYCLE</span><h2>История инцидентов <small>{filteredIncidents.length}</small></h2></div><select className="ops-filter" value={incidentFilter} onChange={(event) => setIncidentFilter(event.target.value)} aria-label="Фильтр по статусу"><option value="all">Все статусы</option><option value="open">Открытые</option><option value="acknowledged">Принятые</option><option value="resolved">Разрешённые</option></select></div><div className="ops-incident-summary"><span>АКТИВНЫЕ <strong>{summary.activeCount}</strong></span>{summary.byType.map((item) => <span key={item.event_type}>{TYPE_LABELS[item.event_type] || item.event_type} <strong>{item.count}</strong></span>)}</div>{filteredIncidents.map((incident) => <IncidentRow key={incident.id} incident={incident} onAcknowledge={acknowledge} />)}{!filteredIncidents.length ? <p className="ops-empty">Для выбранного фильтра событий нет.</p> : null}</section>
          ) : null}

          {view === "settings" ? (
            <section className="ops-section full-section settings-section"><div className="ops-section-heading"><div><span>DETECTION ENGINE</span><h2>Пороговые значения</h2></div><span className="settings-storage">ХРАНЕНИЕ / ЛОКАЛЬНАЯ POSTGRESQL</span></div>{settings ? <form className="ops-settings-form" onSubmit={saveSettings}><div className="settings-group"><div><strong>Трафик</strong><small>Кратковременные всплески и устойчивая нагрузка</small></div><SettingsField label="Порог скачка" value={settings.trafficSpikeBytesPerSec} suffix="bytes/sec" onChange={(value) => updateSetting("trafficSpikeBytesPerSec", value)} /><SettingsField label="Множитель к baseline" value={settings.trafficSpikeMultiplier} suffix="× среднего" step="0.1" onChange={(value) => updateSetting("trafficSpikeMultiplier", value)} /><SettingsField label="Длительная нагрузка" value={settings.highTrafficBytesPerSec} suffix="bytes/sec" onChange={(value) => updateSetting("highTrafficBytesPerSec", value)} /><SettingsField label="Длительность условия" value={settings.highTrafficDurationSamples} suffix="samples подряд" onChange={(value) => updateSetting("highTrafficDurationSamples", value)} /></div><div className="settings-group"><div><strong>Счётчики пакетов</strong><small>Минимальный прирост за интервал сбора</small></div><SettingsField label="Ошибки RX + TX" value={settings.packetErrorDelta} suffix="пакетов" onChange={(value) => updateSetting("packetErrorDelta", value)} /><SettingsField label="Drops RX + TX" value={settings.packetDropDelta} suffix="пакетов" onChange={(value) => updateSetting("packetDropDelta", value)} /></div><div className="settings-actions"><p>Изменения применятся к следующим циклам обнаружения.</p><button className="ops-button primary" type="submit" disabled={savingSettings}>{savingSettings ? "Сохраняем..." : "Сохранить параметры"}</button></div></form> : <div className="ops-loading compact-loading"><strong>Загрузка параметров...</strong></div>}</section>
          ) : null}

          <footer className="ops-footer"><span>HELPDESKPRIME NETWORK / ЛОКАЛЬНЫЙ РЕЖИМ</span><span>Срезы основаны на счётчиках интерфейсов; содержимое пакетов не анализируется.</span></footer>
        </div>
      </section>
    </main>
  );
}
