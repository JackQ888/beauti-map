import MapUtil from "./MapUtil"
import EventTarget from "../EventTarget"

export default class MapData extends EventTarget {
    geoJson: any
    projection: string | null
    bounding: [number | null, number | null, number | null, number | null]
    projectionData: any[]
    projectionDataMapping: Record<string, any>
    width: number
    height: number
    radius: number
    areaPositionFilter: Function | null

    constructor(geoJson: any = null, projection: string = "Mercator") {
        super()
        this.geoJson = geoJson
        this.projection = null
        this.bounding = [null, null, null, null]
        this.projectionDataMapping = {}
        this.areaPositionFilter = null
        this.setProjection(projection)
    }

    destroy() {
        super.destroy()
    }

    setData(geoJson: any) {
        this.geoJson = geoJson
        this.computeProjectionData()
    }

    setProjection(projection: string) {
        if (this.projection === projection) return
        this.projection = projection
        this.computeProjectionData()
    }

    getBounding(): [number, number, number, number] {
        if (this.isEmpty()) return [0, 0, 1, 1]
        return this.bounding as [number, number, number, number]
    }

    getRadius(): number {
        if (this.isEmpty()) return 0
        return this.radius
    }

    getWidth(): number {
        if (this.isEmpty()) return 0
        return this.width
    }

    getHeight(): number {
        if (this.isEmpty()) return 0
        return this.height
    }

    getRatio(): number {
        if (this.isEmpty()) return 1
        return this.height / this.width
    }

    convertSize(value: number): number {
        if (this.isEmpty()) return 0
        return this.radius / 1000 * value
    }

    computeProjectionData() {
        this.projectionData = MapUtil.build(this.geoJson, this.projection!)
        this.projectionDataMapping = {}
        this.bounding = [null, null, null, null]
        for (let row of this.projectionData) {
            this.bounding[0] = this.bounding[0] === null ? row.geometry.box[0] : Math.min(row.geometry.box[0], this.bounding[0]!)
            this.bounding[1] = this.bounding[1] === null ? row.geometry.box[1] : Math.min(row.geometry.box[1], this.bounding[1]!)
            this.bounding[2] = this.bounding[2] === null ? row.geometry.box[2] : Math.max(row.geometry.box[2], this.bounding[2]!)
            this.bounding[3] = this.bounding[3] === null ? row.geometry.box[3] : Math.max(row.geometry.box[3], this.bounding[3]!)
            if (!row.properties || !row.properties.adcode) continue
            this.projectionDataMapping[row.properties.adcode] = row
        }
        this.width = (this.bounding[2] as number) - (this.bounding[0] as number)
        this.height = (this.bounding[3] as number) - (this.bounding[1] as number)
        this.radius = Math.sqrt(Math.pow(this.width / 2, 2) + Math.pow(this.height / 2, 2))
        this.fire('change')
    }

    getData(): any[] {
        return this.projectionData
    }

    getDataByAdcode(adcode: string | number): any {
        if (!adcode) return null
        return this.projectionDataMapping[adcode]
    }

    setAreaPositionFilter(callback: Function) {
        this.areaPositionFilter = callback
        this.fire('areaPositionChange')
    }

    getPositionByAdcode(adcode: string | number): number[] | null {
        if (!adcode) return null
        let position: number[] | null
        try {
            position = this.__getPositionByAdcode__(adcode)
        } catch (e) {
            return null
        }
        if (!this.areaPositionFilter || !position) return position
        let area = this.getDataByAdcode(adcode)
        return this.areaPositionFilter(area, position)
    }

    __getPositionByAdcode__(adcode: string | number): number[] | null {
        if (!adcode) return null
        let screenData = this.getDataByAdcode(adcode)
        if (!screenData) return null
        let centroid = screenData.properties.centroid || screenData.properties.center
        if (centroid) {
            return MapUtil.convert(centroid, this.projection!)
        }
        return [(screenData.geometry.box[0] + screenData.geometry.box[2]) / 2,
                (screenData.geometry.box[1] + screenData.geometry.box[3]) / 2]
    }

    getPositionByCoordinate(coordinate: number[]): number[] | null {
        try {
            return MapUtil.convert(coordinate, this.projection!)
        } catch (e) {
            return null
        }
    }

    getPositionByAny(data: any): number[] | null {
        if (data instanceof Array) {
            return this.getPositionByCoordinate(data)
        }
        return this.getPositionByAdcode(data)
    }

    isEmpty(): boolean {
        return !this.projectionData || !this.projectionData.length
    }
}
