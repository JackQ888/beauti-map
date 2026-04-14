import ColorUtil from '../color/ColorUtil';

export default {
  createBar(x: number, y: number, radius: number, height: number, topColor: string, bottomColor: string, split: number = 4): {
    sections: number[];
    tops: number[];
    sectionColors: number[];
    topColors: number[];
  } {
    let tColor: number[] = ColorUtil.toOneRGBA(topColor)
    let bColor: number[] = ColorUtil.toOneRGBA(bottomColor)
    let sections: number[] = [], tops: number[] = [], sectionColors: number[] = [], topColors: number[] = []
    const PI2 = Math.PI * 2
    const step = 1 / split / 4
    for (let i = 0; i < split; i++) {
      let sp = i / split, ep = (i + 1) / split
      let startTheta = sp * PI2
      let endTheta = ep * PI2
      let sx = x + Math.cos(startTheta) * radius
      let sy = y + Math.sin(startTheta) * radius
      let ex = x + Math.cos(endTheta) * radius
      let ey = y + Math.sin(endTheta) * radius

      //[x,y,h,u,v]
      sections.push(sx, sy, 0, sp + step, 0)
      sectionColors.push(bColor[0], bColor[1], bColor[2], bColor[3])

      sections.push(sx, sy, height, sp + step, 1)
      sectionColors.push(tColor[0], tColor[1], tColor[2], tColor[3])

      sections.push(ex, ey, 0, ep - step, 0)
      sectionColors.push(bColor[0], bColor[1], bColor[2], bColor[3])

      sections.push(ex, ey, 0, ep - step, 0)
      sectionColors.push(bColor[0], bColor[1], bColor[2], bColor[3])

      sections.push(sx, sy, height, sp + step, 1)
      sectionColors.push(tColor[0], tColor[1], tColor[2], tColor[3])

      sections.push(ex, ey, height, ep - step, 1)
      sectionColors.push(tColor[0], tColor[1], tColor[2], tColor[3])

      tops.push(sx, sy, height, 1)
      topColors.push(tColor[0], tColor[1], tColor[2], tColor[3])

      tops.push(x, y, height, 0)
      topColors.push(tColor[0], tColor[1], tColor[2], tColor[3])

      tops.push(ex, ey, height, 1)
      topColors.push(tColor[0], tColor[1], tColor[2], tColor[3])
    }

    return {sections, tops, sectionColors, topColors}
  }
}
