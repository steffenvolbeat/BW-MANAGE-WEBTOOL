"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

// ── Typen ────────────────────────────────────────────────────────────────────

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  type: "application" | "contact" | "company";
  label: string;
  subLabel?: string;
  status?: string;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  type: string;
}

interface NetworkData {
  nodes: NetworkNode[];
  links: Array<{ source: string; target: string; type: string }>;
}

type FilterType = "all" | "application" | "contact" | "company";

// ── Konstanten ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "#3b82f6",
  REVIEWED: "#8b5cf6",
  INTERVIEW_SCHEDULED: "#f59e0b",
  INTERVIEWED: "#f97316",
  OFFER_RECEIVED: "#10b981",
  ACCEPTED: "#059669",
  REJECTED: "#ef4444",
  WITHDRAWN: "#6b7280",
  GHOSTING: "#f43f5e",
  TASK_RECEIVED: "#a855f7",
  TASK_SUBMITTED: "#7c3aed",
  NEGOTIATION: "#0ea5e9",
  SAVED: "#94a3b8",
  OTHER: "#9ca3af",
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Beworben",
  REVIEWED: "Geprüft",
  INTERVIEW_SCHEDULED: "Interview geplant",
  INTERVIEWED: "Interview absolviert",
  OFFER_RECEIVED: "Angebot erhalten",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
  WITHDRAWN: "Zurückgezogen",
  GHOSTING: "Kein Feedback",
  TASK_RECEIVED: "Aufgabe erhalten",
  TASK_SUBMITTED: "Aufgabe eingereicht",
  NEGOTIATION: "Verhandlung",
  SAVED: "Gespeichert",
  OTHER: "Sonstiges",
};

const NODE_COLORS: Record<string, string> = {
  company: "#7c3aed",
  application: "#2563eb",
  contact: "#d97706",
};

const NODE_RADII: Record<string, number> = {
  company: 22,
  contact: 14,
  application: 10,
};

const ICON_MAP: Record<string, string> = {
  company: "🏢",
  contact: "👤",
  application: "📄",
};

// ── Komponente ───────────────────────────────────────────────────────────────

