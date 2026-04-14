function min(x1: number | null | undefined, x2: number | null | undefined): number | null | undefined {
    if (x1 === null || x1 === undefined) return x2
    if (x2 === null || x2 === undefined) return x1
    return Math.min(x1, x2)
}

function max(x1: number | null | undefined, x2: number | null | undefined): number | null | undefined {
    if (x1 === null || x1 === undefined) return x2
    if (x2 === null || x2 === undefined) return x1
    return Math.max(x1, x2)
}

function inRange(start: number, end: number, value: number): boolean {
    return start <= value && end >= value
}

function rotate(x: number, y: number, theta: number): number[] {
    let sinTheta = Math.sin(theta)
    let cosTheta = Math.cos(theta)
    return [x * cosTheta - y * sinTheta, x * sinTheta + y * cosTheta]
}

function rotateBox(w: number, h: number, theta: number): number[] {
    if (theta % Math.PI === 0) return [w, h]
    let sinTheta = Math.abs(Math.sin(theta))
    let cosTheta = Math.abs(Math.cos(theta))
    return [w * cosTheta + h * sinTheta, w * sinTheta + h * cosTheta]
}

function pointInRect(rect: number[], point: number[]): boolean {
    return inRange(rect[0], rect[0] + rect[2], point[0]) &&
        inRange(rect[1], rect[1] + rect[3], point[1]);
}

let ctx: CanvasRenderingContext2D | null, canvas: HTMLCanvasElement | null

function measureText(text: string | string[], style?: any, context?: CanvasRenderingContext2D): { width: number, height: number } {
    let myCtx = context || ctx
    if (!myCtx) {
        canvas = document.createElement("canvas")
        ctx = myCtx = canvas!.getContext("2d")!
    }
    if (style) myCtx!.save()
    let width = 0, height = 0
    if (text instanceof Array) {
        for (let t of text) {
            if (style) {
                (myCtx as any).font = ((style.fontStyle || "") + " " + (style.fontWeight || "") +
                    " " + style.fontSize + "px " + style.fontFamily).trim()
            }
            let rect = (myCtx as any).measureText(t)
            width = Math.max(width, rect.width)
            height = rect.fontBoundingBoxAscent == null ? style.fontSize : (rect.fontBoundingBoxAscent + rect.fontBoundingBoxDescent)
        }
    } else {
        if (style) {
            (myCtx as any).font = ((style.fontStyle || "") + " " + (style.fontWeight || "") +
                " " + style.fontSize + "px " + style.fontFamily).trim()
        }
        let rect = (myCtx as any).measureText(text)
        width = rect.width
        height = rect.fontBoundingBoxAscent == null ? style.fontSize : (rect.fontBoundingBoxAscent + rect.fontBoundingBoxDescent)
    }
    if (style) myCtx!.restore()
    return { width, height }
}

function collision(b1: number[], b2: number[]): boolean {
    let dx = Math.abs(b1[0] + b1[2] / 2 - b2[0] - b2[2] / 2)
    let dy = Math.abs(b1[1] + b1[3] / 2 - b2[1] - b2[3] / 2);
    let dw = (b1[2] + b2[2]) / 2
    let dh = (b1[3] + b2[3]) / 2
    return dx <= dw && dy <= dh;
}

function deal(num: number, pixelRatio: number = window.devicePixelRatio, floor: boolean = true): number {
    if (!floor) return num
    let value = Math.floor(num * pixelRatio) / pixelRatio
    if (!value && num) {
        return num / Math.abs(num) / pixelRatio
    }
    return value
}

function distance(targetX: number, targetY: number, sourceX: number, sourceY: number): number {
    let deltaX = targetX - sourceX, deltaY = targetY - sourceY
    if (!deltaX && !deltaY) return 0
    return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
}

function distance2(targetX: number, targetY: number, sourceX: number, sourceY: number): number {
    return Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
}

function distancexy(x: number, y: number): number {
    return Math.sqrt(Math.pow(y, 2) + Math.pow(x, 2))
}

