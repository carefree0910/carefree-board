export function parseColor(color: string): number {
  return parseInt(color.slice(1, 7), 16);
}

export function clipColor(color: number): number {
  return Math.round(Math.min(255.0, Math.max(0.0, color)));
}

export class RGBA {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number = 1.0) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  static from(color: string, alpha: number = 1.0): RGBA {
    if (color.startsWith("rgb")) {
      if (color.startsWith("rgba")) {
        const split = color
          .slice(5, color.length)
          .split(",")
          .map((element) => element.trim());
        if (split.length !== 4) {
          throw Error(
            `rgba is detected but ${split.length} numbers are provided`,
          );
        }
        return new RGBA(
          parseInt(split[0]),
          parseInt(split[1]),
          parseInt(split[2]),
          parseInt(split[3]),
        );
      }
      const split = color
        .slice(4, color.length)
        .split(",")
        .map((element) => element.trim());
      if (split.length !== 3) {
        throw Error(`rgb is detected but ${split.length} numbers are provided`);
      }
      return new RGBA(
        parseInt(split[0]),
        parseInt(split[1]),
        parseInt(split[2]),
        alpha,
      );
    }
    if (color.length !== 4 && color.length !== 7 && color.length !== 9) {
      throw Error(`unrecognized color string : ${color}`);
    }
    if (color.length === 4) {
      const [r, g, b] = color.slice(1, 4).split("");
      color = `#${r}${r}${g}${g}${b}${b}`;
    }
    return new RGBA(
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
      alpha,
    );
  }

  static parseColorString(str: string): {
    color: string;
    opacity: number;
  } {
    const startIdx = str[0] === "#" ? 1 : 0;
    let color = str.slice(startIdx);
    let opacity = 1;

    if (color.length === 3) {
      color = `${color[0]}${color[0]}${color[1]}${color[1]}${color[2]}${color[2]}`;
    }
    if (color.length === 8) {
      opacity = parseInt(color.slice(6), 16) / 255;
      color = color.slice(0, 6);
    }

    color = "#" + color;
    return {
      color,
      opacity,
    };
  }

  get hex(): number {
    const { r, g, b } = this;
    return (r << 16) + (g << 8) + b;
  }

  get hexString(): string {
    return "#" + ((1 << 24) + this.hex).toString(16).slice(1);
  }

  get hexStringWithAlpha(): string {
    return (
      "#" +
      ((1 << 24) + this.hex).toString(16).slice(1) +
      Math.min(255, Math.max(0, Math.round(this.a * 255)))
        .toString(16)
        .padStart(2, "0")
    );
  }

  get rgbString(): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }

  get rgbaString(): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  get isGrey(): boolean {
    const isClose = (a: number, b: number) => Math.abs(a - b) < 5;
    return (
      isClose(this.r, this.g) &&
      isClose(this.g, this.b) &&
      isClose(this.b, this.r)
    );
  }

  blendWith({ r: or, g: og, b: ob, a: oa }: RGBA): RGBA {
    const { r, g, b, a: a } = this;
    const newA = 1.0 - (1.0 - oa) * (1.0 - a);
    return new RGBA(
      clipColor((or * oa) / newA + (r * a * (1.0 - oa)) / newA),
      clipColor((og * oa) / newA + (g * a * (1.0 - oa)) / newA),
      clipColor((ob * oa) / newA + (b * a * (1.0 - oa)) / newA),
      newA,
    );
  }

  toHSL(): HSLA {
    let { r, g, b } = this;
    (r /= 255), (g /= 255), (b /= 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const h = this._hue(r, g, b, d, min, max);
    const l = (max + min) / 2;
    let s;
    if (max === min) {
      s = 0;
    } else {
      s = 0.5 * (l > 0.5 ? d / (1.0 - l) : d / l);
    }
    return new HSLA(h, s, l, this.a);
  }

  toHSV(): HSVA {
    let { r, g, b } = this;
    (r /= 255), (g /= 255), (b /= 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const h = this._hue(r, g, b, d, min, max);
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return new HSVA(h, s, v, this.a);
  }

  distanceTo(other: RGBA): number {
    const { r, g, b } = this;
    const { r: or, g: og, b: ob } = other;
    const rMean = 0.5 * (r + or);
    const dr = r - or;
    const dg = g - og;
    const db = b - ob;
    return Math.sqrt(
      (2 + rMean / 256) * dr * dr +
        4 * dg * dg +
        (2 + (255 - rMean) / 256) * db * db,
    );
  }

  private _hue(
    r: number,
    g: number,
    b: number,
    d: number,
    min: number,
    max: number,
  ): number {
    if (max === min) {
      return 0;
    }
    let h;
    switch (max) {
      case r: {
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      }
      case g: {
        h = (b - r) / d + 2;
        break;
      }
      case b: {
        h = (r - g) / d + 4;
        break;
      }
      default:
        throw Error("internal error occurred at RGBA._hue");
    }
    return h / 6;
  }
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export class HSVA {
  h: number;
  s: number;
  v: number;
  alpha: number;

  constructor(h: number, s: number, v: number, alpha: number = 1.0) {
    this.h = h;
    this.s = s;
    this.v = v;
    this.alpha = alpha;
  }

  toRGB(): RGBA {
    let r, g, b;
    const { h, s, v } = this;
    const h6 = Math.max(0.0, Math.min(6.0 - 1.0e-8, h * 6));
    const i = Math.floor(h6) % 6;
    const f = h6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i) {
      case 0: {
        (r = v), (g = t), (b = p);
        break;
      }
      case 1: {
        (r = q), (g = v), (b = p);
        break;
      }
      case 2: {
        (r = p), (g = v), (b = t);
        break;
      }
      case 3: {
        (r = p), (g = q), (b = v);
        break;
      }
      case 4: {
        (r = t), (g = p), (b = v);
        break;
      }
      case 5: {
        (r = v), (g = p), (b = q);
        break;
      }
      default:
        throw Error("internal error occurred at HSVA.toRGB");
    }
    return new RGBA(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
      this.alpha,
    );
  }
}

export class HSLA {
  h: number;
  s: number;
  l: number;
  alpha: number;

  constructor(h: number, s: number, l: number, alpha: number = 1.0) {
    this.h = h;
    this.s = s;
    this.l = l;
    this.alpha = alpha;
  }

  toRGB(): RGBA {
    let r, g, b;
    const { h, s, l } = this;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return new RGBA(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
      this.alpha,
    );
  }
}

export function blendColors(...colors: RGBA[]): RGBA {
  return colors.reduce((memo, current) => {
    return memo.blendWith(current);
  });
}
