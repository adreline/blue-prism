const express = require("express");
const bodyParser = require("body-parser");
const { escape } = require('../modules/processor.js');
const { settings } = require('../config.json');

class Frontend{
    constructor(db_handle,root){
        this.db = db_handle;
        this.app = express()
        this.app.set('views', `${root}/frontend/views`)
        this.app.set('view engine', 'pug')
        this.app.use(bodyParser.urlencoded({ extended: false }))

        this.app.get("/", (req, res) => {
            (async ()=>{
                try{
                    var size = await this.db.sql('SELECT COUNT(id) AS size FROM websites WHERE banned = 0 AND last_visited != 0');
                    size = Number(size[0].size);
                    var current_page = 0;
                    const last_page = parseInt(size / settings.rowsPerPage);
                    if(typeof req.query.page != 'undefined'){
                        if(isNaN(req.query.page)) throw new Error('non numeric value submited');
                        if(req.query.page > last_page) throw new Error('page out of range');
                        current_page=req.query.page;
                    }
                    var data = await this.db.selectWithPagination(settings.rowsPerPage,`SELECT * FROM websites WHERE banned = 0 AND last_visited != 0`,req.query.page);
                    data.forEach((link,key) => {
                        data[key].last_visited = new Date(Number(link.last_visited)).toLocaleString();
                    })
                    const pagination = this.paginate('/?page=',current_page,last_page,2);
                    res.render('index',{ links: data, code: 0, pagination: pagination })
                }catch(e){
                    console.error(e);
                    res.render('index',{ links: [], code: 1, msg: e.message, pagination: null })
                }
            })();
        })
        this.app.get("/search",(req, res)=>{
            (async ()=>{
                try{
                    const q = escape(req.query.question);
                    if(q=='') throw new Error('query is empty');
                    var location = `/search?question=${q}`;
                    var current_page = 0;
                    if(typeof req.query.page != 'undefined'){
                        if(isNaN(req.query.page)) throw new Error('non numeric value submited');
                        if(req.query.page > last_page) throw new Error('page out of range');
                        location+=(req.query.page > 0 ) ? `&page=${req.query.page}` : ``;
                        current_page=req.query.page;
                    }
                    var size = await this.db.sql(`SELECT COUNT(id) AS size FROM websites WHERE (banned = 0 AND last_visited != 0) AND (title LIKE '%${q}%' OR contents LIKE '%${q}%')`);
                    size = Number(size[0].size);
                    const last_page = parseInt(size / settings.rowsPerPage);
                    
                    
                    const data = await this.db.selectWithPagination(settings.rowsPerPage,`SELECT * FROM websites WHERE (banned = 0 AND last_visited != 0) AND (title LIKE '%${q}%' OR contents LIKE '%${q}%')`,req.query.page);
                    data.forEach((link,key) => {
                        data[key].last_visited = new Date(Number(link.last_visited)).toLocaleString();
                    })
                    const pagination = this.paginate(`/search?question=${q}&page=`,current_page,last_page,4);

                    res.render('index',{ links: data, code: 0, pagination: pagination });
                    
                }catch(e){
                    console.error(e);
                    res.render('index',{ links: [], code: 1, mgs: e.message, pagination: null });
                }
                
            })();    
        })
        this.app.get(/\/\w*(\.css|\.png|\.jpe?g)/, (req, res)=>{
            res.sendFile(`${root}/frontend/views/${req.url}`)
        })
        this.app.get("/control-panel",(req,res)=>{
            (async ()=>{
                const total = await this.db.sql("SELECT COUNT(id) AS 'num' FROM websites");
                const indexed = await this.db.sql("SELECT COUNT(id) AS 'num' FROM websites WHERE banned=0 AND last_visited!=0");
                const banned = await this.db.sql("SELECT COUNT(id) AS 'num' FROM websites WHERE banned=1 AND title!='__dead'");
                const dead = await this.db.sql("SELECT COUNT(id) AS 'num' FROM websites WHERE title='__dead'");
                const uncharted = await this.db.sql("SELECT COUNT(id) AS 'num' FROM websites WHERE last_visited=0;");
                var stats = {
                    total: Number(total[0].num),
                    indexed: Number(indexed[0].num),
                    banned: Number(banned[0].num),
                    dead: Number(dead[0].num),
                    uncharted: Number(uncharted[0].num),
                    ratio: null
                }
                stats.ratio = ((1-(stats.indexed/(stats.total - stats.uncharted)))*100).toPrecision(4);
                res.render('control',stats);    
            })();
        })
        this.app.get("/purge",(req,res)=>{
            const domain = escape(req.query.domain);
            if(domain=='') throw new Error('domain is empty');
            (async ()=>{
                try{
                    let q = `UPDATE deeplinks.websites SET title='__banned', contents='__banned', discovery_site='__banned', banned=1 WHERE url LIKE '%${domain}%' OR discovery_site LIKE '%${domain}%'`;
                    await this.db.sql(q);
                    
                }catch(e){
                    console.log(e.message);
                }finally{
                    const backtrack = new URL(req.headers.referer);
                    res.redirect(`${backtrack.pathname}${backtrack.search}`);
                }
            })();
        })
        this.app.get("/ban/:id",(req,res)=>{
            const id = req.params.id;
            if(isNaN(id)) throw new Error('id is invalid');
            (async ()=>{
                try{
                    let q = `UPDATE deeplinks.websites SET title='__banned', contents='__banned', banned=1 WHERE id = ${id}`;
                    await this.db.sql(q);
                }catch(e){
                    console.log(e.message);
                }finally{
                    const backtrack = new URL(req.headers.referer);
                    res.redirect(`${backtrack.pathname}${backtrack.search}`);
                }
            })();
        })
    }
    serve(){
        this.app.listen(9997, () => {
            console.log("Server is Running")
        })
    }
    paginate(location,current,last_page,breakpoint){
        if(last_page==1||last_page==0) return null;
        current=parseInt(current);
        let pagination = [];
        pagination.push({
            num: '<<',
            location: `${location}0`,
            current: false
        });
        if(current-1>-1){
            pagination.push({
                num: '<',
                location: `${location}${current-1}`,
                current: false
            });
        }
        
        if(last_page > (breakpoint*2)){
            if(current > breakpoint){
                for(var i = (current-breakpoint);i<(current+breakpoint+1);i++){
                    if(i<last_page+1){
                        pagination.push({
                            num: i,
                            location: `${location}${i}`,
                            current: (i == current)
                        });
                    }
                }
            }else{
                for(var i = 0;i<(breakpoint*2);i++){
                    pagination.push({
                        num: i,
                        location: `${location}${i}`,
                        current: (i == current)
                    });
                }
            }

        }else{
            for(var i = 0;i<last_page+1;i++){
                pagination.push({
                    num: i,
                    location: `${location}${i}`,
                    current: (i == current)
                });
            }
        }
        if(current<last_page){
            pagination.push({
                num: '>',
                location: `${location}${current+1}`,
                current: false
            });
        }
        pagination.push({
            num: '>>',
            location: `${location}${last_page}`,
            current: false
        });

        return pagination;

    }
}

exports.Frontend = Frontend;


