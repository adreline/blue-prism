const async = require('async');
const { root, db, blacklist, settings } = require('./config.json')
const { pullWebsite } = require(`./modules/crawler.js`);
const { crunchDataFromHtml, escape } = require(`./modules/processor.js`);
const { Database } = require(`./modules/database.js`);
const { Frontend } = require(`./frontend/server.js`);

const Deeplinks = new Database(db);
const Server = new Frontend(Deeplinks,root);

const flags = (typeof process.argv.slice(2)[0] != 'undefined') ? process.argv.slice(2)[0] : 'default';
let heap = [];

async function replenish(q){
    let promise = new Promise((results, reject)=>{
        Deeplinks.getUncharted()
        .then(rows=>{
            rows.forEach(row=>{ q.push({url: new URL(row.url), discovered: row.discovery_site}) });
            results();
        }).catch(e=>{ reject(e); })
    }) 
    return await promise;
}
function explore(){
    let q = async.queue((task, callback)=>{
        Deeplinks.wasVisited(task.url.href).then(visited=>{
            if(!visited){
                console.log(`pulling ${task.url.href}`)
                pullWebsite(task.url.href).then((dom)=>{
                    const data = crunchDataFromHtml(dom);
                    let bannable = blacklist.find(word=>{ return data.title.toLowerCase().includes(word) });
                    bannable = (typeof bannable != 'undefined');
                    heap.push({
                        title: (bannable) ? '__banned' : data.title,
                        last_visit: Date.now(),
                        contents: (bannable) ? '__banned' : data.content,
                        url: task.url.href,
                        domain: task.url.origin,
                        discovery_site: task.discovered,
                        banned: (bannable) ? 1 : 0
                    })
                    for(next_url of data.links){
                        if (q.length()<settings.maxQueueSize) q.push({url: next_url, discovered: task.url},()=>{console.log('pull finished')});
                        heap.push({
                            title: '__uncharted',
                            last_visit: 0,
                            contents: '__uncharted',
                            url: next_url.href,
                            domain: next_url.origin,
                            discovery_site: task.url,
                            banned: 0
                        })
                    }
                    callback();
                }).catch((e)=>{
                    console.log(e.message);
                    heap.push({
                        title: '__dead',
                        last_visit: Date.now(),
                        contents: escape(e.message.replace(task.url,'')),
                        url: task.url.href,
                        domain: task.url.origin,
                        discovery_site: task.discovered,
                        banned: 1
                    })
                    callback();
                })
            }else{
                console.log(`not pulling, url visited`)
                callback();
            }
        })
        console.log(`links in queue: ${q.length()}`); 
        console.log(`Heap size: ${heap.length}`);
        if(heap.length>settings.maxHeapSize){
            console.log('commiting heap to db');
            q.pause();
            Deeplinks.putWebsites(heap)
            .then(()=>{
                console.log('commited');
                heap = [];
                q.resume();
            })
            .catch(e=>{ console.log(e.message) })
        }
    }, settings.maxProxyConnections);
    return q;
}
switch(flags){
    case 'default':
        let q = explore();
        
        replenish(q)
        .catch(e=>{
            console.log(e)
        })
        
        q.drain(()=>{ 
            console.log('deadend reached') 
            replenish(q)
            .catch(e=>{
                console.log(e)
            })
        })
    break;
    case 'serve':
        Server.serve();
    break;
}


