/**
 * Liquid Glass SkSL Shader
 *
 * Adapted from the Dominaants "Liquid Glass" GLSL shader on Shadertoy
 * (shadertoy.com/view/3cdXDX), ported to SkSL for @shopify/react-native-skia.
 *
 * Produces a smooth, semi-transparent glass surface with:
 *   - Superellipse rounded-rectangle mask
 *   - Soft specular highlight
 *   - Subtle fresnel edge reflection
 *   - Border glow
 */

export const liquidGlassShader = /* sksl */ `
uniform float2 iResolution;
uniform float4 glassColor;
uniform float cornerRadius;
uniform float refractionStrength;
uniform float blurAmount;

half4 main(float2 xy) {
  float2 uv = xy / iResolution;
  float2 center = float2(0.5);
  float r = cornerRadius / min(iResolution.x, iResolution.y);

  // Superellipse (power 8) rounded rectangle mask
  float2 aspect = float2(iResolution.x / iResolution.y, 1.0);
  float2 p = (uv - center) * aspect;
  float2 q = abs(p) / (float2(0.5) - r * 0.95);
  float se = pow(q.x, 8.0) + pow(q.y, 8.0);

  // Soft inner fill mask
  float mask = 1.0 - smoothstep(0.88, 1.05, se);

  // Border region for glow
  float border = smoothstep(0.82, 0.95, se) - smoothstep(0.95, 1.10, se);

  // ---- Base glass: smooth semi-transparent color ----
  float3 glassRgb = glassColor.rgb;
  float alpha = glassColor.a;

  // ---- Specular highlight (soft top-left light reflection) ----
  float2 lightPos = float2(0.18, 0.18);
  float2 toLight = lightPos - uv;
  float lightDist = length(toLight);
  float specSize = 0.28;
  float specular = exp(-lightDist * lightDist / (specSize * specSize));
  specular *= 0.18 * mask;

  // ---- Fresnel edge reflection (subtle) ----
  float2 toCenter = uv - center;
  float edgeDist = length(toCenter * aspect * 1.6);
  float fresnel = pow(smoothstep(0.38, 0.90, edgeDist), 2.0) * 0.12 * mask;

  // ---- Compose final color ----
  // Start with the glass tint at the given alpha
  float3 result = glassRgb * alpha * mask;

  // Add soft specular highlight (slightly warm white)
  result += float3(specular * 1.3, specular * 1.25, specular * 1.1);

  // Add subtle fresnel blue-tinted edge reflection
  result += float3(fresnel * 0.3, fresnel * 0.35, fresnel * 0.55);

  // Add border glow
  result += float3(0.15, 0.18, 0.25) * border * 0.35;

  float finalAlpha = alpha * mask + border * 0.3;

  return half4(half3(result), half(finalAlpha));
}
`;
