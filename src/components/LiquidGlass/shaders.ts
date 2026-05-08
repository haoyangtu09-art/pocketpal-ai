/**
 * Bubble Glass Highlight Shader
 *
 * Sits on top of BackdropFilter (blurred backdrop + tinted fill) and adds
 * lighting layers that create the *illusion* of a curved 3D glass surface.
 *
 * Four layers, all driven by the signed distance to the rounded rectangle edge:
 *   1. Contour-following Fresnel glow (edge-distance based, two bands)
 *   2. Anisotropic specular highlight (elongated reflection band)
 *   3. Inner shadow ring (dark band ~3px inside edge → thickness)
 *   4. Center darkening (radial gradient → convex depth)
 */

export const highlightShader = /* sksl */ `
uniform float2 iResolution;
uniform float cornerRadius;
uniform float2 iLightOrigin;

half4 main(float2 xy) {
  float2 uv = xy / iResolution;
  float2 center = float2(0.5);
  float aspect = iResolution.x / iResolution.y;

  // Guard: minimum normalized radius to avoid division by zero
  float r = cornerRadius / min(iResolution.x, iResolution.y);
  r = max(r, 0.001);

  // === Rounded rectangle SDF (signed distance field) ===
  float2 halfSize = float2(aspect * 0.5 - r, 0.5 - r);
  float2 p = (uv - center) * float2(aspect, 1.0);
  float2 q = abs(p) - halfSize;
  float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

  // Normalized distance: positive = outside, negative = inside
  float d = sdf / min(iResolution.x, iResolution.y);
  float innerDist = -d;  // positive = inside, larger = deeper inside

  // Sharp edge mask for alpha clipping
  float edgeMask = 1.0 - smoothstep(-0.0015, 0.0015, d);

  // === 1. Contour Fresnel glow (narrow intense band) ===
  // Rapid exponential falloff from the exact edge inward.
  // Multiplier 50.0 controls glow width; higher = thinner/brighter.
  float fresnel = exp(-innerDist * 50.0) * 0.50;
  fresnel *= smoothstep(-0.002, 0.008, innerDist); // soften the absolute edge

  // Wider secondary Fresnel band (warmer, less intense)
  float fresnel2 = exp(-innerDist * 22.0) * 0.14;

  // === 2. Anisotropic specular highlight ===
  // Light reflects off convex glass as an elongated streak
  // perpendicular to the light direction.
  float2 lightDir = normalize(center - iLightOrigin);
  float2 perpDir = float2(-lightDir.y, lightDir.x);
  float2 dUv = uv - iLightOrigin;
  float projPerp = dot(dUv, perpDir);
  float projParallel = dot(dUv, lightDir);

  float spec = exp(-projPerp * projPerp / 0.09)
             * exp(-projParallel * projParallel / 0.0064);
  spec *= 0.42;
  // Fade specular near edges — highlight sits on the glass surface
  spec *= clamp(innerDist / 0.06, 0.0, 1.0);

  // === 3. Inner shadow ring (glass thickness illusion) ===
  // A dark band ~3px inside the edge (innerDist ≈ 0.025)
  float innerShadow = exp(-(innerDist - 0.025) * (innerDist - 0.025)
                          / (0.005 * 0.005));
  innerShadow *= 0.18;

  // === 4. Center darkening (convex depth) ===
  float radialDist = length((uv - center) * float2(aspect, 1.0));
  float maxRadial = length(
    float2(aspect * 0.5, 0.5) - float2(r / aspect, r));
  float centerDark = pow(clamp(radialDist / max(maxRadial, 0.001), 0.0, 1.0), 2.5);
  centerDark *= 0.12;

  // === Compose ===
  float3 color = float3(0.0);

  // Specular: warm white, slightly golden
  color += float3(spec * 1.08, spec * 1.03, spec * 0.95);

  // Fresnel narrow: cool blue-white (glass edge reflection)
  color += float3(fresnel * 0.20, fresnel * 0.28, fresnel * 0.55);
  // Fresnel wide: warmer rim
  color += float3(fresnel2 * 0.16, fresnel2 * 0.13, fresnel2 * 0.06);

  // Inner shadow: subtractive dark band
  color -= float3(innerShadow * 0.7, innerShadow * 0.75, innerShadow * 0.90);

  // Center darkening: subtractive gradient
  color -= centerDark * 0.55;

  // Very subtle overall blue glass tint
  color += float3(0.0, 0.0, 0.010);

  // Alpha from all highlight contributions
  float a = spec * 0.55 + fresnel * 0.60 + fresnel2 * 0.28 + innerShadow * 0.30;
  a = clamp(a, 0.0, 0.92);

  // Apply edge mask so highlights don't bleed outside the shape
  a *= edgeMask;

  return half4(half3(color), half(a));
}
`;
