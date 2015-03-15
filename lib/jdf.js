/**
 * @jdf
 */
var path = require('path');
//var fs = require('fs');
var util = require('util');

//lib自身组件
var $ = require('./base.js');
var f = require('./file.js');
var Server = require('./server.js');
var Compress = require('./compress.js');
var Openurl = require("./openurl.js");
var Widget = require("./widget.js");
var Config = require("./config.js");
var Log = require("./log.js");
var BuildCss = require("./buildCss.js");
var BuildWidget = require("./buildWidget.js");
var Output = require("./output.js");
var FindPort = require('./findPort');
var FileLint = require('./fileLint');
var FileFormat = require('./FileFormat');
var FtpUpload = require('./ftpUpload');
var boscotest = require('./boscotest.js');

//外部组件
var Node_watch = require('node-watch');
var Livereload = require('./livereloadServer');

//define
var jdf = module.exports;

/**
 * @配置项
 */
jdf.config = Config;

/**
 * @commoder help
 */
jdf.help = function () {
    var content = [];
    content = content.concat([
        '',
        '  Usage: ghostpig <Command>',
        '',
        '  Command:',
        '',
        '    install[i]      install init dir, demo,svn',
        //'  init            project directory init',
        '    build[b]        build project',
        '      -open xxx     build and open a page',
        '      -intime       save html|tpl|handlebars file auto to svn for test',
        '      -nosvn        build without svn',
        '',
        '    upload          upload html for test',
        '      -html         upload output your own custom dirname',
        '',
        '    widget',
        '      -all          preview all widget',
        '      -list         get widget list from server',
        '      -preview xxx  preview a widget',
        '      -install xxx  install a widget to local',
        '      -publish xxx  publish a widget to server',
        '      -create xxx   create a widget to local',
        //'    -w            watch upload output files to remote sever',
        '',
        '    online       package and svn to server',
        '      -no           package but no svn to server ',
        '    -h              get help information',
        '    -v              get the version number',
        ''
    ]);
    $.log(content.join('\n'));
}

/**
 * @总的初始化函数 from ../index.js
 * @commander
 */
