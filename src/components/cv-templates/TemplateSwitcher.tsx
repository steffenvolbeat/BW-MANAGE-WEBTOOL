"use client";
import { TemplateMeta } from "./shared";

interface Props {
  templates: TemplateMeta[];
  activeKey: string;
  onSelect: (key: string) => void;
  label?: string;
}

export default function TemplateSwitcher({ templates, activeKey, onSelect, label = "Template wählen" }: Props) {
  return (
    <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {templates.map(t => {
            const active = t.key === activeKey;
            return (
              <button
                key={t.key}
                onClick={() => onSelect(t.key)}
                title={t.description}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${active ? t.accent : "#1e293b"}`,
                  background: active ? `${t.accent}18` : "#1e293b",
                  color: active ? t.accent : "#94a3b8",
                  fontSize: 12, fontWeight: active ? 700 : 400, transition: "all 0.15s",
                  boxShadow: active ? `0 0 12px ${t.accent}44` : "none",
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.accent, display: "inline-block", flexShrink: 0, boxShadow: active ? `0 0 6px ${t.accent}` : "none" }} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
