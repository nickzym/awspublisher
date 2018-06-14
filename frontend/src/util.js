let token = null

async function initUrl(target) {
  if (target.rpcUrl) {
    return
  }
  if (!target.url) {
    target.url = await readConfig('rpc', target.service, target.site)
  }
  if (target.url.endsWith('/jsonrpc')) {
    target.url = target.url.slice(0, -8)
  }
  if (target.url.endsWith('/')) {
    target.url = target.url.slice(0, -1)
  }
  target.rpcUrl = target.url + '/jsonrpc'
  target.wsUrl = target.url.replace(/^http/, 'ws') + '/websocket'
}

async function initWebSocket(target) {
  if (target.ws) {
    return
  }
  await initUrl(target)
  target.ws = new WebSocket(target.wsUrl)
  target.handlers = {}
  target.ws.onmessage = function(e) {
    let { event, message } = JSON.parse(e.data)
    target.handlers[event](message)
  }
  await new Promise((resolve, reject) => {
    target.ws.onopen = resolve
    target.ws.onerror = reject
  })
}

function genSub(target) {
  return async function(event, handler) {
    await initWebSocket(target)
    target.handlers[event] = handler
    target.ws.send(event)
  }
}

const proxyHandler = {
  get(target, prop) {
    if (prop === 'then') {
      return null
    }
    if (prop === 'sub') {
      return genSub(target)
    }
    let method = prop
    if (target.method) {
      method = target.method + '.' + method
    }
    return new Proxy(Object.assign(function(){}, target, { method }), proxyHandler)
  },
  async apply(target, thisArg, argumentsList) {
    if (!target.method) {
      return
    }
    await initUrl(target)
    let res = await fetch(target.rpcUrl, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: target.method,
        // FIXME: hotfix for javascript __doc__
        params: argumentsList.length > 0 && argumentsList[0] === 'THIS IS A SECRET STRING TO INVOKE PROPERTY' ? null : [...argumentsList],
        id: null,
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-TS-Auth': token,
      },
      mode: 'cors',
      credentials: 'include',
    })
    if (!res.ok) {
      if (res.status === 401 && target.service !== 'auth') {
        try {
          if (!token) {
            token = (await findRpcService('auth').get_current_user()).token
            if (token) {
              return proxyHandler.apply(target, thisArg, argumentsList)
            }
          }
        } catch (e) {
        }
        window.location.href = await findWebService('auth') + '?redirect=' +
          encodeURIComponent(window.location.href)
      }
      throw res.status + res.statusText
    }
    let json = JSON.parse(await res.text(), (k, v) => {
      if (v && v.__ts_rpc_type === 'datetime') {
        return new Date(v.__ts * 1000)
      }
      return v
    })
    if (json.error) {
      let tb = ''
      if (json.error.data) {
        tb = '\n' + json.error.data.traceback.join('')
      }
      console.error(json.error.message + tb)
      throw json.error
    } else {
      return json.result
    }
  }
}

export function RemoteObject(url, service, site) {
  return new Proxy({ url, service, site }, proxyHandler)
}

let suffix = ''
let match = window.location.hostname.match(/\.[^.]+\.tusimple\.ai$/)
if (match) {
  suffix = match[0]
}
const configPath = '/scratch/brewery/cellar/ts_rpc/devel/data/services.json'
const nonce = '?_ts=' + Date.now()
const config = {}

export const DOMAIN_SUFFIX = suffix

export async function readConfig(cat, name, site='local') {
  await readSiteConfig(site)
  if (!config[site][cat][name]) {
    throw Error(`${site} doesn't have ${cat} service "${name}"`)
  }
  return config[site][cat][name]
}

export async function readSiteConfig(site='local') {
  if (!(site in config)) {
    let server = 'http://nas-web'
    server += site === 'local' ? suffix : `.${site}.tusimple.ai`
    config[site] = await (await fetch(server + configPath + nonce)).json()
  }
  return config[site]
}

export function findRpcService(name, site='local') {
  return RemoteObject(null, name, site)
}

export function findWebService(name, site='local') {
  return readConfig('web', name, site)
}

export function findMiscService(name, site='local') {
  return readConfig('misc', name, site)
}

// backward compatible
export const findService = findRpcService
export const findServiceInfo = findWebService
