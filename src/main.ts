/**
 * Example 编排器 - 菜单切换多示例
 */
import { Map3D } from './index'
import barExample from './examples/bar'
import baseExample from './examples/base'
import scatterExample from './examples/scatter'
import thermoExample from './examples/thermo'
import pointExample from './examples/point'
import spriteTextExample from './examples/spriteText'
import symbolExample from './examples/symbol'

const examples = [
    barExample,
    baseExample,
    scatterExample,
    thermoExample,
    pointExample,
    spriteTextExample,
    symbolExample
]

let currentMap: any = null
let currentIndex: number = -1
let switching = false
let currentBackFn: (() => void) | null = null

/** 注入菜单 CSS */
function injectStyles() {
    const style = document.createElement('style')
    style.textContent = `
        #sidebar {
            width: 200px;
            min-width: 200px;
            height: 100vh;
            background: rgba(10, 10, 10, 0.92);
            border-right: 1px solid rgba(255,255,255,0.08);
            display: flex;
            flex-direction: column;
            user-select: none;
        }
        #sidebar .header {
            padding: 20px 16px 12px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        #sidebar .header h2 {
            font-size: 16px;
            font-weight: 600;
            color: #00ffae;
            margin: 0;
            letter-spacing: 1px;
        }
        #sidebar .header p {
            font-size: 11px;
            color: rgba(255,255,255,0.35);
            margin: 4px 0 0;
        }
        #sidebar .menu {
            flex: 1;
            overflow-y: auto;
            padding: 8px 0;
        }
        #sidebar .menu-item {
            display: flex;
            flex-direction: column;
            padding: 12px 16px;
            cursor: pointer;
            border-left: 3px solid transparent;
            transition: all 0.2s ease;
        }
        #sidebar .menu-item:hover {
            background: rgba(255,255,255,0.04);
        }
        #sidebar .menu-item.active {
            background: rgba(0,255,174,0.06);
            border-left-color: #00ffae;
        }
        #sidebar .menu-item .name {
            font-size: 13px;
            color: rgba(255,255,255,0.8);
            font-weight: 500;
        }
        #sidebar .menu-item.active .name {
            color: #fff;
        }
        #sidebar .menu-item .desc {
            font-size: 11px;
            color: rgba(255,255,255,0.3);
            margin-top: 2px;
        }
        #sidebar .menu-item.active .desc {
            color: rgba(0,255,174,0.6);
        }
        #back-btn {
            display: none;
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 10;
            padding: 8px 16px;
            background: rgba(0,0,0,0.7);
            border: 1px solid rgba(0,255,174,0.4);
            border-radius: 4px;
            color: #00ffae;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            backdrop-filter: blur(4px);
        }
        #back-btn:hover {
            background: rgba(0,255,174,0.25);
        }
        #map-container {
            flex: 1;
            height: 100vh;
            position: relative;
        }
        #map-container .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: rgba(255,255,255,0.4);
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
    `
    document.head.appendChild(style)
}

/** 构建菜单 HTML */
function buildMenu(): HTMLElement {
    const sidebar = document.createElement('div')
    sidebar.id = 'sidebar'

    const header = document.createElement('div')
    header.className = 'header'
    header.innerHTML = '<h2>EXAMPLES</h2><p>mapComponent 组件示例</p>'
    sidebar.appendChild(header)

    const menu = document.createElement('div')
    menu.className = 'menu'

    examples.forEach((example, index) => {
        const item = document.createElement('div')
        item.className = 'menu-item'
        item.innerHTML = `<span class="name">${example.name}</span><span class="desc">${example.description}</span>`
        item.addEventListener('click', () => switchExample(index))
        menu.appendChild(item)
    })

    sidebar.appendChild(menu)
    return sidebar
}

/** 创建返回按钮（附加到 map-container） */
function createBackBtn() {
    const container = document.getElementById('map-container')!
    const backBtn = document.createElement('div')
    backBtn.id = 'back-btn'
    backBtn.textContent = '← 返回全国'
    backBtn.addEventListener('click', () => {
        if (currentBackFn) {
            currentBackFn()
            backBtn.style.display = 'none'
            currentBackFn = null
        }
    })
    container.appendChild(backBtn)
}

/** 注册返回回调（由 example 调用） */
export function onDrillDown(backFn: () => void) {
    currentBackFn = backFn
    const backBtn = document.getElementById('back-btn')
    if (backBtn) backBtn.style.display = 'block'
}

/** 切换 Example */
async function switchExample(index: number) {
    if (index === currentIndex || switching) return
    switching = true

    // 清除返回按钮
    currentBackFn = null
    const backBtn = document.getElementById('back-btn')
    if (backBtn) backBtn.style.display = 'none'

    // 更新菜单选中态
    const items = document.querySelectorAll('#sidebar .menu-item')
    items.forEach((el, i) => {
        el.classList.toggle('active', i === index)
    })

    // 显示加载提示
    const container = document.getElementById('map-container')!
    const loading = document.createElement('div')
    loading.className = 'loading'
    loading.textContent = '加载中...'
    container.appendChild(loading)

    // 销毁旧地图
    if (currentMap) {
        currentMap.destroy()
        currentMap = null
    }

    currentIndex = index

    // 创建新地图
    currentMap = new Map3D({ el: container })

    // 执行 example setup
    try {
        await examples[index].setup(currentMap)
    } catch (e) {
        console.error(`Example "${examples[index].name}" 加载失败:`, e)
    }

    // 移除加载提示
    if (loading.parentNode) loading.parentNode.removeChild(loading)

    switching = false
}

// 启动
function main() {
    const app = document.getElementById('app')!
    injectStyles()
    app.insertBefore(buildMenu(), app.firstChild)
    createBackBtn()
    switchExample(0)
}

main()
