function remove(array: any[], item: any): any {
    if (!array) return null
    let index = findIndex(array, item)
    if (index != -1) return array.splice(index, 1)[0]
    return null
}

function removeByCondition(array: any[], condition: (item: any) => boolean): void {
    if (!array) return null
    for (let i = array.length - 1; i >= 0; i--) {
        if (condition(array[i])) {
            array.splice(i, 1)
        }
    }
}

function findIndex(array: any[], item: any): number {
    for (let i = 0, l = array.length; i < l; i++) {
        if (item === array[i]) {
            return i
        }
    }
    return -1
}

function contain(array: any[], item: any): boolean {
    return findIndex(array, item) !== -1
}

function itemEqual(arr1: any[], arr2: any[]): boolean {
    if (!arr1 && !arr2) return true
    if (arr1 === arr2) return true
    if ((!arr1 && arr2) || (arr1 && !arr2)) return false
    if (arr1.length != arr2.length) return false
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false
    }
    return true
}

export default {
    remove, findIndex, contain, itemEqual, removeByCondition
}
