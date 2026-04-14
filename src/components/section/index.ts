import GLPanelLayer from "../../core/layers/GLPanelLayer"
import GLBuffer from "../../engine/webgl/GLBuffer"
import GLProject from "../../engine/webgl/GLProject"
import shader from "./shader"
import drawShader from "./drawShader"
import ObjectUtil from "../../engine/utils/ObjectUtil"
import GLTexture from "../../engine/webgl/GLTexture"
import GLRenderTarget from "../../engine/webgl/GLRenderTarget"
import BlurFilterElement from "../../utils/blurFilter"
import LineUtil from "../../engine/utils/LineUtil"

export default class Section extends GLPanelLayer {
  props: any;
  polygnProject: any;
  vertexBuffer: any;
  colorTexture: any;
  blurElement: any;
  reflectionTarget: any;
  drawProject: any;
  needUpdateColor: boolean;
  needUpdateBuffer: boolean;
  colorCanvas: any;
  colorCtx: any;

  constructor() {
    super();
    this.props = {
      color: '#fff',
      effect: 0.5,
      height: 20,
      thickness: 20,
      reflection: {
        enable: false,
        scale:1,
        blur: 0,
        opacity: 1
      }
    };
    this.needUpdateColor = true
    this.on('destroy', () => {
      if (this.polygnProject) this.polygnProject.destroy()
      if (this.vertexBuffer) this.vertexBuffer.destroy()
      if (this.colorTexture) this.colorTexture.destroy()
      if (this.blurElement) this.blurElement.destroy()
      if (this.reflectionTarget) this.reflectionTarget.destroy()
      if (this.drawProject) this.drawProject.destroy()
    })
  }

  setProps(props: any) {
    let oldColor = this.props.color
    ObjectUtil.setProps(this.props, props)
    if (oldColor !== this.props.color) {
      this.needUpdateColor = true
    }
    if (this.props.reflection.enable && this.props.reflection.blur) {
      if (this.blurElement) {
        this.blurElement.setProps({
          blurX: this.props.reflection.blur,
          blurY: 4 * this.props.reflection.blur
        })
      }
    } else {
      if (this.blurElement) {
        this.blurElement.destroy()
        this.blurElement = null
      }
      if (this.reflectionTarget) {
        this.reflectionTarget.destroy()
        this.reflectionTarget = null
      }
      if (this.drawProject) {
        this.drawProject.destroy()
        this.drawProject = null
      }

    }
  }

  refresh() {
    this.updateSelf()
    this.needUpdateBuffer = true
  }

