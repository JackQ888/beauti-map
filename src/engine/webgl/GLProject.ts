import GLShader from "./GLShader";

interface UniformInfo {
  type: number;
  location: WebGLUniformLocation | null;
}

interface AttributeInfo {
  type: number;
  location: number;
}

interface UniformData {
  data: any;
  transpose?: boolean;
}

interface AttributeData {
  data: any;
  size: number;
  type?: number;
  normalized?: boolean;
  stride?: number;
  offset?: number;
}

export default class GLProject {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vsShader: GLShader;
  fsShader: GLShader;
  uniforms: Record<string, WebGLUniformLocation | null>;
  attributes: Record<string, number>;
  uniformMap: Record<string, UniformInfo>;
  attributeMap: Record<string, AttributeInfo>;

  constructor(gl: WebGL2RenderingContext, {vsSource, fsSource}: { vsSource: string; fsSource: string }) {
    this.gl = gl;
    this.program = gl.createProgram()!;
    this.vsShader = new GLShader(gl, gl.VERTEX_SHADER, vsSource);
    this.fsShader = new GLShader(gl, gl.FRAGMENT_SHADER, fsSource);
    gl.attachShader(this.program, this.vsShader.shader);
    gl.attachShader(this.program, this.fsShader.shader);
    gl.linkProgram(this.program);
    this.uniforms = {};
    this.attributes = {};

    this.uniformMap = {};
    this.attributeMap = {};

    let numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    let numAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);

    for (let i = 0; i < numUniforms; ++i) {
      let obj = gl.getActiveUniform(this.program, i);
      if (!obj) continue;
      let location = gl.getUniformLocation(this.program, obj.name);
      this.uniforms[obj.name] = location;
      this.uniformMap[obj.name] = {
        type: obj.type,
        location: location
      };
    }
    for (let i = 0; i < numAttributes; i++) {
      let obj = gl.getActiveAttrib(this.program, i);
      if (!obj) continue;
      let location = gl.getAttribLocation(this.program, obj.name);
      this.attributes[obj.name] = location;
      this.attributeMap[obj.name] = {
        type: obj.type,
        location: location
      };
    }
  }

  use(): void {
    this.gl.useProgram(this.program);
  }

  destroy(): void {
    for (let key in this.attributeMap) {
      let attributeInfo = this.attributeMap[key];
      this.gl.disableVertexAttribArray(attributeInfo.location);
    }
    this.gl.deleteProgram(this.program);
    this.vsShader.destroy();
    this.fsShader.destroy();
  }

  setUniforms(uniforms: Record<string, UniformData>): void {
    for (let key in uniforms) {
      let uniformInfo = this.uniformMap[key];
      if (!uniformInfo) continue;
      let uniform = uniforms[key];

      switch (uniformInfo.type) {
        case this.gl.FLOAT: {
          this.gl.uniform1f(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.FLOAT_VEC2: {
          this.gl.uniform2fv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.FLOAT_VEC3: {
          this.gl.uniform3fv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.FLOAT_VEC4: {
          this.gl.uniform4fv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.SAMPLER_2D:
        case this.gl.INT_SAMPLER_2D:
        case this.gl.BOOL:
        case this.gl.INT: {
          this.gl.uniform1i(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.INT_VEC2: {
          this.gl.uniform2iv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.INT_VEC3: {
          this.gl.uniform3iv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.INT_VEC4: {
          this.gl.uniform4iv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.FLOAT_MAT2: {
          this.gl.uniformMatrix2fv(uniformInfo.location, uniform.transpose, uniform.data);
          break;
        }
        case this.gl.FLOAT_MAT3: {
          this.gl.uniformMatrix3fv(uniformInfo.location, uniform.transpose, uniform.data);
          break;
        }
        case this.gl.FLOAT_MAT4: {
          this.gl.uniformMatrix4fv(uniformInfo.location, uniform.transpose, uniform.data);
          break;
        }
        default: {
          console.warn("没有匹配到对应类型:" + uniformInfo.type);
        }
      }
    }
  }

  setAttributes(attributes: Record<string, AttributeData>): void {
    for (let key in attributes) {
      let attributeInfo = this.attributeMap[key];
      if (!attributeInfo) continue;
      let attribute = attributes[key];
      attribute.data.use();
      this.gl.enableVertexAttribArray(attributeInfo.location);
      this.gl.vertexAttribPointer(attributeInfo.location, attribute.size, attribute.type || this.gl.FLOAT, attribute.normalized || false, attribute.stride || 0, attribute.offset || 0);
    }
  }
}
