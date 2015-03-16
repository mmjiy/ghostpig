/**
* @公用方法
*/
var path = require('path');
var fs = require('fs');
var util = require('util');

var $ = module.exports = {
	reg:{
		widget:function(){
			//检测是否存在和取widget name
			return new RegExp('{%widget\\s.*?name="(.*?)".*?%}','gm');
		},
		widgetType:function(){
			//取widget type
			return new RegExp('{%widget\\s.*?type="(.*?)".*?%}','gm');
		},
		widgetData:function(){
			//取widget data
			return new RegExp('{%widget\\s.*?data=\'(.*?)\'.*?%}','gm');
		},
		widgetComment:function(){
			//取widget 是否有注释
			return new RegExp('{%widget\\s.*?comment=[\'|"](.*?)[\'|"].*?%}','gm');
		},
		widgetOutputName:function(){
			//当前页面输出的widget name
			return new RegExp('{%widgetOutputName="(.*?)".*?%}','gm');
		},
		cssStr : '<link\\s.*?href="(.*?)".*?>',
		cssLink:function(){
			return new RegExp(this.cssStr,'gm');
		},
		jsStr : '<script\\s.*?src="(.*?)".*?</script>',
		jsLink:function(){
			return new RegExp(this.jsStr,'gm');
		},
		staticPre:function(){
			return new RegExp('.*?static','gm');
		},
		htmlComment: function(){
			return new RegExp('<!--[\\S\\s]*?-->', 'g');
		}
	},
	placeholder:{
		csscomboLink : function(url){
			 return '<link type="text/css" rel="stylesheet"  href="'+url+'" source="combo"/>\r\n';
		},		
		cssLink : function(url){
			 return '<link type="text/css" rel="stylesheet"  href="'+url+'" source="widget"/>\r\n';
		},
		jscomboLink:function(url){
			 return '<script type="text/javascript" src="'+url+'" source="combo"></script>\r\n';
		},
		jsLink:function(url){
			 return '<script type="text/javascript" src="'+url+'" source="widget"></script>\r\n';
		},
		insertHead:function(content,str){
			if ( /<\/head>/.test(content) ){
				return content.replace('</head>',str+'</head>');
			}else{
				return str + content;
			}
		},
		insertBody:function(content,str){
			if ( /<\/body>/.test(content) ){
				return content.replace('</body>',str+'</body>');
			}else{
				return content + str;
			}
		}
	},
	is:{
		//数据源文件
		dataSourceSuffix: '.json',
		dataSource : function(pathName){
			 return path.extname(pathName) === this.dataSourceSuffix;			 
		},
		tplSuffix: '.tpl',
		tpl : function(pathName){
			 return path.extname(pathName) === this.tplSuffix;
		},
		vmSuffix: '.vm',
		vm : function(pathName){
			 return path.extname(pathName) === this.vmSuffix;
		},
        handlebarsSuffix: '.handlebars',
        handlebars : function(pathName){
            return path.extname(pathName) === this.handlebarsSuffix;
        },
		html : function(pathName){
			 return path.extname(pathName) === '.html';
		},
		cssSuffix: '.css',
		css : function(pathName){
			 return path.extname(pathName) === this.cssSuffix;
		},
		less : function(pathName){
			 return path.extname(pathName) === '.less';
		},
		//这个扩展名比较悲剧
		sass : function(pathName){
			 return path.extname(pathName) === '.scss';
		},
		jsSuffix: '.js',
		js : function(pathName){
			 return path.extname(pathName) === this.jsSuffix;
		},
		png : function(pathName){
			 return path.extname(pathName) === '.png';
		},		
		//图片文件
		img : function(pathName){
			var name = path.extname(pathName);
			return  name === '.jpg' || name === '.jpeg' || name === '.png' || name === '.gif';
		},
		//含有http,https
		httpLink:function(str){
			return /^http:\/\/|https:\/\//.test(str);
		},
		//是否为图片url
		imageFile:function(str){
			var reg = new RegExp('.'+'('+$.imageFileType()+')');
			return reg.test(str);
		}
	},
	imageFileType:function(){
		 return 'svg|tiff|wbmp|png|bmp|fax|gif|ico|jfif|jpe|jpeg|jpg|cur';
	},
	/**
	 * @去掉path中的//
	 */
	replaceSlash:function(path){
		 return path.replace(/\/\//gm,'/');
	},
	/**
	* @去空格
	*/
	trim:function(str){
		 return str.replace(/\s/g,'');
	},
	/**
	 * @变量存在返回变量,变量不存在返回''
	 */
	getVar:function(t){
		if(typeof(t) != 'undefined'){
			return t;
		}
		return '';
	},
    ask:function(qa,opt){
        var Prompt = require('simple-prompt');
        opt=opt||{};
        var questions = [
            {question: qa}
        ];
        var profile = new Prompt(questions);
        profile.create().then(function (error, answers) {
            if (error) {
                return;
            }
            var ret=opt[answers[qa]];
            if($.isFunction(ret)) ret.call();
            else if($.isFunction(opt.default))opt.default.call();
            else if($.isFunction(opt)){
                opt.call("",answers[qa]);
            }
        });
    },
    askbool:function(qa,errorback,successback){
        $.log("!!!"+qa+"(yes or no)");
        $.ask("yes|no?",{
            "yes":function(){
                if($.isFunction(successback))successback.call();
                else $.log("choose 'yes' with none to do");
            },
            "default":function(){
               if($.isFunction(errorback))errorback.call();
               else $.log("choose 'no' with none to do");
            }
        });
    },
    /**
     *
     * @param str       错误信息
     * @param m         发生错误的模块
     */
    error:function(str,m){
        str=str || "";
        var basemessage="ghost error: ";
        if($.isString(m))basemessage+="["+m+"] ";
        console.log(basemessage+str);
    },
    log:function(str,m){
        str=str || {};
        var basemessage="ghost log: ";
        if($.isString(m)){
            basemessage+="["+m+"] ";
            console.log(basemessage+str);
        }
        else{
            console.log(str);
        }
    },
    isString:isString,
    isFunction:isFunction,
    isArray:isArray,
    isNull:isNull,
    isBoolean:isBoolean,
    isObject:isObject,
    isDate:isDate,
    replaceall:function(base,from,to){
       var reg = new RegExp(from,"g")
       return base.replace(reg, to);
    },
    foreach:function(obj,callback){
        if(isObject(obj)){
            for(var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    callback.call(this,obj[i],i);
                }
            }
        }
    }
}