export default function NetworkGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tooltip: relativ zum SVG-Container (nicht pageX/Y!)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: NetworkNode } | null>(null);

  // Filter + Suche
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Vollbild
  const [fullscreen, setFullscreen] = useState(false);

  // Ausgewählter Knoten (Info-Panel)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Simulations-Abstoßungskraft
  const [strength, setStrength] = useState(-340);

  // Daten laden
  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/analytics/network")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: NetworkData) => setData(d))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Gefilterte Daten
  const filteredData: NetworkData | null = (() => {
    if (!data) return null;
    const q = searchQuery.toLowerCase().trim();

    const matchNodes = data.nodes.filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (q && !n.label.toLowerCase().includes(q) && !n.subLabel?.toLowerCase().includes(q)) return false;
      return true;
    });

    const visibleIds = new Set(matchNodes.map((n) => n.id));
    // Verbundene Knoten mitziehen (damit Graph nicht reißt)
    data.links.forEach((l) => {
      if (visibleIds.has(l.source) || visibleIds.has(l.target)) {
        visibleIds.add(l.source);
        visibleIds.add(l.target);
      }
    });

    return {
      nodes: data.nodes.filter((n) => visibleIds.has(n.id)),
      links: data.links.filter((l) => visibleIds.has(l.source) && visibleIds.has(l.target)),
    };
  })();

  // Verbindungsgrad (für Tooltip + Zentralknoten)
  const degreeMap: Record<string, number> = {};
  data?.links.forEach((l) => {
    degreeMap[l.source] = (degreeMap[l.source] ?? 0) + 1;
    degreeMap[l.target] = (degreeMap[l.target] ?? 0) + 1;
  });
  const topNodeId = Object.entries(degreeMap).sort(([, a], [, b]) => b - a)[0]?.[0];
  const topNode = data?.nodes.find((n) => n.id === topNodeId);

  // D3-Graph
  useEffect(() => {
    if (!filteredData || !svgRef.current) return;

    const svgEl = svgRef.current;
    const width = svgEl.clientWidth || 860;
    const height = svgEl.clientHeight || 580;

    const svg = d3.select<SVGSVGElement, unknown>(svgEl);
    svg.selectAll("*").remove();

    if (filteredData.nodes.length === 0) return;

    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "transparent");
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", (event) => { g.attr("transform", event.transform); });
    svg.call(zoom);

    const nodes: NetworkNode[] = filteredData.nodes.map((n) => ({ ...n }));
    const links: NetworkLink[] = filteredData.links.map((l) => ({ ...l } as NetworkLink));

    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force("link",
        d3.forceLink<NetworkNode, NetworkLink>(links)
          .id((d) => d.id)
          .distance((l) => {
            const src = l.source as NetworkNode;
            const tgt = l.target as NetworkNode;
            return (src.type === "company" || tgt.type === "company") ? 130 : 80;
          })
          .strength(0.7)
      )
      .force("charge", d3.forceManyBody<NetworkNode>().strength(strength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<NetworkNode>().radius((d) => NODE_RADII[d.type] + 10));

    // Defs
    const defs = svg.append("defs");

    // Glow-Filter für hover
    const glowFilter = defs.append("filter").attr("id", "glow-net");
    glowFilter.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Pfeile
    ["applied_to", "works_at"].forEach((type) => {
      defs.append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -4 8 8")
        .attr("refX", 28)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-4L8,0L0,4")
        .attr("fill", type === "works_at" ? "#f59e0b" : "#94a3b8");
    });

    // Links
    const link = g.append("g").attr("class", "links")
      .selectAll<SVGLineElement, NetworkLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => d.type === "works_at" ? "#f59e0b60" : "#94a3b840")
      .attr("stroke-width", (d) => d.type === "works_at" ? 1.5 : 1)
      .attr("stroke-dasharray", (d) => d.type === "works_at" ? "5,3" : "none")
      .attr("marker-end", (d) => `url(#arrow-${d.type})`);

    // Knoten als <g> Gruppen (KORREKTE Methode – Icons/Labels relativ zur Gruppe)
    const nodeGroup = g.append("g").attr("class", "nodes")
      .selectAll<SVGGElement, NetworkNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("mouseover", (event: MouseEvent, d: NetworkNode) => {
        // Position RELATIV zum SVG-Container (nicht pageX/Y)
        const rect = svgEl.getBoundingClientRect();
        setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, node: d });

        // Verbundene Knoten hervorheben
        const connected = new Set<string>();
        links.forEach((l) => {
          const s = (l.source as NetworkNode).id;
          const t = (l.target as NetworkNode).id;
          if (s === d.id) connected.add(t);
          if (t === d.id) connected.add(s);
        });
        link.attr("opacity", (l) => {
          const s = (l.source as NetworkNode).id;
          const t = (l.target as NetworkNode).id;
          return s === d.id || t === d.id ? 1 : 0.08;
        }).attr("stroke-width", (l) => {
          const s = (l.source as NetworkNode).id;
          const t = (l.target as NetworkNode).id;
          return s === d.id || t === d.id ? 2.5 : (l.type === "works_at" ? 1.5 : 1);
        });
        nodeGroup.selectAll<SVGCircleElement, NetworkNode>("circle")
          .attr("opacity", (n) => n.id === d.id || connected.has(n.id) ? 1 : 0.15)
          .attr("filter", (n) => n.id === d.id ? "url(#glow-net)" : null);
      })
      .on("mousemove", (event: MouseEvent) => {
        const rect = svgEl.getBoundingClientRect();
        setTooltip((prev) => prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top } : null);
      })
      .on("mouseout", () => {
        setTooltip(null);
        link.attr("opacity", 1).attr("stroke-width", (d) => d.type === "works_at" ? 1.5 : 1);
        nodeGroup.selectAll<SVGCircleElement, NetworkNode>("circle")
          .attr("opacity", 1).attr("filter", null);
      })
      .on("click", (_event: MouseEvent, d: NetworkNode) => {
        setSelectedId((prev) => prev === d.id ? null : d.id);
      })
      .call(
        d3.drag<SVGGElement, NetworkNode>()
          .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Kreis
    nodeGroup.append("circle")
      .attr("r", (d) => NODE_RADII[d.type])
      .attr("fill", (d) =>
        d.type === "application" && d.status
          ? (STATUS_COLORS[d.status] ?? NODE_COLORS.application)
          : NODE_COLORS[d.type]
      )
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    // Icon (relativ zur Gruppe bei 0,0)
    const iconText = nodeGroup.append("text")
      .text((d) => ICON_MAP[d.type])
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", (d) => d.type === "company" ? "14px" : "9px")
      .attr("pointer-events", "none");

    // Label (unterhalb des Knotens)
    const labelText = nodeGroup.append("text")
      .text((d) => d.label.length > 18 ? d.label.slice(0, 17) + "…" : d.label)
      .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("font-size", (d) => d.type === "company" ? "11px" : "9px")
      .attr("font-weight", (d) => d.type === "company" ? "600" : "400")
      .attr("fill", "#374151")
      .attr("pointer-events", "none");

    // BUG-FIX: Tick setzt transform auf die <g>-Gruppe, nicht x/y auf Circle
    // Icons und Labels sind bereits relativ zur Gruppe positioniert
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NetworkNode).x ?? 0)
        .attr("y1", (d) => (d.source as NetworkNode).y ?? 0)
        .attr("x2", (d) => (d.target as NetworkNode).x ?? 0)
        .attr("y2", (d) => (d.target as NetworkNode).y ?? 0);

      // Gruppe verschieben – Icon/Label folgen automatisch
      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);

      // Label-y relativ zur Gruppe
      labelText.attr("y", (d) => NODE_RADII[d.type] + 13);
      iconText.attr("x", 0).attr("y", 0);
    });

    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85).translate(-width / 2, -height / 2)
    );

    return () => { simulation.stop(); };
  }, [filteredData, fullscreen, strength]);

  // ── Statistiken ──────────────────────────────────────────────────────────────
  const companyCount = data?.nodes.filter((n) => n.type === "company").length ?? 0;
  const appCount = data?.nodes.filter((n) => n.type === "application").length ?? 0;
  const contactCount = data?.nodes.filter((n) => n.type === "contact").length ?? 0;

  // ── Loading / Error / Empty ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-(--muted) text-sm">Lade Netzwerk-Graph…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4 text-red-500">
        <span className="text-4xl">⚠️</span>
        <p className="font-medium">Fehler beim Laden</p>
        <p className="text-sm text-(--muted)">{error}</p>
        <button onClick={loadData}
          className="px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 hover:bg-red-100 transition-colors">
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-3 text-(--muted)">
        <span className="text-6xl">🌐</span>
        <p className="font-medium text-lg">Netzwerk ist leer</p>
        <p className="text-sm">Füge Bewerbungen und Kontakte hinzu, um den Graphen zu sehen.</p>
      </div>
    );
  }

  const graphHeight = fullscreen ? "calc(100vh - 120px)" : "600px";

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl overflow-hidden border border-(--border) bg-(--card) ${fullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap p-3 border-b border-(--border) bg-(--card)/95 backdrop-blur-sm">
        {/* Suche */}
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Knoten suchen…"
            className="w-full pl-7 pr-6 py-1.5 text-xs rounded-lg border border-(--border) bg-(--card) focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-(--muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-(--muted) hover:text-foreground text-sm leading-none">×</button>
          )}
        </div>

        {/* Typ-Filter */}
        <div className="flex gap-1 border border-(--border) rounded-lg p-0.5">
          {([
            { id: "all", label: "Alle" },
            { id: "company", label: "🏢" },
            { id: "application", label: "📄" },
            { id: "contact", label: "👤" },
          ] as { id: FilterType; label: string }[]).map((f) => (
            <button key={f.id}
              onClick={() => setFilterType(f.id)}
              title={f.id === "all" ? "Alle anzeigen" : f.id === "company" ? "Nur Unternehmen" : f.id === "application" ? "Nur Bewerbungen" : "Nur Kontakte"}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${filterType === f.id ? "bg-indigo-600 text-white font-semibold" : "text-(--muted) hover:bg-(--hover)"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Kraft-Slider */}
        <div className="flex items-center gap-2 text-xs text-(--muted)">
          <span className="hidden sm:inline">Abstoßung</span>
          <input type="range" min={-900} max={-50} step={50} value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            title={`Abstoßungskraft: ${strength}`}
            className="w-20 accent-indigo-600 cursor-pointer" />
        </div>

        <div className="flex gap-1 ml-auto">
          {/* Neu laden */}
          <button onClick={loadData} title="Neu laden"
            className="p-1.5 border border-(--border) rounded-lg hover:bg-(--hover) transition-colors text-(--muted)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {/* Vollbild */}
          <button onClick={() => setFullscreen((p) => !p)} title={fullscreen ? "Vollbild beenden" : "Vollbild"}
            className="p-1.5 border border-(--border) rounded-lg hover:bg-(--hover) transition-colors text-(--muted)">
            {fullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── SVG ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        <svg ref={svgRef} className="w-full" style={{ height: graphHeight, display: "block" }} />

        {/* ── Tooltip (relativ zum SVG-Container, nicht fixed!) ─────────── */}
        {tooltip && (
          <div
            className="absolute z-50 bg-(--card) border border-(--border) shadow-2xl rounded-xl px-3 py-2.5 text-sm pointer-events-none max-w-[220px]"
            style={{
              // eslint-disable-next-line react-hooks/refs -- svgRef.current für Tooltip-Positionierung mit sicherem Fallback
              left: Math.min(tooltip.x + 14, (svgRef.current?.clientWidth ?? 800) - 240),
              top: Math.max(tooltip.y - 60, 8),
            }}
          >
            <div className="font-semibold leading-tight mb-1">{tooltip.node.label}</div>
            {tooltip.node.subLabel && (
              <div className="text-(--muted) text-xs capitalize mb-1">
                {tooltip.node.subLabel.replace(/_/g, " ").toLowerCase()}
              </div>
            )}
            {tooltip.node.type === "application" && tooltip.node.status && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[tooltip.node.status] ?? "#3b82f6" }} />
                <span className="text-xs">{STATUS_LABELS[tooltip.node.status] ?? tooltip.node.status}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: NODE_COLORS[tooltip.node.type] }} />
              <span className="text-xs text-(--muted)">
                {tooltip.node.type === "company" ? "Unternehmen" : tooltip.node.type === "contact" ? "Kontakt" : "Bewerbung"}
              </span>
            </div>
            {degreeMap[tooltip.node.id] !== undefined && (
              <div className="mt-1.5 text-[11px] text-(--muted) border-t border-(--border) pt-1.5">
                🔗 {degreeMap[tooltip.node.id]} Verbindung{degreeMap[tooltip.node.id] !== 1 ? "en" : ""}
              </div>
            )}
            <div className="mt-1 text-[10px] text-(--muted) opacity-60">Klicken zum Markieren</div>
          </div>
        )}

        {/* ── Legende ──────────────────────────────────────────────────── */}
        <div className="absolute bottom-4 left-4 bg-(--card)/92 backdrop-blur-sm border border-(--border) rounded-xl px-3 py-2.5 text-xs space-y-1.5 shadow-md">
          <p className="font-semibold text-(--muted) text-[10px] uppercase tracking-wider mb-2">Legende</p>
          {[
            { color: "#7c3aed", label: "Unternehmen" },
            { color: "#2563eb", label: "Bewerbung" },
            { color: "#d97706", label: "Kontakt" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
          <hr className="border-(--border) my-1" />
          <div className="flex items-center gap-2">
            <span className="border-b-2 border-dashed border-amber-400 w-4 shrink-0" />
            <span className="text-(--muted)">arbeitet bei</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="border-b border-slate-300 w-4 shrink-0" />
            <span className="text-(--muted)">beworben bei</span>
          </div>
          <p className="text-[10px] text-(--muted) mt-1 opacity-70 leading-relaxed">
            Scrollen = Zoom<br />
            Ziehen = Verschieben<br />
            Hover = Verbindungen
          </p>
        </div>

        {/* ── Graphstatistik ────────────────────────────────────────────── */}
        <div className="absolute bottom-4 right-4 bg-(--card)/92 backdrop-blur-sm border border-(--border) rounded-xl px-3 py-2.5 text-xs shadow-md space-y-1.5">
          <p className="font-semibold text-(--muted) text-[10px] uppercase tracking-wider mb-2">Graph</p>
          {[
            { emoji: "🏢", label: "Firmen", value: companyCount },
            { emoji: "📄", label: "Bewerbungen", value: appCount },
            { emoji: "👤", label: "Kontakte", value: contactCount },
            { emoji: "🔗", label: "Verbindungen", value: data.links.length },
          ].map((s) => (
            <div key={s.label} className="flex justify-between gap-4">
              <span className="text-(--muted)">{s.emoji} {s.label}</span>
              <span className="font-semibold">{s.value}</span>
            </div>
          ))}
          {topNode && (
            <>
              <hr className="border-(--border) my-1" />
              <div>
                <p className="text-[10px] text-(--muted) uppercase tracking-wide mb-0.5">Zentralster Knoten</p>
                <p className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]" title={topNode.label}>
                  {topNode.label}
                </p>
                <p className="text-[10px] text-(--muted)">{degreeMap[topNode.id]} Verbindungen</p>
              </div>
            </>
          )}
          {filteredData && filteredData.nodes.length !== data.nodes.length && (
            <p className="text-[10px] text-indigo-500 pt-1 border-t border-(--border)">
              {filteredData.nodes.length}/{data.nodes.length} sichtbar
            </p>
          )}
        </div>

        {/* ── Info-Panel für ausgewählten Knoten ───────────────────────── */}
        {selectedId && (() => {
          const node = data.nodes.find((n) => n.id === selectedId);
          if (!node) return null;
          const connections = data.links
            .filter((l) => l.source === selectedId || l.target === selectedId)
            .map((l) => {
              const otherId = l.source === selectedId ? l.target : l.source;
              const other = data.nodes.find((n) => n.id === otherId);
              return other ? { node: other, linkType: l.type } : null;
            })
            .filter(Boolean) as { node: NetworkNode; linkType: string }[];
          return (
            <div className="absolute top-4 right-4 z-20 bg-(--card)/97 backdrop-blur-sm border border-indigo-300 dark:border-indigo-700 rounded-xl px-4 py-3 text-xs shadow-xl max-w-[210px]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight truncate">{node.label}</p>
                  <p className="text-(--muted) text-[11px]">
                    {node.type === "company" ? "🏢 Unternehmen" : node.type === "contact" ? "👤 Kontakt" : "📄 Bewerbung"}
                  </p>
                </div>
                <button onClick={() => setSelectedId(null)}
                  className="text-(--muted) hover:text-foreground text-lg leading-none flex-shrink-0 mt-0.5">×</button>
              </div>
              {node.status && (
                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-(--border)">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[node.status] ?? "#3b82f6" }} />
                  <span className="font-medium">{STATUS_LABELS[node.status] ?? node.status}</span>
                </div>
              )}
              {connections.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-(--muted) mb-1.5">
                    Verbindungen ({connections.length})
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {connections.map(({ node: n, linkType }) => (
                      <button key={n.id} onClick={() => setSelectedId(n.id)}
                        className="flex items-center gap-1.5 w-full text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: NODE_COLORS[n.type] }} />
                        <span className="truncate group-hover:underline">{n.label}</span>
                        <span className="text-[10px] text-(--muted) ml-auto flex-shrink-0">
                          {linkType === "works_at" ? "bei" : "→"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
