import MathUtil from "../math/MathUtil"
import ColorUtil from "../color/ColorUtil"

let colorRegex = /^rgb|#/


function getPixel(str: string): number {
    if (!str || !str.substring) return 0
    return str.substring(0, str.length - 2) as any as number
}

function getPercent(str: string): number {
    if (!str || !str.substring) return 0
    return str.substring(0, str.length - 1) as any as number
}

function mixPixel(px1: string, px2: string, percent: number): string {
    let p1 = px1.substring(0, px1.length - 2) as any as number
    let p2 = px2.substring(0, px2.length - 2) as any as number
    return MathUtil.deal(p1 + (p2 - p1) * percent) + "px"
}


function mixPercent(pt1: string, pt2: string, percent: number): string {
    let p1 = pt1.substring(0, pt1.length - 1) as any as number
    let p2 = pt2.substring(0, pt2.length - 1) as any as number
    return (p1 + (p2 - p1) * percent) + "%"
}

function isPixel(content: any): boolean {
    if (!content) return false
    return content.endsWith && content.endsWith("px");
}

function isPercent(content: any): boolean {
    if (!content) return false
    return content.endsWith && content.endsWith("%");
}

function isColor(content: string): boolean {
    return colorRegex.test(content)
}

function mixArray(arr1: any[], arr2: any[], percent: number, type: string): any[] {
    let length = Math.min(arr1.length, arr2.length)
    let arr: any[] = []
    switch (type) {
        case "color": {
            for (let i = 0; i < length; i++) {
                arr[i] = ColorUtil.mix(arr1[i], arr2[i], percent)
            }
            break
        }
        case "number": {
            for (let i = 0; i < length; i++) {
                arr[i] = MathUtil.mix(arr1[i], arr2[i], percent)
            }
            break
        }
        case "pixel": {
            for (let i = 0; i < length; i++) {
                arr[i] = mixPixel(arr1[i], arr2[i], percent)
            }
            break
        }
        case "percent": {
            for (let i = 0; i < length; i++) {
                arr[i] = mixPercent(arr1[i], arr2[i], percent)
            }
            break
        }
    }
    return arr
}

function getType(value: any): string | string[] {
    if (typeof (value) === 'number') return "number"
    if (isColor(value)) return "color"
    if (isPercent(value)) return "percent"
    if (isPixel(value)) return "pixel"
    if (value instanceof Array) {
        let ts: string[] = []
        for (let v of value) {
            ts.push(getType(v) as string)
        }
        return ts
    }
    return "unknown"
}

function mix(v1: any, v2: any, percent: number, type: any): any {
    switch (type) {
        case "color": {
            return ColorUtil.mix(v1, v2, percent)
        }
        case "number": {
            return MathUtil.mix(v1, v2, percent)
        }
        case "pixel": {
            return mixPixel(v1, v2, percent)
        }
        case "percent": {
            return mixPercent(v1, v2, percent)
        }
        case "unknown": {
            return v2
        }
        default: {
            if (type instanceof Array) {
                let vs: any[] = []
                for (let i = 0, l = type.length; i < l; i++) {
                    vs.push(mix(v1[i], v2[i], percent, type[i]))
                }
                return vs
            }
            return v2
        }
    }
}


export default { isColor, isPixel, isPercent, mixPixel, mixPercent, mixArray, getType, mix }
