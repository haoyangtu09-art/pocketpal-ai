/**
 * Matte Glass Highlight Shader
 *
 * Sits on top of BackdropFilter (blurred backdrop + tinted fill) and adds
 * lighting layers that create a softly curved glass surface.
 *
 * Edge glow fades inward (not a directional beam).
 * Light catches the top rim and gently fades downward/inward.
 */

export const highlightShader = /* sksl */ `
uniform float2 iResolution;
uniform float cornerRadius;

half4 main(float2 xy) {
  float2 uv = xy / iResolution;
  float2 center = float2(0.5);
  float aspect = iResolution.x / iResolution.y;

  float r = max(cornerRadius / min(iResolution.x, iResolution.y), 0.001);

  // Rounded rectangle SDF
  float2 halfSize = float2(aspect * 0.5 - r, 0.5 - r);
  float2 p = (uv - center) * float2(aspect, 1.0);
  float2 q = abs(p) - halfSize;
  float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float d = sdf / min(iResolution.x, iResolution.y);
  float innerDist = -d;

  // Sharp edge mask
  float edgeMask = 1.0 - smoothstep(-0.0015, 0.0015, d);

  // === Edge glow — uniform along contour, fades inward ===
  // The glow is brightest at the edge and decays exponentially inward.
  // Two bands: narrow bright rim + wider soft halo.
  float rimGlow = exp(-innerDist * 35.0) * 0.45;
  float haloGlow = exp(-innerDist * 14.0) * 0.12;

  // === Top-edge highlight — soft overhead light reflection ===
  // Vertical gradient: brightest at top edge, fades downward.
  // This simulates overhead room light catching the top of the glass bubble.
  float topHighlight = exp(-innerDist * 20.0)
                      * exp(-uv.y * uv.y / 0.06)
                      * 0.28;

  // === Inner shadow — subtle dark band ~3px inside edge ===
  float innerShadow = exp(-(innerDist - 0.025) * (innerDist - 0.025)
                          / (0.005 * 0.005));
  innerShadow *= 0.15;

  // === Center darkening — subtle radial falloff ===
  float radialDist = length((uv - center) * float2(aspect, 1.0));
  float maxRadial = length(float2(aspect * 0.5, 0.5) - float2(r / aspect, r));
  float centerDark = pow(clamp(radialDist / max(maxRadial, 0.001), 0.0, 1.0), 2.5);
  centerDark *= 0.10;

  // === Compose ===
  float3 color = float3(0.0);

  // Top highlight: warm white
  color += float3(topHighlight * 1.05, topHighlight * 1.02, topHighlight * 0.95);

  // Rim glow: cool blue-white edge reflection
  color += float3(rimGlow * 0.22, rimGlow * 0.30, rimGlow * 0.55);

  // Halo glow: wider warm edge
  color += float3(haloGlow * 0.14, haloGlow * 0.12, haloGlow * 0.05);

  // Inner shadow: subtractive dark band
  color -= float3(innerShadow * 0.6, innerShadow * 0.65, innerShadow * 0.80);

  // Center darkening
  color -= centerDark * 0.45;

  // Subtle blue glass tint
  color += float3(0.0, 0.0, 0.008);

  float a = topHighlight * 0.5 + rimGlow * 0.55 + haloGlow * 0.25 + innerShadow * 0.25;
  a = clamp(a, 0.0, 0.90);
  a *= edgeMask;

  return half4(half3(color), half(a));
}
`;
