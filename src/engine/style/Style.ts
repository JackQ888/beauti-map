// Minimal PropertiesListener replacement for Style
const PropertiesListener = {
  bindProperties(target: any, properties: Record<string, any>, callback: (val: any, oldValue: any) => void): void {
    if (!properties) return
    Object.keys(properties).forEach(key => {
      let targetValue = properties[key]
      Object.defineProperty(target, key, {
        get: function (this: any) {
          if (!this.__observer__ || !this.__observer__.hasOwnProperty(key)) return targetValue
          return this.__observer__[key];
        },
        set: function (this: any, val: any) {
          if (!this.__observer__ && targetValue === val) return;
          if (!this.__observer__) {
            this.__observer__ = {[key]: targetValue}
          }
          let oldValue = this.__observer__[key]
          if (val === oldValue) return
          this.__observer__[key] = val
          callback.call(this, val, oldValue)
        }
      })
    })
  }
};

export default class Style {
  target: any;
  ignoreEvent: boolean;
  ignoreSelfEvent: boolean;
  cursor: string;
  width: number;
  height: number;
  cache: boolean;
  x: number;
  y: number;
  floor: boolean;
  opacity: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  transformX: string;
  transformY: string;
  composite: string;
  translateX: string;
  translateY: string;
  visible: boolean;
  zIndex: number;

  constructor(target: any) {
    this.target = target
    this.ignoreEvent = false
    this.ignoreSelfEvent = false
    this.cursor = ''
    this.width = 0
    this.height = 0
    this.cache = false
    this.x = 0
    this.y = 0
    this.floor = true
    this.opacity = 1
    this.rotation = 0
    this.scaleX = 1
    this.scaleY = 1
    this.transformX = "50%"
    this.transformY = "50%"
    this.composite = "source-over"
    this.translateX = "0px"
    this.translateY = "0px"
    this.visible = true
    this.zIndex = 0
  }

  updateSelf(): void {
    this.target.updateSelf()
  }

  updateParent(): void {
    this.target.updateParent()
  }

  sortParentChildren(): void {
    this.target.sortParentChildren()
  }
}

// Set up prototype-based reactive properties
(Style.prototype as any).target = null;
(Style.prototype as any).ignoreEvent = false;
(Style.prototype as any).ignoreSelfEvent = false;
(Style.prototype as any).cursor = '';
(Style.prototype as any).width = 0;
(Style.prototype as any).height = 0;

PropertiesListener.bindProperties(Style.prototype, {
  cache: false,//缓存
}, Style.prototype.updateSelf)

PropertiesListener.bindProperties(Style.prototype, {
  x: 0,
  y: 0,
  floor: true,//按照像素比取整处理
  opacity: 1, //节点透明度
  rotation: 0, //节点旋转
  scaleX: 1, //节点X缩放
  scaleY: 1, //节点Y缩放
  transformX: "50%",
  transformY: "50%",
  composite: "source-over",
  translateX: "0px",//节点布局偏移量
  translateY: "0px",//节点布局偏移量
  visible: true, //节点是否可见
}, Style.prototype.updateParent)

PropertiesListener.bindProperties(Style.prototype, {
  zIndex: 0
}, Style.prototype.sortParentChildren)