/**
* @取当前时间 2014-01-14 
* @return 2014-01-14
*/
$.getDay = function(separator) {
	if(typeof(separator) == 'undefined'){
		separator = '-';
	}
	var myDate=new Date();
	var year=myDate.getFullYear();
	var month=myDate.getMonth()+1;
	month = month<10 ? '0'+month : month;
	var day=myDate.getDate();
	day = day<10 ? '0'+day : day;
	return year +separator+ month+separator+ day;
}

/**
* @取当前时间 12:11:10 
* @return 14:44:55
*/
$.getTime = function(separator, hasMs) {
	if(typeof(separator) == 'undefined'){
		separator = ':';
	}
	var myDate=new Date();
	var hour=myDate.getHours();
	hour = hour<10 ? '0'+hour : hour;
	var mint=myDate.getMinutes();
	mint = mint<10 ? '0'+mint : mint;
	var seconds=myDate.getSeconds();
	seconds = seconds<10 ? '0'+seconds : seconds;
	var ms = myDate.getMilliseconds();
	var result = hour +separator+ mint+separator+ seconds;
	if (typeof(hasMs) != 'undeinfed' && hasMs) {
		result += separator + ms;
	}
	return result;
}

/**
 * @name $.isArray
 * @param {All} obj 主体
 * @return {Boolean} true/false
 */
$.isArray = function(obj){
	return Object.prototype.toString.apply(obj) === '[object Array]';
}