function distancexy2(x: number, y: number): number {
    return Math.pow(y, 2) + Math.pow(x, 2)
}

function mixPoint2D(n1: number[] | null, n2: number[] | null, percent: number): number[] | null {
    if (!n1) return n2 || null
    if (!n2) return n1
    return [mix(n1[0], n2[0], percent), mix(n1[1], n2[1], percent)]
}

function compute(style: any, size: number, ratio: number = window.devicePixelRatio): number {
    if (style === 0 || style === "0px" || style === "0") return 0
    if (!style) {
        console.error("格式错误:" + style)
        return 0
    }
    if (!style.trim) {
        console.error("格式错误:" + style)
        return 0
    }
    style = style.trim()
    let x1: number, x2: number
    let isAdd = style.indexOf("+") > 0
    let isReduce = style.indexOf("-") > 0
    if (isAdd || isReduce) {
        let arr: string[]
        if (isAdd) {
            arr = style.split("+")
        } else {
            arr = style.split("-")
        }
        let n1 = arr[0]
        let n2 = arr[1]
        if (n1.endsWith("%") && n2.endsWith("px")) {
            let percent = (n1.substring(0, n1.length - 1) as any as number) - 0
            x1 = percent * size * 0.01
            x2 = (n2.substring(0, n2.length - 2) as any as number) - 0
        } else if (n1.endsWith("px") && n2.endsWith("%")) {
            let percent = (n2.substring(0, n2.length - 1) as any as number) - 0
            x2 = percent * size * 0.01
            x1 = (n1.substring(0, n1.length - 2) as any as number) - 0
        } else {
            console.error("格式错误:" + style)
            return 0
        }
        if (isAdd) {
            return deal(x1 + x2, ratio)
        } else {
            return deal(x1 - x2, ratio)
        }
    } else {
        if (style.endsWith("%")) {
            let percent = style.substring(0, style.length - 1) - 0
            return deal(percent * size * 0.01, ratio)
        } else if (style.endsWith("px")) {
            return deal(style.substring(0, style.length - 2) - 0, ratio)
        }
        console.error("格式错误:" + style)
        return 0
    }
}

function isCollisionArea(ps: number[][], p: number[]): boolean {
    let count = 0
    let d = Math.random() * Math.PI * 2
    let tp = [p[0] + Math.cos(d), p[1] + Math.sin(d)]
    for (let i = 0; i < ps.length - 1; i++) {
        if (isIntersection(ps[i], ps[i + 1], p, tp)) count++
    }
    if (!arrayEqual(ps[ps.length - 1], ps[0])) {
        if (isIntersection(ps[ps.length - 1], ps[0], p, tp)) count++
    }
    return count % 2 === 1
}

function pointInArray(arr: number[][], p: number[]): boolean {
    for (let row of arr) {
        if (row[0] === p[0] && row[1] === p[1]) return true
    }
    return false
}

function arrayEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false
    for (let i = 0, l = arr1.length; i < l; i++) {
        if (arr1[i] !== arr2[i]) return false
    }
    return true
}

function isIntersection(p1: number[], p2: number[], p3: number[], p4: number[]): boolean | null {
    let dx1 = p2[0] - p1[0];
    let dy1 = p2[1] - p1[1];
    let dx3 = p4[0] - p3[0];
    let dy3 = p4[1] - p3[1];

    dx1 = (dx1 == 0 ? 0.000001 : dx1)
    dx3 = (dx3 == 0 ? 0.000001 : dx3)
    let k1 = (dy1 / dx1);
    let k3 = (dy3 / dx3);
    if (k1 == k3) return null;
    let n = (p3[1] + k3 * (p1[0] - p3[0]) - p1[1]) / (dy1 - (k3) * dx1)
    if (n < 0 || n > 1) {
        return false;
    }
    let m = (p1[0] + dx1 * n - p3[0]) / (dx3)
    if (isNaN(m)) {
        return false
    }
    if (m <= 0) {
        return false;
    }
    return true
}

