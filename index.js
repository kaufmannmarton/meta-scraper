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
        const hostname = new URL(url).hostname

        if (!iconHref.startsWith('/')) {
            return `${hostname}/${iconHref}`
        }

        return hostname + iconHref
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

    send(response, 200, data)
}
