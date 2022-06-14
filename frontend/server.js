const express = require("express");
const bodyParser = require("body-parser");

exports.Frontend = class{
    constructor(db_handle,views){
        this.db = db_handle;
        this.app = express()
        this.app.set('views', views)
        this.app.set('view engine', 'pug')
        this.app.use(bodyParser.urlencoded({ extended: false }))

        this.app.get("/", (req, res) => {
            this.db.getWebsites(10)
            .then(data=>{
                console.log(data)
                res.render('index',{links: data})
            })
            
        })
    }
    serve(){
        this.app.listen(9997, () => {
            console.log("Server is Running")
        })
    }
}




