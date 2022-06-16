const express = require("express");
const bodyParser = require("body-parser");
const { escape } = require('../modules/crawler.js');
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
                    const data = await this.db.selectWithPagination(settings.rowsPerPage,`SELECT * FROM websites WHERE banned = 0 AND last_visited != 0`,req.query.page);
                    const pagination = this.paginate('/?page=',current_page,last_page,4);
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
                    const pagination = this.paginate(`/search?question=${q}&page=`,current_page,last_page,4);

                    res.render('index',{ links: data, code: 0, pagination: pagination });
                    
                }catch(e){
                    console.error(e);
                    res.render('index',{ links: [], code: 1, mgs: e.message, pagination: null });
                }
                
            })();    
        })
        this.app.get("/app.css", (req, res)=>{
            res.sendFile(`${root}/frontend/views/${req.url}`)
        })
    }
    serve(){
        this.app.listen(9997, () => {
            console.log("Server is Running")
        })
    }
    paginate(location,current,last_page,breakpoint){
        if(last_page==1) return null;
        current=parseInt(current);
        let pagination = [];
        if(last_page > (breakpoint*2)){
            let j = current;
            if(current < last_page-breakpoint){
                for(var i = 0;i<breakpoint;i++){
                    pagination.push({
                        num: j,
                        location: `${location}${j}`,
                        current: (j == current)
                    });
                    j++;
                }
            }else{
                pagination.push({
                    num: 0,
                    location: `${location}${0}`,
                    current: false
                });
            }
            pagination.push({
                num: '...'
            });
            j=last_page-breakpoint;
            for(var i = 0;i<breakpoint;i++){
                pagination.push({
                    num: j,
                    location: `${location}${j}`,
                    current: false 
                });
                j++;
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
        return pagination;

    }
}

exports.Frontend = Frontend;


