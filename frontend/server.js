const express = require("express");
const bodyParser = require("body-parser");

exports.Frontend = class{
    constructor(db_handle,root){
        this.db = db_handle;
        this.app = express()
        this.app.set('views', `${root}/frontend/views`)
        this.app.set('view engine', 'pug')
        this.app.use(bodyParser.urlencoded({ extended: false }))

        this.app.get("/", (req, res) => {
            this.db.getWebsites(10)
            .then(data=>{
                console.log(data)
                res.render('index',{links: data})
            })
            
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




