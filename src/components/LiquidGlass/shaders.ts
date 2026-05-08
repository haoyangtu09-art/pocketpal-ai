/**
 * Liquid Glass SkSL Shader
 *
 * Adapted from the Dominaants "Liquid Glass" GLSL shader on Shadertoy
 * (shadertoy.com/view/3cdXDX), ported to SkSL for @shopify/react-native-skia.
 *
 * This is a purely procedural shader — no input image required.
 * Effects:
 *   - Superellipse (power 8) rounded rectangle mask
 *   - Specular highlight (top-left light source)
 *   - Fresnel edge reflection
 *   - Procedural frost/noise texture
 *   - Border glow
 */

export const liquidGlassShader = /* sksl */ `
uniform float2 iResolution;
uniform float4 glassColor;
uniform float cornerRadius;
uniform float refractionStrength;
uniform float blurAmount;
uniform float iTime;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + float2(1, 0)), f.x),
    mix(hash(i + float2(0, 1)), hash(i + float2(1, 1)), f.x),
    f.y
  );
}

half4 main(float2 xy) {
  float2 uv = xy / iResolution;
  float2 center = float2(0.5);
  float r = cornerRadius / min(iResolution.x, iResolution.y);

  // Superellipse (power 8) rounded rectangle mask
  float2 aspect = float2(iResolution.x / iResolution.y, 1.0);
  float2 p = (uv - center) * aspect;
  float2 q = abs(p) / (float2(0.5) - r * 0.95);
  float se = pow(q.x, 8.0) + pow(q.y, 8.0);

  // Inner fill mask
  float mask = 1.0 - smoothstep(0.88, 1.05, se);

  // Border region
  float border = smoothstep(0.82, 0.95, se) - smoothstep(0.95, 1.10, se);

  // ---- Base glass color ----
  float3 glassRgb = glassColor.rgb;
  float alpha = glassColor.a;

  // ---- Procedural background texture ----
  float2 texUv = xy * 0.008;
  float nBg = noise(texUv + iTime * 0.03) * 0.06;
  float3 bg = glassRgb * 0.75 + nBg;

  // ---- Specular highlight ----
  float2 lightPos = float2(0.22, 0.22);
  float2 toLight = lightPos - uv;
  float lightDist = length(toLight);
  float specSize = 0.32;
  float specular = exp(-lightDist * lightDist / (specSize * specSize));
  specular *= 0.22 * mask;

  // ---- Fresnel edge reflection ----
  float2 toCenter = uv - center;
  float edgeDist = length(toCenter * aspect * 1.7);
  float fresnel = pow(smoothstep(0.35, 0.92, edgeDist), 2.2) * 0.18 * mask;

  // ---- Frost texture ----
  float2 noiseUv = xy * 0.06 * blurAmount;
  float n0 = noise(noiseUv + iTime * 0.05);
  float n1 = noise(noiseUv * 2.1 + 1.3 - iTime * 0.03);
  float n2 = noise(noiseUv * 4.7 + 3.1);
  float frost = (n0 * 0.5 + n1 * 0.35 + n2 * 0.15) * refractionStrength * mask;

  // ---- Compose ----
  float3 result = bg * alpha * mask;

  // Specular
  result += float3(specular * 1.4, specular * 1.35, specular * 1.25);

  // Fresnel
  result += float3(fresnel * 0.9, fresnel * 0.95, fresnel * 1.0);

  // Border glow
  result += float3(0.28, 0.33, 0.42) * border * 0.45;

  // Frost overlay
  result += float3(frost * 0.7, frost * 0.75, frost * 0.85);

  float finalAlpha = alpha * mask + border * 0.4;

  return half4(half3(result), half(finalAlpha));
}
`;
