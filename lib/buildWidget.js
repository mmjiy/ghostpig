/**
 * @build widget 引入其内容和相关css,js文件以及css,js路径替换
 * @param inputPath 文件路径
 * @param content 文件内容
 * @param type 编译类型 build || release
 * @example
 {%widget name="unit"%}
 ==>
 <link type="text/css" rel="stylesheet"  href="/widget/base/base.css" source="widget"/>
 ==>
 <link type="text/css" rel="stylesheet"  href="/app/css/widget.css" source="widget"/>

 删除和替换 {%widgetOutputName="mywidgetname"%}
 */

var path = require('path');
var fs = require('fs');

//lib自身组件
var $ = require('./base.js');
var f = require('./file.js');
var jdf = require('./jdf.js');
var Vm = require("./vm.js");
var Handlebars = require("./handlebars.js");
var cheerio = require("cheerio");


//exports
var buildWidget = module.exports = {};

var nowcdn = "";


/**
 * @init
 */
//build widget 每个HTML
buildWidget.init = function (inputPath, content, type, callback) {
    var isBuild = type == 'build';
    var isRelease = type == 'release';
    var isOutput = type == 'output';


    //测试模式不开启本地测试 并且是build的话，就用本地路径
    if (!jdf.config.local && isBuild)nowcdn = LocalServer;

    //输出模式输出，并且有输出cdn
    else if (isOutput && jdf.config.combocdn)nowcdn = jdf.config.combocdn;


    else if (isBuild)nowcdn = jdf.config.cdn;

    else if (isOutput) {
        $.log("you have not config combocdn with output now", "ghost output");
        nowcdn = jdf.config.programcdn;
    }

    //插入全局JS CSS
    var jslinks=[],csslinks=[];

    var H = cheerio.load(content, {decodeEntities: false});

    if($.isArray(jdf.config.build.overalljs) &&jdf.config.build.overalljs.length>0){

        for(var n=0;n<jdf.config.build.overalljs.length;n++){
            var tmpjssrc=jdf.bgCurrentDir+"/"+jdf.config.jsDir+"/"+jdf.config.build.overalljs[n];
            if(f.exists(tmpjssrc)){
                jslinks.push($.placeholder.jscomboLink("/"+jdf.config.jsDir+"/"+jdf.config.build.overalljs[n]));
            }
        }
        if(jslinks.length>0)H("head").prepend(jslinks.join("\n"));

    }
    if($.isArray(jdf.config.build.overallcss) &&jdf.config.build.overallcss.length>0){

        for(var nn=0;nn<jdf.config.build.overallcss.length;nn++){
            var tmpcsssrc=jdf.bgCurrentDir+"/"+jdf.config.cssDir+"/"+jdf.config.build.overallcss[nn];
            if(f.exists(tmpcsssrc)){
                csslinks.push($.placeholder.csscomboLink("/"+jdf.config.cssDir+"/"+jdf.config.build.overallcss[nn]));
            }
        }
        if(csslinks.length>0)H("head").prepend(csslinks.join("\n"));
    }

    content= H.html();
    //css,js路径替换
    if (isOutput || isBuild) content = staticUrlReplace(content,jslinks,csslinks);
    var G = cheerio.load(content, {decodeEntities: false});
    var result = G("widget");

    var origin = content;
    var isJM = false;
    var cssFile = '' , jsFile = '';
    var cssComboArr = [];
    var jsComboArr = [];
    var LocalServer = nowcdn;


    //widget
    if (result.length > 0) {
        //取得html中所有注释内容
        //var commentArray = content.match(/<!--(.|\s)*?-->/gm);
        var filesListObj = {};//去重用

        var setwidget = function (G, _this, notwrite) {
            _this = G(_this);

            notwrite = notwrite || false;

            var widgetArray = _this.html();
            // var resultItem=widgetArray;
            //是否在注释过了
            /*
             if($.inArray(commentArray, resultItem, true)){
             return;
             }
             */
            var widgetType = _this.attr("type") || "";
            //widgetStr中的name
            var widgetName = _this.attr("name") || "";

            //取widget数据 {%widget data=" "%}
            var widgetData = _this.data() || {};

            var widgetcomment = _this.attr("comment") === "false" ? false : (_this.attr("comment")||"");


            var datasource = function (data, e) {
                if ($.isObject(data)) {
                    for (var n in data) {
                        if (data.hasOwnProperty(n)) {
                            data[n] = datasource(data[n]);
                        }
                    }
                    return data;
                }
                else {
                    if ($.isString(data) && data.charAt(0) == "#") {
                        var obj = G(_this).children(data);
                        var ret = setwidget(G, obj, true);
                        return ret;
                    }
                    else return data;
                }
            }

            datasource(widgetData);


            //取widget是否注释tag {%widget comment=" "%}
            var widgetComment = _this.attr("comment") || "";

            //如果type为js或者css则只引用不处理tpl
            var buildTag = {
                tpl: true,
                vm: true,
                js: true,
                css: true,
                handlebars: true
            }

            if (widgetType) {
                if (widgetType == 'tpl' || widgetType == 'vm' || widgetType == 'css' || widgetType == 'js' || widgetType == 'handlebars') {
                    for (var i in buildTag) {
                        if (i != widgetType) buildTag[i] = false;
                    }
                } else {
                    $.log(inputPath + ' ' + resultItem);
                    $.log("ghostpig warnning [widget type - " + widgetType + '] is not approve, please try "tpl,vm,js,css,handlebars" again ');
                    return;
                }
            }

            //{%widget name=" "%}
            var widgetStr = widgetArray;

            //如果没有name 则直接下一个
            if (widgetName == "")return;

            var widgetDir = '/widget/' + widgetName;
            //widget 目录
            var fileDir = path.normalize(jdf.currentDir + widgetDir);


            var placeholder = '';
            var dirExists = f.exists(fileDir);
            if (dirExists) {
                var files = fs.readdirSync(fileDir);
                //循环这个WIDGET里面的所有文件
                files.forEach(function (item) {
                    //less,scss文件转换成css文件
                    var itemOrgin = item;
                    item = $.getCssExtname(item);

                    //tpl,css,js路径中含有widgetName前缀的才引用 ---> 名字完全一样才引用

                    //单个文件
                    var fileUrl = path.join(fileDir, item);
                    var staticUrl = '' + widgetDir + '/' + item;

                    //css Compile
                    var cssCompileFn = function (staticUrl) {
                        var cssLink = staticUrl;
                        //gp build
                        if (isBuild) {
                            //目前暂时设定为本地测试
                            if (jdf.config.testcdn) {
                                if (cssLink.charAt(0) == "/")cssLink = LocalServer + cssLink;
                                else cssLink = LocalServer + "/" + cssLink;
                            }
                            cssLink = $.placeholder.cssLink(cssLink);
                            G("head").append(cssLink);
                        } else if (isRelease || isOutput) {
                            cssLink = $.placeholder.cssLink(cssLink);
                            if (jdf.config.output.combineWidgetCss) {
                                //less,sass文件从编译后的bgCurrent读取
                                if ($.is.less(itemOrgin) || $.is.sass(itemOrgin)) {
                                    var fileUrlTemp = jdf.bgCurrentDir + staticUrl;
                                    cssFile += f.read(fileUrlTemp) + '\n\r';
                                } else {
                                    cssFile += f.read(jdf.bgCurrentDir + staticUrl) + '\n\r';
                                }
                            } else {
                                if (jdf.config.output.cssCombo && nowcdn) {
                                    cssComboArr.push(staticUrl);
                                } else {
                                    G("head").append(cssLink);
                                }
                            }
                        }

                        /*
                         if (isJM){
                         origin = $.placeholder.insertHead(origin,cssLink);
                         }*/
                        filesListObj[staticUrl] = 1;
                    }

                    //js Compile
                    var jsCompileFn = function (staticUrl) {
                        var jsLink = staticUrl;
                        //如果是gp isbuild

                        if (isBuild) {
                            //目前暂时设定为本地测试
                            if (jdf.config.testcdn) {
                                if (jsLink.charAt(0) == "/")jsLink = LocalServer + jsLink;
                                else jsLink = LocalServer + "/" + jsLink;
                            }
                            jsLink = $.placeholder.jsLink(jsLink);
                            if (jdf.config.build.jsPlace === "insertHead")G("head").append(jsLink);
                            else G("body").append(jsLink);
                        }
                        //如果是gp release 或者 gp isOutput
                        else if (isRelease || isOutput) {
                            jsLink = $.placeholder.jsLink(jsLink);
                            if (jdf.config.output.combineWidgetJs) {
                                //合并所有widget中的js文件至widgetOutputName
                                jsFile += f.read(jdf.currentDir + staticUrl) + '\n\r';
                            } else {
                                if (jdf.config.output.jsCombo && nowcdn) {
                                    jsComboArr.push(staticUrl);
                                } else {
                                    if (jdf.config.build.jsPlace === "insertHead")G("head").append(jsLink);
                                    else G("body").append(jsLink);
                                }
                            }
                        }
                        /*
                         if (isJM){
                         origin = $.placeholder.insertBody(origin,jsLink);
                         }*/
                        filesListObj[staticUrl] = 1;
                    }

                    /**
                     * @build widget tpl/vm
                     */
                    //vm编译
                    var vmCompileFn = function (vmContent) {
                        var fileUrlDirname = path.dirname(fileUrl) + '/';
                        var dataSourceContent = {};
                        var dataSourceUrl = fileUrlDirname + widgetName + $.is.dataSourceSuffix;
                        try {
                            if (f.exists(dataSourceUrl)) {
                                var temp = f.read(dataSourceUrl);
                                if (temp && temp != '')  dataSourceContent = JSON.parse(temp);
                            }
                        } catch (e) {
                            $.log(dataSourceUrl);
                            $.log(e);
                            return;
                        }


                        var dataObj = $.merageObj(dataSourceContent, widgetData);

                        //vm处理
                        try {
                            if (dataObj && vmContent && jdf.config.output.vm) {
                                var vmRander = Vm.rander(vmContent, dataObj, fileUrlDirname);

                                //vm继承js/css
                                if (vmRander.url.js) {
                                    vmRander.url.js.forEach(function (item) {
                                        jsCompileFn(item);
                                    })
                                }

                                if (vmRander.url.css) {
                                    vmRander.url.css.forEach(function (item) {
                                        cssCompileFn(item);
                                    })
                                }
                                return vmRander.content;
                            }
                        } catch (e) {
                            $.log('ghostpig erro [ghostpig.buildWidget] - velocityjs');
                            $.log(e);
                        }

                        return vmContent;
                    }

                    //handlebar编译
                    var handlebarsCompileFn = function (hbContent) {
                        var fileUrlDirname = path.dirname(fileUrl) + '/';
                        var dataSourceContent = {};
                        var dataSourceUrl = fileUrlDirname + widgetName + $.is.dataSourceSuffix;
                        try {
                            if (f.exists(dataSourceUrl)) {
                                var temp = f.read(dataSourceUrl);
                                if (temp && temp != '')  dataSourceContent = JSON.parse(temp);
                            }
                        } catch (e) {
                            $.log(dataSourceUrl);
                            $.log(e);
                            return;
                        }


                        var dataObj = $.merageObj(dataSourceContent, widgetData);


                        //handlebars处理
                        try {
                            if (dataObj && hbContent && jdf.config.output.handlebars) {

                                var vmRander = Handlebars.rander(hbContent, dataObj, fileUrlDirname);

                                //handlebars继承js/css
                                if (vmRander.url.js) {
                                    vmRander.url.js.forEach(function (item) {
                                        jsCompileFn(item);
                                    })
                                }

                                if (vmRander.url.css) {
                                    vmRander.url.css.forEach(function (item) {
                                        cssCompileFn(item);
                                    })
                                }
                                //调用<template>
                                var T=cheerio.load(vmRander.content,{decodeEntities: false});
                                var template=T("template");
                                if(template.length>0){
                                    template.each(function(){

                                        var _this=G(this);
                                        var name=_this.attr("name");
                                        var data=_this.data();
                                        var _filename=widgetName+"_"+name;
                                        var templatetitle=_filename + ".handlebars";
                                        var templatefile = fileDir + "/" + templatetitle;
                                        if(_this.find("link").length>0 || _this.find("script").length>0){
                                            $.error(templatefile+" is error with <link> or <script>","ghost buildwidget");
                                        }
                                        else {
                                            if (name) {

                                                if (f.exists(templatefile)) {
                                                    var templatecontent = f.read(templatefile, jdf.config.ContentType);
                                                    templatecontent = Handlebars.rander(templatecontent, data, false);
                                                    _this.replaceWith(templatecontent);
                                                }
                                                else{
                                                    $.error(templatefile+" is not exist","ghost buildwidget");
                                                }
                                            }
                                            else{
                                                $.error(widgetName+" widget has a wrong template","ghost buildwidget");
                                            }
                                        }
                                    });
                                    vmRander.content= T.html();
                                }


                                return vmRander.content;
                            }
                        } catch (e) {
                            $.log('ghostpig erro [ghostpig.buildWidget] - hadnelbars');
                            $.log(e);
                        }

                        return hbContent;
                    }

                    //tpl vm Compile
                    var tmplCompileFn = function (isVm) {
                        placeholder = f.read(fileUrl, jdf.config.ContentType);
                        //替换模板中的cssLink/jsLink

                        if (isOutput) placeholder = staticUrlReplace(placeholder);
                        if (isVm) {
                            placeholder = vmCompileFn(placeholder);
                        }
                        fileUrl = f.pathFormat(path.join(widgetDir, item));
                        var typeHtml = '';
                        if (widgetType) typeHtml = '[' + widgetType + ']';
                        if (jdf.config.build.widgetIncludeComment) {
                            if (widgetComment === 'false' || notwrite) return;
                            placeholder = '\r\n<!-- ' + typeHtml + ' ' + fileUrl + ' -->\r\n' + placeholder + '\r\n<!--/ ' + fileUrl + ' -->\r\n';
                        }
                    }

                    //handlebars Compile
                    var tmplCompileFn_b = function (is) {
                        placeholder = f.read(fileUrl);
                        //替换模板中的cssLink/jsLink

                        if (isOutput) placeholder = staticUrlReplace(placeholder);
                        if (is) {
                            placeholder = handlebarsCompileFn(placeholder);
                        }


                        fileUrl = f.pathFormat(path.join(widgetDir, item));
                        var typeHtml = '';
                        if (widgetType) typeHtml = '[' + widgetType + ']';

                        if (jdf.config.build.widgetIncludeComment && widgetcomment !== false) {
                            if (widgetComment === 'false' || notwrite) {
                                return;
                            }
                            var defaultcomment=typeHtml + " " + fileUrl;
                            if(widgetcomment!="")defaultcomment=widgetcomment;
                            placeholder = '\r\n<!-- ' + defaultcomment + ' -->\r\n' + placeholder + '\r\n<!--/ ' + fileUrl + ' -->';

                        }
                    }

                    //吧widget目录下所有不是页面的handlebars预编译 添加到js里面去
                    var addTemplatetojs=function(hname){
                         placeholder = f.read(fileUrl);
                         var templatename=hname;
                         var placeholder=Handlebars.precomplies(placeholder,templatename,jdf.config.build.alias.Handlebars);
                         var jsfile=widgetDir+"/"+widgetName+".js";
                         jsbgfile=path.normalize(jdf.bgCurrentDir + jsfile);
                         jsfile=path.normalize(jdf.currentDir + jsfile);
                         if(f.exists(jsfile)){
                             var jsplaceholder= f.read(jsfile);
                             placeholder=jsplaceholder+"\n\n\n"+placeholder;
                             f.write(jsbgfile,placeholder,jdf.config.ContentType);
                         }
                    }
                    //tpl
                    if ($.is.tpl(item) && buildTag.tpl && (item == widgetName + $.is.tplSuffix)) {
                        tmplCompileFn(true);
                    }

                    //vm
                    if ($.is.vm(item) && buildTag.vm && item == widgetName + $.is.vmSuffix) {
                        tmplCompileFn(true);
                    }

                    //handlebars
                    if ($.is.handlebars(item) && buildTag.handlebars && item == widgetName + $.is.handlebarsSuffix) {
                        tmplCompileFn_b(true);
                    }
                    else if($.is.handlebars(item) && buildTag.handlebars && item.indexOf(widgetName)>-1){
                        addTemplatetojs(item);
                    }

                    /**
                     * @build widget css
                     */

                    if ($.is.css(item) && !filesListObj[staticUrl] && buildTag.css && item == widgetName + $.is.cssSuffix) {
                        cssCompileFn(staticUrl);
                    }

                    /**
                     * @build widget js
                     */
                    if ($.is.js(item) && !filesListObj[staticUrl] && buildTag.js && item == widgetName + $.is.jsSuffix) {
                        jsCompileFn(staticUrl);
                    }
                });
                /*
                 if (isJM){
                 origin = origin.replace(widgetStr,placeholder);
                 }*/
                //替换掉{%widget name="base"%}
                //content = content.replace(widgetStr,placeholder);
                if (!notwrite)G(_this).replaceWith(G(placeholder));
            } else {
                $.log('ghostpig warning [ghostpig.buildWidget] ' + widgetStr + ' widget ' + widgetName + ' does not exist.');
            }
            return placeholder;
        }

        result.each(function (i, r, content) {
            var _this = this;
            setwidget.call(this, G, _this)
        });

        G("img").each(function () {
            var _this = G(this);
            var src = _this.attr("src");
            if (src && src.indexOf("{")<0 && src.indexOf("images")<0) {
                var staticsrc = projectPathReplace(src);
                if (staticsrc.charAt(0) == "/")staticsrc = staticsrc.substr(1);
                var imgcdn=(nowcdn == jdf.config.combocdn)?jdf.config.comborealcdn : nowcdn;
                staticsrc = imgcdn + "/" + staticsrc;
                _this.attr("src", staticsrc);
            }

        });

        content = G.html();

        //release output处理
        if (isRelease || isOutput) {
            //修改为默认取配置文件中的widgetOutputName 2014-5-24
            var pkgName = jdf.config.widgetOutputName;
            //var pkgName = path.basename(inputPath).replace('.html', '');

            var outputDir = jdf.bgCurrentDir;
            var outputCss = '/' + jdf.config.cssDir + '/' + pkgName + '.css';
            var outputJs = '/' + jdf.config.jsDir + '/' + pkgName + '.js';

            var cssOutputDir = '/' + jdf.config.cssDir.replace(jdf.config.baseDir + '/', '') + '/';
            var jsOutputDir = '/' + jdf.config.jsDir.replace(jdf.config.baseDir + '/', '') + '/';
            if (isOutput) {
                if (nowcdn) {
                    outputCss = '/' + jdf.getProjectPath() + cssOutputDir + pkgName + '.css';
                    outputCss = $.replaceSlash(outputCss);
                    outputCss = nowcdn + outputCss;

                    outputJs = '/' + jdf.getProjectPath() + jsOutputDir + pkgName + '.js';
                    outputJs = $.replaceSlash(outputJs);
                    outputJs = nowcdn + outputJs;
                } else {
                    outputCss = addgetProjectPath(cssOutputDir + pkgName + '.css');
                    outputJs = addgetProjectPath(jsOutputDir + pkgName + '.js');
                }
            }


            //seajsAddCdn
            content = seajsAddCdn(content);

            //widgetUrlAddCdn
            content = widgetUrlAddCdn(content);

            //css链接加前缀
            if (jdf.config.output.combineWidgetCss && cssFile != '') {
                var cssLink = $.placeholder.cssLink(outputCss);
                content = $.placeholder.insertHead(content, cssLink);
                f.write(path.normalize(outputDir + '/' + jdf.config.cssDir + '/' + pkgName + '.css'), cssFile);
            } else if (jdf.config.output.cssCombo && cssComboArr.length) {
                cssComboArr = $.uniq(cssComboArr);
                var outputCss1 = '/' + jdf.getProjectPath() + '??' + cssComboArr.join(',');
                outputCss1 = nowcdn + $.replaceSlash(outputCss1);
                var cssLink1 = $.placeholder.cssLink(outputCss1);
                content = $.placeholder.insertHead(content, cssLink1);
            }

            //js链接加前缀
            if (jdf.config.output.combineWidgetJs && jsFile != '') {
                var jsLink = $.placeholder.jsLink(outputJs);
                content = buildWidget.insertJs(content, jsLink, jdf.config.output.jsPlace);
                f.write(path.normalize(outputDir + '/' + jdf.config.jsDir + '/' + pkgName + '.js'), jsFile);
            } else if (jdf.config.output.jsCombo && jsComboArr.length) {
                jsComboArr = $.uniq(jsComboArr);
                var outputJs1 = '/' + jdf.getProjectPath() + '??' + jsComboArr.join(',');
                outputJs1 = nowcdn + $.replaceSlash(outputJs1);
                var jsLink1 = $.placeholder.jsLink(outputJs1);
                content = buildWidget.insertJs(content, jsLink1, jdf.config.output.jsPlace);
            }

        }
    } else {

        if (isRelease || isOutput) {
            //seajsAddCdn
            content = seajsAddCdn(content);
        }

        if (isOutput) {
            //widgetUrlAddCdn
            content = widgetUrlAddCdn(content);
        }
    }

    var data = {
        origin: origin,
        tpl: content,
        css: cssFile,
        js: jsFile
    }

    if (callback) callback(data);
}


