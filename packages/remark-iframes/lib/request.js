import fetch from 'node-fetch'
import { sanitizeUri } from 'micromark-util-sanitize-uri'

const protocolIframe = /^https?$/i

export default function embedRequest (iframeUrl, providers) {
  // Make a list of valid domains
  const validDomains = Object.entries(providers)
    .filter(d => d[1].disabled === false)
    .map(d => d[0])

  // Check if URL is valid and matches a domain
  const checkedUrl = urlChecker(iframeUrl)
  if (!checkedUrl) return

  const provider = providers[checkedUrl.host]
  if (!provider) return

  // Two possible cases: oembed or not
  if (provider.oembed) {
    const reqUrl = new URL(provider.oembed)
    reqUrl.searchParams.append('format', 'json')
    reqUrl.searchParams.append('url', checkedUrl.url)

    return fetch(reqUrl.toString(), { timeout: 1500 })
      .then(res => res.json())
      .then(oembedRes => {
        const oembedUrl = oembedRes.html.match(/src="(.+?)"/)[1]
        const oembedThumbnail = oembedRes.thumbnail_url

        return {
          url: oembedUrl,
          thumbnail: oembedThumbnail,
          width: provider.width || oembedRes.width,
          height: provider.height || oembedRes.height
        }
      })
  }

  // If oembed wasn't provided
  return new Promise(resolve => {
    resolve({
      url: computeFinalUrl(provider, checkedUrl.url),
      thumbnail: computeThumbnail(provider, checkedUrl.url),
      width: provider.width,
      height: provider.height
    })
  })

  function urlChecker (url) {
    const sanitizedUrl = sanitizeUri(url, protocolIframe)

    try {
      const parsedUrl = new URL(sanitizedUrl)

      if (validDomains.includes(parsedUrl.hostname)) {
        return { url: sanitizedUrl, host: parsedUrl.hostname }
      }
    } catch (e) {}
  }
}

function computeFinalUrl (provider, url) {
  let finalUrl = url
  let parsed = new URL(finalUrl)

  if (provider.droppedQueryParameters && parsed.search) {
    const search = new URLSearchParams(parsed.search)
    provider.droppedQueryParameters.forEach(ignored => search.delete(ignored))
    parsed.search = search.toString()
    finalUrl = parsed.toString()
  }

  if (provider.replace && provider.replace.length) {
    provider.replace.forEach((rule) => {
      const [from, to] = rule
      if (from && to) finalUrl = finalUrl.replace(from, to)
      parsed = new URL(finalUrl)
    })
    finalUrl = parsed.toString()
  }

  if (provider.removeFileName) {
    parsed.pathname = parsed.pathname.substring(0, parsed.pathname.lastIndexOf('/'))
    finalUrl = parsed.toString()
  }

  if (provider.removeAfter && finalUrl.includes(provider.removeAfter)) {
    finalUrl = finalUrl.substring(0, finalUrl.indexOf(provider.removeAfter))
  }

  if (provider.append) {
    finalUrl += provider.append
  }

  return finalUrl
}

function computeThumbnail (provider, url) {
  let thumbnailURL = ''
  const thumbnailConfig = provider.thumbnail

  if (thumbnailConfig && thumbnailConfig.format) {
    thumbnailURL = thumbnailConfig.format

    Object
      .keys(thumbnailConfig)
      .filter((key) => key !== 'format')
      .forEach((key) => {
        const search = new RegExp(`{${key}}`, 'g')
        const replace = new RegExp(thumbnailConfig[key]).exec(url)
        if (replace) thumbnailURL = thumbnailURL.replace(search, replace[1])
      })
  }

  return thumbnailURL
}
