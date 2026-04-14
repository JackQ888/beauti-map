/**
 * 柱状图飞线 - 默认首页示例
 */
import MapData from '../core/data/MapData'
import FilterMapData from '../core/data/FilterMapData'
import JsonUtil from '../utils/JsonUtil'
import AnimationUtil from '../engine/animation/AnimationUtil'
import { onDrillDown } from '../main'

const PATH = '/geoJson/'

export default {
    name: '柱状图飞线',
    description: 'Bar + FlyLine + Point + PanelText',
    async setup(map: any) {
        const [geoJson, boundaryGeoJson] = await Promise.all([
            JsonUtil.loadJson(PATH + '100000.json'),
            JsonUtil.loadJson(PATH + '100000_boundary.json')
        ])

        const mapData = new MapData(geoJson, 'Mercator')
        const boundaryData = new MapData(boundaryGeoJson, 'Mercator')
        const HEIGHT = 50

        // TexturePanel - 文字纹理底图
        let txtPanel = map.createChild('TexturePanel')
        txtPanel.setProps({ radius: 1.5, url: '/assets/txt.png', duration: -1, opacity: 0.3 })

        // TexturePanel - 圆圈背景底座
        let circleBasePanel = map.createChild('TexturePanel')
        circleBasePanel.setProps({ radius: 1, url: '/assets/circle1.png', duration: 30000, blur: 2, opacity: 0.1 })

        // GridPanel
        let gridPanel = map.createChild('GridPanel')
        gridPanel.setProps({
            number: 30,
            line: { enable: true, color: 'rgba(120,120,140,0.2)' },
            point: { enable: true, color: '#51b4c2' }
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
            border: { color: '#45bfbf' },
            background: { color: 'rgba(34,55,55,0.1)', texture: { enable: false } }
        })
        backgroundArea.height = HEIGHT

        // Section - 增强倒影
        let section = map.createChild('Section')
        section.setProps({
            color: [[0, '#5ff'], [0.3, 'rgba(0,0,0,0.5)'], [1, '#0092ff']],
            thickness: HEIGHT,
            reflection: { enable: true, scale: 2, blur: 1, opacity: 0.8 }
        })
        section.height = HEIGHT

        // Boundary - 虚线边框
        let boundary = map.createChild('Boundary')
        boundary.setProps({
            color: '#5ff', lineWidth: 2, lineStyle: 'solid',
            shadow: { enable: true, shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 10, shadowColor: '#fff' },
            insetShadow: { enable: true, shadowBlur: 100, shadowColor: '#00cfff' }
        })
        boundary.height = HEIGHT

        // EffectLight
        let effectLight = map.createChild('EffectLight')
        effectLight.setProps({
            color: '#ffaa33', lineWidth: 50, lightNumber: 3, lightLength: 0.5, duration: 2000, ease: 'linear'
        })
        effectLight.height = HEIGHT

        // Hover 组件
        let hoverArea = map.createChild('BackgroundArea')
        hoverArea.$ignoreEvent = true
        hoverArea.setProps({
            border: { color: '#ffc400' },
            background: { color: 'rgba(255,242,0,0.15)' }
        })
        hoverArea.height = HEIGHT

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
        hoverSection.height = HEIGHT

        // PanelText - 渐变文字
        let panelText = map.createChild('PanelText')
        panelText.setProps({
            text: {
                font: { fontSize: 14, fontStyle: 'normal', fontWeight: 'normal', fontFamily: 'DingTalk', color: '#ffcf0f' },
                shadow: { enable: true, shadowBlur: 4, shadowColor: '#000', shadowOffsetX: -5, shadowOffsetY: 8 }
            }
        })
        panelText.height = HEIGHT

        // Bar
        let bar = map.createChild('Bar')
        bar.setData([
            { point: '650000', height: 150, radius: 16, topColor: '#ff4949', bottomColor: '#fff', splitNum: 40 },
            { point: '150000', height: 120, radius: 16, topColor: '#8dff00', bottomColor: '#fff', splitNum: 5 },
            { point: '640000', height: 70, radius: 16, topColor: '#ff0', bottomColor: '#ff7300', splitNum: 4 },
            { point: '330000', height: 50, radius: 16, topColor: '#afc', bottomColor: '#fff', splitNum: 40 },
            { point: '630000', height: 50, radius: 16, topColor: 'rgb(29,162,220)', bottomColor: 'rgb(0,255,174)', splitNum: 40 }
        ])
        bar.height = HEIGHT

        // Point
        let point = map.createChild('Point')
        point.setData([
            { point: '650000', radius: 100, color: '#fff' },
            { point: '150000', radius: 100, color: '#aff' },
            { point: '630000', radius: 100, color: '#02BD87' },
            { point: '330000', radius: 100, color: '#fff' },
            { point: '640000', radius: 100, color: '#FFAF19' }
        ])
        point.height = HEIGHT

        // FlyLine
        let fly = map.createChild('FlyLine')
        fly.$cursor = 'pointer'
        fly.height = HEIGHT
        fly.setData([
            { start: '330000', end: '650000', tension: 0.5, radius: 2, lineColor: 'rgba(255,255,0,0.2)', lightColor: '#ff0' },
            { start: '330000', end: '640000', tension: 0.6, radius: 2, lineColor: 'rgba(220,220,220,0.5)', lightColor: '#fff' }
        ])

        map.addChild(txtPanel, gridPanel, trace, circlePanel, section, backgroundArea,
            boundary, effectLight, circleBasePanel, panelText, hoverSection, hoverArea, hoverBoundary, point, bar, fly)

        // 设置数据
        const hoverMapData = new FilterMapData(mapData)
        hoverMapData.setDataFilter(() => false)

        map.setMapData(mapData)
        panelText.setMapData(mapData)
        txtPanel.setMapData(boundaryData)
        circleBasePanel.setMapData(boundaryData)
        gridPanel.setMapData(boundaryData)
        circlePanel.setMapData(boundaryData)
        trace.setMapData(boundaryData)
        section.setMapData(boundaryData)
        backgroundArea.setMapData(mapData)
        boundary.setMapData(boundaryData)
        effectLight.setMapData(boundaryData)
        point.setMapData(mapData)
        fly.setMapData(mapData)
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
