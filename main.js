const async = require('async');
const { root, db, blacklist, settings } = require('./config.json')
const {pullWebsite, crunchDataFromHtml} = require(`./modules/crawler.js`);
const { Database } = require(`./modules/database.js`);
const { Frontend } = require(`./frontend/server.js`);

const Deeplinks = new Database(db);
const Server = new Frontend(Deeplinks,`${root}/frontend/views`);

const flags = (typeof process.argv.slice(2)[0] != 'undefined')?process.argv.slice(2)[0]:'default';
let heap = [];

function crawl(){
    var q = async.queue((link, callback)=>{
        Deeplinks.wasVisited(link.url).then(visited=>{
            if(!visited){
                console.log(`pulling ${link.url}`)
                pullWebsite(link.url).then((dom)=>{
                    let data = crunchDataFromHtml(dom);
                    let bannable = blacklist.find(word=>{ return data.title[0].toLowerCase().includes(word) });
                    bannable = (typeof bannable != 'undefined');
                    heap.push({
                        title: (bannable) ? 'banned' : data.title[0],
                        last_visit: Date.now(),
                        contents: (bannable) ? 'banned' : 'some contents',
                        url: link.url,
                        banned: (bannable) ? 1 : 0
                    })
                    for(next_link of data.links){
                        if (q.length()<settings.maxQueueSize) q.push({url: next_link},()=>{console.log('pull finished')});
                        heap.push({
                            title: '-',
                            last_visit: 0,
                            contents: '-',
                            url: next_link,
                            banned: 0
                        })
                    }
                    callback();
                }).catch((e)=>{
                    console.log('couldnt pull');
                    console.log(e);
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
        }
    }, settings.maxProxyConnections);
    
    Deeplinks.getUncharted()
    .then(rows=>{
        rows.forEach(row=>{
            q.push({url: row.url})
        })
    }).catch(e=>{ console.log(e) })
    
    q.drain(()=>{
        console.log('deadend reached');
    })
    
}

switch(flags){
    case 'default':
        crawl();
    break;
    case 'commit':
        Deeplinks.commitData()
        .then(msg=>{console.log(msg);})
        .catch(e=>{console.log(e);})
    break;
    case 'serve':
        Server.serve();
    break;
}

process.on('uncaughtException', err => {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    console.error(err.stack)
    process.exit(1)
});