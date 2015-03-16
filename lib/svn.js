/**
 * 这是一个SVN调用的测试
 * 目前只使用于window【mac linux 尚未测试】
 * 要求本身安装有svn,
 * Created by pocouser on 2015/2/28.
 */

var f=require("./file.js");
if(!f.isWin){
    $.log("bosco error:[svn is now support by window]")
    return;
}
var $=require("./base.js");
var child_process=require("child_process");
var ghostpig=require("./jdf.js");
var iconv=require("iconv-lite");
var path=require("path");
var exec=child_process.exec;
var ask;
var defaultname="";
var defaultpassword="";


var svnJsonDir = path.resolve(__dirname, '../lib/')+"/svnconfig.json";
//配置默认SVN
if(f.exists(svnJsonDir)) {

    var svnconfig = f.readJSON(svnJsonDir);
    if(svnconfig.name && svnconfig.password){
        defaultname=svnconfig.name;
        defaultpassword=svnconfig.password
    }
}

ask = $.ask;
iconv.skipDecodeWarning = true;

ghostpig.getConfig();
var debug=ghostpig.config.svn.debug;//1:浅度输出bug 2:深度输出BUG 0:不输出BUG

var svn_error=function(str,callback){
    if(debug)$.error(str,"ghostpig svn");
    callback && callback.call && callback.call(null,false,str);
}

var svn_exec =function(command,args,callback,errorback){
    if(!command)svn_error("svn_exec have no command insert");
    var command_args={timeout:15000,encoding:"binary"};
    if(debug===2)$.log(command);

    //复制和默认传递的command参数
    if(args && !(args.call)){
        for(var x in args){
            command_args[x]=args[x];
        }
    }
    else if(args && args.call){
        errorback=callback;
        callback=args;
    }



    var child=exec(command,command_args,function(error,a,b){
        if (error !== null) {
            b=iconv.decode(b,"GBK");
            debug && errorback && errorback.call && errorback.call(null,error,b);
            if(!errorback && debug===2){
                svn_error(b);
            }
            callback && callback.call && callback.call(null,false,b);
        }
        else {
            a=iconv.decode(a,"GBK");
            callback && callback.call && callback.call(null,true,a);
        }
    });
    child.on("error",function(){
        console.log("**************error**************");
        console.log(argument);
        console.log("**************error**************");
    })
    child.on("message",function(){
        console.log("**************message**************");
        console.log(argument);
        console.log("**************message**************");
    })
}




/**
 *
 * @param url svn地址
 * @param path 保存的路径
 * @param username svn用户名
 * @param password svn密码
 * @param callback svn checkout 返回函数
 * @returns {boolean}
 */
var svn_checkout=exports.svn_checkout=function(url,path,username,password,callback,opt){
    var name=username || defaultname,
        password=password  || defaultpassword,
        svnurl=url,
        target = path;
    //判断环境
    if(!name || !password){
        svn_error('"svn checkout" without name or password',callback);
        return false;
    }
    if(!svnurl){
        svn_error('"svn checkout" without svnurl',callback);
        return false;
    }
    if(!target){
        svn_error('"svn checkout" without target',callback);
        return false;
    }


    //使用command
    //ghostpig.bgMkdir();
    //var svnDir=ghostpig.bgCurrentSvnDir;
    target=target;
    /*
    if(f.exists(target)){
        svn_error('"svn checkout" your target is here.');
        return false;
    }*/
    var command="svn checkout "+url+" "+target+" --username "+name+" --password "+password;

    if(opt && opt.depth)command+=' --depth "'+opt.depth+'"';

    svn_exec(command,callback,function(error,b){
        if(error.killed){
            svn_error("svn.name or svn.password is unRight");
        }
        else{
            svn_error(b);
        }
    })

}




/**
 *
 * @param url svn地址
 * @param path 保存的路径
 * @param username svn用户名
 * @param password svn密码
 * @param callback svn checkout 返回函数
 * @returns {boolean}
 */