/**
* @less/sass文件名称转css后缀
* @time 2014-3-5
* @example  a.less ==> a.css; a.sass ==> a.css
*/
$.getCssExtname = function(filename) {
    return filename.replace(/(scss|less)$/g, 'css');
}

/**
* @getUrlParam
* @time 2014-10-8
*/
$.getUrlParam = function(url){
	var urlParseRE = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;
	return urlParseRE.exec(url);
}

/**
 * @http get
 * @param {String} url 域名
 * @param {Function} callback 回调
 * @example 
	$.httpget('http://www.baidu.com/?tn=sitehao123', function (data){
		console.log(data);
	});
 */
$.httpget = function (url, callback){
	var http = require('http');

	var matches = $.getUrlParam(url);
	var host = matches[6];
	var param = (matches[13] ? matches[13] : '') + (matches[16] ? matches[16] : '') + (matches[17] ? matches[17] : '');
	
	if ( typeof(callback) == 'undefined'){
		var callback = null;
	}
	
	var options = {
		host: host,
		path: param,
		callback: callback
	};

	var requestCallback = function(response) {
	  var str = '';

	  response.on('data', function (chunk) {
	  	str += chunk;
	  });

	  response.on('end', function () {
	  	if(options.callback) options.callback(str);
	  });
	}

	var req = http.request(options, requestCallback);
	req.on('error', function (e) {
	  	//console.log(e);
	});
	req.end();

	req.setTimeout(500,function(){
		req.abort();
	});
}

/**
 * @数组去重
 * @算法: 设置成一个对象的属性
 */
$.uniq = function (arr){
	if($.isArray(arr)){
		var obj = {};
		for (var i=0; i<arr.length; i++){
			obj[arr[i]]=i;
		}
		arr=[];
		var j = 0;
		for (var i in obj){
			arr[j] = i;
			j += 1;
		}
	}
	return arr;
}

/**
 * @对象merage
 * @obj2的权重大
 */
$.merageObj = function(obj1, obj2) {
	for (var p in obj2) {
		try {
			if ( obj2[p].constructor==Object ) {
				obj1[p] = $.merageObj(obj1[p], obj2[p]);
			}else{
				obj1[p] = obj2[p];
			}
		} catch(e) {
			obj1[p] = obj2[p];
		}
	}
	return obj1;
}

/**
 * @inArray
 * @param {Array} arr 主体
 * @param {String} str字符串
 * @param {Boolean} include是否和匹配的字符串完成相同或者是为包含的关系
 */
$.inArray = function(arr, str, include){
	if(util.isArray(arr)){
		var res = false;
		arr.forEach(function(item){
			if(typeof(include) != 'undefined' && include){
				var reg = new RegExp(str,'gm')
				if(reg.test(item)){
				 	res = true;
				}
			}else{
				if(item == str){
				 	res = true;
				}
			}
		});
		return res;
	}
}

function isArray(ar) {
    return Array.isArray(ar);
}

function isBoolean(arg) {
    return typeof arg === 'boolean';
}

function isNull(arg) {
    return arg === null;
}

function isNullOrUndefined(arg) {
    return arg == null;
}

function isNumber(arg) {
    return typeof arg === 'number';
}

function isString(arg) {
    return typeof arg === 'string';
}

function isSymbol(arg) {
    return typeof arg === 'symbol';
}

function isUndefined(arg) {
    return arg === void 0;
}

function isRegExp(re) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
}

function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
}

function isDate(d) {
    return isObject(d) && objectToString(d) === '[object Date]';
}

function isError(e) {
    return isObject(e) && objectToString(e) === '[object Error]';
}

function isFunction(arg) {
    return typeof arg === 'function';
}

function isPrimitive(arg) {
    return arg === null ||
        typeof arg === 'boolean' ||
        typeof arg === 'number' ||
        typeof arg === 'string' ||
        typeof arg === 'symbol' ||  // ES6 symbol
        typeof arg === 'undefined';
}

function isBuffer(arg) {
    return arg instanceof Buffer;
}

function objectToString(o) {
    return Object.prototype.toString.call(o);
}