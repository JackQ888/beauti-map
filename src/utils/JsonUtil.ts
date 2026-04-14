const JsonUtil = {
    loadJson(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let requestURL = url
            let request = new XMLHttpRequest()
            request.open('GET', requestURL)
            request.responseType = 'text'
            request.send()

            request.onload = function () {
                if (request.readyState === 4) {
                    if (request.status === 200) {
                        try {
                            resolve(JSON.parse(request.response))
                        } catch (e) {
                            console.error("json转换失败:" + url)
                            reject("json转换失败:" + url)
                        }
                    } else {
                        reject("request failed:" + url)
                    }
                }
            }
        })
    }
}

export default JsonUtil
