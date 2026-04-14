/**
 * 散点图示例 - Scatter + Section + 倒影 + 底图背景
 */
import MapData from '../core/data/MapData'
import FilterMapData from '../core/data/FilterMapData'
import JsonUtil from '../utils/JsonUtil'
import AnimationUtil from '../engine/animation/AnimationUtil'

const PATH = '/geoJson/'

export default {
    name: '散点图',
    description: 'Scatter 散点 + 切面倒影',
    async setup(map: any) {
        const [geoJson, boundaryGeoJson, scatterJson] = await Promise.all([
            JsonUtil.loadJson("/geoJson/100000.json"),
            JsonUtil.loadJson("/geoJson/100000_boundary.json"),
            JsonUtil.loadJson('/assets/ChinaScatter.json')
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

        // Section - 切面 + 倒影
        let section = map.createChild('Section')
        section.setProps({
            color: [[0.3, '#4bc4be'], [0.5, '#235959'], [1, '#40d555']],
            thickness: 50,
            reflection: { enable: true, opacity: 0.7, blur: 0.2 }
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

        // Scatter
        let scatter = map.createChild('Scatter')
        scatter.$cursor = 'pointer'
        scatter.setProps({ blur: 0.8, lighter: true })
        let datas: any[] = []
        for (let item of scatterJson) {
            datas.push({ lng: item[0], lat: item[1], size: 18, blur: 1, breath: 0, color: [0.5, 0.5, 0.1, 1] })
        }
        scatter.height = 50
        scatter.setData(datas)

        map.addChild(txtPanel, circlePanel2, gridPanel, trace, circlePanel, section, backgroundArea,
            boundary, effectLight, hoverSection, hoverArea, hoverBoundary, scatter)

        // 设置数据
        const hoverMapData = new FilterMapData(mapData)
        hoverMapData.setDataFilter(() => false)

        map.setMapData(mapData)
        backgroundArea.setMapData(mapData)
        scatter.setMapData(mapData)
        gridPanel.setMapData(boundaryData)
        circlePanel.setMapData(boundaryData)
        trace.setMapData(boundaryData)
        section.setMapData(boundaryData)
        boundary.setMapData(boundaryData)
        effectLight.setMapData(boundaryData)

        hoverArea.setMapData(hoverMapData)
        hoverBoundary.setMapData(hoverMapData)
        hoverSection.setMapData(hoverMapData)

        // 下钻交互
        backgroundArea.on('areaClick', async (area: any) => {
            mapData.setData(await JsonUtil.loadJson(PATH + area.properties.adcode + '.json'))
            boundaryData.setData(await JsonUtil.loadJson(PATH + area.properties.adcode + '_boundary.json'))
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
