/**
* @simple server
*/
var PORT = 3000;
var http = require('http');
var url=require('url');
var fs=require('fs');
var path=require('path');

var f = require('./file.js');
var jdf = require('./jdf.js');
var $=require("./base.js");

var mine = {
  "css": "text/css",
  "gif": "image/gif",
  "html": "text/html",
  "tpl": "text/html",
  "vm": "text/html",
  "handlebars" : "text/html",
  "shtml": "text/html",
  "ico": "image/x-icon",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "pdf": "application/pdf",
  "png": "image/png",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tiff": "image/tiff",
  "txt": "text/plain",
  "wav": "audio/x-wav",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "xml": "text/xml"
};

//exports
var server = module.exports = {};

/**
* @getIp
*/
server.getIp = function(){
	var net = require('os').networkInterfaces();
    for(var key in net){
        if(net.hasOwnProperty(key)){
            var items = net[key];
            if(items && items.length){
                for(var i = 0; i < items.length; i++){
                    var ip = String(items[i].address).trim();
                    if(ip && /^\d+(?:\.\d+){3}$/.test(ip) && ip !== '127.0.0.1'){
                        return ip;
                    }
                }
            }
        }
    }
    return '127.0.0.1';
};

/**
 * @joinbuffers
 */
server.joinbuffers = function(bufferStore) {
    var length = bufferStore.reduce(function(previous, current) {
        return previous + current.length;
    }, 0);

    var data = new Buffer(length);
    var startPos = 0;
    bufferStore.forEach(function(buffer){
        buffer.copy(data, startPos);
        startPos += buffer.length;
    });
    return data;
};