jdf.init = function (argv) {

    //读取配置文件
    jdf.getConfig(function (configData) {
        var cmd2 = argv[2];
        jdf.currentDir = f.currentDir();

        if (argv.length < 3 || cmd2 === '-h' || cmd2 === '--help') {
            Log.send('help');
            jdf.help();

        } else if (cmd2 === '-v' || cmd2 === '--version') {
            Log.send('version');
            jdf.version();

        } else if (cmd2 === 'svnconfig') {
            var svnJsonDir = path.resolve(__dirname, '../lib/');
            var cmd3=argv[3],cmd4=argv[4];
            if(cmd3=="show"){
                f.readJSON(svnJsonDir+"/svnconfig.json",function(svnconfig){
                    $.log("svn name is '"+svnconfig.name+"'\n"+"password is '"+svnconfig.password+"'");
                })

            }
            else {
                if (cmd3 && cmd4) {
                    var svnconfig={};
                    svnconfig.name=cmd3;
                    svnconfig.password=cmd4;
                    var svnJsonDir = path.resolve(__dirname, '../lib/');
                    f.write(svnJsonDir+"/svnconfig.json",JSON.stringify(svnconfig));
                    $.log("svn config complete.","ghost svnconfig");
                }
                else{
                    $.error("you should enter 'svnconfig <svnname> <password>'");
                }
            }

        } else if (cmd2[0] === '-') {
            Log.send('help');
            jdf.help();

        } else if (cmd2 === 'i' || cmd2 === 'install') {

            var core=function(type) {
                var username=argv[5],
                    password=argv[6],
                    svnurl=argv[4],
                    svn=require("./svn.js");
                if(username && password && svnurl) {
                    svn.svn_checkout(svnurl, "./", username, password, function (e, str) {
                        if (e) {
                            $.log("you install program success", "ghostpig install")
                        }
                        else {
                            $.error(str);
                        }
                    });
                }
                else{
                    $.error("ghost install [svnurl] [username] [password]","ghost install");
                }
            }
            switch (argv[3]) {
                case  'demo':
                    Log.send('install-demo');
                    jdf.install('demo')
                    return;
                case  'init':
                    Log.send('install-init');
                    jdf.install('init')
                    return;
                case 'svn':{
                    core();
                    return;
                }
                default:
                    $.log('You can "ghostpig install demo" or "ghostpig install init"');
            }

        }
        else if(jdf.isreadconfig) {

            if (cmd2 === 'b' || cmd2 === 'build') {
                Log.send('build');
                jdf.argvInit('build', argv);

            } /*else if (cmd2 === 'r' || cmd2 === 'release') {
             Log.send('release');
             jdf.argvInit('release', argv);

             } else if (cmd2 === 'o' || cmd2 === 'output') {
             Log.send('output');
             jdf.argvInit('output', argv);

             } */
            else if (cmd2 === 'online') {

                Log.send('online...');
                if (argv[3] != '-no')argv[3] = "-html";
                jdf.argvInit('output', argv);
            } else if (cmd2 === 'u' || cmd2 === 'upload') {

                if (jdf.config.svn.name && jdf.config.svn.password) {
                    var SvnUpload = require("./svnupload.js");
                    SvnUpload.init(argv, configData);
                }
                else {
                    Log.send('upload');
                    FtpUpload.init(argv, configData);
                }

            } /*else if (cmd2 === 'c' || cmd2 === 'compress') {
             Log.send('compress');
             Compress.dir(argv[3], argv[4]);

             //widget
             }*/
            else if (cmd2 === 'w' || cmd2 === 'widget') {
                var cmd3 = argv[3], cmd4 = argv[4], cmd5 = argv[5];
                var force = cmd5 != 'undefined' && cmd5 == '-force' ? true : false

                if (cmd3 == '-all' || cmd3 == '-a') {
                    Log.send('widget-all');
                    Widget.all(cmd4);
                    return;
                }

                if (cmd3 == '-list' || cmd3 == '-l') {
                    Log.send('widget-list');
                    Widget.list(cmd4);
                    return;
                }

                var hasCmd4 = function () {
                    if (cmd4) {
                        return true;
                    } else {
                        $.log('ghostpig tips [ghostpig.init] Please input widget name');
                        return false;
                    }
                }

                var widgetCmd = function () {
                    var content = [];
                    content = content.concat([
                        '',
                        '  Command:',
                        '',
                        '    widget',
                        '      -all     preview all widget',
                        '      -list    get widget list from server',
                        '      -preview xxx 	preview a widget',
                        '      -create  xxx 	create a widget to local',
                        ''
                    ]);
                    $.log(content.join('\n'));
                }

                if (cmd3) {
                    if ((cmd3 == '-preview' || cmd3 == '-pre') && hasCmd4()) {
                        Log.send('widget-preview');
                        Widget.preview(cmd4);

                    } else if ((cmd3 == '-install' || cmd3 == '-i') && hasCmd4()) {
                        Log.send('widget-install');
                        Widget.install(cmd4, force);

                    } else if ((cmd3 == '-publish' || cmd3 == '-p') && hasCmd4()) {
                        Log.send('widget-publish');
                        Widget.publish(cmd4, force);

                    } else if ((cmd3 == '-create' || cmd3 == '-c') && hasCmd4()) {
                        Log.send('widget-create');
                        Widget.create(cmd4);

                    }
                    else {
                        widgetCmd();
                    }
                }
                if (!cmd3) {
                    widgetCmd();
                }

                //extra commands
                //server
            } /*else if (cmd2 === 'server') {
             Log.send('server');
             Server.init('./', jdf.config.localServerPort, jdf.config.cdn, jdf.getProjectPath(), true);
             $.log('ghostpig server running at http://localhost:' + jdf.config.localServerPort + '/');

             //file lint
             } else if (cmd2 === 'lint' || cmd2 === 'l') {
             var cmd3 = argv[3];
             var filename = (typeof(cmd3) == 'undefined') ? f.currentDir() : cmd3;
             Log.send('file lint');
             FileLint.init(filename);

             //file format
             } else if (cmd2 === 'format' || cmd2 === 'f') {
             var cmd3 = argv[3];
             var filename = (typeof(cmd3) == 'undefined') ? f.currentDir() : cmd3;
             Log.send('file format');
             FileFormat.init(filename);

             //clean
             } else if (cmd2 === 'clean') {
             Log.send('clean');
             jdf.clean();

             //todo: beautiful/jsbin/
             } */ else if (cmd2 == "test") {
                boscotest.init(argv);
            }
            else {
                $.log('ghostpig error [ghostpig.init] invalid option: ' + cmd2 + ' \rType "ghostpig -h" for usage.');
            }
        }
        else{
            $.error("no config.json in this dir","ghostpig")
        }
    });
};

