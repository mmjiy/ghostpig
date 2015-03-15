/**
 * upload的处理类，用svn模式
 * Created by Bosco on 2015/3/3.
 */
var svn=require("./svn.js");
var $=require("./base.js");
var f=require("./file.js");
var ghostpig=require("./jdf.js");


var gp=function(){
    if(ghostpig){
        if(!ghostpig.isreadconfig){
            ghostpig=ghostpig.getConfig();
        }
        if(!ghostpig.bgCurrentDir && ghostpig.bgMkdir){
            ghostpig.bgMkdir();
        }
    }
    else{
        return null;
    }
}

exports.init=function(argv,config){
    if(!argv){
        $.error("no arguments","svn upload");
    }
    var action=argv[3],
        p1=argv[4],
        p2=argv[5];
    if(action=="-html"){
        ghostpig.bgMkdir();
        ghostpig.bgCopyDir();
        ghostpig.buildMain("build");
        if(p1) {
            if(p1.indexOf(".html")<0)p1=p1+".html";

            uploadhtml(p1);
        }
        else{
            /*$.askbool("You enter none page,whether you upload all html?",function(){
                $.log("You must enter a name to upload");
            },function(){
                uploadhtml();
            })*/
            uploadhtml();
        }
    }
    else{
        $.log("you should enter upload -html or ");
    }

};

var uploadhtml=exports.uploadhtml=function(html,callback){
    gp();
    var htmlDir= ghostpig.bgCurrentDir+"/"+ghostpig.config.htmlDir;
    if(f.exists(htmlDir)) {
        $.log("upload to svn","upload html");
        var username=ghostpig.config.svn.name,
            password=ghostpig.config.svn.password,
            url=ghostpig.config.svn.html+"/"+ghostpig.config.svn.name;
        //单个html
        if (html) {
            var path=htmlDir+"/"+html;
            if (f.exists(path)) {
                url=url+"/"+html;
                svn.svn_save(url,path,username,password,function(e,result){
                    if(e){
                        $.log("upload htmldir sucess","upload html");
                        $.isFunction(callback) && callback.call(null,true);
                    }
                    else{
                        $.error(result,"upload html");
                        $.isFunction(callback) && callback.call(null,false);
                    }
                },true);
            }
            else $.error("file '" + path + "' is not exist", "upload html");
        }
        //目录
        else {
            svn.svn_save(url,htmlDir,username,password,function(e,result){
                if(e){
                    $.log("upload htmldir sucess","upload html");
                    $.isFunction(callback) && callback.call(null,true);
                }
                else{
                    $.error(result,"upload html");
                    $.isFunction(callback) && callback.call(null,false);
                }
            },true);
        }
    }
    else{
        $.error("your config of htmlDir '"+htmlDir+"' is not exist","upload html");
    }
}