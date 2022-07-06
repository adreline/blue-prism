const { parse, valid } = require('node-html-parser');
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
const patterns = {
    hyperlink: /((https?:)(\/\/)([\w]*)\.onion(\/[\w\-?=&%\+\d]*|\.html?|\.php)*)/gmi,
    disallowedlink: /(?:(?:https?)+\:\/\/+[a-zA-Z0-9\/\._-]{1,})+(?:(?:jpe?g|png|gif|tiff))/i,
    meta: {
        title: /<title>.*<\/title>/gmi
    }
}
const html_tag_blacklist = [
    "nav",
    "script",
    "style"
]

function affirmNode(html_node){
    //verify if a node in question should be processed
    if (!(html_node.parentNode === 'undefined') && html_node.parentNode != null) {
        if (html_tag_blacklist.includes(html_node.parentNode.rawTagName)) {
          //the tag is a backlisted one, return
          return false
        }
    }
    //tag isnt blacklisted
    return true
}
function affirmLink(link){
    return (link.match(patterns.disallowedlink) == null);
}

function gatherTextNodes(dom){
    //this is a recursive function which walks over html dom tree searching for _rawText.
    let dictionary = "";
    let traverse = (array_or_node)=>{
            //test for TextNode
            if (!(typeof array_or_node._rawText === 'undefined')) {
                //its a text_node
                //do some formatting
                let candidate = array_or_node._rawText.trim().replace(/[\\$'"`”„]/g, " ")
                if (candidate.length>2 && affirmNode(array_or_node)) {
                dictionary+=`${candidate} `;
                }
                //text_node cant have child nodes, return
                return true;
            }
            //determine if array_or_node is an array or object
            if (typeof array_or_node.length === 'undefined') {
                //it is object, look for child nodes or text node
                //look for more nodes
                if (!(typeof array_or_node.childNodes === 'undefined') && array_or_node.childNodes.length > 0) {
                //we have some more nodes to iterate over, make a recursive call
                traverse(array_or_node.childNodes)
                }
            }else {
                //it is an array
                array_or_node.forEach((html_object) => {
                //just call itself, the funct knows what to do
                traverse(html_object)
                });
            
            }
    }
    traverse(dom);
    return dictionary.substring(0,4000);
}

function crunchDataFromHtml(res){
    if(typeof res != 'string') throw new Error(`Data submited to parser is not of the type string, but ${typeof res}`);
    let links=[];
    let title = res.match(patterns.meta.title);
    title = (title==null||title.length==0) ? "no title found" : title[0];
    if(!valid(res)) throw new Error('html invalid');
    const dom = parse(res);
    const content = gatherTextNodes(dom);

    for(const link of res.matchAll(patterns.hyperlink)){
        if(links.indexOf(link[0])==-1 && affirmLink(link[0])) links.push(new URL(link[0]));
    }
    return {links: links, title: escape(sanitizeHtml(title,{allowedTags: []})), content: escape(sanitizeHtml(content,{allowedTags: []}))}
}
  exports.escape = escape;
  exports.crunchDataFromHtml = crunchDataFromHtml;