/**
 * @输入命令的初始化 build, release, output
 */
jdf.argvInit = function (runType, argv, callback) {

    if (runType == 'build' || runType == 'release') {
        if (runType == 'build' && typeof(argv[3]) != 'undefined' && argv[3] == '-css') {
            jdf.buildCss();
        } else {
            var autoOpenurl = false, comboDebug = false , package = false, intime = false,nosvn=false;
            if (typeof(argv[3]) != 'undefined') {
                if (argv[3] == '-open' || argv[3] == '-o') {
                    if (argv[4] && argv[4].charAt(0)!="-")autoOpenurl = argv[4];
                    else autoOpenurl = true;
                }
                if (argv[3] == '-intime' || argv[4] == '-intime' || argv[5] == '-intime') {
                    intime = true;
                }
                if (argv[3] == '-nosvn' || argv[4] == '-nosvn' || argv[5] == '-nosvn') {
                    nosvn=true;
                }
                if (argv[4] == '-open' || argv[4] == '-o') {
                    if (argv[5])autoOpenurl = argv[5];
                    else autoOpenurl = true;
                }
            }
            jdf.bgMkdir();
            jdf.bgCopyDir();
            jdf.buildMain(runType);

            jdf.bgbuildcss();
            //Compress.cssImagesUrlReplace();

            var core=function(e){
                if(e) {
                    jdf.server(autoOpenurl, comboDebug, function (data) {
                        jdf.watch(runType, callback, data, intime);
                    });
                }
            }
            if(nosvn===false) {
                var svn = require("./svnupload.js");
                svn.uploadhtml("", core);
            }
            else{
                core(true);
            }
        }
    } else if (runType == 'output') {
        jdf.bgMkdir();

        var _bgdir = jdf.bgCurrentDir + "_" + Math.random();
        f.renameFile(jdf.bgCurrentDir, _bgdir);
        f.delAsync(_bgdir);
        f.mkdir(jdf.bgCurrentDir);

        jdf.bgMkdir();
        jdf.bgCopyDir();
        jdf.buildMain(runType);

        //默认
        var outputType = 'default' , outputList, isbackup = false, isdebug = false, nosvn = false;

        if (typeof(argv[3]) != 'undefined') {
            var cmd3 = argv[3];
            var cmd4 = argv[4];

            //custom自定义
            outputType = 'custom';
            outputList = cmd3;

            //debug(不压缩)
            if (cmd3 == '-debug' || cmd4 == '-debug') {
                isdebug = true;
                if (!cmd4) outputType = 'default';
            }

            //hashtml
            if (cmd3 == '-html' || cmd3 == '-h' || cmd3 == '-no') {
                outputType = 'hashtml';
                outputList = null;
            }

            if (cmd3 == '-no') {
                nosvn = true;
            }

            //backup
            if (cmd3 == '-backup' || cmd4 == '-backup') {
                outputType = 'backup';
                isbackup = true;
                if (cmd4 == '-backup') {
                    outputType = 'custom';
                    outputList = cmd3;
                }
            }
        } else {
            //按配置项来输出
            if (jdf.config.outputCustom) {
                outputType = 'custom';
                outputList = jdf.config.outputCustom;
            }
        }

        try {
            Output.init({
                type: outputType,
                list: outputList,
                isbackup: isbackup,
                isdebug: isdebug,
                callback: callback,
                nosvn: nosvn
            });
        } catch (e) {
            $.log(e);
        }
    }
}


