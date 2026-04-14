function multiply(a: number[], b: number[]): number[] {
    let a00 = a[0 * 3 + 0];
    let a01 = a[0 * 3 + 1];
    let a02 = a[0 * 3 + 2];
    let a10 = a[1 * 3 + 0];
    let a11 = a[1 * 3 + 1];
    let a12 = a[1 * 3 + 2];
    let a20 = a[2 * 3 + 0];
    let a21 = a[2 * 3 + 1];
    let a22 = a[2 * 3 + 2];
    let b00 = b[0 * 3 + 0];
    let b01 = b[0 * 3 + 1];
    let b02 = b[0 * 3 + 2];
    let b10 = b[1 * 3 + 0];
    let b11 = b[1 * 3 + 1];
    let b12 = b[1 * 3 + 2];
    let b20 = b[2 * 3 + 0];
    let b21 = b[2 * 3 + 1];
    let b22 = b[2 * 3 + 2];

    return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
    ];
}

function identity(): number[] {
    return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
    ];
}

function projection(width: number, height: number): number[] {
    return [
        2 / width, 0, 0,
        0, -2 / height, 0,
        -1, 1, 1,
    ];
}

function project(m: number[], width: number, height: number): number[] {
    return multiply(m, projection(width, height));
}

function translation(tx: number, ty: number): number[] {
    return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1,
    ];
}

function translate(m: number[], tx: number, ty: number): number[] {
    return multiply(m, translation(tx, ty));
}

function rotation(angleInRadians: number): number[] {
    let c = Math.cos(angleInRadians);
    let s = Math.sin(angleInRadians);
    return [
        c, -s, 0,
        s, c, 0,
        0, 0, 1,
    ];
}

function rotate(m: number[], angleInRadians: number): number[] {
    return multiply(m, rotation(angleInRadians));
}

function scaling(sx: number, sy: number): number[] {
    return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1,
    ];
}

function scale(m: number[], sx: number, sy: number): number[] {
    return multiply(m, scaling(sx, sy));
}

function dot(x1: number, y1: number, x2: number, y2: number): number {
    return x1 * x2 + y1 * y2;
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

function normalize(x: number, y: number): number[] {
    let l = distance(0, 0, x, y);
    if (l > 0.00001) {
        return [x / l, y / l];
    } else {
        return [0, 0];
    }
}

function reflect(ix: number, iy: number, nx: number, ny: number): number[] {
    let d = dot(nx, ny, ix, iy);
    return [
        ix - 2 * d * nx,
        iy - 2 * d * ny,
    ];
}

function radToDeg(r: number): number {
    return r * 180 / Math.PI;
}

function degToRad(d: number): number {
    return d * Math.PI / 180;
}

function transformPoint(m: number[], v: number[]): number[] {
    let v0 = v[0];
    let v1 = v[1];
    let d = v0 * m[0 * 3 + 2] + v1 * m[1 * 3 + 2] + m[2 * 3 + 2];
    return [
        (v0 * m[0 * 3 + 0] + v1 * m[1 * 3 + 0] + m[2 * 3 + 0]) / d,
        (v0 * m[0 * 3 + 1] + v1 * m[1 * 3 + 1] + m[2 * 3 + 1]) / d,
    ];
}

function inverse(m: number[]): number[] {
    let t00 = m[1 * 3 + 1] * m[2 * 3 + 2] - m[1 * 3 + 2] * m[2 * 3 + 1];
    let t10 = m[0 * 3 + 1] * m[2 * 3 + 2] - m[0 * 3 + 2] * m[2 * 3 + 1];
    let t20 = m[0 * 3 + 1] * m[1 * 3 + 2] - m[0 * 3 + 2] * m[1 * 3 + 1];
    let d = 1.0 / (m[0 * 3 + 0] * t00 - m[1 * 3 + 0] * t10 + m[2 * 3 + 0] * t20);
    return [
        d * t00, -d * t10, d * t20,
        -d * (m[1 * 3 + 0] * m[2 * 3 + 2] - m[1 * 3 + 2] * m[2 * 3 + 0]),
        d * (m[0 * 3 + 0] * m[2 * 3 + 2] - m[0 * 3 + 2] * m[2 * 3 + 0]),
        -d * (m[0 * 3 + 0] * m[1 * 3 + 2] - m[0 * 3 + 2] * m[1 * 3 + 0]),
        d * (m[1 * 3 + 0] * m[2 * 3 + 1] - m[1 * 3 + 1] * m[2 * 3 + 0]),
        -d * (m[0 * 3 + 0] * m[2 * 3 + 1] - m[0 * 3 + 1] * m[2 * 3 + 0]),
        d * (m[0 * 3 + 0] * m[1 * 3 + 1] - m[0 * 3 + 1] * m[1 * 3 + 0]),
    ];
}

export default {
    degToRad,
    distance,
    dot,
    identity,
    inverse,
    multiply,
    normalize,
    projection,
    radToDeg,
    reflect,
    rotation,
    rotate,
    scaling,
    scale,
    transformPoint,
    translation,
    translate,
    project,
}
