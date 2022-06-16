const express = require("express");
const bodyParser = require("body-parser");
const { escape } = require('../modules/crawler.js');


class Frontend{
    constructor(db_handle,root){
        this.db = db_handle;
        this.app = express()
        this.app.set('views', `${root}/frontend/views`)
        this.app.set('view engine', 'pug')
        this.app.use(bodyParser.urlencoded({ extended: false }))

        this.app.get("/", (req, res) => {
            this.db.getWebsites(10)
            .then(data=>{ res.render('index',{ links: data, code: 0 }) })
            .catch(e=>{ res.render('index',{ links: [], code: 1, msg: e.message }) })
        })
        this.app.get("/search",(req, res)=>{
            let q = escape(req.query.question);
            if(q=='') res.render('index', { links: [] });
            this.db.sql(`SELECT * FROM websites WHERE banned = 0 AND last_visited != 0 AND title LIKE '%${q}%' OR contents LIKE '%${q}%'`)
            .then(rows=>{ res.render('index',{ links: rows, code: 0 }) })
            .catch(e=>{ res.render('index',{ links: [], code: 1, mgs: e.message }) })
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
}

exports.Frontend = Frontend;


