const async = require("async");
const url = require('url');
const http = require('http');
const https = require('https');
var bl = require('bl');
const { SocksProxyAgent } = require('socks-proxy-agent');

const link_pattern = /((https?:)(\/\/)([\w]*)\.onion)/gmi;
const meta_title_pattern = /<title>.*<\/title>/gmi;
const proxy = 'socks5h://127.0.0.1:9050';

exports.pullWebsite = async function (link){
    let options = url.parse(link);
    const agent = new SocksProxyAgent(proxy);
    
    options.agent = agent;
    const httpOrHttps = options.protocol === 'https:' ? https : http;

    let promise = new Promise((results, reject) => {
        httpOrHttps.get(options, res => {
            let body = "";
            res.pipe(bl((er, data)=>{
                if(er) reject(er);
                body+=data.toString();
                results(body);
            }));
        });

      });
      return await promise; 
}

exports.crunchDataFromHtml = function (dom){
    //console.log(dom)
    if(typeof dom != 'string') return null;
    let links=[];
    let title = dom.match(meta_title_pattern);
    for(const link of dom.matchAll(link_pattern)){
        if(links.indexOf(link[0])==-1) links.push(link[0]);
    }
    return {links: links, title: title}
}

