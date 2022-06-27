const fetch = require('node-fetch');
const ProxyAgent = require('simple-proxy-agent');
const { onion } = require('../config.json');



async function pullWebsite(link){
    try{
        const response = await fetch(link, {
            agent: new ProxyAgent(`socks5://${onion.host}:${onion.port}`, {
                tunnel: true,
                timeout: onion.connectionTimeout,
            })
        });
        return await response.text();
    }catch(e){
        throw e;
    }
}





exports.pullWebsite = pullWebsite;
