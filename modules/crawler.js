const fetch = require('node-fetch');
const ProxyAgent = require('simple-proxy-agent');
const { onion } = require('../config.json');
const link_pattern = /((https?:)(\/\/)([\w]*)\.onion)/gmi;
const meta_title_pattern = /<title>.*<\/title>/gmi;

exports.pullWebsite = async function (link){

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

exports.crunchDataFromHtml = function (dom){
    if(typeof dom != 'string') throw new Error(`Data submited to parser is not of the type string, but ${typeof dom}`);
    let links=[];
    let title = dom.match(meta_title_pattern);
    title = (title.length==0) ? "no title found" : title[0];
    for(const link of dom.matchAll(link_pattern)){
        if(links.indexOf(link[0])==-1) links.push(link[0]);
    }
    return {links: links, title: title}
}



