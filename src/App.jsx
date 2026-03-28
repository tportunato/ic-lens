import { useState, useRef, useEffect } from "react";

// ─── Palette ─────────────────────────────────────────────────────────────────
const DEAL_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];
const ATTR_COLORS = {
  entryPrice:      "#64748b",
  revenueGrowth:   "#3b82f6",
  marginExpansion: "#8b5cf6",
  multipleExp:     "#f59e0b",
  leveragePaydown: "#10b981",
};

// ─── Sample Data ─────────────────────────────────────────────────────────────
const SAMPLE_DEALS = [
  {
    id: 1, name: "Alpine Consumer Brands", sector: "Consumer & Retail",
    geography: "Western Europe", currency: "EUR", vintage: "2024",
    ev: 420, ebitda: 52, revenue: 185, evEbitda: 8.1, evRevenue: 2.27, sectorMedianEvEbitda: 9.5,
    irr: 22.4, moic: 2.8, payback: 4.5, holdingPeriod: 5,
    attr_entryPrice: 0.18, attr_revenueGrowth: 0.62, attr_marginExpansion: 0.31,
    attr_multipleExpansion: 0.28, attr_leveragePaydown: 0.41,
    netDebt: 210, netDebtEbitda: 4.0, interestCoverage: 3.8,
    debtType: "Senior + PIK", covenantProximity: 18, refinancingRisk: "Medium",
    entryCagr: 0, exitCagr: 8.5, ebitdaMarginEntry: 28.1, ebitdaMarginExit: 33.5,
    organicGrowthSplit: 75, assumptionScore: 6.2,
    exitMultiple: 10.5, exitRoute: "Trade Sale", exitEbitda: 89, impliedExitEv: 934,
    exitMultipleSensPlus: 11.5, exitMultipleSensMinus: 9.5,
    mgmtTrackRecord: 8, mgmtSkinInGame: 7, sponsorQuality: 9, alignment: 8,
    notes: "Classic earnings growth story. Volume + pricing driving top-line; margin lever from procurement savings and warehouse consolidation. Trade buyer pool deep.",
    fragility: "Revenue CAGR",
  },
  {
    id: 2, name: "Horizon MedTech", sector: "Healthcare & Life Sciences",
    geography: "DACH", currency: "EUR", vintage: "2024",
    ev: 680, ebitda: 58, revenue: 210, evEbitda: 11.7, evRevenue: 3.24, sectorMedianEvEbitda: 14.0,
    irr: 26.1, moic: 3.1, payback: 3.8, holdingPeriod: 4,
    attr_entryPrice: 0.41, attr_revenueGrowth: 0.24, attr_marginExpansion: 0.08,
    attr_multipleExpansion: 0.98, attr_leveragePaydown: 0.39,
    netDebt: 290, netDebtEbitda: 5.0, interestCoverage: 3.1,
    debtType: "Senior Secured", covenantProximity: 12, refinancingRisk: "Low",
    entryCagr: 0, exitCagr: 11.0, ebitdaMarginEntry: 27.6, ebitdaMarginExit: 29.0,
    organicGrowthSplit: 60, assumptionScore: 7.8,
    exitMultiple: 18.0, exitRoute: "IPO", exitEbitda: 88, impliedExitEv: 1584,
    exitMultipleSensPlus: 19.0, exitMultipleSensMinus: 17.0,
    mgmtTrackRecord: 9, mgmtSkinInGame: 6, sponsorQuality: 9, alignment: 7,
    notes: "Multiple expansion thesis. Entry at discount to peers; rerating anticipated post-FDA clearance on next-gen device. IPO pathway subject to market conditions.",
    fragility: "Exit Multiple",
  },
  {
    id: 3, name: "Veridian Industrials", sector: "Industrials & Manufacturing",
    geography: "Southern Europe", currency: "EUR", vintage: "2023",
    ev: 195, ebitda: 14, revenue: 98, evEbitda: 13.9, evRevenue: 1.99, sectorMedianEvEbitda: 8.5,
    irr: 31.5, moic: 3.8, payback: 3.2, holdingPeriod: 4,
    attr_entryPrice: 0.12, attr_revenueGrowth: 0.45, attr_marginExpansion: 1.42,
    attr_multipleExpansion: 0.71, attr_leveragePaydown: 0.28,
    netDebt: 98, netDebtEbitda: 7.0, interestCoverage: 1.9,
    debtType: "Unitranche", covenantProximity: 5, refinancingRisk: "High",
    entryCagr: 0, exitCagr: 14.0, ebitdaMarginEntry: 14.3, ebitdaMarginExit: 24.0,
    organicGrowthSplit: 85, assumptionScore: 8.9,
    exitMultiple: 9.5, exitRoute: "Secondary Buyout", exitEbitda: 42, impliedExitEv: 399,
    exitMultipleSensPlus: 10.5, exitMultipleSensMinus: 8.5,
    mgmtTrackRecord: 6, mgmtSkinInGame: 9, sponsorQuality: 7, alignment: 9,
    notes: "Operational turnaround. Significant EBITDA margin expansion from lean manufacturing, pricing power recovery, overhead reduction. Execution risk is the key variable.",
    fragility: "EBITDA Margin",
  },
];

// ─── Constants ───────────────────────────────────────────────────────────────
const SECTORS = ["Technology & Software","Healthcare & Life Sciences","Consumer & Retail","Industrials & Manufacturing","Financial Services","Business Services","Energy & Infrastructure","Real Estate","Media & Telecommunications","Logistics & Supply Chain"];
const GEOGRAPHIES = ["Western Europe","DACH","Nordics","Southern Europe","CEE / Eastern Europe","UK & Ireland","North America","Asia-Pacific","Global"];
const EXIT_ROUTES = ["Trade Sale","IPO","Secondary Buyout","Recapitalisation"];
const DEBT_TYPES = ["Senior Secured","Senior + PIK","Unitranche","Mezzanine","High Yield","TLB + RCF"];
const REFINANCING_RISKS = ["Low","Medium","High"];
const CURRENCIES = ["EUR","GBP","USD","CHF"];

