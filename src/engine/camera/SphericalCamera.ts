import Matrix3D from '../math/Matrix3D';
import AnimationUtil from '../animation/AnimationUtil';

const TRANSFORM_MATRIX: any = (Matrix3D.identity as any)()
Matrix3D.scale(TRANSFORM_MATRIX, 1, -1, 1, TRANSFORM_MATRIX)
Matrix3D.xRotate(TRANSFORM_MATRIX, Math.PI / 2, TRANSFORM_MATRIX)

const EPS = 0.001;

const MAX_RADIUS = 1
const MIN_RADIUS = 0.000011

interface Center {
  x: number;
  y: number;
  z: number;
}

interface CameraProps {
  radius: number;
  phi: number;
  theta: number;
  _radius: number;
  _phi: number;
  _theta: number;
}

// Minimal MathUtil.rotate replacement
const MathUtil = {
  rotate(x: number, y: number, theta: number): number[] {
    let sinTheta = Math.sin(theta)
    let cosTheta = Math.cos(theta)
    return [x * cosTheta - y * sinTheta, x * sinTheta + y * cosTheta]
  }
};

// Minimal EventTarget replacement
class EventTarget {
  captureHandlers: Record<string, Array<{ once: boolean; callback: (event?: any) => void }>>;
  bubbleHandlers: Record<string, Array<{ once: boolean; callback: (event?: any) => void }>>;
  __eventTimers__: any[];

  constructor() {
    this.captureHandlers = {}
    this.bubbleHandlers = {}
    this.__eventTimers__ = []
  }

  fire(type: string, event?: any, capture?: boolean): void {
    if (!this.captureHandlers || !this.bubbleHandlers) return;
    let handlers: Array<{ once: boolean; callback: (event?: any) => void }> | undefined
    if (capture) {
      handlers = this.captureHandlers[type]
    } else {
      handlers = this.bubbleHandlers[type]
    }
    if (!handlers) return
    for (let i = 0, l = handlers.length; i < l; i++) {
      let handler = handlers[i]
      try {
        handler.callback(event)
      } catch (err) {
        console.error(err)
      }
      if (handler.once) {
        handlers.splice(i, 1)
        i--
        l--
      }
    }
  }

  once(type: string, callback: (event?: any) => void): void {
    this.on(type, callback, {once: true})
  }

  on(type: string, callback: (event?: any) => void, option?: { capture?: boolean; once?: boolean; time?: number }): void {
    let capture = option ? option.capture : false
    let once = option ? option.once : false
    let handlers: Array<{ once: boolean; callback: (event?: any) => void }>
    if (capture) {
      handlers = this.captureHandlers[type]
      if (!handlers) {
        this.captureHandlers[type] = handlers = []
      }
    } else {
      handlers = this.bubbleHandlers[type]
      if (!handlers) {
        this.bubbleHandlers[type] = handlers = []
      }
    }
    handlers.push({once, callback})
  }

  off(type: string, callback?: (event?: any) => void, option?: { capture?: boolean }): void {
    let capture = option ? option.capture : false
    let handlers: Array<{ once: boolean; callback: (event?: any) => void }> | undefined
    if (capture) {
      handlers = this.captureHandlers[type]
    } else {
      handlers = this.bubbleHandlers[type]
    }
    if (!handlers) return;
    if (!callback) {
      handlers.length = 0
    } else {
      for (let i = 0, l = handlers.length; i < l; i++) {
        let handler = handlers[i]
        if (handler.callback === callback) {
          handlers.splice(i, 1)
          break
        }
      }
    }
  }
}

export default class SphericalCamera extends EventTarget {
  center: Center;
  props: CameraProps;
  needUpdate: boolean;
  canControl: boolean;
  domElement?: HTMLElement;
  downX: number;
  downY: number;
  followId: number;
  followRadiusId: number;
  matrix: any;

  constructor(domElement?: HTMLElement) {
    super()
    this.center = {
      x: 0,
      y: 0,
      z: 0
    }

    this.props = {
      radius: 1,
      phi: EPS,
      theta: 0,
      _radius: 1,
      _phi: EPS,
      _theta: 0
    }

    this.needUpdate = true
    this.canControl = true
    this.downX = 0
    this.downY = 0
    this.followId = 0
    this.followRadiusId = 0
    this.matrix = null
    if (domElement) {
      this.dragStart = this.dragStart.bind(this)
      this.dragMove = this.dragMove.bind(this)
      this.dragEnd = this.dragEnd.bind(this)
      this.wheel = this.wheel.bind(this)
      this.update = this.update.bind(this)
      this.domElement = domElement
      this.domElement.addEventListener("mousedown", this.dragStart as any)
      this.domElement.addEventListener("mousewheel", this.wheel as any)
    }
  }


  setControl(flag: boolean): void {
    this.canControl = flag
  }


  dragStart(e: MouseEvent): void {
    if (!this.canControl) return
    window.addEventListener("mousemove", this.dragMove as any)
    window.addEventListener("mouseup", this.dragEnd as any)
    this.downX = e.clientX
    this.downY = e.clientY
  }

