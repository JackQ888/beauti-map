import EaseFunctions from './EaseFunctions';

interface ExecuteOptions {
  target?: any;
  properties?: Record<string, any>;
  duration?: number;
  ease?: string;
  delay?: number;
  start?: () => void;
  update?: (animationPercent?: number, percent?: number) => void;
  resolve?: () => void;
  reject?: () => void;
}

interface ExecutesOptions {
  entries?: Array<{ target: any; properties: Record<string, any> }>;
  duration?: number;
  ease?: string;
  delay?: number;
  start?: () => void;
  update?: (animationPercent?: number, percent?: number) => void;
  resolve?: () => void;
  reject?: () => void;
}

interface FollowOptions {
  target: any;
  properties: Record<string, number>;
  speed?: number;
  minDelta?: number;
  update?: () => void;
  resolve?: () => void;
  reject?: () => void;
}

interface FollowProperty {
  key: string;
  targetValue: number;
}

interface FollowEntry {
  target: any;
  properties: FollowProperty[];
  speed: number;
  minDelta: number;
  update?: () => void;
  resolve?: () => void;
  reject?: () => void;
}

interface EntryOption {
  key: string;
  from: any;
  to: any;
  type: any;
}

// Minimal inline replacement for PropertiesUtil used by AnimationUtil
// In the new structure, PropertiesUtil types are inferred inline
const PropertiesUtil = {
  getType(value: any): any {
    const colorRegex = /^rgb|#/;
    if (typeof value === 'number') return "number"
    if (typeof value === 'string') {
      if (colorRegex.test(value)) return "color"
      if (value.endsWith("%")) return "percent"
      if (value.endsWith("px")) return "pixel"
    }
    if (Array.isArray(value)) {
      let ts: any[] = []
      for (let v of value) {
        ts.push(PropertiesUtil.getType(v))
      }
      return ts
    }
    return "unknown"
  },
  mix(v1: any, v2: any, percent: number, type: any): any {
    switch (type) {
      case "number": {
        return v1 + (v2 - v1) * percent
      }
      case "unknown": {
        return v2
      }
      default: {
        return v2
      }
    }
  }
};

class Animation {
  entries: Entry[];
  duration: number;
  ease: (t: number) => number;
  startCallback: (() => void) | undefined;
  updateCallback: ((animationPercent: number, percent: number) => void) | undefined;
  completeCallback: (() => void) | undefined;
  errorCallback: ((e: any) => void) | undefined;
  time: number;
  startFlag: boolean;
  pauseFlag: boolean;
  cancelFlag: boolean;
  abortFlag: boolean;
  completeFlag: boolean;

  constructor(
      entries: Array<{ target: any; properties: Record<string, any> }>,
      duration: number, delay: number, ease: string,
      startCallback: (() => void) | undefined,
      updateCallback: ((animationPercent: number, percent: number) => void) | undefined,
      completeCallback: (() => void) | undefined,
      errorCallback: ((e: any) => void) | undefined) {
    this.entries = []
    for (let item of entries) {
      this.entries.push(new Entry(
          item.target, item.properties
      ))
    }
    this.duration = duration
    this.ease = EaseFunctions[ease] || EaseFunctions.linear
    this.startCallback = startCallback
    this.updateCallback = updateCallback
    this.completeCallback = completeCallback
    this.errorCallback = errorCallback
    this.time = -delay

    this.startFlag = false
    this.pauseFlag = false
    this.cancelFlag = false
    this.abortFlag = false
    this.completeFlag = false
  }

