export default class Ray {
    position: Float32Array
    direction: Float32Array
    mouse: {x: number, y: number}
    matrix: Float32Array
    size: {width: number, height: number}

    constructor(position: Float32Array, direction: Float32Array, mouse: {x: number, y: number}, matrix: Float32Array, size: {width: number, height: number}) {
        this.position = position
        this.direction = direction
        this.mouse = mouse
        this.matrix = matrix
        this.size = size
    }
}