jdf.bgbuildcss=function(){
    var dir=jdf.bgCurrentDir;
    var cssfiles= f.getdirlist(dir);
    var path=require("path");

    for(var n=0;n<cssfiles.length;n++){
        var item=cssfiles[n];
        if($.is.css(item)){
            var itema=path.relative(dir,item);
            itema="/"+path.dirname(itema)+"/";
            itema=itema.replace(/\\/g,"/");
            var result= f.read(item);
            f.write(item,Compress.cssImagesUrlReplace(item, result, jdf.config.cdn, itema));
        }
    }
}

/**
 * @读取jdf version
 */
jdf.version = function () {
    var package = require('../package.json');
    $.log(package.version);
}

/**
 * @读取配置文件config.json, 覆盖默认配置
 */
jdf.getConfig = function (callback) {

    var res = null;
    var url = f.currentDir() + '/' + jdf.config.configFileName;
    if (f.exists(url)) {
        try {
            var data = f.read(url);
            if (data) {
                data = JSON.parse(data);
                if (typeof(data) == 'object') {
                    data = $.merageObj(jdf.config, data);
                    jdf.isreadconfig=true;
                }
                //$.log(data);
                res = data;

                var svnJsonDir = path.resolve(__dirname, '../lib/')+"/svnconfig.json";
//配置默认SVN
                if(f.exists(svnJsonDir)) {

                    var svnconfig = f.readJSON(svnJsonDir);
                    if(svnconfig.name && svnconfig.password){
                        jdf.config.svn.name=svnconfig.name;
                        jdf.config.svn.password=svnconfig.password
                    }
                }
            }
            //if(callback) callback(res);
        } catch (e) {

            $.log('ghostpig error [ghostpig.getConfig] - config.json format error');
            $.log(e);
            return jdf;
        }
        if (callback) callback(res);
        else return res;
    } else {
        if (callback) callback(res);
        else return jdf;
    }
}

/**
 * @工程后台文件夹生成
 * @jdf.bgCurrentDir 为后台文件根目录
 */
jdf.bgMkdir = function () {

    var list = [ 'HOME', 'LOCALAPPDATA', 'APPDATA'];
    var temp;
    for (var i = 0, len = list.length; i < len; i++) {
        if (temp = process.env[list[i]]) {
            break;
        }
    }
    if (temp) {
        temp = temp || __dirname + '/../';
        temp += '/.jdf-temp/';
        temp = path.normalize(temp);
        f.mkdir(temp);

        //创建文件夹
        var creatDir = function (filename) {
            var dir = path.normalize(temp + '/' + filename + '/');
            f.mkdir(dir);
            jdf[filename + 'Dir'] = dir;
        };

        //项目缓存文件夹
        creatDir('cache');
        //项目temp文件夹
        creatDir('temp');
        //项目lib文件夹
        //todo:自动从服务器下载最新版的jdj和jdm,现在是需要install手动下载
        creatDir('lib');
        //creatDir('jdj');
        //creatDir('jdm');

        creatDir('backup');

        creatDir('svn');

        //复制当前项目至temp文件夹(除outputdir)
        //取得当前工程名
        var currentDirName = path.basename(jdf.currentDir);
        jdf.bgCurrentDir = path.normalize(jdf.tempDir + '/' + currentDirName);
        jdf.bgCurrentSvnDir = path.normalize(jdf.svnDir + '/' + currentDirName);
        jdf.bgCurrentDirName = currentDirName;
        f.mkdir(jdf.bgCurrentDir);
        f.mkdir(jdf.bgCurrentSvnDir);
    }
}

