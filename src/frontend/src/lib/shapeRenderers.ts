// ─── Shape SVG Path Renderers ────────────────────────────────────────────────────
// Generates SVG path strings for each emotion shape type

export function renderShapePath(shapeType: string, size: number): string {
  const h = size / 2;
  const w = size / 2;
  switch (shapeType) {
    case "elongated":
      return `M0,${-h * 1.6} C${w * 0.4},${-h * 0.8} ${w * 0.4},${h * 0.8} 0,${h * 1.6} C${-w * 0.4},${h * 0.8} ${-w * 0.4},${-h * 0.8} 0,${-h * 1.6}`;
    case "droplet":
      return `M0,${-h} C${w * 0.8},${-h * 0.3} ${w},${h * 0.5} 0,${h} C${-w},${h * 0.5} ${-w * 0.8},${-h * 0.3} 0,${-h}`;
    case "fragment":
      return `M${-w * 0.3},${-h} L${w * 0.7},${-h * 0.2} L${w * 0.4},${h * 0.8} L${-w * 0.8},${h * 0.5} Z`;
    case "angular":
      return `M0,${-h} L${w * 0.85},${h * 0.4} L${-w * 0.85},${h * 0.4} Z`;
    case "dot":
      return `M0,${-w} a${w},${w} 0 1,0 0,${size} a${w},${w} 0 1,0 0,${-size}`;
    case "flat-disc":
      return `M${-w},0 a${w},${w * 0.35} 0 1,0 ${size},0 a${w},${w * 0.35} 0 1,0 ${-size},0`;
    case "soft-circle":
      return `M0,${-w} a${w},${w} 0 1,0 0,${size} a${w},${w} 0 1,0 0,${-size}`;
    case "fluid-blob":
      return `M0,${-h} C${w * 1.2},${-h * 0.6} ${w * 1.1},${h * 0.6} 0,${h} C${-w * 1.1},${h * 0.6} ${-w * 1.2},${-h * 0.6} 0,${-h}`;
    case "teardrop":
      return `M0,${h} C${-w * 0.7},${h * 0.2} ${-w * 0.5},${-h * 0.5} 0,${-h} C${w * 0.5},${-h * 0.5} ${w * 0.7},${h * 0.2} 0,${h}`;
    case "arc":
      return `M${-w},0 A${w},${w} 0 0,1 ${w},0 C${w * 0.6},${h * 0.6} ${-w * 0.6},${h * 0.6} ${-w},0`;
    default: // blob
      return `M0,${-h} C${w * 1.1},${-h * 0.4} ${w * 0.9},${h * 0.7} 0,${h} C${-w * 0.9},${h * 0.7} ${-w * 1.1},${-h * 0.4} 0,${-h}`;
  }
}