function bezier(startPoint: number[], control1: number[], control2: number[], endPoint: number[], t: number): number[] {
    let x = startPoint[0] * Math.pow(1 - t, 3) + 3 * control1[0] * t *
        Math.pow(1 - t, 2) + 3 * control2[0] * Math.pow(t, 2) * (1 - t) +
        endPoint[0] * Math.pow(t, 3)
    let y = startPoint[1] * Math.pow(1 - t, 3) + 3 * control1[1] * t *
        Math.pow(1 - t, 2) + 3 * control2[1] * Math.pow(t, 2) * (1 - t) +
        endPoint[1] * Math.pow(t, 3)
    return [x, y]
}

function quadratic(startPoint: number[], control: number[], endPoint: number[], t: number): number[] {
    let t2 = t * t
    let x = startPoint[0] * Math.pow(1 - t, 2) + 2 * t * (1 - t) * control[0] +
        t2 * endPoint[0]
    let y = startPoint[1] * Math.pow(1 - t, 2) + 2 * t * (1 - t) * control[1] +
        t2 * endPoint[1]
    return [x, y]
}

function quadratic3d(startPoint: number[], control: number[], endPoint: number[], t: number): number[] {
    let t2 = t * t
    let x = startPoint[0] * Math.pow(1 - t, 2) + 2 * t * (1 - t) * control[0] +
        t2 * endPoint[0]
    let y = startPoint[1] * Math.pow(1 - t, 2) + 2 * t * (1 - t) * control[1] +
        t2 * endPoint[1]
    let z = startPoint[2] * Math.pow(1 - t, 2) + 2 * t * (1 - t) * control[2] +
        t2 * endPoint[2]
    return [x, y, z]
}

function mix(n1: number, n2: number, percent: number): number {
    return n1 + (n2 - n1) * percent
}

function mixPoint(n1: number[], n2: number[], percent: number): number[] {
    return [mix(n1[0], n2[0], percent), mix(n1[1], n2[1], percent)]
}

function interceptionQuadratic(startPoint: number[], control: number[], endPoint: number[], s: number, e: number): number[] | number[][] | null {
    if (s === e) return null
    let e1 = mixPoint(startPoint, control, e)
    let e2 = mixPoint(control, endPoint, e)
    let ctrl_n = mixPoint(e1, e2, s)
    let s_n = quadratic(startPoint, control, endPoint, s)
    let e_n = quadratic(startPoint, control, endPoint, e)
    return [s_n, ctrl_n, e_n]
}

function interceptionBezier(startPoint: number[], control1: number[], control2: number[], endPoint: number[], s: number, e: number): number[] | number[][] | null {
    if (s === e) return null
    let s1 = mixPoint(startPoint, control1, s)
    let s2 = mixPoint(control1, control2, s)
    let s3 = mixPoint(control2, endPoint, s)
    let e1 = mixPoint(startPoint, control1, e)
    let e2 = mixPoint(control1, control2, e)
    let e3 = mixPoint(control2, endPoint, e)
    let ss1 = mixPoint(s1, s2, s)
    let ss2 = mixPoint(s2, s3, s)
    let ee1 = mixPoint(e1, e2, e)
    let ee2 = mixPoint(e2, e3, e)
    let ctrl_start = mixPoint(ss1, ss2, e)
    let ctrl_end = mixPoint(ee2, ee1, 1 - s)
    let s_n = bezier(startPoint, control1, control2, endPoint, s)
    let e_n = bezier(startPoint, control1, control2, endPoint, e)
    return [s_n, ctrl_start, ctrl_end, e_n]
}

function fontSize(style: string): number {
    let pixel = style.match(/\d+px/)?.[0]
    if (!pixel) return 0
    return pixel.substr(0, pixel.length - 2) as any - 0
}

function arraySum(array: number[], start: number = 0, end: number = array.length): number {
    let sum = 0
    for (let i = start; i < end; i++) {
        sum += array[i]
    }
    return sum
}

