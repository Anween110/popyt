import { request as https } from 'https'
import { IncomingMessage, RequestOptions } from 'http'
import { parse as parseUrl } from 'url'

export const request = {
  api: (subUrl: string, params: Object): Promise<any> => {
    let url = 'https://www.googleapis.com/youtube/v3' + (subUrl.startsWith('/') ? subUrl : '/' + subUrl)

    for (let param in params) {
      url += (!url.includes('?') ? '?' : '&') + param + '=' + params[param]
    }

    return get(url)
  }
}

function get (url: string): Promise<any> {
  const options = parseUrlToOptions(url, 'GET')

  return req(options, req => {
    req.on('error', error => {
      throw error
    })

    req.end()
  })
}

function post (url: string, data: any): Promise<any> {
  const options = parseUrlToOptions(url, 'POST')

  return req(options, req => {
    req.on('error', error => {
      throw error
    })

    req.write(data)
    req.end()
  })
}

function put (url: string, data: any): Promise<any> {
  const options = parseUrlToOptions(url, 'PUT')

  return req(options, req => {
    req.on('error', error => {
      throw error
    })

    req.write(data)
    req.end()
  })
}

function parseUrlToOptions (url: string, type: 'POST' | 'PUT' | 'GET'): RequestOptions {
  const parsed = parseUrl(url)

  return {
    hostname: parsed.hostname,
    port: parsed.port ? parsed.port : 443,
    path: parsed.path,
    method: type,
    headers: {
      'Content-Type': 'application/json'
    }
  }
}

function req (options: RequestOptions, reqFunction: Function) {
  return new Promise((resolve, reject) => {
    const cb = (res: IncomingMessage) => {
      let data = ''

      res.setEncoding('utf8')

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        const parsed = JSON.parse(data)

        if (parsed.error) {
          return reject(new Error(parsed.error.message))
        }

        resolve(parsed)
      })

      res.on('error', error => {
        reject(error)
      })
    }

    reqFunction(https(options, cb))
  })
}
