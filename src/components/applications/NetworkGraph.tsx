"use client";

import { useEffect, useRef, useState } from "react";
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
  type: string; // "applied_to" | "works_at"
}

interface NetworkData {
  nodes: NetworkNode[];
  links: Array<{ source: string; target: string; type: string }>;
}

// ── Farbschemata ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "#3b82f6",
  REVIEWED: "#8b5cf6",
  INTERVIEW_SCHEDULED: "#f59e0b",
  INTERVIEWED: "#f97316",
  OFFER_RECEIVED: "#10b981",
  ACCEPTED: "#059669",
  REJECTED: "#ef4444",
  WITHDRAWN: "#6b7280",
  OTHER: "#9ca3af",
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

// ── Komponente ───────────────────────────────────────────────────────────────

export default function NetworkGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    node: NetworkNode;
  } | null>(null);

  // Daten laden
  useEffect(() => {
    fetch("/api/analytics/network")
      .then((r) => r.json())
      .then((d: NetworkData) => setData(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // D3-Graph initialisieren
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svgEl = svgRef.current;
    const width = svgEl.clientWidth || 860;
    const height = svgEl.clientHeight || 620;

    const svg = d3.select<SVGSVGElement, unknown>(svgEl);
    svg.selectAll("*").remove();

    // Hintergrund-Rechteck für Zoom-Gesten
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent");

    const g = svg.append("g");

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Daten klonen (D3 mutiert die Objekte)
    const nodes: NetworkNode[] = data.nodes.map((n) => ({ ...n }));
    const links: NetworkLink[] = data.links.map((l) => ({ ...l } as NetworkLink));

    // Force-Simulation
    const simulation = d3
      .forceSimulation<NetworkNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<NetworkNode, NetworkLink>(links)
          .id((d) => d.id)
          .distance((l) => {
            const src = l.source as NetworkNode;
            const tgt = l.target as NetworkNode;
            if (src.type === "company" || tgt.type === "company") return 120;
            return 80;
          })
          .strength(0.6)
      )
      .force("charge", d3.forceManyBody<NetworkNode>().strength(-340))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide<NetworkNode>().radius((d) => NODE_RADII[d.type] + 8)
      );

    // ── Pfeile/Marker ────────────────────────────────────────────────────
    const defs = svg.append("defs");
    ["applied_to", "works_at"].forEach((type) => {
      defs
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -4 8 8")
        .attr("refX", 24)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-4L8,0L0,4")
        .attr("fill", type === "works_at" ? "#f59e0b" : "#94a3b8");
    });

    // ── Links ────────────────────────────────────────────────────────────
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll<SVGLineElement, NetworkLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) =>
        d.type === "works_at" ? "#f59e0b60" : "#94a3b840"
      )
      .attr("stroke-width", (d) => (d.type === "works_at" ? 1.5 : 1))
      .attr("stroke-dasharray", (d) =>
        d.type === "works_at" ? "5,3" : "none"
      )
      .attr(
        "marker-end",
        (d) => `url(#arrow-${d.type})`
      );

    // ── Knoten ───────────────────────────────────────────────────────────
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGCircleElement, NetworkNode>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => NODE_RADII[d.type])
      .attr("fill", (d) =>
        d.type === "application" && d.status
          ? (STATUS_COLORS[d.status] ?? NODE_COLORS.application)
          : NODE_COLORS[d.type]
      )
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseover", (event: MouseEvent, d: NetworkNode) => {
        d3.select(event.currentTarget as SVGCircleElement)
          .attr("stroke-width", 4)
          .attr("stroke", "#fff");
        setTooltip({ x: event.pageX, y: event.pageY, node: d });
      })
      .on("mousemove", (event: MouseEvent) => {
        setTooltip((prev) =>
          prev ? { ...prev, x: event.pageX, y: event.pageY } : null
        );
      })
      .on("mouseout", (event: MouseEvent) => {
        d3.select(event.currentTarget as SVGCircleElement)
          .attr("stroke-width", 2)
          .attr("stroke", "#ffffff");
        setTooltip(null);
      })
      .call(
        d3
          .drag<SVGCircleElement, NetworkNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // ── Icons in Knoten ──────────────────────────────────────────────────
    const iconMap: Record<string, string> = {
      company: "🏢",
      contact: "👤",
      application: "📄",
    };
    g.append("g")
      .attr("class", "icons")
      .selectAll<SVGTextElement, NetworkNode>("text")
      .data(nodes)
      .join("text")
      .text((d) => iconMap[d.type])
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", (d) => (d.type === "company" ? "16px" : "10px"))
      .attr("pointer-events", "none");

    // ── Labels ───────────────────────────────────────────────────────────
    const label = g
      .append("g")
      .attr("class", "labels")
      .selectAll<SVGTextElement, NetworkNode>("text")
      .data(nodes)
      .join("text")
      .text((d) =>
        d.label.length > 18 ? d.label.slice(0, 17) + "…" : d.label
      )
      .attr("text-anchor", "middle")
      .attr("font-size", (d) => (d.type === "company" ? "11px" : "9px"))
      .attr("font-weight", (d) => (d.type === "company" ? "600" : "400"))
      .attr("fill", "#374151")
      .attr("dy", (d) => NODE_RADII[d.type] + 12)
      .attr("pointer-events", "none");

    // ── Tick ─────────────────────────────────────────────────────────────
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NetworkNode).x ?? 0)
        .attr("y1", (d) => (d.source as NetworkNode).y ?? 0)
        .attr("x2", (d) => (d.target as NetworkNode).x ?? 0)
        .attr("y2", (d) => (d.target as NetworkNode).y ?? 0);

      node
        .attr("cx", (d) => d.x ?? 0)
        .attr("cy", (d) => d.y ?? 0);

      g.selectAll<SVGTextElement, NetworkNode>(".icons text")
        .attr("x", (d) => d.x ?? 0)
        .attr("y", (d) => d.y ?? 0);

      label
        .attr("x", (d) => d.x ?? 0)
        .attr("y", (d) => d.y ?? 0);
    });

    // Initial zoom anpassen
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85).translate(-width / 2, -height / 2)
    );

    return () => {
      simulation.stop();
    };
  }, [data]);

  // ── UI ───────────────────────────────────────────────────────────────────

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
      <div className="flex flex-col items-center justify-center h-[600px] gap-2 text-red-500">
        <span className="text-4xl">⚠️</span>
        <p className="font-medium">Fehler beim Laden</p>
        <p className="text-sm text-(--muted)">{error}</p>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-3 text-(--muted)">
        <span className="text-6xl">🌐</span>
        <p className="font-medium text-lg">Netzwerk ist leer</p>
        <p className="text-sm">
          Füge Bewerbungen und Kontakte hinzu, um den Graphen zu sehen.
        </p>
      </div>
    );
  }

  const companyCount = data.nodes.filter((n) => n.type === "company").length;
  const appCount = data.nodes.filter((n) => n.type === "application").length;
  const contactCount = data.nodes.filter((n) => n.type === "contact").length;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-(--border) bg-(--card)">
      {/* SVG Graph */}
      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: "630px", display: "block" }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-(--card) border border-(--border) shadow-xl rounded-xl px-3 py-2 text-sm pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 14 }}
        >
          <div className="font-semibold">{tooltip.node.label}</div>
          {tooltip.node.subLabel && (
            <div className="text-(--muted) text-xs capitalize">
              {tooltip.node.subLabel.replace(/_/g, " ").toLowerCase()}
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor:
                  tooltip.node.type === "application" && tooltip.node.status
                    ? STATUS_COLORS[tooltip.node.status] ?? "#3b82f6"
                    : NODE_COLORS[tooltip.node.type],
              }}
            />
            <span className="text-xs capitalize text-(--muted)">
              {tooltip.node.type === "company"
                ? "Unternehmen"
                : tooltip.node.type === "contact"
                ? "Kontakt"
                : "Bewerbung"}
            </span>
          </div>
        </div>
      )}

      {/* Legende */}
      <div className="absolute bottom-4 left-4 bg-(--card)/90 backdrop-blur-sm border border-(--border) rounded-xl px-3 py-2.5 text-xs space-y-1.5 shadow-sm">
        <p className="font-semibold text-(--muted) text-[11px] uppercase tracking-wider mb-2">
          Legende
        </p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
          <span>Unternehmen</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
          <span>Bewerbung</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
          <span>Kontakt</span>
        </div>
        <hr className="border-(--border) my-1" />
        <div className="flex items-center gap-2">
          <span className="border-b-2 border-dashed border-amber-400 w-4 shrink-0" />
          <span className="text-(--muted)">arbeitet bei</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="border-b border-slate-300 w-4 shrink-0" />
          <span className="text-(--muted)">beworben bei</span>
        </div>
        <p className="text-(--muted) text-[10px] mt-1">
          Scrollen = Zoom · Ziehen = Verschieben
        </p>
      </div>

      {/* Statistik-Badge */}
      <div className="absolute top-4 right-4 bg-(--card)/90 backdrop-blur-sm border border-(--border) rounded-xl px-3 py-2.5 text-xs shadow-sm space-y-1">
        <p className="font-semibold text-(--muted) text-[11px] uppercase tracking-wider mb-1.5">
          Graphstatistik
        </p>
        <div className="flex justify-between gap-4">
          <span className="text-(--muted)">🏢 Firmen</span>
          <span className="font-semibold">{companyCount}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-(--muted)">📄 Bewerbungen</span>
          <span className="font-semibold">{appCount}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-(--muted)">👤 Kontakte</span>
          <span className="font-semibold">{contactCount}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-(--muted)">🔗 Verbindungen</span>
          <span className="font-semibold">{data.links.length}</span>
        </div>
      </div>
    </div>
  );
}