function randomRange(start: number, end: number): number {
    return Math.random() * (end - start) + start
}

function pointToLineDistance(p1: number[], p2: number[], point: number[]): number {
    let v13 = [point[0] - p1[0], point[1] - p1[1]];
    let v12 = [p2[0] - p1[0], p2[1] - p1[1]];
    if (p1[0] === p2[0] && p1[1] === p2[1]) {
        return length(v13);
    }

    if (dot(v12, v13) < 0) return length(v13);

    let v21 = [-v12[0], -v12[1]];
    let v23 = [point[0] - p2[0], point[1] - p2[1]];

    if (dot(v21, v23) < 0) return length(v23);

    let v31 = [-v13[0], -v13[1]]

    let normal = [-v12[1], v12[0]]
    let l = length(v31)
    let cosT = dot(normal, v31) / (l * length(normal))
    return Math.abs(l * cosT)
}

function dot(v1: number[], v2: number[]): number {
    return v1[0] * v2[0] + v1[1] * v2[1];
}

function length(v: number[]): number {
    return Math.sqrt(v[1] * v[1] + v[0] * v[0]);
}

function normalize(v: number[]): number[] {
    let l = length(v)
    return [v[0] / l, v[1] / l]
}

function accDiv(arg1: number, arg2: number): number {
    let t1 = 0, t2 = 0, r1: number, r2: number;
    try {
        t1 = arg1.toString().split(".")[1].length;
    } catch (e) {
    }

    try {
        t2 = arg2.toString().split(".")[1].length;
    } catch (e) {
    }

    r1 = Number(arg1.toString().replace(".", ""));
    r2 = Number(arg2.toString().replace(".", ""));
    return (r1 / r2) * Math.pow(10, t2 - t1);
}

function accMul(arg1: number, arg2: number): number {
    var m = 0, s1 = arg1.toString(),
        s2 = arg2.toString();
    try {
        m += s1.split(".")[1].length
    } catch (e) {
    }
    try {
        m += s2.split(".")[1].length
    } catch (e) {
    }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) /
        Math.pow(10, m)
}

function accAdd(arg1: number, arg2: number): number {
    var r1: number, r2: number, m: number;
    try {
        r1 = arg1.toString().split(".")[1].length;
    } catch (e) {
        r1 = 0
    }
    try {
        r2 = arg2.toString().split(".")[1].length;
    } catch (e) {
        r2 = 0
    }
    m = Math.pow(10, Math.max(r1, r2));
    return (arg1 * m + arg2 * m) / m;
}

function roundBoxDistance(x: number, y: number, width: number, height: number, radius: number | number[]): number {
    if (radius instanceof Array) {
        if (x < width / 2) {
            if (y < height / 2) {
                radius = radius[0]
            } else {
                radius = radius[3]
            }
        } else {
            if (y < height / 2) {
                radius = radius[1]
            } else {
                radius = radius[2]
            }
        }
    }
    radius -= 0
    x -= width / 2
    y -= height / 2
    width /= 2
    height /= 2
    const dx = Math.abs(x) - width + (radius as number), dy = Math.abs(y) - height + (radius as number);
    return length([max(dx, 0.0) as number, max(dy, 0.0) as number]) + (min(max(dx, dy), 0.0) as number) - (radius as number);
}

export default {
    isCollisionArea,
    rotate,
    rotateBox,
    fontSize,
    collision,
    pointInRect,
    inRange,
    deal,
    arraySum,
    distance,
    distance2,
    distancexy,
    distancexy2,
    compute,
    mix,
    min, max,
    bezier,
    quadratic,
    quadratic3d,
    mixPoint2D,
    measureText,
    isIntersection,
    interceptionQuadratic,
    interceptionBezier,
    randomRange,
    dot,
    length,
    normalize,
    pointToLineDistance, accDiv, accMul, accAdd, roundBoxDistance
}
