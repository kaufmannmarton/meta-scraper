const {URL} = require('url')
const {send, json} = require('micro')
const scrape = require('html-metadata')

const getKeywords = metadata => {
    if (metadata['jsonLd'] && metadata['jsonLd']['keywords']) {
        return metadata['jsonLd']['keywords']
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

module.exports = async (request, response) => {
    if ('POST' !== request.method) {
        send(response, 405)
        return
    }

    const {url} = await json(request)
    const data = {}

    await scrape(url, (error, metadata) => {
        const {title, description, icons} = metadata['general']
        const iconHref = icons[0].href

        data.title = title
        data.description = description
        data.keywords = getKeywords(metadata)
        data.icon = getIcon(url, icons[0].href)
    })

    response.setHeader('Access-Control-Allow-Origin', '*')

    send(response, 200, data)
}
