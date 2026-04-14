import GLRenderer from "./GLRenderer"
import GLGroup from "./GLGroup"
import Ray from "./Ray"
import MapData from "./data/MapData"
import ObjectUtil from "../engine/utils/ObjectUtil"
import Matrix3D from "../engine/math/Matrix3D"
import SphericalCamera from "../engine/camera/SphericalCamera"
import AnimationUtil from "../engine/animation/AnimationUtil"
import componentsIndex from "../components/index"

export default class Map3D extends GLRenderer {
    props: {
        observe: {
            perspective: { viewRadians: number }
            pitch: number
            theta: number
            scale: number
            offsetX: number
            offsetY: number
            control: boolean
        }
        animation: {
            init: { enable: boolean, duration: number, ease: string }
            transform: { enable: boolean, duration: number, ease: string }
        }
    }
    sphericalCamera: SphericalCamera
    mapData: MapData
    animation: any
    renderMatrix: Float32Array
    _DOWN_ELEMENT_: any
    _HOVER_ELEMENT_: any

    constructor({el, fps}: {el: string | HTMLElement, fps?: boolean}) {
        super({el, fps})

        this.props = {
            observe: {
                perspective: {
                    viewRadians: Math.PI / 3
                },
                pitch: 45,
                theta: 0,
                scale: 1,
                offsetX: 0,
                offsetY: 0,
                control: true
            },
            animation: {
                init: {
                    enable: true,
                    duration: 600,
                    ease: "cubicInOut"
                },
                transform: {
                    enable: true,
                    duration: 500,
                    ease: "cubicInOut"
                }
            }
        }
        this.sphericalCamera = new SphericalCamera(this.canvas)
        this.sphericalCamera.on('update', this.updateSelf)
        this.reload = this.reload.bind(this) as any

        this.__mousedown__ = this.__mousedown__.bind(this)
        this.__mouseup__ = this.__mouseup__.bind(this)
        this.__mousemove__ = this.__mousemove__.bind(this)
        this.__mouseout__ = this.__mouseout__.bind(this)
        this.__dblclick__ = this.__dblclick__.bind(this)
        this.canvas.addEventListener("mousedown", this.__mousedown__)
        this.canvas.addEventListener("mouseup", this.__mouseup__)
        this.canvas.addEventListener("dblclick", this.__dblclick__)
        this.canvas.addEventListener("mousemove", this.__mousemove__)
        this.canvas.addEventListener("mouseout", this.__mouseout__)
    }

    setMapData(mapData: MapData) {
        if (this.mapData) {
            this.mapData.off('change', this.reload)
        }
        this.mapData = mapData
        this.mapData.on('change', this.reload)
        this.reload()
    }

    reload() {
        if (!this.mapData || !this.mapData.getData().length) return

        let [minX, minY, maxX, maxY] = this.mapData.getBounding()

        let w = maxX - minX
        let h = maxY - minY

        let centerX = (maxX + minX) / 2 - w * this.props.observe.offsetX,
            centerY = (maxY + minY) / 2 - h * this.props.observe.offsetY

        let size: number
        let widthRatio = w / this.style.width / window.devicePixelRatio,
            heightRatio = h / this.style.height / window.devicePixelRatio
        if (widthRatio > heightRatio) {
            size = w / 2
        } else {
            size = h / 2
        }

        let distance = size * 1.2 * this.props.observe.scale /
            Math.tan(this.props.observe.perspective.viewRadians / 2)

        let isInit = !this.animation

        if (this.animation) {
            this.animation.cancel()
            this.sphericalCamera.theta = this.props.observe.theta / 180 * Math.PI + this.sphericalCamera.theta % (Math.PI * 2)
        } else {
            this.sphericalCamera.radius = (distance) * 2
            this.sphericalCamera.theta = this.props.observe.theta / 180 * Math.PI - Math.PI / 2
            this.sphericalCamera.phi = 0.0001
            this.sphericalCamera.lookAt(centerX, 0.0001, centerY)
        }
        let animation = isInit ? this.props.animation.init : this.props.animation.transform

        let cameraProp = {
            radius: distance,
            theta: this.props.observe.theta / 180 * Math.PI,
            phi: (this.props.observe.pitch / 180 * Math.PI)
        }

        let cameraCenterProp = {
            x: centerX,
            y: 0.0001,
            z: centerY
        }

        if (animation.enable) {
            this.animation = AnimationUtil.executes({
                entries: [
                    {
                        target: this.sphericalCamera,
                        properties: cameraProp
                    },
                    {
                        target: this.sphericalCamera.center,
                        properties: cameraCenterProp
                    }
                ],
                duration: animation.duration,
                ease: animation.ease
            })
        } else {
            Object.assign(this.sphericalCamera, cameraProp)
            Object.assign(this.sphericalCamera.center, cameraCenterProp)
        }
    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        this.sphericalCamera.setControl(this.props.observe.control)
        this.updateSelf()
    }

