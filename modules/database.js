const mariadb = require('mariadb');
const async = require('async');
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
class Database {
    constructor(connection_info){
        this.info = connection_info;
        this.handle = mariadb.createPool(connection_info);
    }
    async getUncharted(){
        let conn = await this.handle.getConnection();
        let promise = new Promise((results, reject)=>{
            conn.query(`SELECT * FROM websites WHERE last_visited = 0`)
            .then(rows=>{ conn.end(); results(rows); })
            .catch(e=>{ conn.end(); reject(e);})
        })
        return await promise;
    }
    async getWebsites(limit=-1){
        let conn = await this.handle.getConnection();
        let promise = new Promise((results, reject)=>{
            let query = `SELECT * FROM websites`;
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
                            website.title = escape(sanitizeHtml(website.title));
                            website.contents = escape(sanitizeHtml(website.contents));              
                            let insert = `INSERT INTO deeplinks.websites (title, contents, last_visited, banned, url) VALUES ('${website.title}','${website.contents}',${website.last_visit},${website.banned},'${website.url}')`;
                            let update = `UPDATE deeplinks.websites SET title='${website.title}', contents='${website.contents}', last_visited=${website.last_visit}, banned=${website.banned} WHERE url='${website.url}'`;
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
