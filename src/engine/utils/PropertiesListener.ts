function bindProperties(target: any, properties: Record<string, any>, callback: (val: any, oldValue: any) => void): void {
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
                    this.__observer__ = { [key]: targetValue }
                }
                let oldValue = this.__observer__[key]
                if (val === oldValue) return
                this.__observer__[key] = val
                callback.call(this, val, oldValue)
            }
        })
    })
}

function bindObjectProperties(target: any, properties: Record<string, any>, callback: (val: any, oldValue: any) => void): void {
    if (!properties) return
    Object.keys(properties).forEach(key => {
        let targetValue = properties[key]
        bindProperties(targetValue, targetValue, callback)
        Object.defineProperty(target, key, {
            get: function () {
                return targetValue;
            },
            set: function (value: any) {
                Object.assign(targetValue, value)
            }
        })
    })
}

function bindProperty(target: any, key: string, value: any, callback: (val: any, oldValue: any) => void): void {
    Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        get(this: any) {
            if (!this.__observer__ || !this.__observer__.hasOwnProperty(key)) return value
            return this.__observer__[key]
        },
        set(this: any, val: any) {
            if (!this.__observer__ && value === val) return;
            if (!this.__observer__) {
                this.__observer__ = { [key]: value }
            }
            let oldValue = this.__observer__[key]
            if (val === oldValue) return
            this.__observer__[key] = val
            callback.call(this, val, oldValue)
        }
    })
}


export default { bindProperty, bindProperties, bindObjectProperties }