jdf.bgMkdir_package = function () {
    var list = [ 'HOME', 'LOCALAPPDATA', 'APPDATA'];
    var temp;
    for (var i = 0, len = list.length; i < len; i++) {
        if (temp = process.env[list[i]]) {
            break;
        }
    }
    if (temp) {
        temp = temp || __dirname + '/../';
        temp += '/.jdf-temp/';
        temp = path.normalize(temp);
        f.mkdir(temp);

        //创建文件夹
        var creatDir = function (filename) {
            var dir = path.normalize(temp + '/' + filename + '/');
            f.mkdir(dir);
            jdf[filename + 'Dir'] = dir;
        };

        //项目缓存文件夹
        creatDir('cache');
        //项目temp文件夹
        creatDir('temp');
        //项目lib文件夹
        //todo:自动从服务器下载最新版的jdj和jdm,现在是需要install手动下载
        creatDir('lib');
        //creatDir('jdj');
        //creatDir('jdm');

        creatDir('backup');
        creatDir('svn');

        //复制当前项目至temp文件夹(除outputdir)
        //取得当前工程名
        var currentDirName = path.basename(jdf.currentDir);
        var subpath = jdf.config.projectPath;
        var basepath = path.normalize(jdf.tempDir + '/' + jdf.config.outputDirName);
        jdf.bgCurrentDir = basepath;
        jdf.bgCurrentDirName = currentDirName;
        f.mkdir(jdf.bgCurrentDir);
        f.mkdir(jdf.bgCurrentDir + "/" + subpath);
    }
}


/**
 * @复制当前项目至工程后台目录
 * @仅copy app,html,widget, config文件
 */
jdf.bgCopyDir = function () {
    if (jdf.config.baseDir != '' || jdf.config.outputCustom) {
        f.copy(jdf.currentDir + '/' + jdf.config.baseDir, jdf.bgCurrentDir + '/' + jdf.config.baseDir);
    }

    f.copy(jdf.currentDir + '/' + jdf.config.cssDir, jdf.bgCurrentDir + '/' + jdf.config.cssDir);
    f.copy(jdf.currentDir + '/' + jdf.config.imagesDir, jdf.bgCurrentDir + '/' + jdf.config.imagesDir);
    f.copy(jdf.currentDir + '/' + jdf.config.jsDir, jdf.bgCurrentDir + '/' + jdf.config.jsDir);

    f.copy(jdf.currentDir + '/' + jdf.config.htmlDir, jdf.bgCurrentDir + '/' + jdf.config.htmlDir);
    f.copy(jdf.currentDir + '/' + jdf.config.widgetDir, jdf.bgCurrentDir + '/' + jdf.config.widgetDir);
    f.copy(jdf.currentDir + '/' + jdf.config.configFileName, jdf.bgCurrentDir + '/' + jdf.config.configFileName);

}
/**
 * @FOR jdf build -package | -p
 */
jdf.bgCopyDir_package = function () {
    var subpath = jdf.config.projectPath;
    var outputDirName = jdf.config.outputDirName;
    var currentbasepath = jdf.currentDir + "/" + outputDirName + "/" + subpath;
    var bgCurrentbasepath = jdf.bgCurrentDir + "/" + subpath;
    $.log(currentbasepath + "\n" + bgCurrentbasepath);
    if (jdf.config.baseDir != '' || jdf.config.outputCustom) {
        f.copy(currentbasepath + '/' + jdf.config.baseDir, bgCurrentbasepath + '/' + jdf.config.baseDir);
    }

    f.copy(currentbasepath + '/' + jdf.config.cssDir, bgCurrentbasepath + '/' + jdf.config.cssDir);
    f.copy(currentbasepath + '/' + jdf.config.imagesDir, bgCurrentbasepath + '/' + jdf.config.imagesDir);
    f.copy(currentbasepath + '/' + jdf.config.jsDir, bgCurrentbasepath + '/' + jdf.config.jsDir);

    f.copy(currentbasepath + '/' + jdf.config.htmlDir, bgCurrentbasepath + '/' + jdf.config.htmlDir);
    f.copy(currentbasepath + '/' + jdf.config.widgetDir, bgCurrentbasepath + '/' + jdf.config.widgetDir);
    f.copy(currentbasepath + '/' + jdf.config.configFileName, bgCurrentbasepath + '/' + jdf.config.configFileName);
}


