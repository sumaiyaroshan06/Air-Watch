
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

import {
  Wind,
  Activity,
  MapPin,
  AlertTriangle,
  Droplets,
  Gauge,
  BrainCircuit,
  Database,
  Leaf,
  RefreshCw,
  CalendarDays,
  ArrowUpRight,
  CheckCircle2,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const API_URL = "http://127.0.0.1:5000";

const initialMeasurements = {
  pm10: "15.5",
  pm2_5: "10.8",
  carbon_monoxide: "240",
  nitrogen_dioxide: "13",
  sulphur_dioxide: "6",
  ozone: "53",
  aerosol_optical_depth: "0.22",
  dust: "0",
  uv_index: "1",
};

const measurementFields = [
  ["pm2_5", "PM2.5", "µg/m³"],
  ["pm10", "PM10", "µg/m³"],
  ["carbon_monoxide", "Carbon monoxide", "µg/m³"],
  ["nitrogen_dioxide", "Nitrogen dioxide", "µg/m³"],
  ["sulphur_dioxide", "Sulphur dioxide", "µg/m³"],
  ["ozone", "Ozone", "µg/m³"],
  ["aerosol_optical_depth", "Aerosol optical depth", "Index"],
  ["dust", "Dust", "µg/m³"],
  ["uv_index", "UV index", "Index"],
];

function StatCard({ title, value, unit, icon: Icon, tone, note }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{title}</span>
        <span className={`stat-icon ${tone}`}>
          <Icon size={19} strokeWidth={2} />
        </span>
      </div>

      <div className="stat-number">
        {value} <span>{unit}</span>
      </div>

      <p className="stat-note">{note}</p>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}

function getAQIColor(value) {
  if (value == null || !Number.isFinite(value)) return "#e8ece9";
  if (value <= 50) return "#22a06b";
  if (value <= 100) return "#e6c847";
  if (value <= 150) return "#ed963d";
  if (value <= 200) return "#df5555";
  if (value <= 300) return "#9563b8";
  return "#713047";
}

function AQICalendarHeatmap({ records, loading }) {
  const years = useMemo(() => {
    const dailyAQI = new Map();

    records.forEach((record) => {
      if (!record.date || record.us_aqi == null) return;

      const value = Number(record.us_aqi);
      if (!Number.isFinite(value)) return;

      const date = String(record.date).slice(0, 10);
      dailyAQI.set(date, value);
    });

    const yearList = [
      ...new Set(
        records
          .filter((record) => record.date)
          .map((record) => Number(String(record.date).slice(0, 4)))
          .filter(Number.isFinite)
      ),
    ].sort((a, b) => b - a);

    return yearList.map((year) => {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      const offset = start.getUTCDay();
      const totalDays = (end - start) / 86400000;
      const totalCells = Math.ceil((offset + totalDays) / 7) * 7;

      const cells = Array.from({ length: totalCells }, (_, index) => {
        const dayOffset = index - offset;

        if (dayOffset < 0 || dayOffset >= totalDays) {
          return null;
        }

        const date = new Date(
          Date.UTC(year, 0, 1 + dayOffset)
        ).toISOString().slice(0, 10);

        return {
          date,
          value: dailyAQI.get(date) ?? null,
          weekday: new Date(date + "T00:00:00Z").getUTCDay(),
        };
      });

      const months = Array.from({ length: 12 }, (_, month) => ({
        name: new Date(Date.UTC(year, month, 1))
          .toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        week: Math.floor(
          (offset + new Date(Date.UTC(year, month, 1)).getUTCDate() - 1 +
            Array.from({ length: month }, (_, i) =>
              new Date(Date.UTC(year, i + 1, 0)).getUTCDate()
            ).reduce((sum, days) => sum + days, 0)) / 7
        ),
      }));

      return {
        year,
        cells,
        months,
        weeks: totalCells / 7,
      };
    });
  }, [records]);

  if (loading) {
    return <EmptyState>Loading AQI heatmap…</EmptyState>;
  }

  if (!years.length) {
    return <EmptyState>No historical AQI data available.</EmptyState>;
  }

  return (
    <div className="aqi-heatmap-list">
      {years.map(({ year, cells, months, weeks }) => (
        <div className="aqi-year-block" key={year}>
          <div className="aqi-year-heading">{year}</div>

          <div className="aqi-heatmap-scroll">
            <div className="aqi-calendar">
              <div className="aqi-month-labels"
                style={{ gridTemplateColumns: `repeat(${weeks}, 13px)` }}>
                {months.map((month) => (
                  <span
                    key={month.name}
                    style={{ gridColumnStart: month.week + 1 }}
                  >
                    {month.name}
                  </span>
                ))}
              </div>

              <div className="aqi-calendar-body">
                <div className="aqi-weekday-labels">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div
                  className="aqi-day-grid"
                  style={{ gridTemplateColumns: `repeat(${weeks}, 10px)` }}
                >
                  {cells.map((cell, index) => (
                    <div
                      key={cell ? cell.date : `blank-${index}`}
                      className="aqi-day-cell"
                      style={{
                        gridColumn: Math.floor(index / 7) + 1,
                        gridRow: (index % 7) + 1,
                        background: cell
                          ? getAQIColor(cell.value)
                          : "transparent",
                      }}
                      title={
                        cell
                          ? `${cell.date} · AQI: ${
                              cell.value == null
                                ? "No reading"
                                : cell.value.toFixed(1)
                            }`
                          : ""
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="aqi-heatmap-legend">
        <span>Lower AQI</span>
        {[0, 51, 101, 151, 201, 301].map((value) => (
          <span
            key={value}
            className="aqi-legend-cell"
            style={{ background: getAQIColor(value) }}
            title={`AQI ${value}`}
          />
        ))}
        <span>Higher AQI</span>
        <span className="aqi-missing-key">
          <i /> No reading
        </span>
      </div>
    </div>
  );
}

function App() {
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [historicalRecords, setHistoricalRecords] = useState([]);
  const [historicalLoading, setHistoricalLoading] = useState(true);
  const [historicalError, setHistoricalError] = useState("");

  const [hotspotData, setHotspotData] = useState(null);
  const [hotspotLoading, setHotspotLoading] = useState(true);
  const [hotspotError, setHotspotError] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHistoricalData() {
      try {
        const response = await fetch(`${API_URL}/historical`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load historical data.");
        }

        if (!Array.isArray(result.records)) {
          throw new Error("The historical API returned invalid data.");
        }

        if (!cancelled) {
          setHistoricalRecords(result.records);
          setHistoricalError("");
        }
      } catch (err) {
        if (!cancelled) {
          setHistoricalError(
            err.message || "Could not connect to the Flask API."
          );
        }
      } finally {
        if (!cancelled) setHistoricalLoading(false);
      }
    }

    async function loadHotspotData() {
      try {
        const response = await fetch(`${API_URL}/hotspots`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load pollution analysis.");
        }

        if (!Array.isArray(result.high_pollution_days)) {
          throw new Error("The analysis API returned invalid data.");
        }

        if (!cancelled) {
          setHotspotData(result);
          setHotspotError("");
        }
      } catch (err) {
        if (!cancelled) {
          setHotspotError(
            err.message || "Could not load high-pollution analysis."
          );
        }
      } finally {
        if (!cancelled) setHotspotLoading(false);
      }
    }

    loadHistoricalData();
    loadHotspotData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMeasurementChange = (event) => {
    const { name, value } = event.target;

    setMeasurements((previous) => ({ ...previous, [name]: value }));
    setPrediction(null);
    setError("");
  };

  const handlePredict = async (event) => {
    event.preventDefault();
    setLoading(true);
    setPrediction(null);
    setError("");

    try {
      const values = {};

      for (const [key, value] of Object.entries(measurements)) {
        if (
          value.trim() === "" ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
        ) {
          throw new Error(
            `Enter a valid non-negative value for ${key.replaceAll("_", " ")}.`
          );
        }

        values[key] = Number(value);
      }

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Prediction request failed.");
      }

      setPrediction(result);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to Flask. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const getLatestValue = (field) => {
    for (let i = historicalRecords.length - 1; i >= 0; i -= 1) {
      const value = historicalRecords[i][field];

      if (value !== null && value !== undefined && Number.isFinite(Number(value))) {
        return Number(value).toLocaleString("en-IN", {
          maximumFractionDigits: 1,
        });
      }
    }

    return "—";
  };

  const latestDate = useMemo(() => {
    for (let i = historicalRecords.length - 1; i >= 0; i -= 1) {
      if (historicalRecords[i].date) return historicalRecords[i].date;
    }
    return null;
  }, [historicalRecords]);

  const chartData = useMemo(
    () =>
      historicalRecords
        .filter(
          (record) =>
            record.pm2_5 != null ||
            record.pm10 != null ||
            record.us_aqi != null
        )
        .slice(-60)
        .map((record) => ({
          time: record.date,
          pm25: record.pm2_5 == null ? null : Number(record.pm2_5),
          pm10: record.pm10 == null ? null : Number(record.pm10),
          us_aqi: record.us_aqi == null ? null : Number(record.us_aqi),
        })),
    [historicalRecords]
  );

  const highestAqiDates = useMemo(
    () =>
      historicalRecords
        .filter(
          (record) =>
            record.us_aqi != null &&
            Number.isFinite(Number(record.us_aqi))
        )
        .slice()
        .sort((a, b) => Number(b.us_aqi) - Number(a.us_aqi))
        .slice(0, 5),
    [historicalRecords]
  );

  const highPollutionDays =
    hotspotData?.high_pollution_days?.slice(0, 10) || [];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#dashboard" onClick={closeMobileMenu}>
          <span className="brand-mark">
            <Wind size={25} strokeWidth={2.2} />
          </span>
          <span className="brand-copy">
            <strong>airwatch<span>.</span></strong>
            <small>ENVIRONMENTAL INTELLIGENCE</small>
          </span>
          <button
            className="mobile-close"
            aria-label="Close menu"
            onClick={(event) => {
              event.preventDefault();
              closeMobileMenu();
            }}
          >
            <X size={19} />
          </button>
        </a>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="side-nav">
          <a className="nav-link active" href="#dashboard" onClick={closeMobileMenu}>
            <Activity size={18} />
            <span>Overview</span>
            <ChevronRight className="nav-chevron" size={15} />
          </a>
          <a className="nav-link" href="#trends" onClick={closeMobileMenu}>
            <Wind size={18} />
            <span>Air quality trends</span>
          </a>
          <a className="nav-link" href="#prediction" onClick={closeMobileMenu}>
            <BrainCircuit size={18} />
            <span>AI prediction</span>
          </a>
          <a className="nav-link" href="#hotspots" onClick={closeMobileMenu}>
            <MapPin size={18} />
            <span>Hotspot analysis</span>
          </a>
          <a className="nav-link" href="#records" onClick={closeMobileMenu}>
            <Database size={18} />
            <span>Historical records</span>
          </a>
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-project-card">
          <span className="project-card-icon"><Leaf size={19} /></span>
          <strong>Cleaner air starts with insight.</strong>
          <p>Explore historical pollution patterns across Hyderabad.</p>
        </div>

        <div className="sidebar-footer">
          <span className={`connection-dot ${historicalError ? "offline" : ""}`} />
          <div>
            <strong>{historicalError ? "API needs attention" : "Historical analysis"}</strong>
            <small>
              {historicalError ? "Check the Flask server" : "Hyderabad · City-level data"}
            </small>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div>
              <div className="breadcrumb">Workspace <span>/</span> Overview</div>
              <h1>Air quality overview</h1>
              <p className="topbar-subtitle">
                Understand the air we breathe, one data point at a time.
              </p>
            </div>
          </div>

          <div className="topbar-meta">
            <div className="location-pill">
              <span className="location-icon"><MapPin size={16} /></span>
              <span><strong>Hyderabad</strong><small>Telangana, India</small></span>
            </div>
            <button
              className="icon-button"
              title="Reload dashboard"
              aria-label="Reload dashboard"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        <section className="hero-panel">
          <div className="hero-content">
            <span className="hero-kicker"><span className="hero-kicker-dot" /> AIR QUALITY INTELLIGENCE</span>
            <h2>See the patterns.<br /><span>Understand the air.</span></h2>
            <p>
              Explore historical pollution levels, identify high-AQI dates,
              and use machine learning to estimate air-quality categories.
            </p>
            <a href="#trends" className="hero-button">
              Explore air quality <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-globe">
              <div className="globe-land land-one" />
              <div className="globe-land land-two" />
              <div className="globe-land land-three" />
              <div className="globe-shine" />
            </div>
            <div className="floating-data data-one"><Wind size={17} /><span>Particulate matter</span></div>
            <div className="floating-data data-two"><Activity size={17} /><span>Historical AQI</span></div>
            <div className="hero-spark spark-one" />
            <div className="hero-spark spark-two" />
          </div>
          <div className="hero-footer">
            <span><Database size={14} /> Historical dataset</span>
            <span><CalendarDays size={14} /> Latest record: {latestDate || "Loading..."}</span>
            <span><MapPin size={14} /> City-level coverage</span>
          </div>
        </section>

  

        {historicalError && (
          <div className="error-banner" role="alert">
            <AlertTriangle size={18} />
            <span>Historical data could not be loaded: {historicalError}</span>
          </div>
        )}

        <section className="section-block">
          <SectionHeading
            eyebrow="AT A GLANCE"
            title="Latest available readings"
            description="Most recent valid values found in your historical dataset."
            action={<span className="data-source-tag"><span /> HISTORICAL DATA</span>}
          />

          <div className="stats-grid">
            <StatCard
              title="Fine particles"
              value={historicalLoading ? "…" : getLatestValue("pm2_5")}
              unit="µg/m³"
              icon={Wind}
              tone="mint"
              note="PM2.5 · Can penetrate deep into the lungs"
            />
            <StatCard
              title="Coarse particles"
              value={historicalLoading ? "…" : getLatestValue("pm10")}
              unit="µg/m³"
              icon={Activity}
              tone="violet"
              note="PM10 · Inhalable particulate matter"
            />
            <StatCard
              title="Hyderabad AQI"
              value={historicalLoading ? "…" : getLatestValue("us_aqi")}
              unit="AQI"
              icon={Gauge}
              tone="orange"
              note="Higher values indicate poorer air quality"
            />
            <StatCard
              title="European AQI"
              value={historicalLoading ? "…" : getLatestValue("european_aqi")}
              unit="AQI"
              icon={Droplets}
              tone="blue"
              note="European index from the same dataset"
            />
          </div>
        </section>

        <section className="section-block" id="trends">
          <SectionHeading
            eyebrow="DATA EXPLORER"
            title="Pollution over time"
            description="Compare particulate levels and examine changes in historical US AQI."
          />

          <div className="charts-grid">
            <article className="panel chart-panel chart-panel-wide">
              <div className="panel-topline">
                <div>
                  <h3>Particulate matter trends</h3>
                  <p>PM2.5 versus PM10 · Last 60 available dates</p>
                </div>
                <span className="chart-unit">µg/m³</span>
              </div>
              <div className="chart chart-large">
                {chartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 12, right: 12, left: -15, bottom: 0 }}>
                      <CartesianGrid stroke="#edf1ed" strokeDasharray="4 5" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: "#87938b", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={35} />
                      <YAxis tick={{ fill: "#87938b", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e6ece7", boxShadow: "0 8px 24px #193b2914" }} />
                      <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#159b78" strokeWidth={2.8} dot={false} activeDot={{ r: 5 }} connectNulls />
                      <Line type="monotone" dataKey="pm10" name="PM10" stroke="#7776db" strokeWidth={2.8} dot={false} activeDot={{ r: 5 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyState>{historicalLoading ? "Loading historical readings…" : "No particulate readings available."}</EmptyState>}
              </div>
              <div className="chart-legend">
                <span><i className="legend-dot mint-dot" /> PM2.5</span>
                <span><i className="legend-dot violet-dot" /> PM10</span>
              </div>
            </article>

            <article className="panel chart-panel">
              <div className="panel-topline">
                <div>
                  <h3>Hyderabad AQI History</h3>
                  <p>Historical air-quality index for Hyderabad</p>
                </div>
                <span className="chart-unit">AQI</span>
              </div>
              <div className="chart chart-large">
                {chartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.015} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#edf1ed" strokeDasharray="4 5" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: "#87938b", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={35} />
                      <YAxis tick={{ fill: "#87938b", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e6ece7" }} />
                      <Area type="monotone" dataKey="us_aqi" name="US AQI" stroke="#e9a23b" strokeWidth={2.5} fill="url(#aqiFill)" connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyState>{historicalLoading ? "Loading AQI history…" : "No AQI readings available."}</EmptyState>}
              </div>
              <p className="chart-footnote">Peaks indicate dates with higher recorded AQI, not specific geographic hotspots.</p>
            </article>
          </div>
        </section>
        
<section className="section-block" id="aqi-heatmap">
  <SectionHeading
    eyebrow="CALENDAR VIEW"
    title="Hyderabad AQI Heatmap"
    description="Explore daily historical AQI values by color. Hover over a day to view its date and reading."
    action={
      <span className="data-source-tag">
        <span /> HISTORICAL DATA
      </span>
    }
  />

  <div className="panel aqi-heatmap-panel">
    <div className="panel-topline">
      <div>
        <h3>Daily pollution calendar</h3>
        <p>Each square represents one calendar date.</p>
      </div>
      <span className="chart-unit">AQI</span>
    </div>

    <AQICalendarHeatmap
      records={historicalRecords}
      loading={historicalLoading}
    />
  </div>
</section>

        <section className="section-block" id="prediction">
          <SectionHeading
            eyebrow="MACHINE LEARNING"
            title="Air quality prediction"
            description="Submit pollutant measurements to your trained Random Forest model."
            action={<span className="model-tag"><BrainCircuit size={15} /> RANDOM FOREST</span>}
          />

          <div className="prediction-layout">
            <div className="panel prediction-form-panel">
              <div className="form-intro">
                <div className="form-icon"><BrainCircuit size={21} /></div>
                <div>
                  <h3>Input measurements</h3>
                  <p>Enter non-negative values for each model feature.</p>
                </div>
              </div>

              <form onSubmit={handlePredict}>
                <div className="prediction-form">
                  {measurementFields.map(([key, label, unit]) => (
                    <label className="prediction-field" key={key}>
                      <span>{label}<small>{unit}</small></span>
                      <input
                        type="number"
                        name={key}
                        min="0"
                        step="any"
                        value={measurements[key]}
                        onChange={handleMeasurementChange}
                        required
                      />
                    </label>
                  ))}
                </div>

                <button className="predict-button" type="submit" disabled={loading}>
                  {loading ? <><RefreshCw className="spin-icon" size={17} /> Analysing measurements…</> : <><BrainCircuit size={18} /> Predict air quality <ArrowUpRight size={17} /></>}
                </button>
              </form>

              {error && <div className="prediction-error" role="alert"><AlertTriangle size={17} />{error}</div>}
            </div>

            <aside className={`panel prediction-result-panel ${prediction ? "has-result" : ""}`}>
              {prediction ? (
                <>
                  <div className="result-status"><CheckCircle2 size={17} /> PREDICTION COMPLETE</div>
                  <div className="result-art"><Gauge size={39} /></div>
                  <p className="result-overline">Predicted AQI category</p>
                  <h3 className="result-category">{prediction.predicted_category || "Result available"}</h3>
                  <p className="result-description">
                    The model generated this category from the pollutant values you entered.
                  </p>
                  {prediction.note && <div className="result-note">{prediction.note}</div>}
                  <button className="secondary-button" onClick={() => { setPrediction(null); setError(""); }}>
                    Try another prediction
                  </button>
                </>
              ) : (
                <>
                  <div className="result-status muted-status"><Activity size={17} /> MODEL WORKSPACE</div>
                  <div className="result-art"><Wind size={42} /></div>
                  <h3>Your prediction<br />will appear here.</h3>
                  <p className="result-description">
                    Fill in the measurements and run the model to view its predicted air-quality category.
                  </p>
                  <div className="result-checklist">
                    <span><CheckCircle2 size={16} /> Nine input features</span>
                    <span><CheckCircle2 size={16} /> Flask API integration</span>
                    <span><CheckCircle2 size={16} /> Random Forest model</span>
                  </div>
                </>
              )}
            </aside>
          </div>
        </section>

        <section className="section-block" id="hotspots">
          <SectionHeading
            eyebrow="POLLUTION ANALYSIS"
            title="High-pollution dates"
            description="Find historical dates when city-level AQI reached unusually high values."
            action={<span className="analysis-tag"><AlertTriangle size={15} /> 90TH PERCENTILE</span>}
          />

          {hotspotLoading && <div className="panel loading-panel">Analysing historical pollution data…</div>}
          {hotspotError && <div className="error-banner" role="alert"><AlertTriangle size={18} />{hotspotError}</div>}

          {hotspotData && (
            <>
              <div className="stats-grid hotspot-stats">
                <StatCard title="High-AQI threshold" value={Number(hotspotData.aqi_threshold).toFixed(1)} unit="AQI" icon={Gauge} tone="orange" note="90th percentile of valid AQI readings" />
                <StatCard title="Flagged dates" value={hotspotData.high_pollution_days.length} unit="dates" icon={CalendarDays} tone="mint" note="Dates at or above the threshold" />
                <StatCard title="Records analysed" value={hotspotData.records_analyzed} unit="records" icon={Database} tone="violet" note="Valid city-level AQI records" />
                <StatCard title="Study area" value={hotspotData.city || "Hyderabad"} unit="" icon={MapPin} tone="blue" note="Historical city-level dataset" />
              </div>

             

              <div className="panel table-panel">
                <div className="panel-topline">
                  <div>
                    <h3>Dates exceeding the threshold</h3>
                    <p>First 10 records returned by the analysis API</p>
                  </div>
                  <span className="table-count">{highPollutionDays.length} shown</span>
                </div>

                {highPollutionDays.length === 0 ? (
                  <EmptyState>No high-pollution dates were returned by the API.</EmptyState>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Date</th><th>Hyderabad AQI</th><th>PM2.5</th><th>PM10</th><th>Classification</th></tr></thead>
                      <tbody>
                        {highPollutionDays.map((record, index) => (
                          <tr key={`${record.date}-${index}`}>
                            <td><span className="date-cell"><CalendarDays size={15} />{record.date}</span></td>
                            <td><strong>{record.us_aqi == null ? "—" : Number(record.us_aqi).toFixed(1)}</strong></td>
                            <td>{record.pm2_5 == null ? "—" : Number(record.pm2_5).toFixed(1)} <small>µg/m³</small></td>
                            <td>{record.pm10 == null ? "—" : Number(record.pm10).toFixed(1)} <small>µg/m³</small></td>
                            <td><span className="high-aqi-badge"><span /> High AQI</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="section-block" id="records">
          <SectionHeading
            eyebrow="HISTORICAL RECORDS"
            title="Highest recorded AQI"
            description="The five largest valid US AQI readings found in the loaded records."
          />

          <div className="panel table-panel">
            {highestAqiDates.length === 0 ? (
              <EmptyState>{historicalLoading ? "Loading historical records…" : "No valid US AQI records were found."}</EmptyState>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Rank</th><th>Date</th><th>Hyderabad AQI</th><th>PM2.5</th></tr></thead>
                  <tbody>
                    {highestAqiDates.map((record, index) => (
                      <tr key={`${record.date}-${index}`}>
                        <td><span className={`rank-badge ${index === 0 ? "rank-first" : ""}`}>{String(index + 1).padStart(2, "0")}</span></td>
                        <td><span className="date-cell"><CalendarDays size={15} />{record.date}</span></td>
                        <td><strong className="aqi-value">{Number(record.us_aqi).toFixed(1)}</strong></td>
                        <td>{record.pm2_5 == null ? "—" : Number(record.pm2_5).toFixed(1)} <small>µg/m³</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <footer className="app-footer">
          <a className="footer-brand" href="#dashboard"><Wind size={17} /> airwatch<span>.</span></a>
          <p>Low-Cost Real-Time Air Pollution Monitoring and Hotspot Detection System</p>
          <span className="footer-note"><Database size={14} /> Historical data · Hyderabad, India</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