  dragMove(e: MouseEvent): void {
    let deltaX = e.clientX - this.downX
    let deltaY = e.clientY - this.downY
    let radius = Math.max(0.0004, this.radius)
    if (e.buttons === 1) {
      let p = MathUtil.rotate(deltaX / (this.domElement as HTMLElement).clientHeight, deltaY / (this.domElement as HTMLElement).clientHeight, -this.props.theta)
      this.lookAt(this.center.x - p[0] * radius, this.center.y, this.center.z - p[1] * radius)
    } else {
      this.props._theta -= (2 * Math.PI * deltaX / (this.domElement as HTMLElement).clientHeight);
      this.props._phi -= (2 * Math.PI * deltaY / (this.domElement as HTMLElement).clientHeight);

      this.props._phi = Math.max(EPS,
          Math.min(Math.PI / 2.2 - EPS, this.props._phi));

      AnimationUtil.cancelFollow(this.followId)
      this.followId = AnimationUtil.follow({
        target: this.props,
        properties: {
          theta: this.props._theta,
          phi: this.props._phi
        },
        minDelta: 0.001,
        speed: 0.3,
        update: this.update
      })
    }
    this.downX = e.clientX
    this.downY = e.clientY

    this.update()
  }

  dragEnd(): void {
    window.removeEventListener("mousemove", this.dragMove as any)
    window.removeEventListener("mouseup", this.dragEnd as any)
  }

  wheel(e: WheelEvent): void {
    if (!this.canControl) return
    this.props._radius *= e.deltaY > 0 ? 1.1 : 0.9
    this.props._radius = Math.max(Math.min(this.props._radius, MAX_RADIUS), MIN_RADIUS)
    AnimationUtil.cancelFollow(this.followRadiusId)
    this.followRadiusId = AnimationUtil.follow({
      target: this.props,
      properties: {
        radius: this.props._radius
      },
      minDelta: 0.0001,
      speed: 0.2,
      update: this.update
    })

    this.update()
  }


  update(): void {
    this.needUpdate = true
    this.fire('update')
  }

  set radius(radius: number) {
    this.props._radius = this.props.radius = radius
    this.update()
  }

  get radius(): number {
    return this.props.radius
  }

  set phi(phi: number) {
    this.props._phi = this.props.phi = phi
    this.makeSafe()
    this.update()
  }

  get phi(): number {
    return this.props.phi
  }

  set theta(theta: number) {
    this.props._theta = this.props.theta = theta
    this.update()
  }

  get theta(): number {
    return this.props.theta
  }

  lookAt(x: number, y: number, z: number): void {
    this.center.x = x
    this.center.y = y
    this.center.z = z
    this.update()
  }

  // restrict phi to be between EPS and PI-EPS
  makeSafe(): void {
    this.props.phi = Math.max(EPS,
        Math.min(Math.PI / 2.2 - EPS, this.props.phi));
  }

  setFromCartesianCoords(x: number, y: number, z: number): void {
    this.props.radius = Math.sqrt(x * x + y * y + z * z);
    if (this.props.radius === 0) {
      this.props.theta = 0;
      this.props.phi = 0;
    } else {
      this.props.theta = Math.atan2(x, z);
      this.props.phi = Math.acos(
          Math.max(-1, Math.min(1, y / this.props.radius)));
    }
    this.update()
  }

  getPosition(): number[] {
    const sinPhiRadius = Math.sin(this.props.phi) * this.props.radius;
    return [
      sinPhiRadius * Math.sin(this.props.theta),
      Math.cos(this.props.phi) * this.props.radius,
      sinPhiRadius * Math.cos(this.props.theta)]
  }


  //实际上y和z是交换的
  getRealPosition(): number[] {
    const sinPhiRadius = Math.sin(this.props.phi) * this.props.radius;
    return [
      this.center.x + sinPhiRadius * Math.sin(this.props.theta),
      this.center.z + sinPhiRadius * Math.cos(this.props.theta),
      this.center.y + Math.cos(this.props.phi) * this.props.radius
    ]
  }

  getMatrix(): any {
    if (!this.needUpdate && this.matrix) return this.matrix
    this.needUpdate = false
    this.matrix = (Matrix3D.identity as any)()
    let position = this.getPosition()

    Matrix3D.inverse(Matrix3D.lookAt([
          this.center.x + position[0],
          this.center.y + position[1],
          this.center.z + position[2]],
        [this.center.x, this.center.y, this.center.z], [0, 1, 0], this.matrix),
        this.matrix)
    Matrix3D.multiply(this.matrix, TRANSFORM_MATRIX, this.matrix)
    return this.matrix
  }


  getMatrixForParams(phi: number, theta: number, radius: number, center: Center): any {
    let matrix = (Matrix3D.identity as any)()
    const sinPhiRadius = Math.sin(phi) * radius;
    let position = [
      sinPhiRadius * Math.sin(theta),
      Math.cos(phi) * radius,
      sinPhiRadius * Math.cos(theta)
    ]

    Matrix3D.inverse(Matrix3D.lookAt([
          center.x + position[0],
          center.y + position[1],
          center.z + position[2]],
        [center.x, center.y, center.z], [0, 1, 0], matrix),
        matrix)
    Matrix3D.multiply(matrix, TRANSFORM_MATRIX, matrix)
    return matrix
  }
}
