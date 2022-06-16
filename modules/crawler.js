const fetch = require('node-fetch');
const ProxyAgent = require('simple-proxy-agent');
const { onion } = require('../config.json');
const sanitizeHtml = require('sanitize-html');
function escape(str) {
    return str.replace(/[\b\f\n\r\t\v\0\'\"\\]/g, match => {
      return {
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\v': '\\v',
        '\0': '\\0',
        '\'': '\\\'',
        '\"': '\\\"',
        '\\': '\\\\'
      }[match]
    })
}
const patterns = {
    hyperlink: /((https?:)(\/\/)([\w]*)\.onion)/gmi,
    meta: {
        title: /<title>.*<\/title>/gmi
    },
    content: {
        p: /^<(?:(p[A-Za-z0-9]*)\b[^>]*>(?:.*?)<\/\1>|p[A-Za-z0-9]*\b[^>]*\/>)$/gmi,
        h: /^<(?:(h\d[A-Za-z0-9]*)\b[^>]*>(?:.*?)<\/\1>|h\d[A-Za-z0-9]*\b[^>]*\/>)$/gmi
    }   
}

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

function crunchDataFromHtml(dom){
    if(typeof dom != 'string') throw new Error(`Data submited to parser is not of the type string, but ${typeof dom}`);
    let links=[];
    let title = dom.match(patterns.meta.title);
    title = (title.length==0) ? "no title found" : title[0];
    let headers = "";
    let paragraphs = "";
    for(const header of dom.matchAll(patterns.content.h)){
        headers+=header+"\n";
    }
    for(const paragraph of dom.matchAll(patterns.content.p)){
        paragraphs+=paragraph+"\n";
    }
    const content = `${headers} ${paragraphs}`;
    for(const link of dom.matchAll(patterns.hyperlink)){
        if(links.indexOf(link[0])==-1) links.push(link[0]);
    }
    return {links: links, title: escape(sanitizeHtml(title,{allowedTags: []})), content: escape(sanitizeHtml(content,{allowedTags: []}))}
}


exports.pullWebsite = pullWebsite;
exports.crunchDataFromHtml = crunchDataFromHtml;
exports.escape = escape;