var svn_checkout_nosvn=exports.svn_checkout_nosvn=function(url,path,username,password,callback) {
    var dateTime=new Date(),
        seed=[
            dateTime.getFullYear(),
            dateTime.getMonth()+1,
            dateTime.getDate(),
            dateTime.getHours(),
            dateTime.getMinutes(),
            dateTime.getSeconds()
        ].join('_'),
        target=path+seed,
        name=username || defaultname,
        password=password  || defaultpassword;
    svn_checkout(url,target,username,password,function(e,result){
        f.copy(target,path);
        f.delAsync(target);
        callback && callback.call && callback.call(null,e,result)
    })
}



/**
 *
 * @param url svn地址
 * @param path 创建的路径
 * @param username svn用户名
 * @param password svn密码
 * @param callback svn checkout 返回函数
 * @returns {boolean}
 * bug:单个文件的时候如果SVN存在会出错
 */
var svn_add=exports. svn_add=function(url,path,username,password,callback){
    var name=username || defaultname,
        password=password  || defaultpassword,
        svnurl=url,
        target = path;
    //判断环境
    if(!name || !password){
        svn_error('"svn add" without name or password',callback);
        return false;
    }
    if(!svnurl){
        svn_error('"svn add" without svnurl',callback);
        return false;
    }
    if(!target){
        svn_error('"svn add" without target',callback);
        return false;
    }
    if(!f.exists(path)){
        svn_error('"svn add" your target is not here.',callback);
        return false;
    }
    //使用command
    var command = 'svn import -m "add by svn.js" ' + path + ' ' + url;
    var core=function(){
        svn_exec(command, callback, function (error, b) {
            svn_delete(url, username, password);
            svn_error(b,callback);
        })
    }
    //上传一个文件夹
    if(f.isDir(path)) {
        var mkdir_command = 'svn mkdir -m "add by svn.js" ' + url;
        svn_exec(mkdir_command, function (e, b) {
            if (e) {
                core();
            }
            else callback && callback.call && callback.call(null, e, b)
        }, function (error, b) {
            svn_error("'svn add' file has exist");
        })
    }
    //上传一个文件
    else{
        core();
    }


}


/**
 *
 * @param url svn地址
 * @param username svn用户名
 * @param password svn密码
 * @param callback svn checkout 返回函数
 * @returns {boolean}
 */
var svn_delete=exports.svn_delete=function(url,username,password,callback){
    var name=username || defaultname,
        password=password  || defaultpassword,
        svnurl=url,
        callback=callback||function(){}
    //判断环境
    if(!name || !password){
        svn_error('"svn delete" without name or password',callback);
        return false;
    }
    if(!svnurl){
        svn_error('"svn delete" without svnurl',callback);
        return false;
    }

    //command
    var command='svn delete -m "delete by svnjs" '+url;
    svn_exec(command,callback,function(error,b){
        svn_error(b);
    })
}


/**
 *
 * @param url svn地址
 * @param path 保存的路径
 * @param username svn用户名
 * @param password svn密码
 * @param callback svn checkout 返回函数
 * @returns {boolean}
 */