/**
 * @屏幕打点器
 * @time 2014-3-14 07:08
 * @example
 *    begin: jdf.dot.begin()  end: jdf.dot.end();
 */
jdf.dot = {
    timer: null,
    begin: function () {
        this.date = new Date();
        process.stdout.write('.');
        this.timer = setInterval(function () {
            process.stdout.write('.');
        }, 1000);
    },
    end: function (haslog) {
        var haslog = typeof(haslog) == 'undefined' ? true : haslog;
        if (this.timer) {
            var date = new Date();
            clearInterval(this.timer);
            if (haslog) {
                $.log('\r\nghostpig spend ' + (date - this.date) / 1000 + 's');
            } else {
                $.log();
            }
        }
    }
}

/**
 * @从服务器端下载文件 todo:检查版本号
 */
jdf.download = function (pathItem, targetDir) {
    var url = jdf.config[pathItem];
    var cacheDir = path.normalize(jdf.cacheDir + '/' + pathItem + '.tar');

    $.log('ghostpig downloading');
    jdf.dot.begin();

    f.download(url, cacheDir, function (data) {
        if (data == 'ok') {
            f.tar(cacheDir, targetDir, function () {
                $.log('\r\nghostpig [' + pathItem + '] install done');
                jdf.dot.end(false);
            });
        } else if (data == 'error') {
            jdf.dot.end(false);
        }
    })
}

/**
 * @从服务器端下载jdj, jdm, demo 或其它文件
 */
jdf.install = function (param) {
    jdf.bgMkdir();

    /**
     widget模块安装走jdf widget -install widget/header
     $.log('jdf downloading');
     jdf.download('jdj', jdf.libDir);
     jdf.download('jdm', jdf.libDir);
     */
    if (param == 'demo') {
        jdf.download('demo', jdf.currentDir);
    } else if (param == 'init') {
        jdf.createStandardDir();
    }
}

/**
 * @服务器
 * @param {Boolse}
    autoOpenurl true: html/index.html存在的话则打开, 不存在打开 http://localhost:3000/
 autoOpenurl false: 只启动不打开网页
 * @param {Boolse}  comboDebug 联调/线上调试模式
 */
jdf.server = function (autoOpenurl, comboDebug, callback) {
    var localServerPort = jdf.config.localServerPort;
    FindPort(localServerPort, function (data) {
        if (!data) {
            $.log('findPort : Port ' + localServerPort + ' has used');
            localServerPort = (localServerPort - 0) + 1000;
            jdf.config.localServerPort = localServerPort;
        }
        Server.init(jdf.bgCurrentDir, localServerPort, jdf.config.cdn, jdf.getProjectPath(), comboDebug);
        if (typeof(autoOpenurl) != 'undefined' && autoOpenurl) {
            var homepage = '/' + jdf.config.htmlDir + '/index.html';
            if ($.isString(autoOpenurl)) {
                if (autoOpenurl.indexOf(".html") > -1) {
                    homepage = '/' + jdf.config.htmlDir + '/' + autoOpenurl;
                    jdf.openurl('http://localhost:' + localServerPort + homepage);
                }
                else {
                    if (autoOpenurl.indexOf(".php") < 0){
                        homepage = '/' + autoOpenurl + ".php";

                    }
                    else {
                        homepage = '/' + autoOpenurl;
                    }
                    jdf.openurl('http://localhost:' + localServerPort + homepage);
                }

            }
            else {
                if (!f.exists(jdf.currentDir + homepage) && homepage.indexOf(".html") < 0) {
                    homepage = '';
                }
                jdf.openurl('http://localhost:' + localServerPort + homepage);
            }
        }

        $.log('ghostpig server running at http://localhost:' + localServerPort + '/');
        if (callback) callback(data);
    });
}

