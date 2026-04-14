import {Vector3} from "./three/Vector3"
import {QuadraticBezierCurve3} from "./three/QuadraticBezierCurve3"

const TubeUtil = {
    getDataByQuad({start, ctrl, end, tubularSegments, radius, radialSegments, realDistance}: {
        start: number[], ctrl: number[], end: number[],
        tubularSegments: number, radius: number, radialSegments: number, realDistance?: boolean
    }) {
        return this.getData(new QuadraticBezierCurve3(
            new Vector3(...start as [number, number, number]),
            new Vector3(...ctrl as [number, number, number]),
            new Vector3(...end as [number, number, number])), tubularSegments, radius, radialSegments, false, realDistance)
    },
    getData(
        path: any, tubularSegments: number = 64, radius: number = 1, radialSegments: number = 8,
        closed: boolean = false, realDistance: boolean = false) {

        const frames = path.computeFrenetFrames(tubularSegments, closed)

        const vertex = new Vector3()
        const normal = new Vector3()

        const vertices: number[] = []
        const normals: number[] = []
        const indices: number[] = []

        let P: any = new Vector3()

        let distance = 0

        generateBufferData()

        if (realDistance) {
            for (let i = 0, l = vertices.length; i < l; i += 4) {
                vertices[i + 3] *= distance
            }
        }

        function generateBufferData() {
            for (let i = 0; i < tubularSegments; i++) {
                generateSegment(i)
            }
            generateSegment((closed === false) ? tubularSegments : 0)
            generateIndices()
        }

        function generateSegment(i: number) {
            if (realDistance) {
                let TP = path.getPointAt(i / tubularSegments)
                if (i) {
                    distance += P.sub(TP).length()
                }
                P = TP
            } else {
                P = path.getPointAt(i / tubularSegments, P)
            }

            const N = frames.normals[i]
            const B = frames.binormals[i]

            for (let j = 0; j <= radialSegments; j++) {
                const v = j / radialSegments * Math.PI * 2
                const sin = Math.sin(v)
                const cos = -Math.cos(v)

                normal.x = (cos * N.x + sin * B.x)
                normal.y = (cos * N.y + sin * B.y)
                normal.z = (cos * N.z + sin * B.z)
                normal.normalize()

                normals.push(normal.x, normal.y, normal.z)

                vertex.x = P.x + radius * normal.x
                vertex.y = P.y + radius * normal.y
                vertex.z = P.z + radius * normal.z

                vertices.push(vertex.x, vertex.y, vertex.z, i / tubularSegments)
            }
        }

        function generateIndices() {
            for (let j = 1; j <= tubularSegments; j++) {
                for (let i = 1; i <= radialSegments; i++) {
                    const a = (radialSegments + 1) * (j - 1) + (i - 1)
                    const b = (radialSegments + 1) * j + (i - 1)
                    const c = (radialSegments + 1) * j + i
                    const d = (radialSegments + 1) * (j - 1) + i

                    indices.push(a, b, d)
                    indices.push(b, c, d)
                }
            }
        }

        return {
            vertices,
            normals,
            indices
        }
    }
}

export default TubeUtil
