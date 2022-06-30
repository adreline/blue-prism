const fetch = require('node-fetch');
const ProxyAgent = require('simple-proxy-agent');
const { onion, settings } = require('../config.json');



async function pullWebsite(link){
    try{
        const response = await fetch(link, {
            agent: new ProxyAgent(`socks5://${onion.host}:${onion.port}`, {
                tunnel: true,
                timeout: onion.connectionTimeout,
            }),
            headers: {'User-Agent': settings.identity}
        });
        if(!response.ok) throw new Error('404 or 500');
        return await response.text();
    }catch(e){
        throw e;
    }
}





exports.pullWebsite = pullWebsite;
