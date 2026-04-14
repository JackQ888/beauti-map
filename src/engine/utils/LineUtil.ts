import MathUtil from "../math/MathUtil"


type Point = [number, number];

interface CurveSegment {
    type: string;
    start: any;
    end: any;
    ctrl?: any;
    ctrl1?: any;
    ctrl2?: any;
}

interface CurveOptions {
    tension?: number;
    step?: boolean | 'start' | 'middle' | 'end';
    close?: boolean;
}

interface SimplifyOptions {
    tolerance?: number;
}

//p2-p1,p2-p3向量叉乘
function getCross(p1: Point, p2: Point, p3: Point): number {
    return (p1[0] - p2[0]) * (p3[1] - p2[1]) - (p3[0] - p2[0]) * (p1[1] - p2[1])
}

/*
*miterLimit:最大尖角比率,尖角长度限制在width*miterLimit下,如果超过长度,则使用斜角模式
*/
function getLineByPoints(points: Point[], width: number, miterLimit: number = 4, close: boolean = false, realDistance: boolean = false): number[] {
    if (!points.length || points.length === 1) return []
    if (close && points[0][0] === points[points.length - 1][0] && points[0][1] === points[points.length - 1][1]) {
        points.pop()
    }
    //顶点列表
    let vertexes: number[] = [];
    if (points.length === 2) {
        let start = points[0]
        let end = points[1]
        let rect = getRectByTwoPoint(start, end, width);

        if (realDistance) {
            let distance = MathUtil.distance(start[0], start[1], end[0], end[1])
            vertexes.push(...rect[0], 0, 0);
            vertexes.push(...rect[1], 0, 1);
            vertexes.push(...rect[2], distance, 0);
            vertexes.push(...rect[3], distance, 1);
        } else {
            vertexes.push(...rect[0], 0, 0);
            vertexes.push(...rect[1], 0, 1);
            vertexes.push(...rect[2], 1, 0);
            vertexes.push(...rect[3], 1, 1);
        }
        return vertexes
    }

    width = Math.max(0.00000000001, width);
    close = close && points.length > 2;



    let beforeRect: Point[] | null = null

    let lastOver = false

    for (let i = 0, l = points.length; i < l; i++) {
        let start = points[i];
        let center = points[i + 1];
        let end = points[i + 2];
        if (i === l - 2) {
            if (close) {
                end = points[0]
                center = points[points.length - 1]
                start = points[points.length - 2];
            } else break;
        } else if (i === l - 1) {
            if (close) {
                end = points[1]
                center = points[0]
                start = points[points.length - 1];
            } else break;
        }

        let startRect = beforeRect || getRectByTwoPoint(start, center, width);
        let endRect = getRectByTwoPoint(center, end, width);
        beforeRect = endRect

        let cs = getCross(start, center, end)

        //判断线段变化方向
        let f = cs > 0

        //获取顶点间长度
        let length = MathUtil.distance(startRect[2][0], startRect[2][1], endRect[0][0], endRect[0][1])
        //获取折点长度
        let sqLength = Math.pow(width / 2, 2) / Math.sqrt(Math.pow(width / 2., 2) - Math.pow(length / 2, 2))
        sqLength = Math.min(width, sqLength)
        let ratio = sqLength / width
        let dx = (endRect[1][1] - startRect[3][1]) / length * sqLength
        let dy = -(endRect[1][0] - startRect[3][0]) / length * sqLength

        if (f) {
            let p1 = [center[0] + dx, center[1] + dy]
            let p2 = [center[0] - dx, center[1] - dy]
            vertexes.push(...startRect[0], 0, 0);
            vertexes.push(...startRect[1], 0, 1);


            if (ratio < miterLimit) {
                vertexes.push(...p1, 0, 0);
                vertexes.push(...p2, 0, 1);
                endRect[0] = p1 as Point
                endRect[1] = p2 as Point
            } else {
                lastOver = i === l - 1
                vertexes.push(...startRect[2], 0, 0);
                vertexes.push(...p2, 0, 1);
                endRect[1] = p2 as Point
            }
        } else {
            let p1 = [center[0] - dx, center[1] - dy]
            let p2 = [center[0] + dx, center[1] + dy]
            vertexes.push(...startRect[0], 0, 0);
            vertexes.push(...startRect[1], 0, 1);

            if (ratio < miterLimit) {
                vertexes.push(...p1, 0, 0);
                vertexes.push(...p2, 0, 1);
                endRect[0] = p1 as Point
                endRect[1] = p2 as Point
            } else {
                lastOver = i === l - 1
                vertexes.push(...p1, 0, 0);
                vertexes.push(...startRect[3], 0, 1);
                endRect[0] = p1 as Point
            }
        }
    }

    if (!close) {
        vertexes.push(...beforeRect![0], 0, 0);
        vertexes.push(...beforeRect![1], 0, 1);

        vertexes.push(...beforeRect![2], 0, 0);
        vertexes.push(...beforeRect![3], 0, 1);
    } else {
        if (lastOver) {
            vertexes.push(...beforeRect![0], 0, 0);
            vertexes.push(...beforeRect![1], 0, 1);
        }

        vertexes[0] = beforeRect![0][0]
        vertexes[1] = beforeRect![0][1]

        vertexes[4] = beforeRect![1][0]
        vertexes[5] = beforeRect![1][1]

    }
    let distance1 = 0
    let distance2 = 0
    for (let i = 8, l = vertexes.length; i < l; i += 8) {
        distance1 += MathUtil.distancexy(vertexes[i] - vertexes[i - 8], vertexes[i + 1] - vertexes[i - 7])
        distance2 += MathUtil.distancexy(vertexes[i + 4] - vertexes[i - 4], vertexes[i + 5] - vertexes[i - 3])
        let d = Math.max(distance1, distance2)
        vertexes[i + 2] = d
        vertexes[i + 6] = d
    }
    if (!realDistance) {
        let md = Math.max(distance1, distance2)
        for (let i = 8, l = vertexes.length; i < l; i += 8) {
            vertexes[i + 2] /= md
            vertexes[i + 6] /= md
        }
    }
    return vertexes;
}