/**
* @init
* @param {String} serverCurrentDir 服务器文件夹本地路径
* @param {String} port 服务器端口号
* @param {String} cdn cdn文件夹前缀 http://cdn.com
* @param {String} replacePath cdn替换路径字符 如vip/2014 : http://cdn.com/vip/2014/js/vip.index.js ---> http://cdn.com/js/vip.index.js 本地调试反向代理适用
* @param {String} debug debug模式下替换http链接中的projectPath
*/
server.init = function(serverCurrentDir, port, cdn, replacePath, comboDebug){
	if (typeof(port) != 'undefined') {
		PORT = port;
	}

	if (typeof(comboDebug) == 'undefined') {
		comboDebug = false;
	}

	var config = http.createServer(function (request, response) {
		var requestUrl = request.url;
        var testcdn=jdf.config.testcdn;
        //处理php

        if(requestUrl.indexOf(".php")>-1 && testcdn){
            var targetrequest=testcdn+requestUrl;
            var is_debug="is_debug="+(jdf.config.svn.name||"");
            if(targetrequest.indexOf("?")<0)targetrequest+="?"+is_debug;
            response.writeHead(200, {
                'Refresh': "0; url="+targetrequest
            });
            response.end();
            /*
            var targetrequest=testcdn+requestUrl;
            var html=[];
            var ast=true;
            var end=function(){
                var htmlstr=Buffer.concat(html);
                response.write(htmlstr);
                response.end();
            }
            response.writeHead(200, {
                'Content-Type': mine.html
            });
            var __count=0;
            var req = http.request(targetrequest, function(res) {
                res.on("data", function(chunk) {
                   clearTimeout(ast);
                  // var page=require("iconv-lite").decode(chunk,"GBK");

                   html.push(chunk);
                   ast=setTimeout(end,1000);
                });
            })
            req.on("error", function(e) {
                console.log(e.message);
            });

            req.end();
            return true;
            */
        }
		var isComboUrl = /\?\?/.test(requestUrl);
		// console.log(request.headers)
		var pathname = url.parse(requestUrl).pathname;
		// console.log(pathname);
		if (typeof(serverCurrentDir) == 'undefined') {
			var realPath = fs.realpathSync('.') +'/'+ pathname;
		}else {
			var realPath = serverCurrentDir +'/'+ pathname;
		}
		realPath = decodeURI(realPath);
		var ext = path.extname(realPath);
		ext = ext ? ext.slice(1) : 'unknown';

		if(isComboUrl){
			//??a.js,b.js计算.js扩展名
			var comboUrlTemp = requestUrl.split(',');
			ext = path.extname(comboUrlTemp[comboUrlTemp.length-1]);
			ext = ext ? ext.slice(1) : 'unknown';
		}

		if(typeof(replacePath) != 'undefined' && comboDebug){
			//替换掉路径中projectPath, 有风险吗?
			realPath = realPath.replace(replacePath,'');
		}
		
		
		fs.exists(realPath, function (exists) {
			if(isComboUrl){
				exists = false;
			}
			//writeFavicon(response);
			if (!exists) {
				//cdn检测同名文件
				//todo增加短路径支持 requestUrl
				var cdnUrl = cdn+pathname;
				if(isComboUrl){
					cdnUrl = requestUrl;
				}

				var response404 = function (str){
					response.writeHead(404, {
						'Content-Type': 'text/html'
					});
					response.write('<center><h1>404 Not Found</h1>'+(str?'<h2>'+str+'</h2>':'')+'</center><hr><center>'+server.copyright(PORT)+'</center>');
					response.end();
				}
				// if(!comboDebug){
				// 	response404();
				// }else{
					var contentType = mine[ext] || "text/plain";
					var fileContent = '';

					//以??先分隔为数组
					var comboUrl = requestUrl.split('??');
					var comboFile = [];

					if(comboUrl.length > 0){
						//将头尾的斜杠去掉
						comboUrl[0] = comboUrl[0].replace(/^\//, '').replace(/\/$/, '');

						if(comboUrl[1]){
							//以逗号将文件名称分隔为数组
							comboFile = comboUrl[1].split(',');
						}
					}

					comboFile.forEach(function(file){
                       // console.log(file);
						var fileDir = '';
						var content = '';

						//将头尾的斜杠去掉
						file = file.replace(/^\//, '').replace(/\/$/, '');
						if(comboUrl[0] !== ''){
							fileDir = comboUrl[0] + '/' + file;
						}else{
							fileDir = file;
						}
						var basefileDir=jdf.bgCurrentDir+"/"+fileDir;
						if(f.exists(fileDir)){
							content = f.read(fileDir);
							fileContent += content;
						}
						else if(f.exists(basefileDir)){
							content = f.read(basefileDir);
							//console.log(content);
							fileContent += content;
						}
						else{
							fileDir = cdnUrl + file;
							response404(file);
						}
					});

					response.writeHead(200, {
						'Content-Type': contentType
					});
					response.write(fileContent);
					response.end();
					/*http.get(cdnUrl,function(res) {
						if(res.statusCode == 404){
							response404();
						}else{
							//非400
							var buffs = [];
							res.on('data',function(chunk){
								//分片存储
								buffs.push(chunk);
							});

							res.on('end',function(){
								var buff = server.joinbuffers(buffs);
								//fix 80% situation bom problem.quick and dirty ?
			                       if(bu1= 187 && buff[2] === 191) {
			                        buff = buff.slice(3, buff.length);
			                    }

								var contentType = mine[ext] || "text/plain";
								response.writeHead(200, {
									'Content-Type': contentType
								});
								response.write(buff);
								console.log(buff)
								//写在本地缓存里, 那如何更新呢?
								//f.write(pathname, "");
								response.end();
							});	
						}
					});*/
				// }
			} else {
				fs.readFile(realPath, "binary", function (err, file) {
					if (err) {
						if(err.errno == 28){
							response.writeHead(200, {
								'Content-Type': mine.html
							});
							var html = server.getDirList(realPath, pathname, PORT);
							response.write(html);
							response.end();
						}else{
							response.writeHead(500, {
								'Content-Type': mine.html
							});
							response.end(err);
						}
					} else {
						var contentType = mine[ext] || "text/plain";
						response.writeHead(200, {
							'Content-Type': contentType
						});
						response.write(file, "binary");
						response.end();
					}
				});
			}
		});
	});
	config.listen(PORT);
	config.on('error', function(err){
		if (err.code === 'EADDRINUSE' || err.code === 'EACCES'){
			console.log('jdf server : Port ' + PORT + ' has used');
		}
	});
}

/**
* @get copyright
*/
server.copyright = function (port){
	var serverIp = server.getIp()+':'+port;
	var copyright = '<p><strong style="font-size:1.2em">jdf server </strong>'+
		' <strong>IP</strong> <a href="http://'+serverIp+'">'+serverIp+'</a>   '+	
		//'<span style="font-size:0.8em">'+new Date()+'</span>  '+
	'</p>';
	return copyright;
}

/**
* @get dir list
*/
server.getDirList = function(realPath, pathname, port){
	// console.log(realPath);
	var dirname = '/';
	var html = '<li style="padding-bottom:5px;"><a href="../">../</a></li>';
	realPath = path.normalize(realPath);
	pathname += '/';
	pathname = pathname.replace(/\/\//,'');

	fs.readdirSync(realPath).forEach(function(name){
		if( !/.Ds_Store$/.test(name) ){
			// console.log(name);
			var url = pathname +'/'+name;
			url = url.replace(/\/\//g,'/');
			url = encodeURI(url);
			dirname = path.dirname(url);
			if(f.isDir('.'+url)){
				url = url + '/';
				name = name + '/';
			}

			html += '<li style="padding-bottom:0.2em;"><a href="'+url+'">'+name+'</a></li>';
		}
	})

	html = '<ul>' +html+ '</ul>';
	html = '<h1>Index of '+dirname+'</h1><hr/>'+html+'<hr/> '+server.copyright(port);
	return html;
}