    render(gl: WebGLRenderingContext | WebGL2RenderingContext) {
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        if (!this.mapData || this.mapData.isEmpty()) return

        let projectionMatrix = Matrix3D.perspective(
            this.props.observe.perspective.viewRadians,
            this.style.width / this.style.height, 0.00001, 1000)
        let viewMatrix = this.sphericalCamera.getMatrix()
        let matrix = Matrix3D.multiply(projectionMatrix, viewMatrix)
        let cameraPosition = this.sphericalCamera.getRealPosition()
        this.renderMatrix = matrix as unknown as Float32Array
        for (let child of this.getSortRenderChildren()) {
            child.draw(gl, matrix, {cameraPosition, pitch: this.sphericalCamera.phi})
        }
    }

    getSortRenderChildren(): GLGroup[] {
        let list: any[] = []
        for (let child of this.children) {
            let zIndex = Math.max(0, (child as any).$zIndex)
            let current = list[zIndex]
            if (!current) {
                list[zIndex] = current = []
            }
            current.push(child)
        }
        let sorts: any[] = []
        for (let current of list) {
            if (!current) continue
            for (let item of current) {
                sorts.push(item)
            }
        }
        return sorts
    }

    createGroup(): GLGroup {
        let group = new GLGroup()
        return group
    }

    createChild(type: string) {
        return new (componentsIndex[type] as any)(this)
    }

    contain(mx: number, my: number): any {
        let projectionMatrix = Matrix3D.perspective(
            this.props.observe.perspective.viewRadians,
            this.style.width / this.style.height, 0.00001, 1000)
        let viewMatrix = this.sphericalCamera.getMatrix()
        let matrix = Matrix3D.multiply(projectionMatrix, viewMatrix)

        let px = mx / this.canvas.clientWidth * 2 - 1,
            py = 1 - my / this.canvas.clientHeight * 2
        let position = this.sphericalCamera.getRealPosition()
        let worldPosition = Matrix3D.transformPoint(Matrix3D.inverse(matrix), [px, py, 0.5])
        let direction = Matrix3D.subtractVectors(worldPosition, position)
        let ray = new Ray(position as unknown as Float32Array, Matrix3D.normalize(direction) as unknown as Float32Array, {x: mx, y: my}, matrix as unknown as Float32Array, {width: this.style.width, height: this.style.height})

        let children = this.getSortRenderChildren()
        for (let i = children.length - 1; i >= 0; i--) {
            let child = children[i] as any
            let evt = child.__contain__(ray)
            if (evt) return evt
        }
        return this
    }

    __mousedown__(e: MouseEvent) {
        if (e.target !== this.canvas) return
        let target = this.contain(e.offsetX, e.offsetY)
        this._DOWN_ELEMENT_ = target
        this.__doEvent__("mousedown", target, e)
    }

    __mouseup__(e: MouseEvent) {
        let beforeElement = this._DOWN_ELEMENT_
        if (this._DOWN_ELEMENT_) {
            this.__doEvent__("mouserelease", this._DOWN_ELEMENT_, e)
            this._DOWN_ELEMENT_ = null
        }
        if (e.target !== this.canvas) return
        let target = this.contain(e.offsetX, e.offsetY)
        this.__doEvent__("mouseup", target, e)
        if (target === beforeElement) {
            this.__doEvent__("click", target, e)
        }
    }

    __dblclick__(e: MouseEvent) {
        if (e.target !== this.canvas) return
        let target = this.contain(e.offsetX, e.offsetY)
        this.__doEvent__("dblclick", target, e)
    }

    __mousemove__(e: MouseEvent) {
        if (e.target !== this.canvas) return
        let target = this.contain(e.offsetX, e.offsetY)
        this.canvas.style.cursor = (target as any).$cursor || ""
        if (this._HOVER_ELEMENT_ !== target && this._HOVER_ELEMENT_) {
            this.__doEvent__("mouseout", this._HOVER_ELEMENT_, e)
            this.__doEvent__("mouseover", target, e)
        }
        this._HOVER_ELEMENT_ = target
        this.__doEvent__("mousemove", target, e)
    }

    __mouseout__(e: MouseEvent) {
        if (this._HOVER_ELEMENT_) {
            this.__doEvent__("mouseout", this._HOVER_ELEMENT_, e)
            this._HOVER_ELEMENT_ = null
        }
    }

    __doEvent__(type: string, target: any, e: MouseEvent) {
        let event: any = {
            type,
            target,
            bubble: true,
            primitiveEvent: e
        }
        let path: any[] = []
        let node = event.target
        while (node) {
            path.unshift(node)
            node = node.parentNode
        }
        event.path = path
        for (let node of path) {
            event.currentTarget = node
            node.fire(type, event, {capture: true})
            if (!event.bubble) return
        }
        event.target.bubbleEvent(type, event)
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.__mousedown__)
        this.canvas.removeEventListener("mouseup", this.__mouseup__)
        this.canvas.removeEventListener("mousemove", this.__mousemove__)
        this.canvas.removeEventListener("mouseout", this.__mouseout__)
        this.canvas.removeEventListener("dblclick", this.__dblclick__)
        super.destroy()
    }
}