/**
 * @insertJs
 * @(考虑到性能 insertHead -> insertBody) -> 放head有利于前后端沟通,可通过配置修改
 * @jdf.config.output.jsPlace 'insertHead' --> header ; 'insertBody' --> body
 */
buildWidget.insertJs = function (content, jsLink, jsPlace) {
    if (jsPlace == 'insertHead') {
        content = $.placeholder.insertHead(content, jsLink);
    } else if (jsPlace == 'insertBody') {
        content = $.placeholder.insertBody(content, jsLink);
    }
    return content;
}

/**
 * @非widget引用, 原页面上的静态资源css, js链接替换处理: js直接加cdn, css链接根据配置是否combo加cdn
 * @param {String} str 源代码
 * @return {String} 替换后的源代码
 * @example
 <link type="text/css" rel="stylesheet"  href="../app/css/main.css" />
 <link type="text/css" rel="stylesheet"  href="../app/css/less.css" />
 ==>
 <link type="text/css" rel="stylesheet"  href="http://cdnul.com/??productpath/css/main.css,productpath/css/less.css" />

 <script type="text/javascript" src="../app/js/common.js"></script>
 ==>
 <script type="text/javascript" src="http://cdnul.com/productpath/js/common.js"></script>
 */

//
function staticUrlReplace(str) {
    var replaceCore = function (str, type) {
        var regStr = $.reg[type + 'Str'];
        var reg = new RegExp(regStr, 'gm');
        var regResult = str.match(reg);
        if (regResult) {
            var comboArray = [];
            regResult.forEach(function (item) {

                var reg = new RegExp(regStr, 'gm');
                var i = reg.exec(item);
                var cdnRegStr = jdf.config.cdnDefalut ? jdf.config.cdnDefalut : nowcdn;
                // if(!jdf.config.cdn)cdnRegStr=LocalServer;
                var cdnReg = new RegExp(cdnRegStr + '/', 'gm');
                var k = i['input'];

                var strReplace = function () {
                    if (!/href="\/\//.test(k)) {
                        if (k.indexOf("\r\n") > -1)str = str.replace(k + '\r\n', '');
                        else str = str.replace(k, '');
                    }
                }
                //bug
                if (i && !cdnReg.test(i[1]) && !$.is.httpLink(i[1])) {
                    //var t = i[1].replace(cdnReg, '');
                    //comboArray.push(t);
                    strReplace();
                }

                if (i && !$.is.httpLink(i[1])) {

                    //url
                    var j = i[1];

                    j = projectPathReplace(j);//获取相对路径（不含../）

                    var widgetReg = new RegExp('^' + jdf.config.widgetDir, 'gm');
                    if (!widgetReg.test(j)) {
                        comboArray.push(j);
                        strReplace();
                    }
                }
            });

            //$.log(comboArray);
            if (comboArray.length > 0) {
                comboArray = $.uniq(comboArray);//去掉重复的元素
                var tagSrc = '';

                //combo
                if (jdf.config.output[type + 'Combo'] && nowcdn) {
                    var cdnPrefix = '';
                    cdnPrefix = nowcdn +
                        (comboArray.length > 1 ? '/??' : '/')
                    ;

                    var comboUrl = comboArray.join(',');
                    comboUrl = comboUrl.replace(/\/\//gm, '/');
                    var staticUrl = cdnPrefix + comboUrl;
                    tagSrc = '' + $.placeholder[type + 'comboLink'](staticUrl);
                }
                //不combo的话循环输出各个标签
                else {
                    for (var i = 0; i < comboArray.length; i++) {
                        var item = comboArray[i];
                        item = nowcdn ? nowcdn + '/' + item : item;

                        item = addgetProjectPath(item);
                        tagSrc += $.placeholder[type + 'Link'](item);
                    }
                }

                //$.log(tagSrc);
                //if (/<\/head>/.test(str)) {
                if (type == 'js') {
                    str = buildWidget.insertJs(str, tagSrc, jdf.config.output.jsPlace);
                } else {
                    str = $.placeholder.insertHead(str, tagSrc);
                }
                //} else{
                //	str += tagSrc;
                //};
            }
        }
        return str;
    }

    var jsReplace = function (str, regStr) {
        var reg = new RegExp(regStr, 'gm');
        var regResult = str.match(reg);
        if (regResult) {
            regResult.forEach(function (item) {
                var reg = new RegExp(regStr, 'gm');
                var i = reg.exec(item);
                if (i && !$.is.httpLink(i[1])) {
                    //url
                    var j = i[1];
                    j = projectPathReplace(j);

                    //add cdn
                    if (nowcdn) {
                        j = '/' + j;
                        j = $.replaceSlash(j);
                        j = nowcdn + j;
                    }

                    j = addgetProjectPath(j);

                    //replace
                    var r = new RegExp(i[1], 'gm');
                    str = str.replace(r, j);
                }
            });
        }
        return str;
    }

    str = replaceCore(str, 'css');
    str = replaceCore(str, 'js');
    //str = jsReplace(str, $.reg.jsStr);
    return str;
}

/**
 * @seajs.use add prefix
 * @example
 *    seajs.use(['/a.js', '/b.js'],function(){}) ==>
 *    seajs.use(['projectPath/a.js', 'projectPath/b.js'],function(){})
 */
function seajsAddCdn(source) {
    var configBaseDir = jdf.config.baseDir ? jdf.config.baseDir + '/' : '';
    var tag = source.match(/seajs.use\((.*?)\S*[function)|]/gmi);
    if (tag) {
        var tempObj = {};
        for (var i = 0, j = tag.length; i < j; i++) {
            var t = tag[i].replace(/seajs.use\(|\[|\]|\)/gim, "");
            t = t.replace(/function\(/gim, "");
            var t1 = t.split(',');
            if (t1) {
                for (var m = 0; m < t1.length; m++) {
                    var t2 = t1[m].replace(/\"/g, '').replace(/\'/g, '');
                    //js和widget的路径,'js/a.js'的不做替换
                    var t1R = new RegExp(jdf.config.jsDir + '/|' + jdf.config.widgetDir + '/', 'gm');
                    if (t1R.test(t2) && !$.is.httpLink(t2) &&
                        ( t2.charAt(0) == '/' || t2.charAt(0) == '\\' || t2.charAt(0) == '.' )
                        ) {
                        tempObj[t2] = projectPathReplace(t2);
                    }
                }
            }
        }

        for (var i in  tempObj) {
            var reg = new RegExp(escape(i), 'gim');
            source = source.replace(reg, tempObj[i]);
        }
    }
    return source;
}

/**
 * @addgetProjectPath
 */
function addgetProjectPath(str) {
    if (!jdf.config.cdn && !/^\.\./.test(str)) {
        str = '..' + str;
    }
    return str;
}

/**
 * @引用widget文件下的img/cssLink/jsLink add cdn prefix
 * @example
 <img src="/widget/a/a.png"><img src='/widget/a/a.png'><img src='../widget/a/a.png'><img src="./widget/a/a.png">
 --->
 <img src="http://cdn.com/projectPath/widget/a/a.png">
 */
function widgetUrlAddCdn(source) {
    var configBaseDir = jdf.config.baseDir ? jdf.config.baseDir + '/' : '';
    var tag = source.match(/["|'][\\.]*\/widget\/\S*["|']/gmi);
    if (tag) {
        var tempObj = {};
        for (var i = 0, j = tag.length; i < j; i++) {
            var t = tag[i].replace(/["|']/gim, "");
            var t1 = t;
            if (jdf.config.cdn) {
                var t2 = '/' + jdf.getProjectPath() + t.replace(/^\.*/, "");
                t2 = $.replaceSlash(t2);
                t1 = jdf.config.cdn + t2;
            } else {
                t1 = addgetProjectPath(t1);
                t1 = $.replaceSlash(t1);
            }

            if (t != t1) {
                tempObj[t] = t1;
            }
        }
        for (var i in tempObj) {
            var reg = new RegExp(i, 'gim');
            source = source.replace(reg, tempObj[i]);
        }
    }
    return source;
}


/**
 * @projectPathReplace
 * @ctime 2014-7-5
 * @example
 /css/index.css
 ../css/index.css
 ==>
 projectPath/css/index.css
 */
function projectPathReplace(j) {
    j = j.replace(jdf.config.baseDir, '');

    if (jdf.config.cdn) {
        j = j.replace(/\.\.\//g, '/');
        //add projectPath
        j = jdf.getProjectPath() + j;
        // del ../  ./
        if (j.charAt(0) == '/') {
            j = j.replace('/', '');
        }
        // 替换./和//为/
        j = j.replace(/\/\/|\.\//gm, '/');
    }

    // // ==> /
    j = j.replace(/\/\//gm, '/');
    return j;
}

