/**
 * 标记符号示例 - Mark + AreaText
 */
import MapData from '../core/data/MapData'
import FilterMapData from '../core/data/FilterMapData'
import JsonUtil from '../utils/JsonUtil'
import AnimationUtil from '../engine/animation/AnimationUtil'
import { onDrillDown } from '../main'

const PATH = '/geoJson/'

export default {
    name: '标记符号',
    description: 'Mark 标记 + AreaText 区域文字',
    async setup(map: any) {
        const [geoJson, boundaryGeoJson] = await Promise.all([
            JsonUtil.loadJson("/geoJson/100000.json"),
            JsonUtil.loadJson("/geoJson/100000_boundary.json")
        ])

        const mapData = new MapData(geoJson, 'Mercator')
        const boundaryData = new MapData(boundaryGeoJson, 'Mercator')

        // TexturePanel - 文字纹理底图
        let txtPanel = map.createChild('TexturePanel')
        txtPanel.setProps({ radius: 1.5, url: '/assets/txt.png', duration: -1, opacity: 0.3 })

        // TexturePanel - 圆圈底图
        let circlePanel2 = map.createChild('TexturePanel')
        circlePanel2.setProps({ radius: 1.5, url: '/assets/circle.png', duration: 30000, blur: 0, opacity: 1 })

        // GridPanel
        let gridPanel = map.createChild('GridPanel')
        gridPanel.setProps({
            number: 50,
            line: { enable: true, color: 'rgba(155,155,155,0.6)' },
            point: { enable: true, color: '#acc' }
        })

        // Trace
        let trace = map.createChild('Trace')

        // CirclePanel
        let circlePanel = map.createChild('CirclePanel')
        circlePanel.setProps({ number: 50 })

        // BackgroundArea
        let backgroundArea = map.createChild('BackgroundArea')
        backgroundArea.$cursor = 'pointer'
        backgroundArea.setProps({
            border: { color: '#ccc' },
            background: { color: 'rgba(34,178,130,0.1)' }
        })
        backgroundArea.height = 50

        // Section
        let section = map.createChild('Section')
        section.setProps({
            color: [[0.3, '#4bc4be'], [0.5, '#235959'], [1, '#40d555']],
            thickness: 50,
            reflection: { enable: true, opacity: 0.7 }
        })
        section.height = 50

        // Boundary
        let boundary = map.createChild('Boundary')
        boundary.setProps({
            color: '#fff', lineWidth: 2,
            shadow: { enable: true, shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 10, shadowColor: '#00ffae' },
            insetShadow: { enable: true, shadowBlur: 100, shadowColor: '#00ff78' }
        })
        boundary.height = 50

        // EffectLight
        let effectLight = map.createChild('EffectLight')
        effectLight.setProps({
            color: '#ffaa33', lineWidth: 40, lightNumber: 3, lightLength: 0.5, duration: 2000, ease: 'linear'
        })
        effectLight.height = 50

        // Hover 组件
        let hoverArea = map.createChild('BackgroundArea')
        hoverArea.$ignoreEvent = true
        hoverArea.setProps({
            border: { color: '#ffc400' },
            background: { color: 'rgba(255,242,0,0.15)' }
        })
        hoverArea.height = 50

        let hoverBoundary = map.createChild('Boundary')
        hoverBoundary.setProps({
            color: '#FF0', lineWidth: 2,
            shadow: { enable: true, shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 10, shadowColor: '#FF0' },
            insetShadow: { enable: true, shadowBlur: 80, shadowColor: '#Fa0' }
        })

        let hoverSection = map.createChild('Section')
        hoverSection.setProps({
            effect: 0.5,
            color: [[0, 'rgba(255,242,0,0.4)'], [1, 'rgba(210,131,5,0.4)']],
            thickness: 0
        })
        hoverSection.height = 50

        // AreaText
        let areaText = map.createChild('AreaText')
        areaText.setProps({
            text: {
                align: { vertical: 'middle', horizontal: 'center' },
                font: { fontSize: 12, fontStyle: 'normal', fontWeight: 'normal', fontFamily: 'DingTalk', color: '#fff' },
                shadow: { enable: true, shadowBlur: 5, shadowColor: '#000', shadowOffsetX: 0, shadowOffsetY: 5 }
            },
            backdrop: {
                enable: true, padding: [5, 8], borderRadius: 5,
                image: { enable: false, url: '', opacity: 1 },
                style: {
                    border: { enable: false, color: '#fff', width: 1 },
                    background: { enable: true, color: 'rgba(0,0,0,0.4)', shadow: { enable: true, shadowBlur: 5, shadowColor: '#000', shadowOffsetX: 0, shadowOffsetY: 5 } }
                }
            }
        })
        areaText.height = 50

        // Mark - 使用 canvas 生成标记图片
        const markUrl = createMarkImage('#ff4444')
        const mark2Url = createMarkImage('#44aaff')

        let mark = map.createChild('Mark')
        mark.$cursor = 'pointer'
        mark.setData([
            {
                url: markUrl,
                anchor: [0.5, 0.65],
                marks: [
                    { id: '1', point: '650000', size: 50 },
                    { id: '3', point: '330000', size: 50 }
                ]
            },
            {
                url: mark2Url,
                anchor: [0.5, 0.65],
                marks: [
                    { id: '2', point: '150000', size: 50 },
                    { id: '4', point: '640000', size: 50 }
                ]
            }
        ])
        mark.height = 50

        map.addChild(txtPanel, circlePanel2, gridPanel, trace, circlePanel, section, backgroundArea, boundary,
            effectLight, hoverSection, hoverArea, hoverBoundary, areaText, mark)

        // 设置数据
        const hoverMapData = new FilterMapData(mapData)
        hoverMapData.setDataFilter(() => false)

        map.setMapData(mapData)
        areaText.setMapData(mapData)
        mark.setMapData(mapData)
        gridPanel.setMapData(boundaryData)
        circlePanel.setMapData(boundaryData)
        trace.setMapData(boundaryData)
        section.setMapData(boundaryData)
        backgroundArea.setMapData(mapData)
        boundary.setMapData(boundaryData)
        effectLight.setMapData(boundaryData)

        hoverArea.setMapData(hoverMapData)
        hoverBoundary.setMapData(hoverMapData)
        hoverSection.setMapData(hoverMapData)

        // 下钻交互
        backgroundArea.on('areaClick', async (area: any) => {
            mapData.setData(await JsonUtil.loadJson(PATH + area.properties.adcode + '.json'))
            boundaryData.setData(await JsonUtil.loadJson(PATH + area.properties.adcode + '_boundary.json'))
            onDrillDown(async () => {
                mapData.setData(await JsonUtil.loadJson("/geoJson/100000.json"))
                boundaryData.setData(await JsonUtil.loadJson("/geoJson/100000_boundary.json"))
            })
        })

        // Hover 交互
        backgroundArea.on('areaChange', (area: any) => {
            if (area) {
                hoverMapData.setDataFilter((item: any) => {
                    return item.properties && item.properties.adcode === area.properties.adcode
                })
                hoverArea.height = backgroundArea.height
                hoverSection.height = backgroundArea.height
                hoverBoundary.height = backgroundArea.height
                AnimationUtil.execute({
                    duration: 300,
                    ease: 'cubicOut',
                    update(percent: number) {
                        let h = backgroundArea.height + 20 * percent
                        hoverArea.height = h
                        hoverSection.height = h
                        hoverBoundary.height = h
                        hoverSection.setProps({ thickness: 20 * percent })
                    }
                })
            } else {
                hoverMapData.setDataFilter(() => false)
            }
        })
    }
}

/** 用 canvas 生成简单的标记图钉 PNG */
function createMarkImage(color: string): string {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // 圆形标记
    ctx.beginPath()
    ctx.arc(size / 2, size / 2 - 4, size / 3, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()

    // 中心点
    ctx.beginPath()
    ctx.arc(size / 2, size / 2 - 4, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    // 底部三角
    ctx.beginPath()
    ctx.moveTo(size / 2 - 10, size / 2 + 8)
    ctx.lineTo(size / 2 + 10, size / 2 + 8)
    ctx.lineTo(size / 2, size - 4)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    return canvas.toDataURL()
}