  update(delta: number): boolean {
    if (this.cancelFlag || this.abortFlag || this.completeFlag) return true
    if (this.pauseFlag) return false
    this.time += delta
    if (this.time < 0) return false
    if (!this.startFlag) {
      try {
        //start回调失败时会执行error回调
        if (this.startCallback) this.startCallback()
      } catch (e) {
        //不存在error回调，就会打印错误，存在则不打印
        if (!this.errorCallback) console.error(e)
        else {
          try {
            this.errorCallback(e)
          } catch (err) {
            console.error(err)
          }
        }
        this.abortFlag = true
        return true
      }
    }
    this.startFlag = true
    let percent = Math.min(1, this.time / this.duration)
    let animationPercent = this.ease(percent)
    try {
      for (let entry of this.entries) {
        entry.setPercent(animationPercent)
      }
      try {
        if (this.updateCallback) this.updateCallback(animationPercent, percent)
      } catch (e) {
        if (!this.errorCallback) console.error(e)
        else {
          try {
            this.errorCallback(e)
          } catch (err) {
            console.error(err)
          }
        }
        this.abortFlag = true
        return true
      }
    } catch (e) {
      //不存在error回调，就会打印错误，存在则不打印
      if (!this.errorCallback) console.error(e)
      else {
        try {
          this.errorCallback(e)
        } catch (err) {
          console.error(err)
        }
      }
      this.abortFlag = true
      return true
    }
    this.completeFlag = percent === 1
    if (this.completeFlag) {
      try {
        //complete回调执行异常时，不会执行error回调
        if (this.completeCallback) this.completeCallback()
      } catch (e) {
        console.error(e)
      }
    }
    return this.completeFlag
  }

  pause(): void {
    if (this.abortFlag) {
      console.warn('animation is aborted!')
      return
    }
    if (this.completeFlag) {
      console.warn('animation is completed!')
      return
    }
    if (this.cancelFlag) {
      console.warn('animation is canceled!')
      return
    }
    this.pauseFlag = true
  }

  play(): void {
    if (this.abortFlag) {
      console.warn('animation is aborted!')
      return
    }
    if (this.completeFlag) {
      console.warn('animation is completed!')
      return
    }
    if (this.cancelFlag) {
      console.warn('animation is canceled!')
      return
    }
    this.pauseFlag = false
  }

  complete(): void {
    if (this.abortFlag) {
      //console.warn('animation is aborted!')
      return
    }
    if (this.completeFlag) {
      //console.warn('animation is completed!')
      return
    }
    if (this.cancelFlag) {
      //console.warn('animation is canceled!')
      return
    }
    this.time = this.duration
    this.completeFlag = true
    for (let entry of this.entries) {
      entry.setPercent(1)
    }
    try {
      if (this.completeCallback) this.completeCallback()
    } catch (e) {
      console.error(e)
    }
  }

  cancel(): void {
    if (this.abortFlag) {
      //console.warn('animation is aborted!')
      return
    }
    if (this.completeFlag) {
      //console.warn('animation is completed!')
      return
    }
    if (this.cancelFlag) {
      //console.warn('animation is canceled!')
      return
    }
    this.cancelFlag = true
  }
}

class Entry {
  target: any;
  options: EntryOption[];

  constructor(target: any, properties: Record<string, any>) {
    this.target = target
    this.options = [];
    for (let key in properties) {
      let sourceValue = target[key], targetValue = properties[key]
      if (target[key] === properties[key]) continue
      this.options.push({
        key,
        from: sourceValue,
        to: targetValue,
        type: PropertiesUtil.getType(properties[key]),
      });
    }
  }

  setPercent(percent: number): void {
    for (let j = 0; j < this.options.length; j++) {
      let option = this.options[j];
      if (option.from === undefined || option.from === null) {
        option.from = option.to;
      }
      if (option.to === undefined || option.to === null) {
        this.target[option.key] = option.to;
      } else {
        this.target[option.key] = PropertiesUtil.mix(option.from, option.to,
            percent, option.type);
      }
    }
  }
}

class AnimationUtilClass {
  animations: Animation[];
  ticks: Record<string, (delta: number) => void>;
  follows: Record<string, FollowEntry>;
  _lastTime: number;
  tickId: number;
  followId: number;
  __executing__: boolean;
  requestId: number;

  constructor() {
    this.animations = [];
    this.ticks = {};
    this.follows = {};
    this._lastTime = 0

    this.tickId = 1
    this.followId = 1
    this._update = this._update.bind(this);
    this.__executing__ = false;
    this.requestId = 0;
  }