var svn_save=exports.svn_save=function(url,path,username,password,callback,force){
    var name=username || defaultname,
        password=password  || defaultpassword,
        svnurl=url,
        target = path;
    //判断环境
    if(!name || !password){
        svn_error('"svn save" without name or password',callback);
        return false;
    }
    if(!svnurl){
        svn_error('"svn save" without svnurl',callback);
        return false;
    }
    if(!target){
        svn_error('"svn save" without target',callback);
        return false;
    }
    if(!f.exists(path)){
        svn_error('"svn save" your upload file is not exist');
        return false;
    }
    //command
    var mkdir_command="svn log "+url;
    svn_exec(mkdir_command,function(e,b){
        //创建
        if(!e){
            if(b.indexOf("E160013")>-1 || b.indexOf("not found")){
                svn_error(b);
                svn_add(url,path,username,password,callback);
            }
            else{
                callback && callback.call && callback.call(null,false,b);
            }
        }
        //更新
        else{
            var core=function() {
                var dateTime=new Date();
                var svnDir = path+[
                    dateTime.getFullYear(),
                        dateTime.getMonth()+1,
                    dateTime.getDate(),
                    dateTime.getHours(),
                    dateTime.getMinutes(),
                    dateTime.getSeconds()
                ].join('_');
                f.mkdir(svnDir);
                //if(ghostpig.bgCurrentSvnDir.indexOf("\\svn\\")<0)svnDir = ghostpig.bgCurrentSvnDir + "/" + path;
                //在更新了SVN以后复制文件并提交
                var corea = function (e) {
                    if (e) {
                        f.copy(path, svnDir);
                        //添加到SVN
                        svn_exec("svn add " + svnDir + "/*", {timeout: 20000}, function (e) {
                            var command = 'svn commit -m "save by svnjs" ' + svnDir;
                            //提交SVN
                            svn_exec(command, function (e,b) {
                                callback && callback.call && callback.call(null, e,b);
                                setTimeout(function() {
                                    try {
                                        f.delAsync(svnDir);
                                    }catch(e){
                                        svn_error(e);
                                    }
                                },5000);
                            }, function (error, b) {
                                if (error.killed) {
                                    svn_error("svn.name or svn.password is uncurrect");
                                    svn_error(b);
                                }
                                else {
                                    svn_error(b);
                                }
                            })
                        }, function () {
                        })
                    }
                    else {
                        callback && callback.call && callback.call(null, false);
                    }
                }
                //如果保存的是一个目录
                if(f.isDir(path)) {
                    svn_checkout(url, svnDir, username, password, corea);

                }
                //如果保存的是一个文件
                else if(f.isFile(path)){
                    var ph=require("path");
                    var dateTime=new Date();
                    var svnDir = ph.dirname(path)+[
                        dateTime.getFullYear(),
                            dateTime.getMonth()+1,
                        dateTime.getDate(),
                        dateTime.getHours(),
                        dateTime.getMinutes(),
                        dateTime.getSeconds()
                    ].join('_');
                    var baseurl=ph.dirname(url),
                        basename=ph.basename(path),
                        newpath=svnDir+"/"+basename;
                    //var newname=basedir+"/"+basename;
                    svn_checkout(baseurl, svnDir, username, password, function(e,result){
                        if(e){
                            svn_exec('svn update "' + newpath+'"', function(e,result){
                                if(e){
                                    f.copy(path,newpath);
                                    var command = 'svn commit -m "save by svnjs" ' + newpath;
                                    svn_exec(command, function(e,result){
                                        f.delAsync(svnDir);
                                        callback && callback.call && callback.call(null,e,result);
                                    })
                                }
                                else {
                                    f.delAsync(svnDir);
                                    callback && callback.call && callback.call(null,e,result);
                                }
                            })
                        }else{
                            f.delAsync(svnDir);
                            callback && callback.call && callback.call(null,false,result);
                        }
                    },{depth:"empty"});
                }
            }
            if(!force) {
                $.askbool("this modules is existed,Are you continue to update?", function () {
                    callback && callback.call && callback.call(null, false, "svn save failed");
                }, core);
            }
            else{
                core();
            }
        }
    })
}

var svn_list=exports.svn_list=function(url,username,password,callback){
    var name=username || defaultname,
        password=password  || defaultpassword,
        svnurl=url,
        callback=callback||function(){}
    //判断环境
    if(!name || !password){
        svn_error('"svn delete" without name or password',callback);
        return false;
    }
    if(!svnurl){
        svn_error('"svn delete" without svnurl',callback);
        return false;
    }

    //command
    var command="svn list "+url+" --username "+username+" --password "+password;
    svn_exec(command,callback);
}

