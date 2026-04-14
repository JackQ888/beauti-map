import MathUtil from "../math/MathUtil"


type LineDashStyle = 'solid' | 'longDash' | 'shortDash' | 'longDashDot' | 'longDashDotDot' | 'dashed' | 'dash' | 'dotted' | 'dot' | string;

interface FontStyle {
    fontStyle?: string;
    fontWeight?: string;
    fontSize?: number;
    fontFamily?: string;
}

interface ShadowStyle {
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    shadowColor: string;
    enable?: boolean;
}

interface StrokeStyle {
    color: string;
    width: number;
    dashOffset: number;
    cap: CanvasLineCap;
    join?: CanvasLineJoin;
    miterLimit?: number;
    type: LineDashStyle | number[];
    shadow?: ShadowStyle & { enable: boolean };
}

interface FillStyle {
    color: string;
    shadow?: ShadowStyle & { enable: boolean };
}

function buildLineDash(style: LineDashStyle | number[], scale: number = 1): number[] {
    if (style instanceof Array) {
        return style
    }
    let n = 1
    switch (style) {
        case 'solid': {
            return []
        }
        case "longDash": {
            return [8 * n * scale, 6 * n * scale]
        }
        case "shortDash": {
            return [2 * n * scale, 3 * n * scale]
        }
        case "longDashDot": {
            return [4 * n * scale, n * scale, n * scale, n * scale]
        }
        case "longDashDotDot": {
            return [4, n * scale, n * scale, n * scale, n * scale, n * scale]
        }
        case "dashed":
        case "dash": {
            return [4 * n * scale, 6 * n * scale]
        }
        case "dotted":
        case "dot": {
            return [n * 2 * scale, n * 2 * scale]
        }
        default:
            return []
    }
}

function setFontStyle(ctx: CanvasRenderingContext2D, style: FontStyle): void {
    ctx.font = ((style.fontStyle || "normal")
        + " " + (style.fontWeight || "normal")
        + " " + (style.fontSize || 12)
        + "px " + (style.fontFamily || "arial")
    ).trim()
}

function setShadowStyle(ctx: CanvasRenderingContext2D, style: ShadowStyle): void {
    ctx.shadowBlur = style.shadowBlur
    ctx.shadowOffsetX = style.shadowOffsetX
    ctx.shadowOffsetY = style.shadowOffsetY
    ctx.shadowColor = style.shadowColor
}

function setStrokeStyle(ctx: CanvasRenderingContext2D, style: StrokeStyle, scale: number = 1): void {
    ctx.strokeStyle = style.color
    ctx.lineWidth = MathUtil.deal(style.width) * scale;
    (ctx as any).dashOffset = style.dashOffset * scale
    ctx.lineCap = style.cap
    if (style.join) ctx.lineJoin = style.join
    if (style.miterLimit) ctx.miterLimit = style.miterLimit
    ctx.setLineDash(buildLineDash(style.type, scale))
    if (style.shadow && style.shadow.enable) {
        setShadowStyle(ctx, style.shadow)
    }
}


function setFillStyle(ctx: CanvasRenderingContext2D, style: FillStyle): void {
    ctx.fillStyle = style.color
    if (style.shadow && style.shadow.enable) {
        setShadowStyle(ctx, style.shadow)
    }
}

function drawRoundRectPath(ctx: CanvasRenderingContext2D, radius: number | number[], width: number, height: number, x: number, y: number, newPath: boolean = true): void {
    if (newPath) ctx.beginPath();
    let radiusLeftTop: number, radiusRightTop: number, radiusRightBottom: number, radiusLeftBottom: number
    if (radius instanceof Array) {
        if (radius.length === 4) {
            radiusLeftTop = Math.max(
                Math.min(width / 2, height / 2, radius[0]), 0)
            radiusRightTop = Math.max(
                Math.min(width / 2, height / 2, radius[1]), 0)
            radiusRightBottom = Math.max(
                Math.min(width / 2, height / 2, radius[2]), 0)
            radiusLeftBottom = Math.max(
                Math.min(width / 2, height / 2, radius[3]), 0)
        } else {
            radiusLeftTop = Math.max(
                Math.min(width / 2, height / 2, radius[0]), 0)
            radiusRightTop = Math.max(
                Math.min(width / 2, height / 2, radius[0]), 0)
            radiusRightBottom = Math.max(
                Math.min(width / 2, height / 2, radius[1]), 0)
            radiusLeftBottom = Math.max(
                Math.min(width / 2, height / 2, radius[1]), 0)
        }
    } else {
        radiusLeftTop = radiusRightTop = radiusRightBottom = radiusLeftBottom = Math.max(Math.min(width / 2, height / 2, radius), 0)
    }
    if (!radiusLeftTop && !radiusRightTop && !radiusRightBottom && !radiusLeftBottom) {
        ctx.rect(x, y, width, height)
        return
    }

    ctx.moveTo(x + width, y + height - radiusRightBottom);
    ctx.arc(x + width - radiusRightBottom, y + height - radiusRightBottom, radiusRightBottom, 0, Math.PI / 2);
    ctx.lineTo(x + radiusLeftBottom, y + height);

    ctx.arc(x + radiusLeftBottom, y + height - radiusLeftBottom, radiusLeftBottom, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + radiusLeftTop);

    ctx.arc(x + radiusLeftTop, y + radiusLeftTop, radiusLeftTop, Math.PI, Math.PI * 3 / 2);
    ctx.lineTo(x + width - radiusRightTop, y);

    ctx.arc(x + width - radiusRightTop, y + radiusRightTop, radiusRightTop, Math.PI * 3 / 2, Math.PI * 2);
    ctx.lineTo(x + width, y + height - radiusRightBottom);
    ctx.closePath();
}

export default {
    setShadowStyle,
    setStrokeStyle,
    setFillStyle,
    setFontStyle,
    buildLineDash,
    drawRoundRectPath
}