  refreshBuffer(gl: any) {
    let data = this.mapData.getData()

    let vertices: number[] = []
    let idx = 0
    for (let areaData of data) {
      if (idx > 10000) break
      idx++
      switch (areaData.geometry.type) {
        case "polygon": {
          for (let i = 0, l = areaData.geometry.polygon.pointsList.length; i <
          l; i++) {
            let polygon = areaData.geometry.polygon
            let points = polygon.pointsList[i]
            let faces = LineUtil.getSection3DByPoints(points)
            vertices.push(vertices[vertices.length - 4],
                vertices[vertices.length - 3], vertices[vertices.length - 2],
                vertices[vertices.length - 1])
            vertices.push(faces[0], faces[1], faces[2], faces[3])
            vertices = vertices.concat(faces)
          }

          break
        }
        case "polygons": {
          for (let i = 0, l = areaData.geometry.polygons.length; i < l; i++) {
            let polygon = areaData.geometry.polygons[i]
            for (let j = 0, k = polygon.pointsList.length; j < k; j++) {
              let points = polygon.pointsList[j]
              let faces = LineUtil.getSection3DByPoints(points)
              vertices.push(vertices[vertices.length - 4],
                  vertices[vertices.length - 3], vertices[vertices.length - 2],
                  vertices[vertices.length - 1])
              vertices.push(faces[0], faces[1], faces[2], faces[3])
              vertices = vertices.concat(faces)
            }

          }
          break
        }
      }
    }
    if (!this.vertexBuffer) {
      this.vertexBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW,
          new Float32Array(vertices))
    } else {
      this.vertexBuffer.setData(new Float32Array(vertices))
    }

  }

  refreshColorTexture(gl: any) {
    if (!this.colorCanvas) {
      this.colorCanvas = document.createElement("canvas")
      this.colorCanvas.width = 8
      this.colorCanvas.height = 128
      this.colorCtx = this.colorCanvas.getContext("2d")
    }

    this.colorCtx.clearRect(0, 0, this.colorCanvas.width,
        this.colorCanvas.height)
    if (this.props.color instanceof Array) {
      let grd = this.colorCtx.createLinearGradient(0, 0, 0,
          this.colorCanvas.height)
      for (let color of this.props.color) {
        grd.addColorStop(color[0], color[1])
      }
      this.colorCtx.fillStyle = grd
      this.colorCtx.fillRect(0, 0, this.colorCanvas.width,
          this.colorCanvas.height)
    } else {
      this.colorCtx.fillStyle = this.props.color
      this.colorCtx.fillRect(0, 0, this.colorCanvas.width,
          this.colorCanvas.height)
    }
    if (!this.colorTexture) {
      this.colorTexture = new GLTexture(gl, this.colorCanvas)
    } else {
      this.colorTexture.setData(this.colorCanvas)
    }
  }

  render(gl: any, matrix: any) {
    if (!this.mapData || this.mapData.isEmpty()) return
    if (this.needUpdateBuffer) {
      this.needUpdateBuffer = false
      this.refreshBuffer(gl)
    }
    if (this.needUpdateColor) {
      this.needUpdateColor = false
      this.refreshColorTexture(gl)
    }

    gl.disable(gl.CULL_FACE)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    if (!this.polygnProject) {
      this.polygnProject = new GLProject(gl, shader)
    }
    this.polygnProject.use()

    let height = this.mapData.convertSize(this.height)
    let thickness = this.mapData.convertSize(this.props.thickness)

    if (this.props.reflection.enable) {
      gl.disable(gl.DEPTH_TEST)
      if (!this.props.reflection.blur) {
        this.polygnProject.setUniforms({
          uMatrix: {
            data: matrix
          },
          uHeight: {
            data: -height - thickness * (0.3+ this.props.reflection.scale)
          },
          uParam: {
            data: [this.props.reflection.opacity, 1]
          },
          uThickness: {
            data: thickness * (1.2+ this.props.reflection.scale)
          }
        })
        this.colorTexture.use(0)
        this.polygnProject.setAttributes({
          aVertices: {
            data: this.vertexBuffer,
            size: 4
          }
        })
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexBuffer.length / 4)
      } else {
        if (!this.reflectionTarget) {
          this.reflectionTarget = new GLRenderTarget(gl, 1024, 1024)
        }

        this.reflectionTarget.use()
        this.reflectionTarget.clear()
        this.polygnProject.setUniforms({
          uMatrix: {
            data: matrix
          },
          uHeight: {
            data: -height - thickness * (0.3 +this.props.reflection.scale + this.props.reflection.blur*0.1)
          },
          uParam: {
            data: [1, 1]
          },
          uThickness: {
            data: thickness * (1.2 + this.props.reflection.scale)
          }
        })
        this.colorTexture.use(0)
        this.polygnProject.setAttributes({
          aVertices: {
            data: this.vertexBuffer,
            size: 4
          }
        })
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexBuffer.length / 4)

        this.reflectionTarget.pop()

        if (!this.blurElement) {
          this.blurElement = new BlurFilterElement({
            blurX: this.props.reflection.blur*0.5,
            blurY: 4 * this.props.reflection.blur
          })
        }

        let blurTexture = this.blurElement.doFilter(gl,
            this.reflectionTarget.getTexture())

        if (!blurTexture) return

        if (!this.drawProject) {
          this.drawProject = new GLProject(gl, drawShader)
        }
        this.drawProject.use()
        blurTexture.use(0)
        this.drawProject.setAttributes({
          aVertices: {
            data: this.blurElement.commonBuffer,
            size: 2
          }
        })
        this.drawProject.setUniforms({
          uOpacity: {
            data: this.props.reflection.opacity
          }
        })
        gl.drawArrays(gl.TRIANGLE_STRIP, 0,
            this.blurElement.commonBuffer.length / 2)
      }
    }
    gl.enable(gl.DEPTH_TEST)
    this.polygnProject.use()

    this.colorTexture.use(0)

    this.polygnProject.setUniforms({
      uMatrix: {
        data: matrix
      },
      uHeight: {
        data: height - thickness
      },
      uParam: {
        data: [1, 0]
      },
      uThickness: {
        data: thickness
      }
    })
    this.polygnProject.setAttributes({
      aVertices: {
        data: this.vertexBuffer,
        size: 4
      }
    })
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexBuffer.length / 4)

  }
}
