const {URL} = require('url')
const {send, json} = require('micro')
const scrape = require('html-metadata')

const getProperty = (object, properties) => {
    const property = properties.shift()

    if (!object[property]) {
        return undefined
    }

    return properties.length > 0
        ? getProperty(object[property], properties)
        : object[property]
}

const getKeywords = metadata => {
    let keywords = getProperty(metadata, ['jsonLd', 'keywords'])

    if (keywords) {
        if (!Array.isArray(keywords)) {
            keywords = keywords.split(',')
        }

        return keywords.map(keyword => keyword.trim())
    }

    return []
}

const getIcon = (url, iconHref) => {
    try {
        // Will throw an error if icon href is not a valid URL
        new URL(iconHref)

        return iconHref
    } catch (exception) {
        const resolvedUrl = new URL(url)
        const protocol = resolvedUrl.protocol
        const hostname = resolvedUrl.hostname

        if (iconHref.startsWith('/')) {
            iconHref = iconHref.substr(1)
        }

        return `${protocol}//${hostname}/${iconHref}`
    }
}

const getSiteName = metadata =>
    getProperty(metadata, ['openGraph', 'site_name']) || ''

const getCover = metadata =>
    getProperty(metadata, ['openGraph', 'image', 'url']) || ''

const getEmbedUrl = metadata =>
    getProperty(metadata, ['twitter', 'player', 'url']) || ''

module.exports = async (request, response) => {
    if ('POST' !== request.method) {
        send(response, 405)
        return
    }

    const {url} = await json(request)
    const data = {}

    await scrape(url)
        .then(metadata => {
            const {title, description, icons} = metadata['general']

            data.title = title
            data.description = description
            data.keywords = getKeywords(metadata)
            data.icon = getIcon(url, icons[0].href)
            data.site = getSiteName(metadata)
            data.cover = getCover(metadata)
            data.embedUrl = getEmbedUrl(metadata)
        })
        .catch(error => console.log(error))

    response.setHeader('Access-Control-Allow-Origin', '*')

    send(response, 200, data)
}
