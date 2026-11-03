import { fontFormat } from "../lib/brand-assets.js";

export function fontFamilyAlias(font) { return `mh-font-${font.id}`; }

export function fontWeights(font) {
  const weights = Array.isArray(font.weights) ? font.weights : [];
  const valid = weights.map(Number).filter((weight) => Number.isInteger(weight) && weight >= 100 && weight <= 900);
  return valid.length ? valid : [400];
}

export function BrandFontStyles({ fonts, urls }) {
  const rules = [];
  for (const font of fonts) {
    const url = font.storage_path ? urls[font.storage_path] : null;
    if (!url) continue;
    for (const weight of fontWeights(font)) rules.push(`@font-face{font-family:"${fontFamilyAlias(font)}";src:url("${url}")format("${fontFormat(font.storage_path)}");font-weight:${weight};font-display:swap;}`);
  }
  return rules.length ? <style>{rules.join("\n")}</style> : null;
}