function getRectByTwoPoint(start: Point, end: Point, width: number): Point[] {
    let dx = end[0] - start[0];
    let dy = end[1] - start[1];
    let length = Math.sqrt(dx * dx + dy * dy);
    let dx1 = dy / length * width / 2, dy1 = -dx / length * width / 2;
    return [
        [start[0] - dx1, start[1] - dy1],
        [start[0] + dx1, start[1] + dy1],
        [end[0] - dx1, end[1] - dy1],
        [end[0] + dx1, end[1] + dy1]
    ];
}


//从点列表拉伸为切面
function getSectionByPoints(points: Point[], stretch: number | number[], theta: number, splitDistance: number, lightDirection: number[], isClosed: boolean = false): number[] {
    let offsetX: number, offsetY: number
    if (stretch instanceof Array) {
        offsetX = Math.cos(theta) * stretch[0]
        offsetY = Math.sin(theta) * stretch[1]
    } else {
        offsetX = Math.cos(theta) * stretch
        offsetY = Math.sin(theta) * stretch
    }
    let ps: number[] = []
    let countDistance = 0


    for (let i = 0, l = points.length; i < l; i++) {
        if (i === l - 1 && !isClosed) break
        let s = points[i]
        let e = points[(i + 1 === l) ? 0 : (i + 1)]
        let d1 = MathUtil.distance(s[0], s[1], e[0], e[1])
        if (!d1) continue
        let cos = (Math.abs as any)(((e[0] - s[0]) * lightDirection[0]) + ((e[1] - s[1]) * lightDirection[1]) / d1, 0)

        let d2 = countDistance + d1
        let p1 = countDistance / splitDistance
        let p2 = d2 / splitDistance
        ps.push(s[0], s[1], p1, 0, s[1], cos)
        ps.push(s[0] + offsetX, s[1] + offsetY, p1, 1, s[1], cos)
        ps.push(e[0], e[1], p2, 0, e[1], cos)
        ps.push(e[0] + offsetX, e[1] + offsetY, p2, 1, e[1], cos)
        countDistance = d2
    }
    return ps
}


//从点列表拉伸为切面
function getSection3DByPoints(points: Point[], lightDirection: number[] = [0, 1], isClosed: boolean = false): number[] {
    let ps: number[] = []
    for (let i = 0, l = points.length; i < l; i++) {
        if (i === l - 1 && !isClosed) break
        let s = points[i]
        let e = points[(i + 1 === l) ? 0 : (i + 1)]
        let d1 = MathUtil.distance(s[0], s[1], e[0], e[1])
        if (!d1) continue
        let cos = (Math.abs as any)(((e[0] - s[0]) * lightDirection[0]) + ((e[1] - s[1]) * lightDirection[1]) / d1, 0)

        //x,y,z,n
        ps.push(s[0], s[1], 0, cos)
        ps.push(s[0], s[1], 1, cos)
        ps.push(e[0], e[1], 0, cos)
        ps.push(e[0], e[1], 1, cos)
    }
    return ps
}