/**
 * @检测路径是否为项目文件夹内路径 即 baseDir htmlDir widgetDir configFile
 * @param {String} filename 文件路径
 */
jdf.checkProjectDir = function (filename) {
    var dirname = filename.replace(jdf.currentDir, '');
    dirname = dirname.replace(/\\/, '');

    if (/^\//.test(dirname)) dirname = dirname.replace(/\//, '');

    var checkTag = false;
    var checkProjectDir = function (i, j) {
        var reg = new RegExp('^' + i);
        if (reg.test(j)) {
            return true;
        } else {
            return false;
        }
    }

    if (checkProjectDir(jdf.config.baseDir, dirname)
        || checkProjectDir(jdf.config.htmlDir, dirname)
        || checkProjectDir(jdf.config.widgetDir, dirname)
        || checkProjectDir(jdf.config.configFileName, dirname)
        ) {
        checkTag = true;
    }
    if(dirname.indexOf(jdf.config.outputDirName+"\\")>-1){
        checkTag=false;
    }
    return checkTag;
}

/**
 * @watch && Livereload
 * @复制有变动的文件
 */
jdf.watch = function (type, callback, data,issvn) {

    if (!data) {
        //如果有另外一个进程那么livereload会直接关闭
        jdf.config.build.livereload = false;
        //$.log("another jdf process running , jdf livereload closed");
    }

    //livereload
    if (jdf.config.build.livereload) Livereload.init();

    var regStr = '\\.(vm|tpl|handlebars|shtml|html|js|css|less|sass|scss|json|' + $.imageFileType() + ')$';
    var reg = new RegExp(regStr);

    //todo初始化时前后台文件夹同步
    Node_watch(jdf.currentDir, function (filename) {
        //文件过滤
        if (f.isFile(filename)) {
            if (!reg.test(filename)) return;
        }
        var target = jdf.bgCurrentDir + filename.replace(jdf.currentDir, '');
        if (jdf.checkProjectDir(filename) && f.isFile(filename)) {
            if (f.exists(filename)) {
                $.log("you edit file '"+filename+"' with do it!");
                f.copy(filename, target, regStr);
                //build
                jdf.buildMain(type);
                jdf.bgbuildcss();

                //svn
                if(issvn && ($.is.html(filename) || $.is.tpl(filename) || $.is.vm(filename) || $.is.handlebars(filename))){
                    var svn=require("./svnupload.js");
                    if($.is.html(filename)){
                        svn.uploadhtml(require("path").basename(target));
                    }
                    else svn.uploadhtml();
                }
                //livereload
                if (jdf.config.build.livereload) Livereload.reloadBrowser([target]);
                if (callback) callback(filename);
            } else {
                f.del(target, function () {
                    if (callback) callback(filename);
                });
            }
        }
    });

    if (callback) callback();
}

/**
 * @openurl
 * @todo : 仅打开一次
 */
jdf.openurl = function (url) {
    if (typeof(url) == 'undefined') {
        var url = "http://localhost:3000/html/index.html";
    }
    Openurl.open(url);
}

/**
 * @自动刷新
 * @todo

 jdf.refresh = function(){
			
	}
 */

/**
 * @获取当前项目父级目录
 * @1. d:\product\index\trunk ===> d:\product/index
 * @2. d:\product\index\branches\homebranches ===> d:\product/index
 * @3. d:\product\index\homebranches ===> d:\product
 */
jdf.getProjectParentPath = function (currentDir) {
    var nowDir = '';
    if (/branches/.test(currentDir)) {
        nowDir = path.resolve(currentDir, '../', '../');
    } else if (/trunk/.test(currentDir)) {
        nowDir = path.resolve(currentDir, '../');
    }
    return nowDir;
}

/**
 * @获取项目前缀名字
 * @仅从配置文件中取,不再支持branch/trunk 2014-5-24
 * @del --> 1. d:\product\index\trunk ===> product/index
 * @del --> 2. d:\product\index\branches\homebranches ===> product/index
 * @del --> 3. d:\product\index\homebranches ===> product
 */
jdf.getProjectPath = function () {
    var currentDir = f.currentDir() , nowDir = '', result = '';
    if (jdf.config.projectPath != null) {
        result = jdf.config.projectPath;
    } else {
        //当前文件夹的文件夹命名为projectPath 2014-6-9
        result = path.basename(f.currentDir());
        /*
         nowDir = jdf.getProjectParentPath(currentDir);

         if (nowDir) {
         nowDir = nowDir.split(path.sep);
         var nowDirArrayLength = nowDir.length;
         result = nowDir[nowDirArrayLength-2] +'/'+ nowDir[nowDirArrayLength-1];
         }*/
    }

    return result;
}


/**
 * @当含有jdj jdm 模块时写放当前文件一次*/
var writeJMOnce = false;


/**
 * @build widget, css(sass, less)
 */
jdf.buildMain = function (type) {
    var builddir = '/' + jdf.config.buildDirName + '/';
    var basedir = jdf.currentDir + builddir;
    //build css
    BuildCss.init(jdf.config.cssDir, jdf.bgCurrentDir + '/' + jdf.config.cssDir);//格式化CSSDIR中的SASS LESS
    BuildCss.init(jdf.config.widgetDir, jdf.bgCurrentDir + '/' + jdf.config.widgetDir);//格式化widgetDir 中的SASS LESS

    //widget build
    //判断是否存在HTML目录，如若有，则WIDGET初始化，把模块COPY到基础的HTML文件【其中JS和CSS合并成COMBO】
    if (f.exists(basedir)) {
        var basedirlist = f.getdirlist(basedir, '.html');
        basedirlist.forEach(function (source) {
            var target = path.normalize(jdf.bgCurrentDir + builddir + source.replace(basedir, ''));
            var content=f.read(source,jdf.config.ContentType);
            BuildWidget.init(source, content, type, function (data) {
                f.write(target, data.tpl,jdf.config.ContentType);

                if (writeJMOnce) {
                    f.write(source, data.origin);
                }

                return 'ok';
            });
        });
    }
}


/**
 * @项目工程目录初始化
 * @time 2014-2-19 10:21:37
 */
jdf.createStandardDir = function () {
    var dirArray = [];
    dirArray[0] = jdf.config.baseDir;
    dirArray[1] = jdf.config.cssDir;
    dirArray[2] = jdf.config.imagesDir;
    dirArray[3] = jdf.config.jsDir;
    dirArray[4] = jdf.config.htmlDir;
    dirArray[5] = jdf.config.widgetDir;

    for (var i = 0; i < dirArray.length; i++) {
        f.mkdir(dirArray[i]);
    }

    var fileArray = [];
    fileArray[0] = jdf.config.configFileName;
    fileArray[1] = jdf.config.htmlDir + '/index.html';

    var templateDir = path.resolve(__dirname, '../template/');

    for (var i = 0; i < fileArray.length; i++) {
        if (!f.exists(fileArray[i])) f.write(fileArray[i], f.read(templateDir + '/' + fileArray[i]));
    }
    $.log('ghostpig project directory init done!');
}

/**
 * @清除项目缓存文件夹
 */
jdf.clean = function () {
    jdf.bgMkdir();
    f.del(jdf.tempDir, function () {
        $.log('ghostpig cache dir clean done');
    });
}


/**
 * @在当前文件下编译less/sass
 */
jdf.buildCss = function () {
    $.log('ghostpig buildCss ...');
    var currentDir = jdf.currentDir;
    BuildCss.init(currentDir, currentDir);

    var regStr = '\\.(less|sass|scss)$';
    var reg = new RegExp(regStr);

    Node_watch(currentDir, function (filename) {
        if (f.isFile(filename)) {
            if (!reg.test(filename)) return;
        }

        $.log(filename.replace(currentDir, ''));
        BuildCss.init(currentDir, currentDir);
    });
}