// ─── Utils ───────────────────────────────────────────────────────────────────
const fmt = (v, dec = 1) => (v != null && v !== "" ? Number(v).toFixed(dec) : "—");
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const calcScore = (deal) => {
  let s = 0, c = 0;
  if (deal.exitCagr) { s += clamp((deal.exitCagr / 15) * 10, 0, 10); c++; }
  if (deal.ebitdaMarginEntry && deal.ebitdaMarginExit) { s += clamp(((deal.ebitdaMarginExit - deal.ebitdaMarginEntry) / 10) * 10, 0, 10); c++; }
  if (deal.exitMultiple) { s += clamp((deal.exitMultiple / 16) * 10, 0, 10); c++; }
  return c > 0 ? (s / c).toFixed(1) : "—";
};
const scoreColor = (s) => { const n = Number(s); return n >= 8 ? "#ef4444" : n >= 6 ? "#f59e0b" : "#22c55e"; };
const riskColor = (r) => ({ Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444" }[r] || "#94a3b8");

// ─── Inline SVG Charts ────────────────────────────────────────────────────────

// Waterfall bar chart — stacked horizontal segments
function WaterfallBar({ deal, color, compact }) {
  const drivers = [
    { key: "attr_entryPrice",       label: "Entry",    c: ATTR_COLORS.entryPrice },
    { key: "attr_revenueGrowth",    label: "Rev Gth",  c: ATTR_COLORS.revenueGrowth },
    { key: "attr_marginExpansion",  label: "Margin",   c: ATTR_COLORS.marginExpansion },
    { key: "attr_multipleExpansion",label: "Multiple", c: ATTR_COLORS.multipleExp },
    { key: "attr_leveragePaydown",  label: "Leverage", c: ATTR_COLORS.leveragePaydown },
  ];
  const total = drivers.reduce((a, d) => a + (Number(deal[d.key]) || 0), 0);
  const h = compact ? 14 : 18;
  let cx = 0;

  return (
    <div>
      <svg width="100%" height={h} style={{ display: "block", borderRadius: "3px", overflow: "hidden" }}>
        {drivers.map((d) => {
          const val = Number(deal[d.key]) || 0;
          const w = total > 0 ? (val / total) * 100 : 0;
          const x = cx;
          cx += w;
          return (
            <rect key={d.key} x={`${x}%`} width={`${w}%`} height={h} fill={d.c}>
              <title>{d.label}: {fmt(val, 2)}×</title>
            </rect>
          );
        })}
      </svg>
      {!compact && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "5px" }}>
          {drivers.map((d) => (
            <div key={d.key} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <div style={{ width: "8px", height: "8px", background: d.c, borderRadius: "1px", flexShrink: 0 }} />
              <span style={{ fontSize: "9px", color: "#64748b" }}>{d.label} <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>{fmt(deal[d.key], 2)}×</strong></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Radar chart — SVG polygon, fixed with generous viewBox padding so labels never clip
function RadarChart({ deal, color }) {
  // Fixed internal coordinate space — labels need ~28px margin on each side
  const VB = 160;          // viewBox size
  const cx = VB / 2;
  const cy = VB / 2;
  const r  = 44;           // radar radius — well inside viewBox leaving room for labels

  const dims = [
    { label: ["Track", "Record"],   key: "mgmtTrackRecord"  },
    { label: ["Skin in", "Game"],   key: "mgmtSkinInGame"   },
    { label: ["Sponsor", "Quality"],key: "sponsorQuality"   },
    { label: ["Alignment"],         key: "alignment"        },
  ];
  const n = dims.length;
  // 4-axis diamond: top, right, bottom, left
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, frac) => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * frac, cy + Math.sin(a) * r * frac];
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = dims.map((d, i) => pt(i, clamp((deal[d.key] || 0) / 10, 0, 1)));
  const polyStr    = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  // Label anchor positions — pushed further out than data max (1.0), then clamped to a
  // fixed offset so they sit cleanly outside the grid regardless of score
  const labelOffset = r + 22; // px from centre
  const labelPt = (i) => {
    const a = angle(i);
    return [cx + Math.cos(a) * labelOffset, cy + Math.sin(a) * labelOffset];
  };

  return (
    // width="100%" so cell drives the size; height auto via viewBox aspect ratio
    <svg width="100%" viewBox={`0 0 ${VB} ${VB}`} style={{ display: "block", maxWidth: "160px", margin: "0 auto" }}>
      {/* Grid rings */}
      {gridLevels.map((lvl) => {
        const pts = dims.map((_, i) => pt(i, lvl).join(",")).join(" ");
        return <polygon key={lvl} points={pts} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />;
      })}
      {/* Axes */}
      {dims.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#d1d5db" strokeWidth="0.5" />;
      })}
      {/* Data fill */}
      <polygon points={polyStr} fill={color + "28"} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Data dots + score labels inside polygon */}
      {dataPoints.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill={color} />
          <text x={x} y={y - 6} textAnchor="middle" fontSize="8"
            fill={color} fontFamily="IBM Plex Mono, monospace" fontWeight="700">
            {deal[dims[i].key]}
          </text>
        </g>
      ))}
      {/* Axis labels — positioned well outside the grid */}
      {dims.map((d, i) => {
        const [lx, ly] = labelPt(i);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="8.5" fill="#64748b" fontFamily="IBM Plex Sans, sans-serif">
            {d.label.map((ln, li) => (
              <tspan key={li} x={lx} dy={li === 0 ? (d.label.length > 1 ? "-0.55em" : "0") : "1.2em"}>
                {ln}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

// Mini bar for single metric comparison
function MetricBar({ value, max, color, height = 6 }) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div style={{ height, background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.4s ease" }} />
    </div>
  );
}

// Exit sensitivity sparkline — fully self-contained fixed height
function SensitivityChart({ deal, color }) {
  const base = Number(deal.exitMultiple) || 10;
  const plus1 = Number(deal.exitMultipleSensPlus) || base + 1;
  const minus1 = Number(deal.exitMultipleSensMinus) || base - 1;
  const baseEV = Number(deal.impliedExitEv) || 0;
  const exitEbitda = Number(deal.exitEbitda) || 0;
  const plusEV = exitEbitda * plus1;
  const minusEV = exitEbitda * minus1;
  const maxVal = Math.max(plusEV, baseEV, minusEV, 1);

  const bars = [
    { label: `${fmt(minus1)}×`, val: minusEV, col: "#fca5a5" },
    { label: `${fmt(base)}×`,   val: baseEV,  col: color },
    { label: `${fmt(plus1)}×`,  val: plusEV,  col: "#6ee7b7" },
  ];

  // Fixed 72px total: 14px EV label + 36px bar + 14px multiple label + 8px gaps
  return (
    <div style={{ display: "flex", gap: "6px", height: "72px" }}>
      {bars.map(({ label, val, col }) => (
        <div key={label} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: "9px", fontFamily: "DM Sans, sans-serif", color: "#888888", lineHeight: "14px", textAlign: "center" }}>
            €{Math.round(val)}m
          </div>
          <div style={{ width: "100%", flex: 1, background: col, borderRadius: "3px", margin: "4px 0" }} />
          <div style={{ fontSize: "9px", color: "#888888", lineHeight: "14px", textAlign: "center" }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Deal Header Card ─────────────────────────────────────────────────────────
function DealHeader({ deal, color, index }) {
  const score = deal.assumptionScore ?? calcScore(deal);
  const flagged = deal.netDebtEbitda > 7 || deal.exitMultiple > 15 || deal.exitCagr > 30;
  return (
    <div style={{
      background: "#ffffff", border: `0.5px solid ${color}40`,
      borderTop: `3px solid ${color}`,
      borderRadius: "12px", padding: "14px 14px 10px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F2744", lineHeight: 1.3 }}>{deal.name}</div>
          <div style={{ fontSize: "11px", color: "#888888", marginTop: "3px" }}>{deal.sector} · {deal.geography} · {deal.vintage}</div>
        </div>
        <div style={{
          padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 500,
          background: scoreColor(score) === "#ef4444" ? "#FEECEC" : scoreColor(score) === "#f59e0b" ? "#FEF5E7" : "#E8F5EE",
          color: scoreColor(score) === "#ef4444" ? "#7a1a1a" : scoreColor(score) === "#f59e0b" ? "#7a5200" : "#1a6b3a",
          whiteSpace: "nowrap",
        }}>
          {score}/10
        </div>
      </div>
      {deal.fragility && (
        <div style={{
          background: "#FEECEC", border: "0.5px solid #f5c6c6",
          borderRadius: "8px", padding: "5px 8px",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", color: "#7a1a1a", textTransform: "uppercase" }}>FRAGILITY</span>
          <span style={{ fontSize: "10px", color: "#7a1a1a", fontWeight: 500 }}>{deal.fragility}</span>
        </div>
      )}
      {flagged && (
        <div style={{ marginTop: "4px", background: "#FEF5E7", border: "0.5px solid #f0d080", borderRadius: "8px", padding: "4px 8px", fontSize: "9px", color: "#7a5200", fontWeight: 500 }}>
          ⚠ Out-of-range metric — acknowledged
        </div>
      )}
      <div style={{ marginTop: "8px", fontSize: "11px", color: "#888888", fontStyle: "italic", lineHeight: 1.5 }}>
        {deal.notes}
      </div>
    </div>
  );
}

// ─── Section Panel ────────────────────────────────────────────────────────────
function Panel({ number, label, children, collapsed, onToggle }) {
  return (
    <div style={{ marginBottom: "2px" }}>
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 20px", background: "#0F2744", cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{
          width: "18px", height: "18px", borderRadius: "50%",
          background: "#C8692A", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "9px", fontWeight: 600, flexShrink: 0,
        }}>{number}</div>
        <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#ffffff", textTransform: "uppercase", flex: 1 }}>
          {label}
        </span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{collapsed ? "▶" : "▼"}</span>
      </div>
      {!collapsed && (
        <div style={{ background: "#F7F5F1", borderBottom: "0.5px solid #E8E5DE" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Dimension Row ────────────────────────────────────────────────────────────
// Renders one metric row across all deals
function MetricRow({ label, deals, getValue, format, barMax, hint, colorFn, isLast }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `160px repeat(${deals.length}, 1fr)`,
      borderBottom: isLast ? "none" : "0.5px solid #E8E5DE",
    }}>
      {/* Label */}
      <div style={{
        padding: "8px 12px 8px 20px",
        display: "flex", alignItems: "center",
        borderRight: "0.5px solid #E8E5DE",
        background: "#ffffff",
      }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 500, color: "#555555" }}>{label}</div>
          {hint && <div style={{ fontSize: "9px", color: "#888888", marginTop: "1px" }}>{hint}</div>}
        </div>
      </div>
      {/* Values */}
      {deals.map((deal, i) => {
        const raw = getValue(deal);
        const display = format ? format(raw) : raw;
        const col = colorFn ? colorFn(raw, deal) : DEAL_COLORS[i];
        return (
          <div key={deal.id} style={{
            padding: "8px 10px",
            borderRight: i < deals.length - 1 ? "0.5px solid #E8E5DE" : "none",
            background: i % 2 === 0 ? "#ffffff" : "#F7F5F1",
          }}>
            <div style={{
              fontSize: "12px", fontWeight: 600,
              color: col || "#0F2744",
              marginBottom: barMax ? "4px" : 0,
            }}>
              {display}
            </div>
            {barMax != null && (
              <MetricBar value={Number(raw) || 0} max={barMax} color={DEAL_COLORS[i]} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Dimension 1: Entry Valuation ─────────────────────────────────────────────
function Dim1({ deals }) {
  const maxEv = Math.max(...deals.map(d => d.ev || 0));
  return (
    <div>
      <MetricRow label="Enterprise Value" hint="€m" deals={deals}
        getValue={d => d.ev} format={v => `€${fmt(v, 0)}m`} barMax={maxEv} />
      <MetricRow label="EV / EBITDA" hint="Entry multiple" deals={deals}
        getValue={d => d.evEbitda} format={v => `${fmt(v)}×`}
        colorFn={(v, d) => {
          if (!v || !d.sectorMedianEvEbitda) return "#0f172a";
          const diff = v - d.sectorMedianEvEbitda;
          return diff > 1.5 ? "#ef4444" : diff < -1.5 ? "#22c55e" : "#f59e0b";
        }}
        barMax={Math.max(...deals.map(d => d.evEbitda || 0)) * 1.2} />
      <MetricRow label="Sector Median EV/EBITDA" hint="Benchmark" deals={deals}
        getValue={d => d.sectorMedianEvEbitda} format={v => `${fmt(v)}×`} />
      <MetricRow label="Premium / Discount" hint="vs sector median" deals={deals}
        getValue={d => d.evEbitda && d.sectorMedianEvEbitda ? (d.evEbitda - d.sectorMedianEvEbitda) : null}
        format={v => v == null ? "—" : `${v > 0 ? "+" : ""}${fmt(v)}×`}
        colorFn={v => v == null ? "#94a3b8" : v > 0 ? "#ef4444" : "#22c55e"} />
      <MetricRow label="EV / Revenue" hint="Entry" deals={deals}
        getValue={d => d.evRevenue} format={v => `${fmt(v, 2)}×`} isLast />
    </div>
  );
}

// ─── Dimension 2: Return Profile ─────────────────────────────────────────────
function Dim2({ deals }) {
  const maxMoic = Math.max(...deals.map(d => d.moic || 0));
  return (
    <div>
      <MetricRow label="IRR" hint="Target" deals={deals}
        getValue={d => d.irr} format={v => `${fmt(v)}%`}
        colorFn={(v) => v >= 25 ? "#22c55e" : v >= 18 ? "#f59e0b" : "#ef4444"}
        barMax={Math.max(...deals.map(d => d.irr || 0)) * 1.2} />
      <MetricRow label="MOIC" hint="Money-on-money" deals={deals}
        getValue={d => d.moic} format={v => `${fmt(v)}×`}
        barMax={maxMoic * 1.15} />
      <MetricRow label="Payback Period" hint="Years" deals={deals}
        getValue={d => d.payback} format={v => `${fmt(v)} yrs`}
        colorFn={(v) => v <= 3 ? "#22c55e" : v <= 4.5 ? "#f59e0b" : "#ef4444"} />
      <MetricRow label="Holding Period" hint="Years" deals={deals}
        getValue={d => d.holdingPeriod} format={v => `${fmt(v, 0)} yrs`} />

      {/* Return Attribution Waterfall — custom row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `160px repeat(${deals.length}, 1fr)`,
        borderBottom: "0.5px solid #e2e8f0",
        background: "#f0f4f8",
      }}>
        <div style={{ padding: "10px 12px 10px 20px", borderRight: "0.5px solid #e2e8f0" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}>Return Attribution</div>
          <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "1px" }}>MOIC waterfall</div>
        </div>
        {deals.map((deal, i) => (
          <div key={deal.id} style={{
            padding: "10px 10px",
            borderRight: i < deals.length - 1 ? "0.5px solid #e2e8f0" : "none",
          }}>
            <WaterfallBar deal={deal} color={DEAL_COLORS[i]} />
          </div>
        ))}
      </div>

      {/* Attribution detail rows */}
      {[
        ["Entry Price Effect", "attr_entryPrice", ATTR_COLORS.entryPrice],
        ["Revenue Growth", "attr_revenueGrowth", ATTR_COLORS.revenueGrowth],
        ["Margin Expansion", "attr_marginExpansion", ATTR_COLORS.marginExpansion],
        ["Multiple Expansion", "attr_multipleExpansion", ATTR_COLORS.multipleExp],
        ["Leverage Paydown", "attr_leveragePaydown", ATTR_COLORS.leveragePaydown],
      ].map(([label, key, col], idx, arr) => (
        <div key={key} style={{
          display: "grid",
          gridTemplateColumns: `160px repeat(${deals.length}, 1fr)`,
          borderBottom: idx < arr.length - 1 ? "0.5px dashed #e2e8f0" : "0.5px solid #e2e8f0",
          background: "#fafbff",
        }}>
          <div style={{ padding: "6px 12px 6px 28px", borderRight: "0.5px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "6px", height: "6px", background: col, borderRadius: "1px", flexShrink: 0 }} />
            <span style={{ fontSize: "10px", color: "#64748b" }}>{label}</span>
          </div>
          {deals.map((deal, i) => (
            <div key={deal.id} style={{
              padding: "6px 10px", borderRight: i < deals.length - 1 ? "0.5px solid #e2e8f0" : "none",
              fontFamily: "monospace", fontSize: "11px", fontWeight: 600, color: col,
              background: i % 2 === 0 ? "#fff" : "#fafbfc",
            }}>
              {fmt(deal[key], 2)}×
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Dimension 3: Leverage ────────────────────────────────────────────────────
function Dim3({ deals }) {
  return (
    <div>
      <MetricRow label="Net Debt" hint="€m" deals={deals}
        getValue={d => d.netDebt} format={v => `€${fmt(v, 0)}m`} />
      <MetricRow label="Net Debt / EBITDA" hint="Entry leverage" deals={deals}
        getValue={d => d.netDebtEbitda} format={v => `${fmt(v)}×`}
        colorFn={(v) => v > 7 ? "#ef4444" : v > 5 ? "#f59e0b" : "#22c55e"}
        barMax={8} />
      <MetricRow label="Interest Coverage" hint="EBITDA / Interest" deals={deals}
        getValue={d => d.interestCoverage} format={v => `${fmt(v)}×`}
        colorFn={(v) => v < 2 ? "#ef4444" : v < 3 ? "#f59e0b" : "#22c55e"} />
      <MetricRow label="Debt Type" deals={deals}
        getValue={d => d.debtType} format={v => v || "—"} />
      <MetricRow label="Covenant Headroom" hint="Distance from covenant" deals={deals}
        getValue={d => d.covenantProximity} format={v => `${fmt(v, 0)}%`}
        colorFn={(v) => v < 10 ? "#ef4444" : v < 20 ? "#f59e0b" : "#22c55e"}
        barMax={50} />
      <MetricRow label="Refinancing Risk" deals={deals}
        getValue={d => d.refinancingRisk}
        colorFn={(v) => riskColor(v)}
        isLast />
    </div>
  );
}

// ─── Dimension 4: Revenue & Margin ───────────────────────────────────────────
function Dim4({ deals }) {
  return (
    <div>
      <MetricRow label="Revenue CAGR (exit)" hint="% p.a. assumption" deals={deals}
        getValue={d => d.exitCagr} format={v => `${fmt(v)}%`}
        colorFn={(v) => v > 20 ? "#ef4444" : v > 12 ? "#f59e0b" : "#22c55e"}
        barMax={Math.max(...deals.map(d => d.exitCagr || 0)) * 1.3} />
      <MetricRow label="Organic Growth Split" hint="% organic" deals={deals}
        getValue={d => d.organicGrowthSplit} format={v => `${fmt(v, 0)}%`}
        barMax={100} />
      <MetricRow label="EBITDA Margin — Entry" deals={deals}
        getValue={d => d.ebitdaMarginEntry} format={v => `${fmt(v)}%`}
        barMax={50} />
      <MetricRow label="EBITDA Margin — Exit" deals={deals}
        getValue={d => d.ebitdaMarginExit} format={v => `${fmt(v)}%`}
        barMax={50} />
      <MetricRow label="Margin Expansion" hint="Exit − entry (pp)" deals={deals}
        getValue={d => d.ebitdaMarginExit && d.ebitdaMarginEntry ? d.ebitdaMarginExit - d.ebitdaMarginEntry : null}
        format={v => v == null ? "—" : `+${fmt(v)}pp`}
        colorFn={(v) => v > 10 ? "#ef4444" : v > 5 ? "#f59e0b" : "#22c55e"}
        barMax={15} />

      {/* Assumption Aggressiveness — custom row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `160px repeat(${deals.length}, 1fr)`,
        background: "#f0f4f8",
        borderBottom: "0.5px solid #e2e8f0",
      }}>
        <div style={{ padding: "10px 12px 10px 20px", borderRight: "0.5px solid #e2e8f0" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}>Assumption Score</div>
          <div style={{ fontSize: "9px", color: "#94a3b8" }}>Aggressiveness 0–10</div>
        </div>
        {deals.map((deal, i) => {
          const s = deal.assumptionScore ?? calcScore(deal);
          const col = scoreColor(s);
          return (
            <div key={deal.id} style={{
              padding: "10px 10px",
              borderRight: i < deals.length - 1 ? "0.5px solid #e2e8f0" : "none",
              background: i % 2 === 0 ? "#fff" : "#fafbfc",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  fontFamily: "monospace", fontSize: "14px", fontWeight: 800, color: col,
                }}>
                  {s}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Number(s) * 10}%`, background: col, borderRadius: "3px" }} />
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "9px", color: col, marginTop: "3px", fontWeight: 600 }}>
                {Number(s) >= 8 ? "HIGH RISK" : Number(s) >= 6 ? "ELEVATED" : "MODERATE"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dimension 5: Exit ────────────────────────────────────────────────────────
function Dim5({ deals }) {
  return (
    <div>
      <MetricRow label="Exit Multiple" hint="EV/EBITDA at exit" deals={deals}
        getValue={d => d.exitMultiple} format={v => `${fmt(v)}×`}
        colorFn={(v) => v > 15 ? "#ef4444" : v > 12 ? "#f59e0b" : "#22c55e"}
        barMax={Math.max(...deals.map(d => d.exitMultiple || 0)) * 1.2} />
      <MetricRow label="Exit Route" deals={deals}
        getValue={d => d.exitRoute} format={v => v || "—"} />
      <MetricRow label="Exit EBITDA" hint="€m" deals={deals}
        getValue={d => d.exitEbitda} format={v => `€${fmt(v, 0)}m`}
        barMax={Math.max(...deals.map(d => d.exitEbitda || 0)) * 1.2} />
      <MetricRow label="Implied Exit EV" hint="€m" deals={deals}
        getValue={d => d.impliedExitEv} format={v => `€${fmt(v, 0)}m`}
        barMax={Math.max(...deals.map(d => d.impliedExitEv || 0)) * 1.2} />

      {/* Exit multiple sensitivity — custom row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `160px repeat(${deals.length}, 1fr)`,
        borderBottom: "0.5px solid #e2e8f0",
        background: "#f0f4f8",
        overflow: "hidden",
      }}>
        <div style={{ padding: "10px 12px 10px 20px", borderRight: "0.5px solid #e2e8f0" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}>EV Sensitivity</div>
          <div style={{ fontSize: "9px", color: "#94a3b8" }}>±1× exit multiple</div>
        </div>
        {deals.map((deal, i) => (
          <div key={deal.id} style={{
            padding: "10px 10px",
            borderRight: i < deals.length - 1 ? "0.5px solid #e2e8f0" : "none",
            background: i % 2 === 0 ? "#fff" : "#fafbfc",
          }}>
            <SensitivityChart deal={deal} color={DEAL_COLORS[i]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dimension 6: Management & Sponsor ───────────────────────────────────────
function Dim6({ deals }) {
  return (
    <div>
      {/* Radar charts row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `160px repeat(${deals.length}, 1fr)`,
        borderBottom: "0.5px solid #e2e8f0",
        // overflow visible so SVG labels aren't clipped by cell boundaries
        overflow: "visible",
      }}>
        <div style={{ padding: "10px 12px 10px 20px", borderRight: "0.5px solid #e2e8f0", display: "flex", alignItems: "center", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}>Quality Radar</div>
            <div style={{ fontSize: "9px", color: "#94a3b8" }}>4-dimension profile</div>
          </div>
        </div>
        {deals.map((deal, i) => (
          <div key={deal.id} style={{
            padding: "16px 8px",
            display: "flex", justifyContent: "center", alignItems: "center",
            minHeight: "170px",
            borderRight: i < deals.length - 1 ? "0.5px solid #e2e8f0" : "none",
            background: i % 2 === 0 ? "#fff" : "#fafbfc",
            overflow: "visible",
          }}>
            <RadarChart deal={deal} color={DEAL_COLORS[i]} />
          </div>
        ))}
      </div>
      <MetricRow label="Track Record" hint="0–10" deals={deals}
        getValue={d => d.mgmtTrackRecord} format={v => `${v}/10`}
        colorFn={(v) => v >= 8 ? "#22c55e" : v >= 6 ? "#f59e0b" : "#ef4444"}
        barMax={10} />
      <MetricRow label="Skin in Game" hint="0–10" deals={deals}
        getValue={d => d.mgmtSkinInGame} format={v => `${v}/10`}
        colorFn={(v) => v >= 8 ? "#22c55e" : v >= 6 ? "#f59e0b" : "#ef4444"}
        barMax={10} />
      <MetricRow label="Sponsor Quality" hint="0–10" deals={deals}
        getValue={d => d.sponsorQuality} format={v => `${v}/10`}
        colorFn={(v) => v >= 8 ? "#22c55e" : v >= 6 ? "#f59e0b" : "#ef4444"}
        barMax={10} />
      <MetricRow label="Alignment" hint="0–10" deals={deals}
        getValue={d => d.alignment} format={v => `${v}/10`}
        colorFn={(v) => v >= 8 ? "#22c55e" : v >= 6 ? "#f59e0b" : "#ef4444"}
        barMax={10}
        isLast />
    </div>
  );
}

// ─── Comparison Dashboard ─────────────────────────────────────────────────────
function ComparisonDashboard({ deals, onBack, onSynthesis }) {
  const [collapsed, setCollapsed] = useState({});

  const toggle = (k) => setCollapsed(prev => ({ ...prev, [k]: !prev[k] }));

  const dims = [
    { key: "d1", number: "1", label: "Entry Valuation", content: <Dim1 deals={deals} /> },
    { key: "d2", number: "2", label: "Return Profile & Attribution Waterfall", content: <Dim2 deals={deals} /> },
    { key: "d3", number: "3", label: "Leverage & Capital Structure", content: <Dim3 deals={deals} /> },
    { key: "d4", number: "4", label: "Revenue & Margin Assumptions", content: <Dim4 deals={deals} /> },
    { key: "d5", number: "5", label: "Exit Assumptions", content: <Dim5 deals={deals} /> },
    { key: "d6", number: "6", label: "Management & Sponsor Quality", content: <Dim6 deals={deals} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", overflow: "hidden" }}>
      {/* Sub-header */}
      <div style={{
        background: "#ffffff", borderBottom: "0.5px solid #E8E5DE",
        padding: "12px 24px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 500, color: "#0F2744" }}>Comparison Dashboard</div>
          <div style={{ fontSize: "12px", color: "#888888", marginTop: "2px" }}>
            {deals.length} deals · 6 analytical dimensions · side-by-side
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onBack} style={{
            padding: "8px 17px", background: "#ffffff", color: "#0F2744",
            border: "1px solid #E8E5DE", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F5F1")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >← Intake</button>
          <button onClick={onSynthesis} style={{
            padding: "9px 18px", background: "#C8692A", color: "#fff",
            border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
            cursor: "pointer",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#A85520")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C8692A")}
          >AI Synthesis →</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Deal headers — sticky */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "grid",
          gridTemplateColumns: `160px repeat(${deals.length}, 1fr)`,
          background: "#F7F5F1",
          borderBottom: "0.5px solid #E8E5DE",
        }}>
          <div style={{
            padding: "12px 20px",
            borderRight: "0.5px solid #E8E5DE",
            display: "flex", alignItems: "center",
          }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#888888" }}>
              Dimension / Deal
            </div>
          </div>
          {deals.map((deal, i) => (
            <div key={deal.id} style={{
              padding: "10px 10px",
              borderRight: i < deals.length - 1 ? "0.5px solid #E8E5DE" : "none",
              borderLeft: `3px solid ${DEAL_COLORS[i]}`,
            }}>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F2744" }}>{deal.name}</div>
              <div style={{ fontSize: "11px", color: "#888888", marginTop: "2px" }}>{deal.sector} · {deal.geography}</div>
              <div style={{ display: "flex", gap: "6px", marginTop: "5px", flexWrap: "wrap" }}>
                {[
                  ["IRR", `${fmt(deal.irr)}%`, deal.irr >= 25 ? "#1a6b3a" : deal.irr >= 18 ? "#7a5200" : "#7a1a1a"],
                  ["MOIC", `${fmt(deal.moic)}×`, DEAL_COLORS[i]],
                  ["ND/E", `${fmt(deal.netDebtEbitda)}×`, deal.netDebtEbitda > 7 ? "#7a1a1a" : "#555555"],
                ].map(([label, val, col]) => (
                  <span key={label} style={{
                    fontSize: "10px", background: "#F7F5F1",
                    border: "0.5px solid #E8E5DE", borderRadius: "20px", padding: "1px 8px",
                    color: col, fontWeight: 500,
                  }}>
                    {label} {val}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Deal header cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `160px repeat(${deals.length}, 1fr)`,
          borderBottom: "0.5px solid #E8E5DE",
          background: "#F7F5F1",
        }}>
          <div style={{ borderRight: "0.5px solid #E8E5DE" }} />
          {deals.map((deal, i) => (
            <div key={deal.id} style={{
              padding: "10px 10px",
              borderRight: i < deals.length - 1 ? "0.5px solid #E8E5DE" : "none",
            }}>
              <DealHeader deal={deal} color={DEAL_COLORS[i]} index={i} />
            </div>
          ))}
        </div>

        {/* Six dimension panels */}
        {dims.map(({ key, number, label, content }) => (
          <Panel key={key} number={number} label={label}
            collapsed={!!collapsed[key]}
            onToggle={() => toggle(key)}>
            {content}
          </Panel>
        ))}

        {/* Legend */}
        <div style={{
          padding: "16px 20px",
          background: "#ffffff", borderTop: "0.5px solid #E8E5DE",
          display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "#888888", letterSpacing: "0.09em", textTransform: "uppercase" }}>
            Colour Legend
          </div>
          {[
            ["#1a6b3a", "#E8F5EE", "Conservative / Strong"],
            ["#7a5200", "#FEF5E7", "Borderline / Moderate"],
            ["#7a1a1a", "#FEECEC", "Aggressive / Weak"],
          ].map(([col, bg, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", background: bg, border: `0.5px solid ${col}40`, borderRadius: "3px" }} />
              <span style={{ fontSize: "11px", color: "#555555" }}>{label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ padding: "1px 8px", background: "#FEECEC", border: "0.5px solid #f5c6c6", borderRadius: "20px", fontSize: "9px", fontWeight: 600, color: "#7a1a1a" }}>FRAGILITY</div>
            <span style={{ fontSize: "11px", color: "#555555" }}>Most load-bearing assumption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Form Components (Screen 1) ───────────────────────────────────────
function Field({ label, children, hint, flag }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <label style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "#888888", textTransform: "uppercase" }}>{label}</label>
        {flag && <span style={{ fontSize: "9px", background: "#FEECEC", color: "#7a1a1a", padding: "1px 6px", borderRadius: "20px", fontWeight: 500 }}>FLAG</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: "10px", color: "#888888", marginTop: "3px" }}>{hint}</div>}
    </div>
  );
}

function Inp({ value, onChange, type = "text", placeholder, min, max, step, style = {} }) {
  return (
    <input type={type} value={value ?? ""} onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : parseFloat(e.target.value)) : e.target.value)}
      placeholder={placeholder} min={min} max={max} step={step}
      style={{ width: "100%", background: "#F7F5F1", border: "0.5px solid #E8E5DE", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", color: "#0F2744", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", ...style }}
      onFocus={(e) => (e.target.style.borderColor = "#C8692A")} onBlur={(e) => (e.target.style.borderColor = "#E8E5DE")} />
  );
}

function Sel({ value, onChange, options }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", background: "#F7F5F1", border: "0.5px solid #E8E5DE", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", color: "#0F2744", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SecHeader({ number, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "0.5px solid #E8E5DE", paddingBottom: "8px", marginBottom: "16px", marginTop: "24px" }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#0F2744", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 600, flexShrink: 0 }}>{number}</div>
      <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#888888", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function DealForm({ deal, onUpdate }) {
  const score = calcScore(deal);
  const flaggedMetrics = { exitMultiple: deal.exitMultiple > 15, exitCagr: deal.exitCagr > 30, netDebtEbitda: deal.netDebtEbitda > 7 };
  const u = (key) => (val) => onUpdate({ ...deal, [key]: val });

  return (
    <div style={{ padding: "0 2px" }}>
      <SecHeader number="A" label="Deal Identity" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Deal Name"><Inp value={deal.name} onChange={u("name")} placeholder="e.g. Alpine Consumer Brands" /></Field>
        <Field label="Currency"><Sel value={deal.currency} onChange={u("currency")} options={CURRENCIES} /></Field>
        <Field label="Sector"><Sel value={deal.sector} onChange={u("sector")} options={SECTORS} /></Field>
        <Field label="Geography"><Sel value={deal.geography} onChange={u("geography")} options={GEOGRAPHIES} /></Field>
        <Field label="Vintage Year"><Inp value={deal.vintage} onChange={u("vintage")} type="number" placeholder="2024" min={2010} max={2030} /></Field>
        <Field label="Holding Period (years)"><Inp value={deal.holdingPeriod} onChange={u("holdingPeriod")} type="number" placeholder="5" min={1} max={15} step={0.5} /></Field>
      </div>
      <Field label="Investment Thesis / Notes">
        <textarea value={deal.notes ?? ""} onChange={(e) => onUpdate({ ...deal, notes: e.target.value })} rows={2}
          style={{ width: "100%", background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: "4px", padding: "6px 9px", fontSize: "12px", color: "#0f172a", fontFamily: "'IBM Plex Sans', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
      </Field>
      <Field label="Fragility Flag" hint="The single variable that, if wrong, breaks the return case">
        <Inp value={deal.fragility} onChange={u("fragility")} placeholder="e.g. Exit Multiple, Revenue CAGR, EBITDA Margin…" />
      </Field>

      <SecHeader number="1" label="Entry Valuation" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
        <Field label="Enterprise Value (€m)"><Inp value={deal.ev} onChange={u("ev")} type="number" min={0} /></Field>
        <Field label="Entry EBITDA (€m)"><Inp value={deal.ebitda} onChange={u("ebitda")} type="number" min={0} step={0.1} /></Field>
        <Field label="Entry Revenue (€m)"><Inp value={deal.revenue} onChange={u("revenue")} type="number" min={0} step={0.1} /></Field>
        <Field label="EV/EBITDA (entry)"><Inp value={deal.evEbitda} onChange={u("evEbitda")} type="number" min={0} step={0.1} /></Field>
        <Field label="EV/Revenue (entry)"><Inp value={deal.evRevenue} onChange={u("evRevenue")} type="number" min={0} step={0.01} /></Field>
        <Field label="Sector Median EV/EBITDA"><Inp value={deal.sectorMedianEvEbitda} onChange={u("sectorMedianEvEbitda")} type="number" min={0} step={0.1} /></Field>
      </div>

      <SecHeader number="2" label="Return Profile" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
        <Field label="Target IRR (%)"><Inp value={deal.irr} onChange={u("irr")} type="number" min={0} max={100} step={0.1} /></Field>
        <Field label="MOIC (×)"><Inp value={deal.moic} onChange={u("moic")} type="number" min={0} step={0.1} /></Field>
        <Field label="Payback Period (yrs)"><Inp value={deal.payback} onChange={u("payback")} type="number" min={0} step={0.1} /></Field>
      </div>
      <div style={{ background: "#f0f4f8", border: "0.5px solid #cbd5e1", borderRadius: "6px", padding: "12px 14px", marginBottom: "14px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#475569", textTransform: "uppercase", marginBottom: "10px" }}>Return Attribution — MOIC Waterfall (× contribution)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0 12px" }}>
          {[["Entry Price Effect","attr_entryPrice"],["Revenue Growth","attr_revenueGrowth"],["Margin Expansion","attr_marginExpansion"],["Multiple Expansion","attr_multipleExpansion"],["Leverage Paydown","attr_leveragePaydown"]].map(([label, key]) => (
            <Field key={key} label={label}><Inp value={deal[key]} onChange={u(key)} type="number" placeholder="0.00" min={-2} max={5} step={0.01} /></Field>
          ))}
        </div>
      </div>

      <SecHeader number="3" label="Leverage & Capital Structure" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
        <Field label="Net Debt (€m)"><Inp value={deal.netDebt} onChange={u("netDebt")} type="number" min={0} /></Field>
        <Field label="Net Debt / EBITDA" flag={flaggedMetrics.netDebtEbitda}>
          <Inp value={deal.netDebtEbitda} onChange={u("netDebtEbitda")} type="number" min={0} step={0.1} style={flaggedMetrics.netDebtEbitda ? { borderColor: "#ef4444" } : {}} />
        </Field>
        <Field label="Interest Coverage (×)"><Inp value={deal.interestCoverage} onChange={u("interestCoverage")} type="number" min={0} step={0.1} /></Field>
        <Field label="Debt Type"><Sel value={deal.debtType} onChange={u("debtType")} options={DEBT_TYPES} /></Field>
        <Field label="Covenant Headroom (%)"><Inp value={deal.covenantProximity} onChange={u("covenantProximity")} type="number" min={0} max={100} /></Field>
        <Field label="Refinancing Risk"><Sel value={deal.refinancingRisk} onChange={u("refinancingRisk")} options={REFINANCING_RISKS} /></Field>
      </div>

      <SecHeader number="4" label="Revenue & Margin Assumptions" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
        <Field label="Revenue CAGR — Exit (%)" flag={flaggedMetrics.exitCagr}>
          <Inp value={deal.exitCagr} onChange={u("exitCagr")} type="number" min={-20} max={100} step={0.1} style={flaggedMetrics.exitCagr ? { borderColor: "#ef4444" } : {}} />
        </Field>
        <Field label="EBITDA Margin — Entry (%)"><Inp value={deal.ebitdaMarginEntry} onChange={u("ebitdaMarginEntry")} type="number" min={0} max={100} step={0.1} /></Field>
        <Field label="EBITDA Margin — Exit (%)"><Inp value={deal.ebitdaMarginExit} onChange={u("ebitdaMarginExit")} type="number" min={0} max={100} step={0.1} /></Field>
        <Field label="Organic Growth Split (%)"><Inp value={deal.organicGrowthSplit} onChange={u("organicGrowthSplit")} type="number" min={0} max={100} step={5} /></Field>
        <Field label="Assumption Score (override)" hint="Auto-calculated if blank">
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Inp value={deal.assumptionScore} onChange={u("assumptionScore")} type="number" min={0} max={10} step={0.1} />
            <div style={{ padding: "4px 10px", borderRadius: "4px", fontWeight: 700, fontSize: "12px", background: scoreColor(deal.assumptionScore ?? score) + "20", color: scoreColor(deal.assumptionScore ?? score), border: `1px solid ${scoreColor(deal.assumptionScore ?? score)}40`, whiteSpace: "nowrap", fontFamily: "monospace" }}>
              {deal.assumptionScore ?? score} / 10
            </div>
          </div>
        </Field>
      </div>

      <SecHeader number="5" label="Exit Assumptions" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0 16px" }}>
        <Field label="Exit Multiple (×)" flag={flaggedMetrics.exitMultiple}>
          <Inp value={deal.exitMultiple} onChange={u("exitMultiple")} type="number" min={0} max={50} step={0.5} style={flaggedMetrics.exitMultiple ? { borderColor: "#ef4444" } : {}} />
        </Field>
        <Field label="+1× Sensitivity"><Inp value={deal.exitMultipleSensPlus} onChange={u("exitMultipleSensPlus")} type="number" min={0} step={0.5} /></Field>
        <Field label="-1× Sensitivity"><Inp value={deal.exitMultipleSensMinus} onChange={u("exitMultipleSensMinus")} type="number" min={0} step={0.5} /></Field>
        <Field label="Exit Route"><Sel value={deal.exitRoute} onChange={u("exitRoute")} options={EXIT_ROUTES} /></Field>
        <Field label="Exit EBITDA (€m)"><Inp value={deal.exitEbitda} onChange={u("exitEbitda")} type="number" min={0} /></Field>
      </div>
      <Field label="Implied Exit EV (€m)"><Inp value={deal.impliedExitEv} onChange={u("impliedExitEv")} type="number" min={0} /></Field>

      <SecHeader number="6" label="Management & Sponsor Quality" />
      <div style={{ background: "#f0f4f8", border: "0.5px solid #cbd5e1", borderRadius: "6px", padding: "12px 14px", marginBottom: "14px" }}>
        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "10px" }}>Score each dimension 1–10.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 16px" }}>
          {[["Track Record","mgmtTrackRecord"],["Skin in Game","mgmtSkinInGame"],["Sponsor Quality","sponsorQuality"],["Alignment","alignment"]].map(([label, key]) => (
            <Field key={key} label={label} hint={`${deal[key] ?? "—"} / 10`}>
              <input type="range" min={1} max={10} step={1} value={deal[key] ?? 5}
                onChange={(e) => onUpdate({ ...deal, [key]: parseInt(e.target.value) })}
                style={{ width: "100%", accentColor: "#1e3a5f", cursor: "pointer" }} />
            </Field>
          ))}
        </div>
      </div>

      {Object.values(flaggedMetrics).some(Boolean) && (
        <div style={{ background: "#fff7ed", border: "0.5px solid #fb923c", borderRadius: "6px", padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#c2410c", marginBottom: "6px" }}>⚠ Metric flags — acknowledgement required</div>
          {flaggedMetrics.exitMultiple && <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#7c2d12", cursor: "pointer", marginBottom: "4px" }}><input type="checkbox" /> Exit multiple above 15× — confirmed and supportable</label>}
          {flaggedMetrics.exitCagr && <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#7c2d12", cursor: "pointer", marginBottom: "4px" }}><input type="checkbox" /> Revenue CAGR above 30% — stress-tested</label>}
          {flaggedMetrics.netDebtEbitda && <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#7c2d12", cursor: "pointer" }}><input type="checkbox" /> Net Debt/EBITDA above 7× — covenant analysis complete</label>}
        </div>
      )}
    </div>
  );
}

function DealTabs({ deals, activeDeal, onSelect, onAdd, onRemove }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", borderBottom: "0.5px solid #E8E5DE", background: "#ffffff", padding: "0 24px" }}>
      {deals.map((d, i) => (
        <div key={d.id} onClick={() => onSelect(d.id)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 18px", borderBottom: activeDeal === d.id ? `2px solid ${DEAL_COLORS[i]}` : "2px solid transparent", cursor: "pointer" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: DEAL_COLORS[i], flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: activeDeal === d.id ? 500 : 400, color: activeDeal === d.id ? "#0F2744" : "#888888" }}>{d.name || `Deal ${d.id}`}</span>
          {deals.length > 1 && <button onClick={(e) => { e.stopPropagation(); onRemove(d.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#888888", fontSize: "14px", lineHeight: 1 }}>×</button>}
        </div>
      ))}
      {deals.length < 5 && (
        <button onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: "#888888", fontSize: "13px" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#0F2744")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
          <span style={{ fontSize: "16px" }}>+</span> Add Deal
        </button>
      )}
    </div>
  );
}

// ─── AI Synthesis Helpers ─────────────────────────────────────────────────────

function buildSynthesisPrompt(deals) {
  const dealSummaries = deals.map((d, i) => `
DEAL ${i + 1}: ${d.name}
  Sector: ${d.sector} | Geography: ${d.geography} | Vintage: ${d.vintage}
  Entry: EV €${d.ev}m | EV/EBITDA ${d.evEbitda}× (sector median ${d.sectorMedianEvEbitda}×) | EV/Revenue ${d.evRevenue}×
  Returns: IRR ${d.irr}% | MOIC ${d.moic}× | Payback ${d.payback} yrs | Hold ${d.holdingPeriod} yrs
  Attribution (MOIC ×): Entry Price ${d.attr_entryPrice} | Revenue Growth ${d.attr_revenueGrowth} | Margin Expansion ${d.attr_marginExpansion} | Multiple Expansion ${d.attr_multipleExpansion} | Leverage Paydown ${d.attr_leveragePaydown}
  Leverage: ND/EBITDA ${d.netDebtEbitda}× | Interest Coverage ${d.interestCoverage}× | ${d.debtType} | Covenant Headroom ${d.covenantProximity}% | Refinancing Risk: ${d.refinancingRisk}
  Revenue/Margin: CAGR ${d.exitCagr}% | EBITDA Margin Entry ${d.ebitdaMarginEntry}% → Exit ${d.ebitdaMarginExit}% | Organic Split ${d.organicGrowthSplit}% | Assumption Score ${d.assumptionScore ?? calcScore(d)}/10
  Exit: ${d.exitMultiple}× EV/EBITDA | Route: ${d.exitRoute} | Exit EBITDA €${d.exitEbitda}m | Implied EV €${d.impliedExitEv}m
  Management: Track Record ${d.mgmtTrackRecord}/10 | Skin in Game ${d.mgmtSkinInGame}/10 | Sponsor ${d.sponsorQuality}/10 | Alignment ${d.alignment}/10
  Thesis: ${d.notes}
  Declared Fragility: ${d.fragility || "not specified"}
`).join("\n");

  return `You are a senior private equity analyst preparing an Investment Committee memo. You have been given data on ${deals.length} deals to analyse side by side.

${dealSummaries}

Produce a structured JSON response with EXACTLY this shape (no markdown fences, raw JSON only):

{
  "crossDealNarrative": {
    "returnDriverComparison": "2-3 sentences comparing the primary return driver across deals — what each deal is fundamentally betting on",
    "valuationContext": "2 sentences on relative entry valuations and what the market was pricing in",
    "leverageRisk": "2 sentences comparing leverage profiles and what that means for downside protection",
    "assumptionQuality": "2 sentences on which deal has the most aggressive vs most conservative assumptions and why that matters"
  },
  "dealAnalyses": [
    {
      "dealName": "exact deal name",
      "returnDrivers": [
        { "driver": "short driver name", "magnitude": "high|medium|low", "dataPoint": "specific metric that supports this", "isFactual": true }
      ],
      "strengths": [
        { "point": "one sentence", "dataPoint": "metric reference", "isFactual": true }
      ],
      "fragilities": [
        { "point": "one sentence on what breaks the case", "dataPoint": "metric reference", "isFactual": false }
      ],
      "icQuestion": "The single sharpest question an IC member should ask this management team"
    }
  ],
  "portfolioObservation": "2-3 sentences on what this portfolio of deals looks like in aggregate — concentration, balance, what's missing",
  "bestRiskAdjustedCase": "dealName of the deal with the best risk-adjusted return profile",
  "bestRiskAdjustedRationale": "one sentence explaining why"
}

Rules:
- isFactual: true = directly readable from the data. isFactual: false = inference or analytical judgement.
- Be precise with numbers — cite the actual metrics.
- Write like a senior analyst, not a chatbot. No hedging, no filler.
- Every statement must be traceable to a specific data input.`;
}

// ─── Static Demo Synthesis ────────────────────────────────────────────────────
const FAKE_SYNTHESIS = {
  crossDealNarrative: {
    returnDriverComparison: "The three deals represent fundamentally distinct return theses with minimal overlap. Alpine Consumer Brands is an earnings growth story — 62% of MOIC comes from revenue growth, with a further 31% from margin expansion through procurement and warehouse consolidation, leaving multiple expansion as a minor contributor at 0.28×. Horizon MedTech inverts this entirely: 0.98× of its 2.1× value creation derives from multiple expansion, betting on a sector rerating post-FDA clearance rather than operational performance. Veridian Industrials is the highest-conviction operational turnaround in the set, with margin expansion contributing 1.42× MOIC — the single largest driver across all deals — underpinned by a 970bps improvement from 14.3% to 24.0% EBITDA margin.",
    valuationContext: "Alpine entered at 8.1× EV/EBITDA, a 140bps discount to its sector median of 9.5× — a modestly attractive entry that offers limited downside protection but reduces exit multiple dependency. Horizon paid 11.7× against a sector median of 14.0×, a 230bps discount that provides meaningful cushion for the rerating thesis, though its €680m entry EV is the largest in the set and concentrates risk in a single binary catalyst. Veridian's 13.9× entry against an 8.5× sector median is the most concerning valuation outlier — the market was pricing in a recovery that has not yet materialised, and the return case requires delivering operational improvements that are already embedded in the purchase price.",
    leverageRisk: "Leverage profiles diverge sharply and are not uniformly correlated with return potential. Alpine at 4.0× ND/EBITDA with 18% covenant headroom sits in the PE sweet spot — meaningful leverage without covenant stress. Horizon at 5.0× with 12% headroom is manageable given predictable MedTech cashflows, and its Low refinancing risk rating is consistent with Senior Secured debt. Veridian is the outlier: 7.0× ND/EBITDA on Unitranche with only 5% covenant headroom and an interest coverage of 1.9× is a stressed capital structure — any EBITDA shortfall against the turnaround plan triggers covenant breach with limited headroom to absorb it.",
    assumptionQuality: "Veridian carries the most aggressive assumption set with a score of 8.9/10, driven by a 14.0% revenue CAGR, a 970bps margin improvement, and an exit multiple that implies sector re-rating despite entering above median. Horizon scores 7.8/10 — the 18.0× exit multiple is the single most aggressive individual assumption in the portfolio, above the 15× flag threshold, and is entirely dependent on IPO market conditions. Alpine is the most conservative at 6.2/10, with an 8.5% CAGR and a 540bps margin expansion that is operationally grounded in specific cost levers rather than market-level assumptions.",
  },
  dealAnalyses: [
    {
      dealName: "Alpine Consumer Brands",
      returnDrivers: [
        { driver: "Revenue Growth", magnitude: "high", dataPoint: "0.62× MOIC contribution — largest single driver; 8.5% exit CAGR assumption", isFactual: true },
        { driver: "Margin Expansion", magnitude: "medium", dataPoint: "0.31× MOIC from 28.1% → 33.5% EBITDA margin (+540bps)", isFactual: true },
        { driver: "Leverage Paydown", magnitude: "medium", dataPoint: "0.41× MOIC; ND/EBITDA 4.0× entry, Senior + PIK structure", isFactual: true },
        { driver: "Multiple Expansion", magnitude: "low", dataPoint: "0.28× MOIC; entry 8.1× vs exit 10.5× — modest re-rating", isFactual: true },
      ],
      strengths: [
        { point: "Entry valuation is below sector median, providing a structural discount that does not require multiple expansion to justify the return.", dataPoint: "8.1× entry vs 9.5× sector median (−140bps)", isFactual: true },
        { point: "Trade sale exit route is well-supported by a deep buyer pool in European consumer, reducing exit execution risk relative to IPO-dependent deals.", dataPoint: "Exit route: Trade Sale; 75% organic growth split", isFactual: true },
        { point: "Covenant headroom is the most comfortable in the portfolio, limiting the probability of a liquidity event during the hold period.", dataPoint: "18% covenant headroom; Medium refinancing risk; 3.8× interest coverage", isFactual: true },
      ],
      fragilities: [
        { point: "The revenue growth driver is the single largest MOIC contributor at 0.62×, yet the 8.5% CAGR assumption relies on sustained volume and pricing — both of which are exposed to consumer cycle deterioration or private label substitution.", dataPoint: "Revenue Growth: 0.62× MOIC (30% of total value creation); 75% organic", isFactual: false },
        { point: "Senior + PIK debt structure creates a compounding interest liability that erodes equity value if revenue growth underperforms in years 2-3 before the PIK toggle is exercised.", dataPoint: "Debt type: Senior + PIK; ND/EBITDA 4.0×; payback 4.5 years", isFactual: false },
      ],
      icQuestion: "What is the specific pricing versus volume split within the 8.5% revenue CAGR, and how does the margin expansion pathway change if volume growth disappoints and you are relying solely on price to hit the top line?",
    },
    {
      dealName: "Horizon MedTech",
      returnDrivers: [
        { driver: "Multiple Expansion", magnitude: "high", dataPoint: "0.98× MOIC — dominant driver; entry 11.7× → exit 18.0×, a 630bps re-rating", isFactual: true },
        { driver: "Entry Price Effect", magnitude: "medium", dataPoint: "0.41× MOIC from buying below sector median (11.7× vs 14.0×)", isFactual: true },
        { driver: "Leverage Paydown", magnitude: "medium", dataPoint: "0.39× MOIC; €290m net debt, Senior Secured, 4-year hold", isFactual: true },
        { driver: "Revenue Growth", magnitude: "low", dataPoint: "0.24× MOIC; 11.0% CAGR — meaningful but not the thesis driver", isFactual: true },
      ],
      strengths: [
        { point: "Entry discount to sector median is the most attractive in the portfolio on an absolute basis, providing a genuine valuation margin of safety if the rerating thesis does not fully materialise.", dataPoint: "Entry 11.7× vs sector median 14.0× (−230bps); entry price effect 0.41×", isFactual: true },
        { point: "Sponsor and management track record scores are the highest in the portfolio, indicating an experienced team with a demonstrated ability to navigate regulatory and capital markets processes.", dataPoint: "Track Record 9/10; Sponsor Quality 9/10", isFactual: true },
        { point: "Low refinancing risk and Senior Secured debt provide structural stability during what is inherently a binary-event-driven hold period.", dataPoint: "Refinancing Risk: Low; Debt type: Senior Secured; 12% covenant headroom", isFactual: true },
      ],
      fragilities: [
        { point: "47% of total MOIC is contingent on an 18.0× exit multiple being achievable, which requires both the FDA clearance event to occur and the IPO window to be open — two independent binary conditions that must both be satisfied simultaneously.", dataPoint: "Multiple expansion 0.98× of 2.1× total value created; exit route IPO; exit multiple 18.0× (FLAG: >15×)", isFactual: false },
        { point: "With only 1.5pp of margin expansion assumed (27.6% → 29.0%), there is minimal operational buffer — if the rerating fails, there is no secondary value creation lever to fall back on.", dataPoint: "Margin expansion: 0.08× MOIC; EBITDA margin delta +1.4pp; margin expansion is the smallest driver in the portfolio", isFactual: false },
      ],
      icQuestion: "What is your specific contingency plan for a 24-month IPO window closure following FDA clearance, and at what exit multiple via trade sale does this deal still return 2.0× to LPs?",
    },
    {
      dealName: "Veridian Industrials",
      returnDrivers: [
        { driver: "Margin Expansion", magnitude: "high", dataPoint: "1.42× MOIC — largest single attribution across all three deals; 14.3% → 24.0% EBITDA margin (+970bps)", isFactual: true },
        { driver: "Multiple Expansion", magnitude: "medium", dataPoint: "0.71× MOIC; entry 13.9× → exit 9.5× — multiple compression at exit, implying sector de-rating must be partially offset by operational credibility", isFactual: true },
        { driver: "Revenue Growth", magnitude: "medium", dataPoint: "0.45× MOIC; 14.0% CAGR, 85% organic — highest organic intensity in the set", isFactual: true },
        { driver: "Leverage Paydown", magnitude: "low", dataPoint: "0.28× MOIC — constrained by stressed coverage ratio limiting accelerated paydown", isFactual: true },
      ],
      strengths: [
        { point: "Management alignment is the strongest in the portfolio, with a skin-in-game score of 9/10 — critical for a turnaround where incentive alignment between sponsor and management is the primary execution risk mitigant.", dataPoint: "Skin in Game 9/10; Alignment 9/10", isFactual: true },
        { point: "The exit multiple assumption of 9.5× is the most conservative in the portfolio and implies no sector re-rating — the return is entirely earned through operational delivery rather than market conditions.", dataPoint: "Exit multiple 9.5×; multiple expansion 0.71× driven by entry-exit spread", isFactual: true },
        { point: "At a 3.8× MOIC, this is the highest returning deal in absolute terms, and the 3.2-year payback period is the fastest — providing the earliest DPI contribution to a fund.", dataPoint: "MOIC 3.8×; IRR 31.5%; payback 3.2 years", isFactual: true },
      ],
      fragilities: [
        { point: "The 970bps EBITDA margin improvement is the most ambitious operational assumption across all three deals — a shortfall of even 300bps would materially impair the return case given the levered capital structure with 5% covenant headroom.", dataPoint: "Assumption score 8.9/10; margin delta 14.3% → 24.0%; ND/EBITDA 7.0× (FLAG); covenant headroom 5%", isFactual: false },
        { point: "An interest coverage of 1.9× provides almost no buffer against EBITDA volatility — a 10% EBITDA miss would push coverage below 1.7×, likely triggering lender intervention on a Unitranche structure with limited amendment flexibility.", dataPoint: "Interest coverage 1.9×; Unitranche; ND/EBITDA 7.0×; refinancing risk High", isFactual: false },
      ],
      icQuestion: "Walk us through the specific operational initiatives that get you from 14.3% to 24.0% EBITDA margin — in what sequence, over what timeline, and which initiative has the largest single risk of non-delivery?",
    },
  ],
  portfolioObservation: "This three-deal portfolio offers genuine return driver diversification — earnings growth, multiple expansion, and operational turnaround — which is analytically attractive but masks a material concentration in execution risk. All three deals are European mid-market with EUR-denominated returns, offering no currency or regional diversification. The portfolio is skewed toward the aggressive end of the assumption spectrum: the weighted average assumption aggressiveness score is approximately 7.6/10, and Veridian's stressed capital structure means a single deal impairment could disproportionately affect fund-level DPI. A balanced IC would likely require Veridian's leverage profile to be stress-tested under a downside scenario before committing alongside the other two.",
  bestRiskAdjustedCase: "Alpine Consumer Brands",
  bestRiskAdjustedRationale: "At 22.4% IRR and 2.8× MOIC, Alpine delivers the most grounded return profile in the set — entry below sector median, a diversified MOIC across five drivers rather than concentration in one, the deepest covenant headroom, and a trade sale exit that does not depend on capital markets conditions or a single regulatory event.",
};

// ─── Synthesis Panel ──────────────────────────────────────────────────────────
function SynthesisPanel({ deals, strategy, onBack }) {
  const [status, setStatus]       = useState("idle");
  const [synthesis, setSynthesis] = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [activeTab, setActiveTab] = useState("cross");
  const [showStrategy, setShowStrategy] = useState(false);
  const [strat, setStrat] = useState({
    ...strategy,
    // ── Mandate thresholds (analyst-set) ──────────────────────────────────────
    minIrr:         strategy.minIrr         ?? 20,
    minMoic:        strategy.minMoic        ?? 2.5,
    maxLeverage:    strategy.maxLeverage     ?? 6,
    maxAssumeScore: strategy.maxAssumeScore  ?? 7.5,
    // ── PE benchmark thresholds (editable, used as fallback) ─────────────────
    // Entry valuation: EV/EBITDA vs sector median
    bench_evDiscount:    -1.0,   // < this vs median → green (buying cheap)
    bench_evPremium:      1.5,   // > this vs median → red (paying up)
    // Return profile: IRR
    bench_irrGood:       25,     // ≥ → green
    bench_irrNeutral:    18,     // ≥ → amber, else red
    // Return profile: MOIC
    bench_moicGood:      3.0,
    bench_moicNeutral:   2.0,
    // Leverage: ND/EBITDA
    bench_levGood:       4.5,    // ≤ → green
    bench_levNeutral:    6.0,    // ≤ → amber, else red
    // Leverage: interest coverage
    bench_covGood:       3.0,    // ≥ → green
    bench_covNeutral:    2.0,    // ≥ → amber, else red
    // Revenue & Margin: assumption aggressiveness
    bench_aggrGood:      5.5,    // ≤ → green
    bench_aggrNeutral:   7.5,    // ≤ → amber, else red
    // Exit: exit multiple
    bench_exitGood:      12,     // ≤ → green
    bench_exitNeutral:   15,     // ≤ → amber, else red (FLAG threshold)
    // Mgmt & Sponsor: average score
    bench_mgmtGood:      7.5,    // ≥ → green
    bench_mgmtNeutral:   6.0,    // ≥ → amber, else red
  });

  function su(key) { return (val) => setStrat(prev => ({ ...prev, [key]: val })); }

  async function runSynthesis() {
    setStatus("loading");
    setSynthesis(null);
    setErrorMsg("");
    await new Promise(r => setTimeout(r, 1800));
    setSynthesis(FAKE_SYNTHESIS);
    setStatus("done");
    setActiveTab("heatmap");
  }

  // ── Mandate fit scoring ─────────────────────────────────────────────────────
  // Returns 0–100 for each deal against current strategy
  function mandateFit(deal) {
    let score = 100;
    const deductions = [];
    if (strat.minIrr && deal.irr < strat.minIrr) {
      const gap = strat.minIrr - deal.irr;
      score -= Math.min(30, gap * 2);
      deductions.push(`IRR ${deal.irr}% below ${strat.minIrr}% threshold`);
    }
    if (strat.minMoic && deal.moic < strat.minMoic) {
      const gap = strat.minMoic - deal.moic;
      score -= Math.min(25, gap * 15);
      deductions.push(`MOIC ${deal.moic}× below ${strat.minMoic}× threshold`);
    }
    if (strat.maxLeverage && deal.netDebtEbitda > strat.maxLeverage) {
      const gap = deal.netDebtEbitda - strat.maxLeverage;
      score -= Math.min(25, gap * 8);
      deductions.push(`ND/EBITDA ${deal.netDebtEbitda}× exceeds ${strat.maxLeverage}× limit`);
    }
    if (strat.maxAssumeScore && Number(deal.assumptionScore ?? calcScore(deal)) > strat.maxAssumeScore) {
      score -= 10;
      deductions.push(`Assumption score ${deal.assumptionScore ?? calcScore(deal)} exceeds ${strat.maxAssumeScore} limit`);
    }
    if (strat.preferredSectors?.length && !strat.preferredSectors.includes(deal.sector)) {
      score -= 10;
      deductions.push(`${deal.sector} not in preferred sectors`);
    }
    if (strat.preferredExitRoutes?.length && !strat.preferredExitRoutes.includes(deal.exitRoute)) {
      score -= 5;
      deductions.push(`${deal.exitRoute} not in preferred exit routes`);
    }
    return { score: Math.max(0, Math.round(score)), deductions };
  }

  function fitColor(score) {
    return score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  }
  function fitLabel(score) {
    return score >= 80 ? "ON MANDATE" : score >= 60 ? "BORDERLINE" : "OFF MANDATE";
  }

  // ── Heatmap scoring ─────────────────────────────────────────────────────────
  // Priority: mandate threshold (if set) → PE benchmark. Every cell carries a
  // `source` label so the analyst can see exactly what drove the colour.
  function scoreDeal(deal) {
    const ascore  = Number(deal.assumptionScore ?? calcScore(deal));
    const evDiff  = (deal.evEbitda && deal.sectorMedianEvEbitda) ? deal.evEbitda - deal.sectorMedianEvEbitda : null;
    const mgmtAvg = (deal.mgmtTrackRecord + deal.mgmtSkinInGame + deal.sponsorQuality + deal.alignment) / 4;
    const { score: fit } = mandateFit(deal);

    // Helper: pick rating + source string
    // mandateVal = the relevant mandate threshold if set, else null
    // benchGood / benchNeutral = PE benchmark fallback values
    // direction: "above" = higher is better, "below" = lower is better
    function rate(val, { mandateGood, mandateBad, benchGood, benchNeutral, direction }) {
      if (direction === "above") {
        // mandate overrides
        if (mandateGood != null && val >= mandateGood) return { rating: "good",    source: "Mandate" };
        if (mandateBad  != null && val <  mandateBad)  return { rating: "bad",     source: "Mandate" };
        // benchmark fallback
        if (val >= benchGood)    return { rating: "good",    source: "PE Benchmark" };
        if (val >= benchNeutral) return { rating: "neutral", source: "PE Benchmark" };
        return                          { rating: "bad",     source: "PE Benchmark" };
      } else {
        // lower is better
        if (mandateGood != null && val <= mandateGood) return { rating: "good",    source: "Mandate" };
        if (mandateBad  != null && val >  mandateBad)  return { rating: "bad",     source: "Mandate" };
        if (val <= benchGood)    return { rating: "good",    source: "PE Benchmark" };
        if (val <= benchNeutral) return { rating: "neutral", source: "PE Benchmark" };
        return                          { rating: "bad",     source: "PE Benchmark" };
      }
    }

    // 1. Entry Valuation — EV/EBITDA vs sector median (lower diff = better)
    const evCell = (() => {
      if (evDiff == null) return { rating: "neutral", source: "No benchmark" };
      if (evDiff < strat.bench_evDiscount) return { rating: "good",    source: "PE Benchmark" };
      if (evDiff > strat.bench_evPremium)  return { rating: "bad",     source: "PE Benchmark" };
      return                                      { rating: "neutral", source: "PE Benchmark" };
    })();

    // 2. Return Profile — mandate IRR first, then benchmark; MOIC as tiebreak
    const irrCell = rate(deal.irr, {
      mandateGood: strat.minIrr, mandateBad: strat.minIrr,
      benchGood: strat.bench_irrGood, benchNeutral: strat.bench_irrNeutral,
      direction: "above",
    });
    const moicCell = rate(deal.moic, {
      mandateGood: strat.minMoic, mandateBad: strat.minMoic,
      benchGood: strat.bench_moicGood, benchNeutral: strat.bench_moicNeutral,
      direction: "above",
    });
    // Combined: worst of IRR and MOIC wins
    const retRatings = [irrCell, moicCell];
    const retRank = r => r.rating === "bad" ? 0 : r.rating === "neutral" ? 1 : 2;
    const retCell = retRatings.sort((a, b) => retRank(a) - retRank(b))[0];

    // 3. Leverage — mandate cap first, then ND/EBITDA benchmark, interest coverage as colour modifier
    const levCell = rate(deal.netDebtEbitda, {
      mandateGood: null, mandateBad: strat.maxLeverage,
      benchGood: strat.bench_levGood, benchNeutral: strat.bench_levNeutral,
      direction: "below",
    });
    // Downgrade one step if interest coverage is also weak
    const covWeak = deal.interestCoverage < strat.bench_covNeutral;
    const covGood = deal.interestCoverage >= strat.bench_covGood;
    let finalLevRating = levCell.rating;
    let levSource = levCell.source;
    if (levCell.rating === "good" && covWeak)    { finalLevRating = "neutral"; levSource += " + Coverage"; }
    if (levCell.rating === "neutral" && covWeak) { finalLevRating = "bad";     levSource += " + Coverage (PE Benchmark)"; }

    // 4. Revenue & Margin — assumption aggressiveness: mandate cap first
    const aggrCell = rate(ascore, {
      mandateGood: null, mandateBad: strat.maxAssumeScore,
      benchGood: strat.bench_aggrGood, benchNeutral: strat.bench_aggrNeutral,
      direction: "below",
    });

    // 5. Exit — exit multiple
    const exitCell = rate(deal.exitMultiple, {
      mandateGood: null, mandateBad: null,
      benchGood: strat.bench_exitGood, benchNeutral: strat.bench_exitNeutral,
      direction: "below",
    });

    // 6. Mgmt & Sponsor — average score
    const mgmtCell = rate(mgmtAvg, {
      mandateGood: null, mandateBad: null,
      benchGood: strat.bench_mgmtGood, benchNeutral: strat.bench_mgmtNeutral,
      direction: "above",
    });

    // 7. Mandate Fit
    const fitCell = { rating: fit >= 80 ? "good" : fit >= 60 ? "neutral" : "bad", source: "Mandate" };

    return [
      { dim: "Entry Valuation",  value: `${fmt(deal.evEbitda)}×`,        sub: evDiff != null ? `${evDiff > 0 ? "+" : ""}${fmt(evDiff)}× vs median` : "No median set", source: evCell.source,   rating: evCell.rating },
      { dim: "Return Profile",   value: `${fmt(deal.irr)}% IRR`,         sub: `${fmt(deal.moic)}× MOIC`,                                                               source: retCell.source,  rating: retCell.rating },
      { dim: "Leverage",         value: `${fmt(deal.netDebtEbitda)}×`,   sub: `${fmt(deal.interestCoverage)}× coverage · ${deal.covenantProximity}% headroom`,          source: levSource,       rating: finalLevRating },
      { dim: "Revenue & Margin", value: `Score ${ascore}/10`,            sub: `${fmt(deal.exitCagr)}% CAGR · +${fmt(deal.ebitdaMarginExit - deal.ebitdaMarginEntry)}pp`, source: aggrCell.source, rating: aggrCell.rating },
      { dim: "Exit Assumptions", value: `${fmt(deal.exitMultiple)}× exit`, sub: deal.exitRoute,                                                                        source: exitCell.source, rating: exitCell.rating },
      { dim: "Mgmt & Sponsor",   value: `${fmt(mgmtAvg, 1)}/10 avg`,    sub: `Track ${deal.mgmtTrackRecord} · Skin ${deal.mgmtSkinInGame} · Align ${deal.alignment}`, source: mgmtCell.source, rating: mgmtCell.rating },
      { dim: "Mandate Fit",      value: `${fit}%`,                       sub: fitLabel(fit),                                                                           source: fitCell.source,  rating: fitCell.rating },
    ];
  }

  const ratingStyles = {
    good:    { bg: "#E8F5EE", border: "#a8d5b8", text: "#1a6b3a", accent: "#1a6b3a" },
    neutral: { bg: "#FEF5E7", border: "#f0d080", text: "#7a5200", accent: "#C8692A" },
    warn:    { bg: "#FEF5E7", border: "#f0d080", text: "#7a5200", accent: "#C8692A" },
    bad:     { bg: "#FEECEC", border: "#f5c6c6", text: "#7a1a1a", accent: "#c0392b" },
  };

  // ── Sub-components ──────────────────────────────────────────────────────────
  function Tag({ isFactual }) {
    return (
      <span style={{ display: "inline-block", fontSize: "9px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "20px", marginLeft: "6px", verticalAlign: "middle", flexShrink: 0, background: isFactual ? "#E8F5EE" : "#FEF5E7", color: isFactual ? "#1a6b3a" : "#7a5200", border: `0.5px solid ${isFactual ? "#a8d5b8" : "#f0d080"}` }}>
        {isFactual ? "DATA" : "INFERENCE"}
      </span>
    );
  }
  function SectionLabel({ children }) {
    return <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#888888", marginBottom: "10px" }}>{children}</div>;
  }
  function NarrativeBlock({ label, text }) {
    return (
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, color: "#0F2744", marginBottom: "5px", letterSpacing: "0.02em" }}>{label}</div>
        <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.7", color: "#555555" }}>{text}</p>
      </div>
    );
  }
  function MagnitudePip({ magnitude }) {
    const cols = { high: "#7a1a1a", medium: "#7a5200", low: "#1a6b3a" };
    const col = cols[magnitude] || "#888888";
    return (
      <span style={{ display: "inline-flex", gap: "2px", alignItems: "center", marginLeft: "6px" }}>
        {["high", "medium", "low"].map((lvl, i) => (
          <span key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: (magnitude === "high" && i <= 2) || (magnitude === "medium" && i <= 1) || (magnitude === "low" && i <= 0) ? col : "#E8E5DE" }} />
        ))}
      </span>
    );
  }

  // ── Strategy drawer ─────────────────────────────────────────────────────────
  function StrategyDrawer() {
    const SI = ({ label, children, hint }) => (
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888888", marginBottom: "4px" }}>{label}</div>
        {children}
        {hint && <div style={{ fontSize: "9px", color: "#888888", marginTop: "2px" }}>{hint}</div>}
      </div>
    );
    const inpStyle = { width: "100%", background: "#F7F5F1", border: "0.5px solid #E8E5DE", borderRadius: "8px", padding: "5px 9px", fontSize: "12px", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
    const numInp = (key, min, max, step = 0.5) => (
      <input type="number" value={strat[key] ?? ""} min={min} max={max} step={step}
        onChange={e => su(key)(e.target.value === "" ? "" : parseFloat(e.target.value))}
        style={inpStyle}
        onFocus={e => (e.target.style.borderColor = "#C8692A")} onBlur={e => (e.target.style.borderColor = "#E8E5DE")} />
    );
    const FUND_TYPES = ["Buyout", "Growth Equity", "Turnaround / Special Situations", "Distressed", "Venture", "Infrastructure"];
    return (
      <div style={{ background: "#ffffff", borderBottom: "0.5px solid #E8E5DE", overflowY: "auto", maxHeight: "420px" }}>
        {/* ── Section 1: Fund Mandate ── */}
        <div style={{ padding: "16px 28px 4px", borderBottom: "0.5px solid #F7F5F1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A3A12", background: "#FBF0E9", border: "0.5px solid #C8692A40", borderRadius: "20px", padding: "2px 8px" }}>⚑ MANDATE</span>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#0F2744" }}>Fund Parameters</span>
            <span style={{ fontSize: "11px", color: "#888888" }}>— override benchmarks when set</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0 20px", marginBottom: "8px" }}>
            <SI label="Fund Name">
              <input value={strat.fundName ?? ""} onChange={e => su("fundName")(e.target.value)} style={inpStyle}
                onFocus={e => (e.target.style.borderColor = "#C8692A")} onBlur={e => (e.target.style.borderColor = "#E8E5DE")} />
            </SI>
            <SI label="Fund Strategy">
              <select value={strat.fundType ?? ""} onChange={e => su("fundType")(e.target.value)}
                style={{ ...inpStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                {FUND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </SI>
            <SI label="Min Target IRR (%)" hint="Colours Return Profile row">{numInp("minIrr", 0, 100, 1)}</SI>
            <SI label="Min Target MOIC (×)" hint="Colours Return Profile row">{numInp("minMoic", 0, 10, 0.1)}</SI>
            <SI label="Max Leverage ND/EBITDA" hint="Colours Leverage row">{numInp("maxLeverage", 0, 15, 0.5)}</SI>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 20px", marginBottom: "12px" }}>
            <SI label="Max Assumption Score /10" hint="Colours Revenue & Margin row">{numInp("maxAssumeScore", 0, 10, 0.5)}</SI>
            <SI label="Preferred Sectors" hint="Affects mandate fit %">
              <input value={(strat.preferredSectors || []).join(", ")} onChange={e => su("preferredSectors")(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} style={inpStyle}
                onFocus={e => (e.target.style.borderColor = "#C8692A")} onBlur={e => (e.target.style.borderColor = "#E8E5DE")} />
            </SI>
            <SI label="Preferred Geographies">
              <input value={(strat.geographies || []).join(", ")} onChange={e => su("geographies")(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} style={inpStyle}
                onFocus={e => (e.target.style.borderColor = "#C8692A")} onBlur={e => (e.target.style.borderColor = "#E8E5DE")} />
            </SI>
            <SI label="Preferred Exit Routes">
              <input value={(strat.preferredExitRoutes || []).join(", ")} onChange={e => su("preferredExitRoutes")(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} style={inpStyle}
                onFocus={e => (e.target.style.borderColor = "#C8692A")} onBlur={e => (e.target.style.borderColor = "#E8E5DE")} />
            </SI>
          </div>
          <SI label="Investment Strategy Notes">
            <textarea value={strat.notes ?? ""} onChange={e => su("notes")(e.target.value)} rows={2}
              style={{ ...inpStyle, resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = "#C8692A")} onBlur={e => (e.target.style.borderColor = "#E8E5DE")} />
          </SI>
        </div>

        {/* ── Section 2: PE Benchmarks ── */}
        <div style={{ padding: "16px 28px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555555", background: "#F2F0EC", border: "0.5px solid #E8E5DE", borderRadius: "20px", padding: "2px 8px" }}>~ BENCHMARK</span>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#0F2744" }}>PE Sector Benchmarks</span>
            <span style={{ fontSize: "11px", color: "#888888" }}>— used where no mandate threshold is set · typical mid-market buyout ranges</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0 20px" }}>
            {/* Entry valuation */}
            <div>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", paddingBottom: "4px", borderBottom: "0.5px solid #E8E5DE" }}>Entry Valuation</div>
              <SI label="Green if EV/EBITDA ≤ median by" hint="× below sector median">{numInp("bench_evDiscount", -5, 0, 0.5)}</SI>
              <SI label="Red if EV/EBITDA ≥ median by" hint="× above sector median">{numInp("bench_evPremium", 0, 10, 0.5)}</SI>
            </div>
            {/* Return profile */}
            <div>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", paddingBottom: "4px", borderBottom: "0.5px solid #E8E5DE" }}>Return Profile</div>
              <SI label="IRR green threshold (%)">{numInp("bench_irrGood", 0, 100, 1)}</SI>
              <SI label="IRR amber threshold (%)">{numInp("bench_irrNeutral", 0, 100, 1)}</SI>
              <SI label="MOIC green threshold (×)">{numInp("bench_moicGood", 0, 10, 0.1)}</SI>
              <SI label="MOIC amber threshold (×)">{numInp("bench_moicNeutral", 0, 10, 0.1)}</SI>
            </div>
            {/* Leverage */}
            <div>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", paddingBottom: "4px", borderBottom: "0.5px solid #E8E5DE" }}>Leverage</div>
              <SI label="ND/EBITDA green ≤ (×)">{numInp("bench_levGood", 0, 15, 0.5)}</SI>
              <SI label="ND/EBITDA amber ≤ (×)">{numInp("bench_levNeutral", 0, 15, 0.5)}</SI>
              <SI label="Int. coverage green ≥ (×)">{numInp("bench_covGood", 0, 10, 0.5)}</SI>
              <SI label="Int. coverage amber ≥ (×)">{numInp("bench_covNeutral", 0, 10, 0.5)}</SI>
            </div>
            {/* Assumptions + Exit */}
            <div>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", paddingBottom: "4px", borderBottom: "0.5px solid #E8E5DE" }}>Assumptions & Exit</div>
              <SI label="Aggr. score green ≤ /10">{numInp("bench_aggrGood", 0, 10, 0.5)}</SI>
              <SI label="Aggr. score amber ≤ /10">{numInp("bench_aggrNeutral", 0, 10, 0.5)}</SI>
              <SI label="Exit multiple green ≤ (×)">{numInp("bench_exitGood", 0, 30, 0.5)}</SI>
              <SI label="Exit multiple amber ≤ (×)">{numInp("bench_exitNeutral", 0, 30, 0.5)}</SI>
            </div>
            {/* Mgmt */}
            <div>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", paddingBottom: "4px", borderBottom: "0.5px solid #E8E5DE" }}>Mgmt & Sponsor</div>
              <SI label="Avg score green ≥ /10">{numInp("bench_mgmtGood", 0, 10, 0.5)}</SI>
              <SI label="Avg score amber ≥ /10">{numInp("bench_mgmtNeutral", 0, 10, 0.5)}</SI>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Heatmap tab ─────────────────────────────────────────────────────────────
  function HeatmapTab() {
    const DIMS = ["Entry Valuation", "Return Profile", "Leverage", "Revenue & Margin", "Exit Assumptions", "Mgmt & Sponsor", "Mandate Fit"];
    const scoredDeals = deals.map(d => ({ deal: d, rows: scoreDeal(d), fit: mandateFit(d) }));

    function overallRating(rows) {
      const goods = rows.filter(r => r.rating === "good").length;
      return goods >= 5 ? "good" : goods >= 3 ? "neutral" : "bad";
    }

    return (
      <div style={{ padding: "24px 28px", overflowX: "auto" }}>
        {/* Strategy context banner */}
        <div style={{
          background: "#0F2744", border: "0.5px solid #1a3557", borderRadius: "12px",
          padding: "14px 20px", marginBottom: "20px",
          display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Evaluating against mandate</div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", marginTop: "2px" }}>{strat.fundName} · {strat.fundType}</div>
          </div>
          <div style={{ width: "0.5px", height: "32px", background: "rgba(255,255,255,0.15)" }} />
          {[
            ["Min IRR", `≥${strat.minIrr}%`],
            ["Min MOIC", `≥${strat.minMoic}×`],
            ["Max Leverage", `≤${strat.maxLeverage}×`],
            ["Max Aggr.", `≤${strat.maxAssumeScore}/10`],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#C8692A" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div style={{ background: "#ffffff", border: "0.5px solid #E8E5DE", borderRadius: "12px", overflow: "hidden" }}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${deals.length}, 1fr)`, borderBottom: "0.5px solid #E8E5DE", background: "#F7F5F1" }}>
            <div style={{ padding: "10px 14px", borderRight: "0.5px solid #E8E5DE" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#888888" }}>Dimension</div>
            </div>
            {scoredDeals.map(({ deal, rows, fit }, i) => {
              return (
                <div key={deal.id} style={{ padding: "10px 12px", borderRight: i < deals.length - 1 ? "0.5px solid #E8E5DE" : "none", borderLeft: `3px solid ${DEAL_COLORS[i]}` }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F2744", marginBottom: "5px" }}>{deal.name}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: fitColor(fit.score) === "#22c55e" ? "#E8F5EE" : fitColor(fit.score) === "#f59e0b" ? "#FEF5E7" : "#FEECEC", border: `0.5px solid ${fitColor(fit.score)}40`, borderRadius: "20px", padding: "2px 8px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: fitColor(fit.score) === "#22c55e" ? "#1a6b3a" : fitColor(fit.score) === "#f59e0b" ? "#7a5200" : "#7a1a1a", flexShrink: 0 }} />
                    <span style={{ fontSize: "9px", fontWeight: 500, color: fitColor(fit.score) === "#22c55e" ? "#1a6b3a" : fitColor(fit.score) === "#f59e0b" ? "#7a5200" : "#7a1a1a", letterSpacing: "0.06em" }}>{fitLabel(fit.score)} · {fit.score}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dimension rows */}
          {DIMS.map((dim, di) => (
            <div key={dim} style={{
              display: "grid",
              gridTemplateColumns: `180px repeat(${deals.length}, 1fr)`,
              borderBottom: di < DIMS.length - 1 ? "0.5px solid #E8E5DE" : "none",
            }}>
              {/* Row label */}
              <div style={{
                padding: "12px 14px", borderRight: "0.5px solid #E8E5DE",
                display: "flex", alignItems: "center", background: di % 2 === 0 ? "#ffffff" : "#F7F5F1",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "#555555" }}>{dim}</div>
              </div>
              {/* Cells */}
              {scoredDeals.map(({ deal, rows }, i) => {
                const cell = rows[di];
                const rs = ratingStyles[cell.rating] || ratingStyles.neutral;
                const isMandateRow = dim === "Mandate Fit";
                return (
                  <div key={deal.id} style={{
                    padding: "10px 12px",
                    borderRight: i < deals.length - 1 ? "0.5px solid #f1f5f9" : "none",
                    background: i % 2 === 0 ? "#fff" : "#fafbfc",
                    position: "relative",
                  }}>
                    {/* Colour accent bar on left */}
                    <div style={{ position: "absolute", left: 0, top: "8px", bottom: "8px", width: "3px", background: rs.accent, borderRadius: "0 2px 2px 0" }} />
                    <div style={{ paddingLeft: "8px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: rs.text, fontFamily: "monospace", marginBottom: "2px" }}>{cell.value}</div>
                      <div style={{ fontSize: "9px", color: "#94a3b8" }}>{cell.sub}</div>
                      {/* Source tag — always visible */}
                      <div style={{ marginTop: "3px", display: "inline-flex", alignItems: "center", gap: "3px", background: cell.source === "Mandate" ? "#eff6ff" : "#f8fafc", border: `0.5px solid ${cell.source === "Mandate" ? "#bfdbfe" : "#e2e8f0"}`, borderRadius: "3px", padding: "1px 5px" }}>
                        <span style={{ fontSize: "8px", fontWeight: 700, color: cell.source === "Mandate" ? "#1d4ed8" : "#64748b", letterSpacing: "0.06em" }}>
                          {cell.source === "Mandate" ? "⚑ MANDATE" : "~ BENCHMARK"}
                        </span>
                      </div>
                      {/* Mandate row: show deductions */}
                      {isMandateRow && mandateFit(deal).deductions.length > 0 && (
                        <div style={{ marginTop: "4px" }}>
                          {mandateFit(deal).deductions.map((d, idx) => (
                            <div key={idx} style={{ fontSize: "8px", color: "#ef4444", display: "flex", alignItems: "flex-start", gap: "3px", marginTop: "2px" }}>
                              <span style={{ flexShrink: 0 }}>·</span>{d}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${deals.length}, 1fr)`, background: "#f0f4f8", borderTop: "0.5px solid #e2e8f0" }}>
            <div style={{ padding: "10px 14px", borderRight: "0.5px solid #e2e8f0", display: "flex", alignItems: "center" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569" }}>Overall Signal</div>
            </div>
            {scoredDeals.map(({ deal, rows }, i) => {
              const goods = rows.filter(r => r.rating === "good").length;
              const bads  = rows.filter(r => r.rating === "bad").length;
              const overall = overallRating(rows);
              const rs = ratingStyles[overall];
              return (
                <div key={deal.id} style={{ padding: "10px 12px", borderRight: i < deals.length - 1 ? "0.5px solid #e2e8f0" : "none" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                    {rows.map((r, ri) => (
                      <div key={ri} style={{ flex: 1, height: "5px", borderRadius: "2px", background: ratingStyles[r.rating]?.accent || "#e2e8f0" }} title={r.dim} />
                    ))}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: rs.text }}>
                    {goods} green · {bads} red
                  </div>
                  <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "1px" }}>out of {rows.length} dimensions</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "20px", marginTop: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "#888888", letterSpacing: "0.09em", textTransform: "uppercase" }}>Colour</div>
          {[["good", "#E8F5EE", "#1a6b3a", "Conservative / On-target"], ["neutral", "#FEF5E7", "#7a5200", "Borderline / Elevated"], ["bad", "#FEECEC", "#7a1a1a", "Aggressive / Below threshold"]].map(([rating, bg, col, label]) => (
            <div key={rating} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", background: bg, border: `0.5px solid ${col}40`, borderRadius: "3px" }} />
              <span style={{ fontSize: "11px", color: "#555555" }}>{label}</span>
            </div>
          ))}
          <div style={{ width: "0.5px", height: "16px", background: "#E8E5DE" }} />
          <div style={{ fontSize: "10px", fontWeight: 600, color: "#888888", letterSpacing: "0.09em", textTransform: "uppercase" }}>Source</div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "9px", fontWeight: 500, color: "#7A3A12", background: "#FBF0E9", border: "0.5px solid #C8692A40", borderRadius: "20px", padding: "1px 7px" }}>⚑ MANDATE</span>
            <span style={{ fontSize: "11px", color: "#555555" }}>Your fund parameters drove this colour</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "9px", fontWeight: 500, color: "#555555", background: "#F2F0EC", border: "0.5px solid #E8E5DE", borderRadius: "20px", padding: "1px 7px" }}>~ BENCHMARK</span>
            <span style={{ fontSize: "11px", color: "#555555" }}>PE sector benchmark applied (editable in ⚙ Strategy)</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Cross-deal tab ──────────────────────────────────────────────────────────
  function CrossDealTab({ data }) {
    const sections = [
      ["Return Driver Comparison", data.returnDriverComparison],
      ["Valuation Context",        data.valuationContext],
      ["Leverage & Downside Risk", data.leverageRisk],
      ["Assumption Quality",       data.assumptionQuality],
    ];
    return (
      <div style={{ padding: "28px 32px", maxWidth: "820px" }}>
        <div style={{ background: "#ffffff", border: "0.5px solid #E8E5DE", borderRadius: "12px", padding: "24px 28px", marginBottom: "20px" }}>
          <SectionLabel>Cross-Deal Analysis</SectionLabel>
          {sections.map(([label, text]) => <NarrativeBlock key={label} label={label} text={text} />)}
        </div>
        <div style={{ background: "#0F2744", border: "0.5px solid #1a3557", borderRadius: "12px", padding: "20px 24px", marginBottom: "20px" }}>
          <SectionLabel>Portfolio Observation</SectionLabel>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.7", color: "rgba(255,255,255,0.75)" }}>{synthesis.portfolioObservation}</p>
        </div>
        <div style={{ background: "#E8F5EE", border: "0.5px solid #a8d5b8", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ fontSize: "20px", flexShrink: 0 }}>★</div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#1a6b3a", marginBottom: "4px" }}>Best Risk-Adjusted Return</div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#0F2744", marginBottom: "4px" }}>{synthesis.bestRiskAdjustedCase}</div>
            <div style={{ fontSize: "13px", color: "#555555", lineHeight: "1.65" }}>{synthesis.bestRiskAdjustedRationale}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Per-deal tab ────────────────────────────────────────────────────────────
  function DealsTab({ analyses }) {
    const [activeDeal, setActiveDeal] = useState(0);
    const da = analyses[activeDeal];
    const dealColor = DEAL_COLORS[activeDeal] || "#C8692A";
    return (
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        <div style={{ width: "200px", flexShrink: 0, borderRight: "0.5px solid #E8E5DE", overflowY: "auto", padding: "16px 12px", background: "#ffffff" }}>
          <SectionLabel>Select Deal</SectionLabel>
          {analyses.map((da, i) => (
            <div key={i} onClick={() => setActiveDeal(i)} style={{ padding: "8px 10px", marginBottom: "5px", cursor: "pointer", borderRadius: "8px", borderLeft: `3px solid ${activeDeal === i ? DEAL_COLORS[i] : "transparent"}`, background: activeDeal === i ? "#FBF0E9" : "transparent" }}>
              <div style={{ fontSize: "13px", fontWeight: activeDeal === i ? 500 : 400, color: activeDeal === i ? "#0F2744" : "#888888" }}>{da.dealName}</div>
              <div style={{ fontSize: "10px", color: fitColor(mandateFit(deals[i]).score) === "#22c55e" ? "#1a6b3a" : fitColor(mandateFit(deals[i]).score) === "#f59e0b" ? "#7a5200" : "#7a1a1a", marginTop: "2px", fontWeight: 500 }}>
                {fitLabel(mandateFit(deals[i]).score)} · {mandateFit(deals[i]).score}%
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
            <div style={{ width: "3px", height: "32px", background: dealColor, borderRadius: "2px", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "16px", fontWeight: 500, color: "#0F2744" }}>{da.dealName}</div>
              <div style={{ fontSize: "11px", color: "#888888", marginTop: "2px" }}>Deal-level synthesis</div>
            </div>
          </div>
          <div style={{ background: "#ffffff", border: "0.5px solid #E8E5DE", borderRadius: "12px", padding: "18px 20px", marginBottom: "14px" }}>
            <SectionLabel>Return Drivers</SectionLabel>
            {da.returnDrivers?.map((rd, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 0", borderBottom: i < da.returnDrivers.length - 1 ? "0.5px solid #E8E5DE" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "3px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: dealColor }}>{rd.driver}</span>
                    <MagnitudePip magnitude={rd.magnitude} />
                    <Tag isFactual={rd.isFactual} />
                  </div>
                  <div style={{ fontSize: "11px", color: "#888888" }}>{rd.dataPoint}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#ffffff", border: "0.5px solid #E8E5DE", borderRadius: "12px", padding: "18px 20px", marginBottom: "14px" }}>
            <SectionLabel>Strengths</SectionLabel>
            {da.strengths?.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <span style={{ color: "#1a6b3a", fontSize: "12px", flexShrink: 0, marginTop: "1px" }}>✓</span>
                <div>
                  <div style={{ display: "inline", fontSize: "13px", lineHeight: "1.65", color: "#555555" }}>{s.point}</div>
                  <Tag isFactual={s.isFactual} />
                  <div style={{ fontSize: "11px", color: "#888888", marginTop: "2px" }}>{s.dataPoint}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#FEECEC", border: "0.5px solid #f5c6c6", borderRadius: "12px", padding: "18px 20px", marginBottom: "14px" }}>
            <SectionLabel>Fragilities & Risks</SectionLabel>
            {da.fragilities?.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <span style={{ color: "#7a1a1a", fontSize: "12px", flexShrink: 0, marginTop: "1px" }}>⚠</span>
                <div>
                  <div style={{ display: "inline", fontSize: "13px", lineHeight: "1.65", color: "#7a1a1a" }}>{f.point}</div>
                  <Tag isFactual={f.isFactual} />
                  <div style={{ fontSize: "11px", color: "#7a1a1a", marginTop: "2px" }}>{f.dataPoint}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#0F2744", border: "0.5px solid #1a3557", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ fontSize: "18px", flexShrink: 0, color: "#C8692A" }}>?</div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Key IC Question</div>
              <div style={{ fontSize: "13px", lineHeight: "1.65", color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>"{da.icQuestion}"</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Legend ──────────────────────────────────────────────────────────────────
  function Legend() {
    return (
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {[{ bg: "#E8F5EE", border: "#a8d5b8", col: "#1a6b3a", label: "DATA — directly from inputs" }, { bg: "#FEF5E7", border: "#f0d080", col: "#7a5200", label: "INFERENCE — AI analytical judgement" }].map(({ bg, border, col, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "20px", background: bg, color: col, border: `0.5px solid ${border}` }}>{label.split(" — ")[0]}</span>
            <span style={{ fontSize: "10px", color: "#888888" }}>{label.split(" — ")[1]}</span>
          </div>
        ))}
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", overflow: "hidden" }}>
      {/* Sub-header */}
      <div style={{ background: "#ffffff", borderBottom: "0.5px solid #E8E5DE", padding: "12px 24px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 500, color: "#0F2744" }}>AI Synthesis</div>
          <div style={{ fontSize: "12px", color: "#888888", marginTop: "2px" }}>
            {deals.length} deals · {strat.fundName} ({strat.fundType}) · Every statement tagged DATA or INFERENCE
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Legend />
          <button onClick={() => setShowStrategy(s => !s)} style={{
            padding: "8px 14px", background: showStrategy ? "#FBF0E9" : "#ffffff",
            border: `0.5px solid ${showStrategy ? "#C8692A" : "#E8E5DE"}`,
            borderRadius: "8px", fontSize: "12px", cursor: "pointer",
            color: showStrategy ? "#7A3A12" : "#555555", fontWeight: showStrategy ? 500 : 400,
            marginLeft: "12px",
          }}>
            ⚙ Investment Strategy {showStrategy ? "▲" : "▼"}
          </button>
          <button onClick={onBack} style={{
            padding: "8px 17px", background: "#ffffff", color: "#0F2744",
            border: "1px solid #E8E5DE", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F7F5F1")}
            onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
          >← Comparison</button>
          <button onClick={runSynthesis} disabled={status === "loading"} style={{
            padding: "9px 18px", background: status === "loading" ? "#E8E5DE" : "#C8692A",
            color: status === "loading" ? "#888888" : "#fff",
            border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
            cursor: status === "loading" ? "not-allowed" : "pointer",
          }}
            onMouseEnter={e => { if (status !== "loading") e.currentTarget.style.background = "#A85520"; }}
            onMouseLeave={e => { if (status !== "loading") e.currentTarget.style.background = "#C8692A"; }}
          >
            {status === "loading" ? "Generating…" : status === "done" ? "↺ Regenerate" : "Generate Synthesis"}
          </button>
        </div>
      </div>

      {/* Strategy drawer */}
      {showStrategy && <StrategyDrawer />}

      {/* Tab bar */}
      {status === "done" && synthesis && (
        <div style={{ background: "#ffffff", borderBottom: "0.5px solid #E8E5DE", padding: "0 24px", display: "flex", flexShrink: 0 }}>
          {[["heatmap", "Deal Scorecard"], ["cross", "Cross-Deal Analysis"], ["deals", `Deal Profiles (${deals.length})`]].map(([key, label]) => (
            <div key={key} onClick={() => setActiveTab(key)} style={{
              padding: "10px 18px", cursor: "pointer", fontSize: "13px",
              fontWeight: activeTab === key ? 500 : 400,
              color: activeTab === key ? "#0F2744" : "#888888",
              borderBottom: activeTab === key ? `2px solid #C8692A` : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: status === "done" && activeTab === "deals" ? "hidden" : "auto", background: "#F7F5F1" }}>
        {status === "idle" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "20px" }}>
            <div style={{ textAlign: "center", maxWidth: "500px" }}>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "#0F2744", marginBottom: "10px", letterSpacing: "-0.01em" }}>AI Synthesis Panel</div>
              <div style={{ fontSize: "13px", color: "#555555", lineHeight: "1.7", marginBottom: "16px" }}>
                Analyse all {deals.length} deals against your investment mandate — scoring each across six dimensions, identifying return drivers and fragilities, and flagging mandate fit.
              </div>
              <div style={{ background: "#ffffff", border: "0.5px solid #E8E5DE", borderRadius: "12px", padding: "14px 18px", marginBottom: "16px", textAlign: "left" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#888888", marginBottom: "8px" }}>Current Mandate</div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F2744", marginBottom: "6px" }}>{strat.fundName} · {strat.fundType}</div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {[["Min IRR", `${strat.minIrr}%`], ["Min MOIC", `${strat.minMoic}×`], ["Max Leverage", `${strat.maxLeverage}×`]].map(([l, v]) => (
                    <div key={l} style={{ fontSize: "10px", color: "#64748b" }}>{l}: <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>{v}</strong></div>
                  ))}
                </div>
                <button onClick={() => setShowStrategy(s => !s)} style={{ marginTop: "8px", fontSize: "11px", color: "#C8692A", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                  Edit strategy parameters ↗
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left", background: "#ffffff", border: "0.5px solid #E8E5DE", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px" }}>
                {["Deal Scorecard Heatmap — 7-dimension colour grid with mandate fit scoring", "Cross-deal return driver comparison and valuation context", "Per-deal strengths, fragilities, and sharpest IC question", "Portfolio-level observation and best risk-adjusted pick"].map(item => (
                  <div key={item} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "#555555" }}>
                    <span style={{ color: "#C8692A", fontWeight: 500, flexShrink: 0 }}>→</span> {item}
                  </div>
                ))}
              </div>
              <button onClick={runSynthesis} style={{
                padding: "9px 28px", background: "#C8692A", color: "#fff",
                border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "#A85520")}
                onMouseLeave={e => (e.currentTarget.style.background = "#C8692A")}
              >
                Generate Synthesis
              </button>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C8692A", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <div style={{ fontSize: "13px", color: "#888888" }}>Scoring {deals.length} deals against {strat.fundName} mandate…</div>
            <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
          </div>
        )}

        {status === "error" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "13px", color: "#7a1a1a", maxWidth: "400px", textAlign: "center" }}>{errorMsg}</div>
            <button onClick={runSynthesis} style={{ padding: "9px 18px", background: "#C8692A", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#A85520")}
              onMouseLeave={e => (e.currentTarget.style.background = "#C8692A")}
            >Retry</button>
          </div>
        )}

        {status === "done" && synthesis && (
          <>
            {activeTab === "heatmap" && <HeatmapTab />}
            {activeTab === "cross"   && <CrossDealTab data={synthesis.crossDealNarrative} />}
            {activeTab === "deals"   && <DealsTab analyses={synthesis.dealAnalyses} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function ICLens() {
  const [screen, setScreen] = useState(1);
  const [deals, setDeals] = useState(SAMPLE_DEALS.map(d => ({ ...d })));
  const [activeDealId, setActiveDealId] = useState(SAMPLE_DEALS[0].id);
  const [strategy, setStrategy] = useState({
    fundName: "Meridian Capital Partners",
    fundType: "Buyout",
    minIrr: 20,
    minMoic: 2.5,
    maxLeverage: 6,
    preferredSectors: ["Consumer & Retail", "Industrials & Manufacturing"],
    excludedSectors: [],
    geographies: ["Western Europe", "DACH"],
    preferredExitRoutes: ["Trade Sale", "Secondary Buyout"],
    maxAssumeScore: 7.5,
    notes: "Mid-market European buyout fund targeting €150m–€800m EV transactions. Bias toward asset-light business models with defensible market positions. Avoid highly cyclical or single-product companies. ESG screening applied at entry.",
  });
  const nextId = Math.max(...deals.map(d => d.id)) + 1;
  const activeDeal = deals.find(d => d.id === activeDealId);

  function updateDeal(updated) { setDeals(prev => prev.map(d => d.id === updated.id ? updated : d)); }
  function addDeal() {
    const id = nextId;
    setDeals(prev => [...prev, {
      id, name: "", sector: "", geography: "", currency: "EUR", vintage: "2024", holdingPeriod: 5,
      ev: "", ebitda: "", revenue: "", evEbitda: "", evRevenue: "", sectorMedianEvEbitda: "",
      irr: "", moic: "", payback: "",
      attr_entryPrice: "", attr_revenueGrowth: "", attr_marginExpansion: "", attr_multipleExpansion: "", attr_leveragePaydown: "",
      netDebt: "", netDebtEbitda: "", interestCoverage: "", debtType: "", covenantProximity: "", refinancingRisk: "",
      entryCagr: 0, exitCagr: "", ebitdaMarginEntry: "", ebitdaMarginExit: "", organicGrowthSplit: 100, assumptionScore: "",
      exitMultiple: "", exitMultipleSensPlus: "", exitMultipleSensMinus: "", exitRoute: "", exitEbitda: "", impliedExitEv: "",
      mgmtTrackRecord: 5, mgmtSkinInGame: 5, sponsorQuality: 5, alignment: 5, notes: "", fragility: "",
    }]);
    setActiveDealId(id);
  }
  function removeDeal(id) {
    const remaining = deals.filter(d => d.id !== id);
    setDeals(remaining);
    if (activeDealId === id) setActiveDealId(remaining[0]?.id);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F1", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F7F5F1; }
        ::-webkit-scrollbar-thumb { background: #E8E5DE; border-radius: 2px; }
        input[type=range] { accent-color: #0F2744; }
      `}</style>

      {/* Header */}
      <header style={{ background: "#0F2744", borderBottom: "0.5px solid #1a3557", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px", flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
        {/* Left — logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <img
            src="https://res.cloudinary.com/dsgfts9gp/image/upload/Gemini_Generated_Image_uao02uao02uao02u-remove-bg-io_mb5sys.png"
            alt=""
            style={{ height: "42px", width: "42px", objectFit: "contain", flexShrink: 0 }}
          />
          <div style={{ width: "0.5px", height: "18px", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", whiteSpace: "nowrap" }}>IC Lens</span>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#C8692A", flexShrink: 0 }} />
          </div>
          <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.09em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", whiteSpace: "nowrap" }}>PE Deal Intelligence</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {[[1, "Deal Intake"], [2, "Comparison"], [3, "AI Synthesis"]].map(([step, label], i) => (
            <div key={step} style={{ display: "flex", alignItems: "center" }}>
              <div onClick={() => setScreen(step)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "6px 10px", cursor: "pointer", opacity: screen === step ? 1 : 0.45 }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: screen === step ? "#C8692A" : screen > step ? "#1a6b3a" : "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 600, color: "#fff", flexShrink: 0 }}>
                  {screen > step ? "✓" : step}
                </div>
                <span style={{ fontSize: "12px", fontWeight: screen === step ? 500 : 400, color: screen === step ? "#ffffff" : "rgba(255,255,255,0.65)", whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < 2 && <div style={{ width: "16px", height: "0.5px", background: "rgba(255,255,255,0.2)" }} />}
            </div>
          ))}
        </div>

        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", flexShrink: 0, whiteSpace: "nowrap" }}>
          {deals.length} deal{deals.length !== 1 ? "s" : ""}
        </div>
      </header>

      {/* Screen 1 — Intake */}
      {screen === 1 && (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
          <div style={{ background: "#ffffff", borderBottom: "0.5px solid #E8E5DE", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 500, color: "#0F2744" }}>Deal Intake</div>
              <div style={{ fontSize: "12px", color: "#888888", marginTop: "2px" }}>Enter metrics across all six analytical dimensions. Pre-populated with 3 sample deals.</div>
            </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setScreen(2)} style={{
              padding: "9px 18px", background: "#C8692A", color: "#fff",
              border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
              cursor: "pointer",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#A85520")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#C8692A")}
            >
              Run Comparison →
            </button>
          </div>
          </div>
          <DealTabs deals={deals} activeDeal={activeDealId} onSelect={setActiveDealId} onAdd={addDeal} onRemove={removeDeal} />
          <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
              {activeDeal && <DealForm deal={activeDeal} onUpdate={updateDeal} />}
            </div>
            {/* Right sidebar */}
            <div style={{ width: "260px", flexShrink: 0, background: "#ffffff", borderLeft: "0.5px solid #E8E5DE", overflowY: "auto", padding: "18px 16px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#888888", marginBottom: "12px" }}>Live Preview</div>
              {activeDeal && (
                <div style={{ background: "#F7F5F1", borderRadius: "8px", padding: "12px", marginBottom: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {[["EV/EBITDA", `${fmt(activeDeal.evEbitda)}×`], ["IRR", `${fmt(activeDeal.irr)}%`], ["MOIC", `${fmt(activeDeal.moic)}×`], ["ND/EBITDA", `${fmt(activeDeal.netDebtEbitda)}×`], ["Exit Mult.", `${fmt(activeDeal.exitMultiple)}×`], ["Rev CAGR", `${fmt(activeDeal.exitCagr)}%`]].map(([label, val]) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#888888" }}>{label}</div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#C8692A", letterSpacing: "-0.01em" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#888888", marginBottom: "8px" }}>All Deals</div>
                {deals.map((d, i) => (
                  <div key={d.id} onClick={() => setActiveDealId(d.id)} style={{ padding: "8px 10px", marginBottom: "5px", background: activeDealId === d.id ? "#FBF0E9" : "#F7F5F1", border: `0.5px solid ${activeDealId === d.id ? "#C8692A40" : "#E8E5DE"}`, borderLeft: `3px solid ${DEAL_COLORS[i]}`, borderRadius: "8px", cursor: "pointer" }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F2744" }}>{d.name || `Deal ${d.id}`}</div>
                    <div style={{ fontSize: "11px", color: "#888888" }}>IRR {fmt(d.irr)}% · MOIC {fmt(d.moic)}×</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2 — Comparison Dashboard */}
      {screen === 2 && (
        <ComparisonDashboard deals={deals} onBack={() => setScreen(1)} onSynthesis={() => setScreen(3)} />
      )}

      {/* Screen 3 — AI Synthesis */}
      {screen === 3 && (
        <SynthesisPanel deals={deals} strategy={strategy} onBack={() => setScreen(2)} />
      )}
    </div>
  );
}