/**
 * @description 计算线条连接样式
 * @param {{tension:Number},{step:Boolean|'start'|'middle'|'end'},{close:Boolean}} options
 * */
function computeCurve(points: Point[], options: CurveOptions = { tension: 0.5, step: false, close: false }): CurveSegment[] {
    if (!points.length) return []
    options = Object.assign({ tension: 0.5, close: false }, options)
    let curves: CurveSegment[] = []

    if (points.length === 2) {
        curves.push({
            type: 'segment',
            start: points[0],
            end: points[1]
        })
        return curves
    }

    //步进效果折线
    if (options.step) {
        let stepType = (typeof options.step) === 'boolean' ? 'start' : options.step
        switch (stepType) {
            case "middle": {
                for (let i = 0, l = points.length - 1; i < l; i++) {
                    let start = points[i]
                    let end = points[i + 1]
                    curves.push({
                        type: 'broken',
                        start,
                        end,
                        ctrl: [(start[0] + end[0]) / 2, end[1]]
                    })
                }
                break
            }
            case "end": {
                for (let i = 0, l = points.length - 1; i < l; i++) {
                    let start = points[i]
                    let end = points[i + 1]
                    curves.push({
                        type: 'broken',
                        start,
                        end,
                        ctrl: [end[0], start[1]]
                    })
                }
                break
            }
            case "start":
            default: {
                for (let i = 0, l = points.length - 1; i < l; i++) {
                    let start = points[i]
                    let end = points[i + 1]
                    curves.push({
                        type: 'broken',
                        start,
                        end,
                        ctrl: [start[0], end[1]]
                    })
                }
                break
            }
        }
        return curves
    }

    //segment
    if (!options.tension) {
        for (let i = 0, l = points.length - 1; i < l; i++) {
            let start = points[i]
            let end = points[i + 1]
            curves.push({
                type: 'segment',
                start,
                end
            })
        }
        return curves
    }

    const len = points.length
    let ctrlPoints = __getCurveControlPoints__(points, options)
    let last: Point
    if (options.close) {
        curves.push({
            type: 'bezier',
            start: points[0],
            end: points[1],
            ctrl1: ctrlPoints[2 * len - 1],
            ctrl2: ctrlPoints[0]
        })
        last = points[1]
    } else {
        curves.push({
            type: 'quadratic',
            start: points[0],
            end: points[1],
            ctrl: ctrlPoints[0]
        })
        last = points[1]
    }
    for (let i = 2; i < len - (options.close ? 0 : 1); i += 1) {
        curves.push({
            type: 'bezier',
            start: last,
            end: points[i],
            ctrl1: ctrlPoints[2 * (i - 1) - 1],
            ctrl2: ctrlPoints[2 * (i - 1)]
        })
        last = points[i]
    }
    if (options.close) {
        curves.push({
            type: 'bezier',
            start: last,
            end: points[0],
            ctrl1: ctrlPoints[2 * (len - 1) - 1],
            ctrl2: ctrlPoints[2 * (len - 1)]
        })
    } else {
        curves.push({
            type: 'quadratic',
            start: last,
            end: points[len - 1],
            ctrl: ctrlPoints[2 * (len - 2) - 1]
        })
    }
    return curves
}

function curvesToPoints(curves: CurveSegment[]): any[] {
    let result: any[] = []
    for (let i = 0, l = curves.length; i < l; i++) {
        let start = i ? 1 : 0
        let curve = curves[i]
        if (curve.type === 'bezier') {
            for (let m = start; m <= 20; m++) {
                let p = MathUtil.bezier(curve.start, curve.ctrl1, curve.ctrl2, curve.end, m / 20) as any
                p.index = i
                result.push(p)
            }
        } else if (curve.type === 'quadratic') {
            for (let m = start; m <= 20; m++) {
                let p = MathUtil.quadratic(curve.start, curve.ctrl, curve.end, m / 20) as any
                p.index = i
                result.push(p)
            }
        } else if (curve.type === 'segment') {
            curve.start.index = i
            curve.end.index = i
            result.push(curve.start)
            result.push(curve.end)
        }
    }
    return result
}

function __distanceByPoints__(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
}

function __vector__(p1: Point, p2: Point): Point {
    return [p2[0] - p1[0], p2[1] - p1[1]]
}

