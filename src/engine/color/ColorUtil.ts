/**
 * @desc 颜色两种混合
 * @param beginColor 开始颜色
 * @param endColor 结束颜色
 * @param percent 混合比例(0-1)
 * */
export function mix(beginColor: string, endColor: string, percent: number): string {
  percent = Math.min(percent, 1)
  percent = Math.max(0, percent)
  if (percent <= 0) return beginColor
  if (percent >= 1) return endColor
  let bc: number[] = toRGBA(beginColor)
  let ec: number[] = toRGBA(endColor)
  let rc: number[] = []
  bc.forEach((c, i) => {
    c = (c - 0) + ((ec[i] - 0) - (c - 0)) * percent;
    rc.push(i < 3 ? Math.round(c) : c);
  })
  let cc: string = "rgba(" + rc[0] + "," + rc[1] + "," + rc[2] + "," + rc[3] + ")"
  return cc;
}

/**
 * @desc 颜色字符串转RGBA数组
 * @param color 颜色
 * */
export function toRGBA(color: string): number[] {
  if (!color || typeof (color) !== 'string' || color === 'none') return [
    0,
    0,
    0,
    0]
  let r = 0, g = 0, b = 0, a = 1
  if (color.startsWith("#")) {
    if (color.length == 4) {
      let rr = color.substring(1, 2), gg = color.substring(2, 3),
          bb = color.substring(3, 4)
      r = parseInt(rr + rr, 16)
      g = parseInt(gg + gg, 16)
      b = parseInt(bb + bb, 16)
    } else {
      r = parseInt(color.substring(1, 3), 16)
      g = parseInt(color.substring(3, 5), 16)
      b = parseInt(color.substring(5, 7), 16)
    }
  } else if (color.startsWith('rgb(')) {
    let arr: string[] = color.substr(0, color.length - 1).split("rgb(")[1].split(",")
    r = arr[0] as any - 0
    g = arr[1] as any - 0
    b = arr[2] as any - 0
  } else if (color.startsWith('rgba(')) {
    let arr: string[] = color.substr(0, color.length - 1).split("rgba(")[1].split(",")
    r = arr[0] as any - 0
    g = arr[1] as any - 0
    b = arr[2] as any - 0
    a = arr[3] as any - 0
  }
  return [r, g, b, a]
}

/**
 * @desc 颜色字符串转归一化RGBA数组,一般WEBGL使用
 * @param color 颜色
 * */
export function toOneRGBA(color: string): number[] {
  let rgba: number[] = toRGBA(color)
  return [rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3]]
}

/**
 * @desc 颜色字符串转归一RGBA数组并且预乘alpha,一般WEBGL使用
 * @param color 颜色
 * */
export function toOnePreMultiplyAlphaRGBA(color: string): number[] {
  let rgba: number[] = toRGBA(color)
  let a: number = rgba[3]
  return [rgba[0] * a / 255, rgba[1] * a / 255, rgba[2] * a / 255, a]
}

/**
 * @desc 判断颜色是否为亮色
 * @param color 颜色
 * */
export function isLightColor(color: string): boolean {
  if (!color) return true
  let rgba: number[] = toRGBA(color)
  if (rgba[3] == 0) return true
  let avg: number = (rgba[0] / rgba[3] + rgba[1] / rgba[3] + rgba[2] / rgba[3]) / 3
  if (avg > 127) {
    return true
  } else {
    return false
  }
}

/**
 * @desc 颜色偏移,可以增加或者减少亮度
 * @param color 颜色
 * @param offset 偏移量
 * */
