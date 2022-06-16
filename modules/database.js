const mariadb = require('mariadb');
const async = require('async');

class Database {
    constructor(connection_info){
        this.info = connection_info;
        this.handle = mariadb.createPool(connection_info);
    }
    async getUncharted(){
        let conn = await this.handle.getConnection();
        let promise = new Promise((results, reject)=>{
            conn.query(`SELECT * FROM websites WHERE last_visited = 0 AND banned = 0`)
            .then(rows=>{ conn.end(); results(rows); })
            .catch(e=>{ conn.end(); reject(e);})
        })
        return await promise;
    }
    async getWebsites(limit=-1){
        let conn = await this.handle.getConnection();
        let promise = new Promise((results, reject)=>{
            let query = `SELECT * FROM websites WHERE banned = 0 AND last_visited != 0`;
            query+=(limit!=-1) ? ` LIMIT ${limit}` : ``;
            conn.query(query)
            .then(rows=>{ conn.end(); results(rows); })
            .catch(e=>{ conn.end(); reject(e); })
        })
        return await promise;
    }
    async wasVisited(url){
       let conn = await this.handle.getConnection();
       let promise = new Promise((results, reject)=>{
            conn.query(`SELECT last_visited FROM websites WHERE url LIKE "${url}"`)
            .then(res=>{
                conn.end();
                results( (typeof res[0] == 'undefined') ? false : ( res[0].last_visited != 0 ) );
            })
            .catch(e=>{ conn.end(); reject(e); })
       })
       return await promise;
    }
    async putWebsites(websites){
      await async.eachLimit(websites, this.info.connectionLimit,
            (website, callback)=>{
                    this.handle.getConnection()
                    .then((conn)=>{
                        conn.query(`SELECT last_visited FROM websites WHERE url LIKE "${website.url}"`)
                        .then(res=>{           
                            let insert = `INSERT INTO deeplinks.websites (title, contents, last_visited, banned, url, discovery_site) VALUES ('${website.title}','${website.contents}',${website.last_visit},${website.banned},'${website.url}','${website.discovery_site}')`;
                            let update = `UPDATE deeplinks.websites SET title='${website.title}', contents='${website.contents}', discovery_site='${website.discovery_site}', last_visited=${website.last_visit}, banned=${website.banned} WHERE url='${website.url}'`;
                            let query = (typeof res[0] == 'undefined') ? insert : (res[0].last_visited == 0) ? update : '';
                            if(query=='')  {throw new Error('overwrite attempt');} 
                            conn.query(query)
                            .then(()=>{
                                conn.end();
                                callback();
                            }).catch(e=>{ 
                                console.log(e);
                                conn.end();
                                callback(); 
                            });
                        }).catch(e=>{ 
                            console.log(e);
                            conn.end();
                            callback(); 
                        })
                    }).catch(e=>{ 
                        console.log(e);
                        conn.end();
                        callback(); 
                    });


            });            
    }

}
exports.Database = Database;