  execute({
            target,
            properties,
            duration = 200,
            ease = 'cubicOut',
            delay = 0,
            start,
            update,
            resolve,
            reject
          }: ExecuteOptions): Animation {
    let animation = new Animation([
      {target, properties}
    ], duration, delay, ease, start, update, resolve, reject)
    this.animations.push(animation);
    if (!this.__executing__) {
      this.__executing__ = true;
      this._update();
    }
    return animation;
  }

  executes({
             entries,
             duration = 200,
             ease = 'cubicOut',
             delay = 0,
             start,
             update,
             resolve,
             reject
           }: ExecutesOptions): Animation {
    let animation = new Animation(entries, duration, delay, ease, start, update,
        resolve, reject)
    this.animations.push(animation);
    if (!this.__executing__) {
      this.__executing__ = true;
      this._update();
    }
    return animation;
  }

  tick(callback?: (delta: number) => void): number {
    if (!callback) return 0;
    let tickId = this.tickId
    this.ticks[tickId] = callback;
    this.tickId++
    if (!this.__executing__) {
      this.__executing__ = true;
      this._update();
    }
    return tickId;
  }

  cancelTick(index: number): void {
    if (index <= 0) return;
    delete this.ticks[index];
  }

  follow({
           target,
           properties,
           speed = 0.1,
           minDelta = 0.1,
           update,
           resolve,
           reject
         }: FollowOptions): number {
    let ps: FollowProperty[] = [];
    for (let key in properties) {
      let targetValue = properties[key];
      ps.push({key, targetValue});
    }
    let followId = this.followId
    this.follows[followId] = {
      target,
      properties: ps,
      speed,
      minDelta,
      update,
      resolve,
      reject,
    };
    this.followId++
    if (!this.__executing__) {
      this.__executing__ = true
      this._update()
    }
    return followId;
  }

  cancelFollow(index: number): void {
    if (index <= 0) return;
    delete this.follows[index];
  }

  _update(): void {
    this.requestId = requestAnimationFrame(this._update);
    let delta = 16.6;
    if (this._lastTime) {
      delta = Date.now() - this._lastTime;
    }
    //最大间隔不超过30ms
    delta = Math.min(delta, 30);
    this._lastTime = Date.now();

    for (let index in this.ticks) {
      try {
        this.ticks[index](delta);
      } catch (e) {
        console.log(e);
        this.cancelTick(parseInt(index));
      }
    }
    let m = delta / 16;
    for (let index in this.follows) {
      let {
        target,
        properties,
        speed,
        minDelta,
        update,
        resolve,
        reject
      } = this.follows[index];
      try {
        let ms = Math.min(speed * m, 0.9);
        for (let i = properties.length - 1; i >= 0; i--) {
          let property = properties[i];
          let {key, targetValue} = property;
          let nowValue: number = target[key];
          nowValue += (targetValue - nowValue) * ms;
          target[key] = nowValue;
          if (Math.abs(targetValue - nowValue) < minDelta) {
            target[key] = targetValue;
            properties.splice(i, 1);
          }
        }
        if (update) update();
        if (!properties.length) {
          this.cancelFollow(parseInt(index));
          if (resolve) resolve();
        }
      } catch (e) {
        console.error(e);
        this.cancelFollow(parseInt(index));
        if (reject) reject();
      }
    }

    for (let i = 0, l = this.animations.length; i < l; i++) {
      let animation = this.animations[i];
      if (animation.update(delta)) {
        this.animations.splice(i, 1);
        i--;
        l--;
      }
    }

    if (!this.animations.length && !Object.keys(this.ticks).length &&
        !Object.keys(this.follows).length) {
      this.__executing__ = false;
      this._lastTime = 0
      cancelAnimationFrame(this.requestId);
    }
  }

  destroy(): void {
    this.animations.length = 0;
    cancelAnimationFrame(this.requestId);
    this.__executing__ = false;
  }
}

const AnimationUtil = new AnimationUtilClass();

export default AnimationUtil;
