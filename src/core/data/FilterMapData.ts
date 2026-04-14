import EventTarget from "../EventTarget"
import MapData from "./MapData"

export default class FilterMapData extends EventTarget {
    mapData: MapData
    filterScreenData: any[] | null
    bounding: [number | null, number | null, number | null, number | null]
    width: number
    height: number
    radius: number
    dataFilter: Function | null
    areaPositionFilter: Function | null

    constructor(mapData: MapData) {
        super()
        this.mapData = mapData
        this.dataFilter = null
        this.areaPositionFilter = null
        this.filterScreenData = null
        this.bounding = [null, null, null, null]
        this.change = this.change.bind(this)
        this.mapData.on('change', this.change)
        this.change()
    }

    destroy() {
        this.mapData.off('change', this.change)
        super.destroy()
    }

    change() {
        let screenData = this.mapData.getData()
        if (!screenData) {
            this.filterScreenData = null
            return
        }
        if (!this.dataFilter) {
            this.filterScreenData = screenData
            this.bounding = this.mapData.getBounding() as any
            this.radius = this.mapData.getRadius()
            this.width = this.mapData.getWidth()
            this.height = this.mapData.getHeight()
            return
        }
        this.filterScreenData = []
        this.bounding = [null, null, null, null]
        for (let row of screenData) {
            if (!this.dataFilter(row)) continue
            this.filterScreenData.push(row)
            this.bounding[0] = this.bounding[0] === null ? row.geometry.box[0] : Math.min(row.geometry.box[0], this.bounding[0]!)
            this.bounding[1] = this.bounding[1] === null ? row.geometry.box[1] : Math.min(row.geometry.box[1], this.bounding[1]!)
            this.bounding[2] = this.bounding[2] === null ? row.geometry.box[2] : Math.max(row.geometry.box[2], this.bounding[2]!)
            this.bounding[3] = this.bounding[3] === null ? row.geometry.box[3] : Math.max(row.geometry.box[3], this.bounding[3]!)
        }
        this.width = (this.bounding[2] as number) - (this.bounding[0] as number)
        this.height = (this.bounding[3] as number) - (this.bounding[1] as number)
        this.radius = Math.sqrt(Math.pow(this.width / 2, 2) + Math.pow(this.height / 2, 2))
        this.fire('change')
    }

    getData(): any[] | null {
        return this.filterScreenData
    }

    setDataFilter(callback: Function) {
        this.dataFilter = callback
        this.change()
    }

    getDataByAdcode(adcode: string | number): any {
        return this.mapData.getDataByAdcode(adcode)
    }

    getPositionByAdcode(adcode: string | number): number[] | null {
        if (!adcode) return null
        let position = this.mapData.getPositionByAdcode(adcode)
        if (!this.areaPositionFilter) return position
        let area = this.getDataByAdcode(adcode)
        return this.areaPositionFilter(area, position)
    }

    setAreaPositionFilter(callback: Function) {
        this.areaPositionFilter = callback
        this.fire('areaPositionChange')
    }

    getPositionByCoordinate(coordinate: number[]): number[] | null {
        return this.mapData.getPositionByCoordinate(coordinate)
    }

    getPositionByAny(data: any): number[] | null {
        return this.mapData.getPositionByAny(data)
    }

    getBounding(): [number, number, number, number] {
        if (!this.filterScreenData) return [0, 0, 1, 1]
        return this.bounding as [number, number, number, number]
    }

    getRadius(): number {
        if (!this.filterScreenData) return 1
        return this.radius
    }

    getWidth(): number {
        if (!this.filterScreenData) return 1
        return this.width
    }

    getHeight(): number {
        if (!this.filterScreenData) return 1
        return this.height
    }

    getRatio(): number {
        if (!this.filterScreenData) return 1
        return this.height / this.width
    }

    convertSize(value: number): number {
        return this.mapData.convertSize(value)
    }

    isEmpty(): boolean {
        return !this.filterScreenData || !this.filterScreenData.length
    }
}
