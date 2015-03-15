/**
 * 这是测试test命令
 * Created by pocouser on 2015/2/28.
 */
//var svn=require("./svn.js");
var f=require("./file.js");

exports.init=function(argv){
    if(argv){
        var src="html/test.html";
        var html= f.read(src);
        require("./buildWidget.js").init(src,html,"build");

    }
    else{
        console.log("test must have pars");
    }
}