function __getTensionControlPoints__(p1: Point, p2: Point, p3: Point, tension: number): [Point, Point] {
    const [x2, y2] = p2
    const v = __vector__(p1, p3)
    const d01 = __distanceByPoints__(p1, p2)
    const d12 = __distanceByPoints__(p2, p3)
    const d012 = d01 + d12
    return [[x2 - (v[0] * tension / 2 * d01) / d012, y2 - (v[1] * tension / 2 * d01) / d012], [
        x2 + (v[0] * tension / 2 * d12) / d012,
        y2 + (v[1] * tension / 2 * d12) / d012
    ]]
}

function __getCurveControlPoints__(pathPoints: Point[], options: CurveOptions): Point[] {
    const pathControlPoints: Point[] = []
    const len = pathPoints.length
    for (let i = 0; i < len - 2; i += 1) {
        const [ctrl1, ctrl2] = __getTensionControlPoints__(pathPoints[i], pathPoints[i + 1], pathPoints[i + 2], options.tension!)
        pathControlPoints.push(ctrl1, ctrl2)
    }
    if (options.close) {
        const [ctrl1, ctrl2] = __getTensionControlPoints__(pathPoints[len - 2], pathPoints[len - 1], pathPoints[0], options.tension!)
        pathControlPoints.push(ctrl1, ctrl2)
        const [ctrl11, ctrl22] = __getTensionControlPoints__(pathPoints[len - 1], pathPoints[0], pathPoints[1], options.tension!)
        pathControlPoints.push(ctrl11, ctrl22)
    }
    return pathControlPoints
}

function simplifyPoints(ps: Point[], options?: SimplifyOptions): Point[] {
    if (!ps.length) return []
    options = Object.assign({ tolerance: 10 }, options)
    let current: Point | null = null
    let pointList: Point[] = []
    let last = ps[ps.length - 1]
    for (let p of ps) {
        if (p === last) {
            pointList.push(p)
            break
        }
        if (current && __distanceByPoints__(current, p) < options.tolerance!) continue
        pointList.push(p)
        current = p
    }
    return pointList
}


function clipLine(ps: Point[], startPercent: number, endPercent: number): Point[] {
    if (startPercent === 0 && endPercent === 1) return ps
    let count = 0
    let distances: number[] = []
    for (let i = 0, l = ps.length - 1; i < l; i++) {
        let s = ps[i]
        let e = ps[i + 1]
        let distance = MathUtil.distance(s[0], s[1], e[0], e[1])
        count += distance
        distances.push(distance)
    }
    let startDistance = startPercent * count
    let endDistance = endPercent * count

    let start: Point | null, startIndex: number, end: Point | null, endIndex: number, current = 0
    start = null; end = null; startIndex = 0; endIndex = 0
    for (let i = 0, l = distances.length; i < l; i++) {
        let distance = distances[i]
        let toDistance = current + distance
        if (!start && startDistance <= toDistance) {
            start = MathUtil.mixPoint2D(ps[i], ps[i + 1], (startDistance - current) / distance) as any as Point
            startIndex = i + 1
        }
        if (!end && endDistance <= toDistance) {
            end = MathUtil.mixPoint2D(ps[i], ps[i + 1], (endDistance - current) / distance) as any as Point
            endIndex = i + 1
        }
        if (start && end) break
        current = toDistance
    }
    let res: Point[] = [start!]
    for (let i = startIndex; i < endIndex; i++) {
        res.push(ps[i])
    }
    res.push(end!)
    return res
}

function getQuadTube(p1: Point, p2: Point, split: number, tension: number): void {
    let distance = MathUtil.distance(p1[0], p1[1], p2[0], p2[1]) * tension
    let center = MathUtil.mixPoint2D(p1, p2, 0.5)
    let normal = MathUtil.normalize([-p2[1] - p1[1], p2[0] - p1[0]])
    let ctrl = [center[0] + normal[0] * distance, center[1] + normal[1] * distance]
    let ps: any[] = []
    let before: any = p1
    for (let m = 1; m <= 20; m++) {
        let now = MathUtil.quadratic(p1, ctrl, p2, m / 20)
        let n: any; m = MathUtil.normalize([-now[1] - before[1], now[0] - before[0]]) as any
        for (let i = 0; i <= 20; i++) {



            before = now
            ps.push(undefined)
        }

        before = now
        ps.push(undefined)
    }
}

export default {
    getLineByPoints,
    simplifyPoints,
    getRectByTwoPoint,
    getSectionByPoints,
    getSection3DByPoints,
    computeCurve,
    clipLine,
    curvesToPoints
};
