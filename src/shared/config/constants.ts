export let host: string = `${document.location.protocol.slice(0, -1)}://${document.location.host.split(':')[0]}`

if (document.location.host.split(':')[1]) {
    if (document.location.host.split(':')[1] !== '3000')
        host += ':7788'
    else
        host += ':8000'
} else
    host += ''