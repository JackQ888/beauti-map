import MathUtil from './MathUtil'

export default {
    getLeftCtrl(sx: number, sy: number, ex: number, ey: number, type: string = 'curve'): number[] {
        let deltaX = ex - sx
        let deltaY = ey - sy
        switch (type) {
            case "curve": {
                let distance = MathUtil.distancexy(deltaX, deltaY * 0.1) / 1.5
                return [
                    sx - distance * 0.8, sy + deltaY * 0.2,
                    ex + distance * 0.8, ey - deltaY * 0.2
                ]
            }
            case "broken": {
                let cx = sx + deltaX / 2
                return [
                    cx, sy,
                    cx, ey
                ]
            }
            default: return []
        }
    },
    getRightCtrl(sx: number, sy: number, ex: number, ey: number, type: string = 'curve'): number[] {
        let deltaX = ex - sx
        let deltaY = ey - sy
        switch (type) {
            case "curve": {
                let distance = MathUtil.distancexy(deltaX, deltaY * 0.1) / 1.5
                return [
                    sx + distance * 0.8, sy + deltaY * 0.2,
                    ex - distance * 0.8, ey - deltaY * 0.2
                ]
            }
            case "broken": {
                let cx = sx + deltaX / 2
                return [
                    cx, sy,
                    cx, ey
                ]
            }
            default: return []
        }
    },
    getTopCtrl(sx: number, sy: number, ex: number, ey: number, type: string = 'curve'): number[] {
        let deltaX = ex - sx
        let deltaY = ey - sy
        switch (type) {
            case "curve": {
                let distance = MathUtil.distancexy(deltaX, deltaY) / 2.5
                return [
                    sx + deltaX * 0.1, sy - distance * 0.8,
                    ex - deltaX * 0.1, ey + distance
                ]
            }
            case "broken": {
                let cy = sy + deltaY / 2
                return [
                    sx, cy,
                    ex, cy
                ]
            }
            default: return []
        }
    },
    getBottomCtrl(sx: number, sy: number, ex: number, ey: number, type: string = 'curve'): number[] {
        let deltaX = ex - sx
        let deltaY = ey - sy
        switch (type) {
            case "curve": {
                let distance = MathUtil.distancexy(deltaX, deltaY) / 2.5
                return [
                    sx + deltaX * 0.1, sy + distance * 0.8,
                    ex - deltaX * 0.1, ey - distance
                ]
            }
            case "broken": {
                let cy = sy + deltaY / 2
                return [
                    sx, cy,
                    ex, cy
                ]
            }
            default: return []
        }
    },
}
