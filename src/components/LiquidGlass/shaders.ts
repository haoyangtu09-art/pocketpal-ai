/**
 * Liquid Glass Highlight Shader
 *
 * Sits on top of the BackdropFilter (blurred backdrop + tinted fill)
 * and adds specular highlight + fresnel edge reflection.
 *
 * The shader is mostly transparent — highlights only appear at
 * the top-left reflection spot and along the edges.
 */

export const highlightShader = /* sksl */ `
uniform float2 iResolution;
uniform float cornerRadius;

half4 main(float2 xy) {
  float2 uv = xy / iResolution;
  float2 center = float2(0.5);
  float r = cornerRadius / min(iResolution.x, iResolution.y);

  // Superellipse rounded rectangle (power 8)
  float2 aspect = float2(iResolution.x / iResolution.y, 1.0);
  float2 p = (uv - center) * aspect;
  float2 q = abs(p) / (float2(0.5) - r * 0.95);
  float se = pow(q.x, 8.0) + pow(q.y, 8.0);

  // Soft edge mask — alpha transitions to 0 outside the rounded rect
  float edge = 1.0 - smoothstep(0.88, 1.02, se);

  // ---- Specular highlight (warm top-left light reflection) ----
  float2 lightPos = float2(0.14, 0.14);
  float dLight = length(lightPos - uv);
  float specSize = 0.28;
  float specular = exp(-dLight * dLight / (specSize * specSize));
  specular *= 0.30 * edge;

  // ---- Fresnel edge reflection (subtle blue-tinted rim light) ----
  float edgeDist = length((uv - center) * aspect * 1.55);
  float fresnel = pow(smoothstep(0.38, 0.88, edgeDist), 2.5) * 0.10 * edge;

  // ---- Border rim glow (very subtle) ----
  float border = smoothstep(0.82, 0.96, se) - smoothstep(0.96, 1.08, se);
  float rimGlow = border * 0.12;

  // Composed alpha: highlights only visible where spec/fresnel/rim contribute
  float a = specular * 0.7 + fresnel * 0.55 + rimGlow * 0.5;

  // Specular is warm white, fresnel/rim tint slightly blue
  float3 color = float3(0.0);
  color += float3(specular * 1.15, specular * 1.1, specular * 1.0);
  color += float3(fresnel * 0.1, fresnel * 0.12, fresnel * 0.3);
  color += float3(rimGlow * 0.25, rimGlow * 0.28, rimGlow * 0.40);

  return half4(half3(color), half(a));
}
`;
