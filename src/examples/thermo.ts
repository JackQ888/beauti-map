/**
 * 热力图示例 - Thermo
 */
import MapData from '../core/data/MapData'
import JsonUtil from '../utils/JsonUtil'

const PATH = '/geoJson/'

export default {
    name: '热力图',
    description: 'Thermo 热力可视化',
    async setup(map: any) {
        const [geoJson, thermoJson] = await Promise.all([
            JsonUtil.loadJson(PATH + '100000.json'),
            JsonUtil.loadJson('/assets/ChinaThermo.json')
        ])

        const mapData = new MapData(geoJson, 'Mercator')

        // BackgroundArea
        let backgroundArea = map.createChild('BackgroundArea')
        backgroundArea.setProps({
            border: { color: '#ccc' },
            background: { color: 'rgba(0,0,0,0)' }
        })

        // Thermo
        let thermo = map.createChild('Thermo')
        thermo.height = 50
        thermo.setProps({
            pointSize: 50, blur: 0.2, clip: true,
            minValueAlpha: 0.1, maxValueAlpha: 0.5,
            colors: [
                [0, 'rgba(0,60,255,0.8)'],
                [0.3, 'rgba(17,245,197,0.8)'],
                [0.5, 'rgba(248,231,28,0.85)'],
                [0.7, 'rgba(252,177,54,0.85)'],
                [1, 'rgba(255,50,105,0.85)']
            ]
        })
        thermo.setData(thermoJson)

        map.addChild(backgroundArea, thermo)

        map.setMapData(mapData)
        backgroundArea.setMapData(mapData)
        thermo.setMapData(mapData)
    }
}
