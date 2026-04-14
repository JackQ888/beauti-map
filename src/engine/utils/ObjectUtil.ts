function deepAssign(target: any, source: any): any {
  if (!source) return target
  for (let key in source) {
    if (!source.hasOwnProperty(key)) continue
    let sourceValue: any = source[key]
    let targetValue: any = target[key]
    if (sourceValue !== undefined && targetValue !== undefined) {
      if (typeof (sourceValue) === 'object' && typeof (targetValue) === 'object') {
        if (sourceValue === null || targetValue === null) {
          target[key] = sourceValue
        } else if (sourceValue instanceof Array && targetValue instanceof Array) {
          for (let i = 0, l = sourceValue.length; i < l; i++) {
            let tv: any = targetValue[i]
            let sv: any = sourceValue[i]
            if (!tv || !sv) {
              targetValue[i] = deepClone(sv)
            } else {
              deepAssign(tv, sv)
            }
          }
          targetValue.splice(sourceValue.length, targetValue.length - sourceValue.length)
        }
        else {
          deepAssign(targetValue, sourceValue)
        }
      } else {
        target[key] = sourceValue
      }
    } else {
      target[key] = sourceValue
    }
  }
  return target
}

function deepClone(data: any): any {
  if (!(data instanceof Object) || (typeof data == "function")) {
    return data;
  }
  let constructor = data.constructor
  let result = new constructor()

  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      result[key] = deepClone(data[key])
    }
  }
  return result
}

function setProps(target: any, source: any): any {
  if (!source) return target
  for (let key in source) {
    if (!source.hasOwnProperty(key)) continue
    let sourceValue: any = source[key]
    let targetValue: any = target[key]
    if (sourceValue !== undefined && targetValue !== undefined) {
      if (typeof (sourceValue) === 'object' && typeof (targetValue) === 'object') {
        if (sourceValue === null || targetValue === null) {
          target[key] = sourceValue
        } else if (sourceValue instanceof Array && targetValue instanceof Array) {
          target[key] = sourceValue
        } else {
          deepAssign(targetValue, sourceValue)
        }
      } else {
        target[key] = sourceValue
      }
    } else {
      target[key] = sourceValue
    }
  }
  return target
}


export default { deepAssign, deepClone, setProps }
