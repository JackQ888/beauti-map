# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`beauti-map` 是一个独立的、零依赖的 3D 地图可视化 WebGL 组件库。它使用原生 WebGL（优先 WebGL2，回退 WebGL1）渲染中国地图，支持省市级下钻、多种可视化图层叠加（柱状图、飞线、散点、热力图等）。不依赖 Three.js 或其他 3D 库，所有矩阵运算、几何、相机系统均为自研。

## Commands

- `npm start` — 启动开发服务器（webpack-dev-server，端口 88，包含示例菜单）
- `npm run pack` — 生产构建，输出 UMD 包到 `dist/beauti-map.js`（全局名 `BeautiMap`）

无测试框架、无 lint 配置。

## Architecture

### 入口与构建

- `src/index.ts` — 库导出入口，导出核心类和所有组件（`webpack.config.pack.js` 使用）
- `src/main.ts` — 开发入口，示例编排器，提供左侧菜单切换多个 example（`webpack.config.dev.js` 使用）
- `src/examples/` — 各示例的 setup 函数，每个示例展示不同组件组合

### 核心层级（`src/core/`）

继承链：`EventTarget` → `Node` → `GLRenderer` → `Map3D`

- **`Map3D`** — 顶层地图类，管理相机、投影矩阵、鼠标事件（click/hover/dblclick 通过 Ray Casting 实现）、子节点渲染排序
- **`GLRenderer`** — WebGL 渲染器基类，创建 canvas/WebGL context，管理 requestAnimationFrame 渲染循环和 resize
- **`Node`** — 场景树节点，提供 addChild/removeChild、事件冒泡、traverse、destroy
- **`GLGroup`** — 渲染分组节点，支持 `$zIndex` 排序、`$visible` 控制、Ray Casting 命中检测
- **`GL3DLayer`** — 3D 图层基类，绑定 MapData，支持 `height` 属性控制挤出高度，提供 `draw()` 模板方法
- **`GLPanelLayer`** — 2D 面板图层基类，类似 GL3DLayer 但面向 panel 类型渲染

### 数据系统（`src/core/data/`）

- **`MapData`** — 核心数据类，接收 GeoJSON，通过 `MapUtil` 做投影转换（支持 Mercator），计算 bounding/radius，`change` 事件驱动刷新
- **`FilterMapData`** — MapData 子类，支持 `setDataFilter()` 过滤，常用于 hover 高亮
- **`MapUtil`** — GeoJSON 解析与投影计算工具

### 引擎层（`src/engine/`）

自研渲染引擎，不依赖外部 3D 库：

- `webgl/` — GLShader、GLBuffer、GLTexture、GLProject（坐标投影）、GLRenderTarget（离屏渲染）
- `math/` — Matrix3D（4x4矩阵运算）、Matrix2D、MathUtil、Bezier
- `camera/` — SphericalCamera（球面坐标系相机，支持鼠标交互控制）
- `animation/` — AnimationUtil + EaseFunctions（属性插值动画系统）
- `geometry/` — GeometryUtil（几何体生成）
- `color/` — ColorUtil
- `utils/` — DrawUtil、LineUtil、GLUtil、ObjectUtil 等 WebGL 绘制工具

### 组件层（`src/components/`）

每个组件是一个独立目录，包含 `index.ts`（组件类）、`shader.ts`（顶点/片元着色器）、可选 `drawShader.ts`/`pointShader.ts`。

两大类组件：

**3D 图层组件**（继承 GL3DLayer，响应地图区域）：
BackgroundArea、Section、GridPanel、CirclePanel、TexturePanel、Trace、Boundary、EffectLight、PanelText、AreaText

**数据可视化组件**（接收独立数据源）：
Bar、Scatter、FlyLine、FlyLine2D、Thermo、Mark、Point、SpriteText、Content

### 组件使用模式

```typescript
const map = new Map3D({ el: container })
const layer = map.createChild('BackgroundArea')  // 通过字符串名创建组件
layer.setProps({ /* 配置 */ })
layer.setMapData(mapData)  // 绑定数据源
layer.height = 50         // 设置挤出高度
layer.on('areaClick', callback)  // 事件监听
map.addChild(layer)
map.setMapData(mapData)   // 设置主地图数据触发渲染
```

### GeoJSON 数据

`public/geoJson/` 存放中国地图 GeoJSON 数据，命名规则：`{adcode}.json`（区域数据）、`{adcode}_boundary.json`（边界数据）。adcode 为行政区划代码（100000=全国，110000=北京等）。

### 自研数学库（`src/utils/three/`）

从 Three.js 提取的独立数学工具：Vector2/3、Matrix4、Quaternion、BezierCurve3 等，无 Three.js 运行时依赖。
