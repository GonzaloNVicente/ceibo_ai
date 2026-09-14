function oklchToRgb(l, c, h) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  function toGamma(v) {
    v = Math.max(0, Math.min(1, v));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  }

  const r255 = Math.round(toGamma(r) * 255);
  const g255 = Math.round(toGamma(g) * 255);
  const b255 = Math.round(toGamma(bl) * 255);

  const hex = "#" + [r255, g255, b255].map(x => x.toString(16).padStart(2, "0")).join("");
  return { hex, rgb: [r255, g255, b255] };
}

const darkColors = [
  ["dark-background", 0.129, 0.042, 264.695],
  ["dark-foreground", 0.984, 0.003, 247.858],
  ["dark-card", 0.208, 0.042, 265.755],
  ["dark-card-foreground", 0.984, 0.003, 247.858],
  ["dark-primary", 0.929, 0.013, 255.508],
  ["dark-primary-foreground", 0.208, 0.042, 265.755],
  ["dark-secondary / muted / accent", 0.279, 0.041, 260.031],
  ["dark-muted-foreground", 0.704, 0.04, 256.788],
  ["dark-destructive", 0.704, 0.191, 22.216],
  ["dark-ring", 0.551, 0.027, 264.364],
  ["dark-sidebar", 0.208, 0.042, 265.755],
  ["dark-sidebar-primary", 0.488, 0.243, 264.376],
  ["dark-sidebar-accent", 0.279, 0.041, 260.031],
];

for (const [name, l, c, h] of darkColors) {
  const { hex, rgb } = oklchToRgb(l, c, h);
  console.log(`${name.padEnd(30)}: oklch(${l} ${c} ${h}) -> ${hex} rgb(${rgb.join(", ")})`);
}
