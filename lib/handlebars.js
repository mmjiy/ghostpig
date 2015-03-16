/**
 * Created by Bosco on 2015/3/5.
 */


var path = require('path');
var fs = require('fs');
var util = require('util');

var $ = require('./base.js');
var f = require('./file.js');
var jdf = require("./jdf.js");

var Hbs = require('handlebars');

//exports
var Hb = module.exports;

/**
 * @velocityjs extend
 * @{String} str 数据内容
 * @{String} dirname 文件的dirname
 */
Hb.parse = function(str, dirname){
    var dirname = typeof dirname == 'undefined' ? '' : dirname;
    var arr = str.match(/#parse\([\"|\'](.*?)[\"|\']\)/gmi);
    //console.log(arr);
    var res = {
        handlebars:[],
        tpl:[],
        js:[],
        css:[]
    };

    if (arr) {
        for (var i =0  ; i<arr.length  ; i++ ){
            var temp = arr[i].match(/#parse\([\"|\'](.*?)[\"|\']\)/);
            if(temp){
                //console.log(temp);
                var basename = temp[1];
                if (basename) {
                    var source  = dirname + basename;
                    source = path.normalize(source);

                    var dirname1 = path.dirname(source);
                    var dirlist1 = f.getdirlist(dirname1);

                    dirlist1.forEach(function(item){
                        var item = item.replace(jdf.currentDir, '');
                        item = item.replace(/\\/g,'/');

                        if($.is.handlebars(item)){
                            res.handlebars.push(item);
                        }

                        if($.is.tpl(item)){
                            res.tpl.push(item);
                        }

                        if($.is.css(item)||$.is.less(item)||$.is.sass(item)){
                            res.css.push($.getCssExtname(item));
                        }

                        if($.is.js(item)){
                            res.js.push(item);
                        }
                    });

                    if (f.exists(source)) {
                        var content = f.read(source);
                        if (content) {
                            //替换
                            str = str.replace(temp[0], content);
                        }
                    }
                }
            }
        }
    }

    return {
        content:str,
        url:res
    };
}

/**
 * @rander data
 * @{String} vmSource vm内容
 * @{Object} dataObj vm对应的数据
 * @{String} dirname vm的dirname
 */
Hb.rander = function(hbSource, dataObj, dirname){
    if (hbSource && dataObj) {
        if(dirname) {
            var vmTpm = Hb.parse(hbSource, dirname);
            var handle = Hbs.compile(hbSource);
            var content = handle(dataObj);
            return {
                content: content,
                url: vmTpm.url
            };
        }
        else{
            var handle = Hbs.compile(hbSource);
            var content = handle(dataObj);
            return content;
        }
    }
}

Hb.precomplies=function(content,name,handlebarsid){
    if(content){

        // id for template
        var id = name

        // handlebars alias
        var alias = handlebarsid;

        var template = [
            'define("%s", ["%s"], function(require, exports, module) {',
            'var Handlebars = require("%s");',
            'var template = Handlebars.template;',
            'module.exports = template(',
            '%s',
            ');',
            '})'
        ].join('\n');

        var data = content;

        //patchHandlebars(Hbs);

        var obj={
            id: handlebarsid,
            knownHelpers: [],
            knownHelpersOnly: false
        }

        var code = Hbs.precompile(data, obj);

        var ret = util.format(template, id, alias, alias, code);
        return ret;
    }
    return "";
}
