/**
 * 综合示例 - GridPanel, Trace, BackgroundArea, Section,
 * CirclePanel, Boundary, EffectLight, Scatter, Bar, AreaText + 悬停交互
 */
import MapData from '../core/data/MapData'
import FilterMapData from '../core/data/FilterMapData'
import JsonUtil from '../utils/JsonUtil'
import AnimationUtil from '../engine/animation/AnimationUtil'
import { onDrillDown } from '../main'

const PATH = '/geoJson/'

export default {
    name: '散点柱状图',
    description: '散点 + 柱状图 + 悬停交互',
    async setup(map: any) {
        const [geoJson, boundaryGeoJson, scatterJson] = await Promise.all([
            JsonUtil.loadJson(PATH + '100000.json'),
            JsonUtil.loadJson(PATH + '100000_boundary.json'),
            JsonUtil.loadJson('/assets/ChinaScatter.json')
        ])

        const mapData = new MapData(geoJson, 'Mercator')
        const boundaryData = new MapData(boundaryGeoJson, 'Mercator')

        // TexturePanel
        let txtPanel = map.createChild('TexturePanel')
        txtPanel.setProps({ radius: 1.5, url: '/assets/txt.png', duration: -1, opacity: 0.3 })
        let circlePanel2 = map.createChild('TexturePanel')
        circlePanel2.setProps({ radius: 1.5, url: '/assets/circle.png', duration: 30000, blur: 0, opacity: 1 })

        // GridPanel
        let gridPanel = map.createChild('GridPanel')
        gridPanel.setProps({
            number: 50,
            line: { enable: true, color: 'rgba(155,155,155,0.6)' },
            point: { enable: true, color: '#acc' }
        })

        let trace = map.createChild('Trace')
        let circlePanel = map.createChild('CirclePanel')
        circlePanel.setProps({ number: 50 })

        // BackgroundArea
        let backgroundArea = map.createChild('BackgroundArea')
        backgroundArea.$cursor = 'pointer'
        backgroundArea.setProps({
            border: { color: '#ccc' },
            background: { color: '#1a3a4a' }
        })
        backgroundArea.height = 50

        // Section
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
        hoverArea.setProps({ border: { color: '#ffc400' }, background: { color: 'rgba(255,242,0,0.15)' } })
        hoverArea.height = 50

        let hoverBoundary = map.createChild('Boundary')
        hoverBoundary.setProps({
            color: '#FF0', lineWidth: 2,
            shadow: { enable: true, shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 10, shadowColor: '#FF0' },
            insetShadow: { enable: true, shadowBlur: 80, shadowColor: '#Fa0' }
        })

        let hoverSection = map.createChild('Section')
        hoverSection.setProps({ effect: 0.5, color: [[0, 'rgba(255,242,0,0.4)'], [1, 'rgba(210,131,5,0.4)']], thickness: 0 })
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

        // Scatter
        let scatter = map.createChild('Scatter')
        scatter.$cursor = 'pointer'
        scatter.setProps({})
        let scatterData: any[] = []
        for (let item of scatterJson) {
            scatterData.push({ lng: item[0], lat: item[1], size: 4 })
        }
        scatter.height = 50
        scatter.setData(scatterData)

        // Bar
        let bar = map.createChild('Bar')
        bar.setData([
            { point: '650000', height: 150, radius: 16, topColor: '#ff4949', bottomColor: '#fff', splitNum: 4 },
            { point: '150000', height: 120, radius: 16, topColor: '#8dff00', bottomColor: '#fff', splitNum: 20 },
            { point: '640000', height: 70, radius: 16, topColor: '#ff7300', bottomColor: '#fff', splitNum: 10 },
            { point: '620000', height: 50, radius: 16, topColor: '#00ffae', bottomColor: '#fff', splitNum: 6 }
        ])
        bar.height = 50

        map.addChild(txtPanel, circlePanel2, gridPanel, trace, circlePanel, section, backgroundArea, boundary,
            effectLight, hoverSection, hoverArea, hoverBoundary, areaText, scatter, bar)

        // 设置数据
        const hoverMapData = new FilterMapData(mapData)
        hoverMapData.setDataFilter(() => false)

        map.setMapData(mapData)
        areaText.setMapData(mapData)
        txtPanel.setMapData(boundaryData)
        circlePanel2.setMapData(boundaryData)
        gridPanel.setMapData(boundaryData)
        circlePanel.setMapData(boundaryData)
        trace.setMapData(boundaryData)
        section.setMapData(boundaryData)
        backgroundArea.setMapData(mapData)
        boundary.setMapData(boundaryData)
        effectLight.setMapData(boundaryData)
        scatter.setMapData(boundaryData)
        bar.setMapData(mapData)
        bar.setClipMapData(boundaryData)

        hoverArea.setMapData(hoverMapData)
        hoverBoundary.setMapData(hoverMapData)
        hoverSection.setMapData(hoverMapData)

        // 下钻交互
        backgroundArea.on('areaClick', async (area: any) => {
            mapData.setData(await JsonUtil.loadJson(PATH + area.properties.adcode + '.json'))
            boundaryData.setData(await JsonUtil.loadJson(PATH + area.properties.adcode + '_boundary.json'))
            onDrillDown(async () => {
                mapData.setData(await JsonUtil.loadJson(PATH + '100000.json'))
                boundaryData.setData(await JsonUtil.loadJson(PATH + '100000_boundary.json'))
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
