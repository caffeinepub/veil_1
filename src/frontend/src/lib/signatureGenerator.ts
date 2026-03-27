// ─── Signature Generator ─────────────────────────────────────────────────────
// Returns the first name for use as a script bold italic signature.

export interface SignatureResult {
  firstName: string;
  // Legacy fields kept so existing call sites don't break at compile time
  svgPath: string;
  viewBox: string;
  width: number;
  height: number;
  pathLength: number;
}

/**
 * Returns the user's first name as the signature data.
 * All SVG path fields are kept as empty stubs so existing code compiles.
 */
export function generateSignature(
  name: string,
  _seed: string,
): SignatureResult {
  const firstName = (name || "You").trim().split(/\s+/)[0];
  return {
    firstName,
    // Stub values — SignatureSvg no longer uses these
    svgPath: "",
    viewBox: "0 0 140 60",
    width: 140,
    height: 60,
    pathLength: 0,
  };
}
