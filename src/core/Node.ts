import EventTarget from "./EventTarget"
import ArrayUtils from "../engine/utils/ArrayUtils"

export default class Node extends EventTarget {
    static $IgnoreRemoveEvents: boolean = false

    __alive__: boolean
    children: Node[]
    parentNode: Node | null
    disabledSortChildren: boolean
    canvas?: HTMLCanvasElement

    constructor() {
        super()
        this.__alive__ = true
        this.children = []
        this.disabledSortChildren = false
        this.parentNode = null
    }

    bubble(type: string, data?: any) {
        this.bubbleEvent(type, {type, bubble: true, target: this, data})
    }

    //冒泡在这里写的原因是在EventTarget里没有节点关系概念
    bubbleEvent(type: string, event: any) {
        let node: Node | null = this
        while (node) {
            event.currentTarget = node
            let handlers = node.handlers[type]
            if (handlers) {
                for (let i = 0, l = handlers.length; i < l; i++) {
                    let handler = handlers[i]
                    try {
                        handler.callback(event)
                    } catch (err) {
                        console.error(err)
                    }
                    if (handler.once) {
                        handlers.splice(i, 1)
                        i--
                        l--
                    }
                }
            }
            if (!event.bubble) return
            node = node.parentNode
        }
    }

    get prevSibling(): Node | null {
        if(!this.parentNode) return null
        let index = this.parentNode.children.indexOf(this)
        return this.parentNode.children[index-1] || null
    }

    get nextSibling(): Node | null {
        if(!this.parentNode) return null
        let index = this.parentNode.children.indexOf(this)
        return this.parentNode.children[index+1] || null
    }

    get firstChild(): Node | null {
        return this.children[0] || null
    }

    get lastChild(): Node | null {
        return this.children[this.children.length - 1] || null
    }

    sortChildren() {

    }

    addChild(...elements: Node[]) {
        for (let element of elements) {
            if (element.parentNode === this &&
                this.children[this.children.length - 1] === element) continue
            let sameParent = element.parentNode === this
            Node.$IgnoreRemoveEvents = true
            element.remove()
            Node.$IgnoreRemoveEvents = false
            this.children.push(element)

            let beforeStatus = !!element.parentNode
            element.parentNode = this
            this.fire('childNodeAdd', element)
            if (!beforeStatus) {
                element.fire('nodeStatusChange', true)
            }
            if (!sameParent) element.fire('parentResize')
        }
        this.sortChildren()
    }

    insertChild(index: number, ...elements: Node[]) {
        for (let element of elements) {
            if (element.parentNode === this) {
                ArrayUtils.remove(this.children, element)
            }

            let sameParent = element.parentNode === this

            Node.$IgnoreRemoveEvents = true
            element.remove()
            Node.$IgnoreRemoveEvents = false
            this.children.splice(index++, 0, element)

            let beforeStatus = !!element.parentNode
            element.parentNode = this
            this.fire('childNodeAdd', element)
            if (!beforeStatus) {
                element.fire('nodeStatusChange', true)
            }
            if (!sameParent) element.fire('parentResize')
        }
        this.sortChildren()
    }

    removeChild(...elements: Node[]) {
        for (let element of elements) {
            if (element.parentNode !== this) continue
            for (let i = 0, l = this.children.length; i < l; i++) {
                if (this.children[i] === element) {
                    this.children.splice(i, 1)
                    element.parentNode = null
                    if (!Node.$IgnoreRemoveEvents) {
                        element.fire('nodeStatusChange', false)
                    }
                    break
                }
            }
        }
        this.sortChildren()
    }

    replaceChild(currentNode: Node, newNode: Node) {
        for (let i = 0, l = this.children.length; i < l; i++) {
            if (this.children[i] === currentNode) {
                this.children.splice(i, 1, newNode)
                currentNode.parentNode = null
                let isEmptyParent = !newNode.parentNode
                if (newNode.parentNode !== this) {
                    newNode.parentNode = this
                    newNode.fire('parentResize')
                }
                if (!Node.$IgnoreRemoveEvents) {
                    newNode.fire('nodeStatusChange', isEmptyParent)
                    currentNode.fire('nodeStatusChange', false)
                }
                break
            }
        }
    }

    //将自身从父节点移除
    remove() {
        if (this.parentNode) this.parentNode.removeChild(this)
    }

    traverse(callback: (node: Node) => void) {
        callback(this)
        for (let child of this.children) {
            child.traverse(callback)
        }
    }

    destroy() {
        this.__alive__ = false
        this.fire('destroy')

        for (let i = this.children.length - 1; i >= 0; i--) {
            let child = this.children[i]
            try {
                child.destroy()
            } catch (err) {
                console.error(err)
            }
        }

        this.children.length = 0
        if (this.canvas) {
            this.canvas.width = 0
            this.canvas.height = 0
        }
        for (let key in this) {
            delete this[key]
        }
    }

    clear(fromIndex: number = 0) {
        for (let i = this.children.length - 1; i >= fromIndex; i--) {
            let child = this.children[i]
            try {
                child.destroy()
            } catch (err) {
                console.error(err)
            }
        }
        this.children.splice(fromIndex, this.children.length - fromIndex)
        this.updateSelf()
    }

    updateSelf() {}
}
