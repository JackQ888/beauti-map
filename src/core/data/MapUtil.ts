function build(feature: any, projection: string, result: any[] = []): any[] {
    if (!feature) return []
    const type = feature.type || "Feature"
    switch (type) {
        case "GeometryCollection":
            for (let i = 0, l = feature.geometries.length; i < l; i++) {
                result.push({
                    type: "feature",
                    geometry: buildGeometry(feature.geometries[i], projection)
                })
            }
            break
        case "FeatureCollection":
            for (let i = 0, l = feature.features.length; i < l; i++) {
                build(feature.features[i], projection, result)
            }
            break
        case "Feature":
            result.push({
                type: "feature",
                properties: feature.properties,
                geometry: buildGeometry(feature.geometry, projection)
            })
    }
    return result
}

function buildGeometry(geometry: any, projection: string): any {
    switch (geometry.type) {
        case 'MultiPolygon': {
            const box: [number | null, number | null, number | null, number | null] = [null, null, null, null]
            let polygons = {
                type: 'polygons',
                polygons: [] as any[],
                box
            }
            for (let i = 0, l = geometry.coordinates.length; i < l; i++) {
                let coordinates = geometry.coordinates[i]
                const polygon = buildPolygon(coordinates, projection)
                box[0] = min(box[0], polygon.box[0])
                box[1] = min(box[1], polygon.box[1])
                box[2] = max(box[2], polygon.box[2])
                box[3] = max(box[3], polygon.box[3])
                polygons.polygons.push(polygon)
            }
            return polygons
        }
        case 'Polygon': {
            let polygon = buildPolygon(geometry.coordinates, projection)
            return {
                type: 'polygon',
                polygon: polygon,
                box: polygon.box
            }
        }
        case 'MultiLineString': {
            const box: [number | null, number | null, number | null, number | null] = [null, null, null, null]
            let lines = {
                type: 'lines',
                lines: [] as any[],
                box
            }
            for (let i = 0, l = geometry.coordinates.length; i < l; i++) {
                let coordinates = geometry.coordinates[i]
                const line = buildLine(coordinates, projection)
                box[0] = min(box[0], line.box[0])
                box[1] = min(box[1], line.box[1])
                box[2] = max(box[2], line.box[2])
                box[3] = max(box[3], line.box[3])
                lines.lines.push(line)
            }
            return lines
        }
        case 'LineString': {
            let line = buildLine(geometry.coordinates, projection)
            return {
                type: 'line',
                line: line,
                box: line.box
            }
        }
    }
}

function buildPolygon(pointsList: number[][][], projection: string): any {
    const result: number[][][] = []
    let minX: number | null = null, minY: number | null = null, maxX: number | null = null, maxY: number | null = null
    for (let i = 0, l = pointsList.length; i < l; i++) {
        const res: number[][] = []
        const points = pointsList[i]
        let before: number[] | null = null
        for (let j = 0, k = points.length; j < k; j++) {
            let p = convert(points[j], projection)
            if (!p || before && before[0] === p[0] && before[1] === p[1]) continue
            before = p
            minX = min(minX, p[0])
            maxX = max(maxX, p[0])
            minY = min(minY, p[1])
            maxY = max(maxY, p[1])
            res.push(p)
        }
        result.push(res)
    }
    return {
        pointsList: result,
        box: [minX, minY, maxX, maxY]
    }
}

function buildLine(pointsList: number[][], projection: string): any {
    const result: number[][] = []
    let minX: number | null = null, minY: number | null = null, maxX: number | null = null, maxY: number | null = null
    let before: number[] | null = null
    for (let i = 0, l = pointsList.length; i < l; i++) {
        let p = convert(pointsList[i], projection)
        if (!p || before && before[0] === p[0] && before[1] === p[1]) continue
        before = p
        minX = min(minX, p[0])
        maxX = max(maxX, p[0])
        minY = min(minY, p[1])
        maxY = max(maxY, p[1])
        result.push(p)
    }
    return {
        pointsList: result,
        box: [minX, minY, maxX, maxY]
    }
}

function convert([lng, lat]: number[], projection: string = "Mercator"): number[] | null {
    lng -= 0
    lat -= 0
    if (!(lng <= 180 && lng >= -180) || !(lat <= 90 && lat >= -90) || isNaN(lng) || isNaN(lat)) return null
    switch (projection) {
        case "WGS84": {
            return [lng, lat]
        }
        default:
        case "Mercator": {
            return [(180 + lng) / 360, (
                -90 == lat ? 1 : 90 == lat ? 0 : (180 - 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))) / 360
            )]
        }
    }
}

function inverse([x, y]: number[], projection: string = "Mercator"): number[] {
    switch (projection) {
        case "WGS84": {
            return [x, y]
        }
        default:
        case "Mercator": {
            return [360 * x - 180, (
                360 / Math.PI * Math.atan(Math.exp((180 - 360 * y) * Math.PI / 180)) - 90
            )]
        }
    }
}

function min(x1: number | null | undefined, x2: number | null | undefined): number | null {
    if (x1 === null || x1 === undefined) return x2!
    if (x2 === null || x2 === undefined) return x1
    return Math.min(x1, x2)
}

function max(x1: number | null | undefined, x2: number | null | undefined): number | null {
    if (x1 === null || x1 === undefined) return x2!
    if (x2 === null || x2 === undefined) return x1
    return Math.max(x1, x2)
}

const MapUtil = {build, convert, inverse}
export default MapUtil
