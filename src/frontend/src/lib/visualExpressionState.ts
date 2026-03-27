// ─── Visual Expression State ─────────────────────────────────────────────────
// localStorage-backed state for visual expression feature

const KEYS = {
  hasUsed: "veil-visual-has-used",
  aiConsent: "veil-visual-ai-consent", // 'yes' | 'no' | null
  entries: "veil-visual-entries",
} as const;

export interface VisualEntry {
  id: string;
  emotion_type: string;
  emotion_label: string;
  aura_color: string;
  canvas_data: string; // serialized shape positions as JSON
  ai_snapshot_svg?: string; // generated CSS/SVG snapshot
  interaction_energy: number; // 0–100
  intensity: number; // 1–10
  created_at: string; // ISO date string
  has_text?: string; // optional journal text caption
}

export function hasUsedVisualCanvas(): boolean {
  return localStorage.getItem(KEYS.hasUsed) === "true";
}

export function markVisualCanvasUsed(): void {
  localStorage.setItem(KEYS.hasUsed, "true");
}

export function getAISnapshotConsent(): "yes" | "no" | null {
  const val = localStorage.getItem(KEYS.aiConsent);
  if (val === "yes" || val === "no") return val;
  return null;
}

export function setAISnapshotConsent(consent: "yes" | "no"): void {
  localStorage.setItem(KEYS.aiConsent, consent);
}

export function saveVisualEntry(entry: VisualEntry): void {
  const entries = getVisualEntries();
  entries.unshift(entry);
  // Keep max 200 entries
  const trimmed = entries.slice(0, 200);
  localStorage.setItem(KEYS.entries, JSON.stringify(trimmed));
  markVisualCanvasUsed();
}

export function getVisualEntries(): VisualEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.entries);
    if (!raw) return [];
    return JSON.parse(raw) as VisualEntry[];
  } catch {
    return [];
  }
}

// Generate a deterministic but unique-looking AI snapshot
// based on emotion + intensity + energy — never from text content
export function generateAISnapshot(
  emotion_type: string,
  intensity: number,
  energy: number,
  aura_color: string,
): string {
  // Returns an SVG string representing an abstract emotional snapshot
  const seed = intensity * 17 + energy * 3 + emotion_type.charCodeAt(0);
  const rng = (n: number) =>
    Math.abs(Math.sin(seed * (n + 1) * 9301 + 49297) % 1);

  const shapes: string[] = [];
  const count = 6 + Math.floor(rng(0) * 8);
  const baseColor = aura_color;

  // Parse hex to rgb components for opacity layers
  const r = Number.parseInt(baseColor.slice(1, 3), 16);
  const g = Number.parseInt(baseColor.slice(3, 5), 16);
  const b = Number.parseInt(baseColor.slice(5, 7), 16);

  for (let i = 0; i < count; i++) {
    const cx = 20 + rng(i * 2) * 160;
    const cy = 20 + rng(i * 2 + 1) * 160;
    const rx = 8 + rng(i * 3) * (intensity * 4 + energy * 0.3);
    const ry = 6 + rng(i * 3 + 1) * (intensity * 3 + energy * 0.2);
    const opacity = 0.15 + rng(i * 4) * 0.55;
    const rotate = rng(i * 5) * 360;
    shapes.push(
      `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="rgb(${r},${g},${b})" opacity="${opacity.toFixed(2)}" transform="rotate(${rotate.toFixed(1)},${cx.toFixed(1)},${cy.toFixed(1)})" />`,
    );
  }

  // Add a few flowing lines
  for (let i = 0; i < 3; i++) {
    const x1 = rng(i * 10) * 200;
    const y1 = rng(i * 10 + 1) * 200;
    const x2 = rng(i * 10 + 2) * 200;
    const y2 = rng(i * 10 + 3) * 200;
    const cx1 = rng(i * 10 + 4) * 200;
    const cy1 = rng(i * 10 + 5) * 200;
    const opacity = 0.1 + rng(i * 11) * 0.3;
    const width = 0.5 + rng(i * 12) * 2;
    shapes.push(
      `<path d="M${x1.toFixed(0)},${y1.toFixed(0)} Q${cx1.toFixed(0)},${cy1.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)}" stroke="rgb(${r},${g},${b})" stroke-width="${width.toFixed(1)}" fill="none" opacity="${opacity.toFixed(2)}" />`,
    );
  }

  const bgOpacity = 0.08 + intensity * 0.01;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="rgb(${r},${g},${b})" opacity="${bgOpacity.toFixed(2)}" rx="8"/>
  ${shapes.join("\n  ")}
</svg>`;
}