export function offset(color: string, offset: number = 0): string {
  if (offset === 0) return color
  let r: number | undefined, g: number | undefined, b: number | undefined, a: number | undefined
  if (color.startsWith("#")) {
    if (color.length === 4) {
      let rr = color.substring(1, 2), gg = color.substring(2, 3),
          bb = color.substring(3, 4)
      r = parseInt(rr + rr, 16)
      g = parseInt(gg + gg, 16)
      b = parseInt(bb + bb, 16)
    } else {
      r = parseInt(color.substring(1, 3), 16)
      g = parseInt(color.substring(3, 5), 16)
      b = parseInt(color.substring(5, 7), 16)
    }
    a = 1
  } else if (color.startsWith('rgb(')) {
    let arr: string[] = color.substr(0, color.length - 1).split("rgb(")[1].split(",")
    r = parseInt(arr[0])
    g = parseInt(arr[1])
    b = parseInt(arr[2])
    a = 1
  } else if (color.startsWith('rgba(')) {
    let arr: string[] = color.substr(0, color.length - 1).split("rgba(")[1].split(",")
    r = parseInt(arr[0])
    g = parseInt(arr[1])
    b = parseInt(arr[2])
    a = arr[3] as any - 0
  }
  return `rgba(${Math.min(Math.max(r! + offset, 0), 255)},${Math.min(
      Math.max(g! + offset, 0), 255)},${Math.min(Math.max(b! + offset, 0),
      255)},${a})`
}

/**
 *  @desc 基于当前颜色叠加透明度
 *  @param color 颜色
 *  @param alpha 透明度
 * */
export function multiplyAlpha(color: string, alpha: number = 1): string {
  let rgba: number[] = toRGBA(color)
  return `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${Math.min(rgba[3] * alpha,
      1)})`
}

/**
 *  @desc 基于当前颜色重新设置透明度
 *  @param color 颜色
 *  @param alpha 透明度
 * */
export function setAlpha(color: string, alpha: number = 1): string {
  if (alpha >= 1) return color
  let rgba: number[] = toRGBA(color)
  return `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${alpha})`
}

/**
 *  @desc 通过颜色列表获取指定比例下的混合颜色
 *  @param colors 颜色列表
 *  @param p 百分比
 * */
export function mixColorByColors(colors: [number, string][], p: number): string {
  if (colors.length === 1) return colors[0][1]
  p = Math.max(0, Math.min(1, p))

  if (p >= colors[colors.length - 1][0]) {
    return colors[colors.length - 1][1]
  } else if (p <= colors[0][0]) {
    return colors[0][1]
  }

  let before: [number, string] = colors[0]
  for (let i = 1, l = colors.length; i < l; i++) {
    let c: [number, string] = colors[i]
    if (p <= c[0]) {
      let s = before[0]
      let e = c[0]
      let percent = (p - s) / (e - s)
      return mix(before[1], c[1], percent)
    }
    before = c
  }
  return ''
}

/**
 *  @desc 通过颜色列表转换为hsb
 * */
export function rgbToHsb(r: number, g: number, b: number): number[] {
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h: number, s: number, v = max;

  let d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, v]
}

/**
 *  @desc 通过hsb列表转换为颜色
 * */
export function hsbToRgb(h: number, s: number, v: number): number[] {
  let r: number, g: number, b: number;
  let i = Math.floor(h * 6.0);
  let f = h * 6.0 - i;
  let p = v * (1.0 - s);
  let q = v * (1.0 - f * s);
  let t = v * (1.0 - (1.0 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return [
    Math.round(r! * 255),
    Math.round(g! * 255),
    Math.round(b! * 255)
  ]
}

export function filterColor(color: string, hScale: number = 1, sScale: number = 1, bScale: number = 1): string {
  let rgba: number[] = toRGBA(color)
  let hsb: number[] = rgbToHsb(rgba[0], rgba[1], rgba[2])
  let rgb: number[] = hsbToRgb(hsb[0] * hScale, hsb[1] * sScale, hsb[2] * bScale)
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${rgba[3]})`
}

export default {
  mixColorByColors,
  multiplyAlpha,
  setAlpha,
  offset,
  toRGBA,
  toOneRGBA,
  filterColor,
  toOnePreMultiplyAlphaRGBA,
  mix,
  isLightColor
}
