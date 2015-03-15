/**
 * @统一配置文件
 */

/**
 * @config Json File Content
 */
var configJsonFileContent = '{\r\n'+ 	
'	"host": "ftpServerIp",\r\n'+	
'	"user": "anonymous",\r\n'+
'	"password": "anonymous",\r\n'+
'	"projectPath": ""\r\n'+
'}';

module.exports = {
	//"threads":4, 多线程
	//"isbackup":true,
	//"backupPath":"d:/ppa",
    "projectPath":"",
	"demo": "http://putaoshu.github.io/jdf/download/jdf_demo.tar?true",//demo示例url
	//"jdj": "http://putaoshublog.sinaapp.com/lab/jdf_module/jdj.tar?1",
	//"jdm": "http://putaoshublog.sinaapp.com/lab/jdf_module/jdm.tar?1",

	"configFileName": "config.json", //配置文件名称
	
	"host": null, //远端机器IP
	"user": null, //远端机器user
	"password": null, //远端机器password

	"baseDir": "", //静态文件名称
	"cssDir": "css", //css文件夹名称
	"imagesDir": "css/i", //images文件夹名称
	"jsDir": "js", //js文件夹名称
	"htmlDir": "html", //html文件夹名称
	"widgetDir": "widget", //widget文件夹名称
	"buildDirName": "html", //编译的html文件夹名称
	
	"outputDirName": "build", //输出文件夹名称
	"outputCustom": null, //自定义输出文件夹
	"widgetOutputName": "widget", //输出的所有widget合并后的文件名
    "ContentType":"utf8",

	"localServerPort": 1080, //本地服务器端口
	"haslog":true,
	"configJsonFileContent": configJsonFileContent,
	
	"cdn": "http://localhost:1080", //静态cdn域名
    "combocdn": "http://cb-c.poco.cn/pocowap",//combo cdn
    "comborealcdn":"http://cb-c.poco.cn/assets/pocowap",//combo 对应的真实cdn
    "testcdn":"http://photo.poco.cn/special/wx_app",
    "programcdn":"http://localhost:1080",



	"serverDir": "www.poco.cn", //上传至远端服务器文件夹的名称
	"previewServerDir": "www.poco.cn", //html文件夹上传至服务器所在的文件夹名称
	"widgetServerDir": "cb-c.poco.cn", //widget服务器所在的文件夹名称

    "local":true,

	"build":{
		"jsPlace": "insertBody", //调试时js文件位置 insertHead|insertBody
		"widgetIncludeComment":true,//widget引用带注释
		"livereload":false, //是否开启liveload
		"sass":true,//是否开启sass编译
		"less":true,//是否开启less编译
		"csslint":false,//是否开启csslint
        "buildserver":false,
        "alias":{
            "Handlebars":"H"
        },
        "overalljs":[],
        "overallcss":[]
	},

	"output":{
		"concat": {},//文件合并

		"cssImagesUrlReplace": true,//css中图片url加cdn替换
		"jsPlace": "insertBody", //编译后js文件位置 insertHead|insertBody
		"cssCombo": true, //css进行combo
		"jsCombo": true, //js进行combo todo

		"combineWidgetCss":false,//合并所有引用的widget中的css
		"combineWidgetJs":false,//合并所有引用的widget中的js

		"hasBanner": true, //压缩后的js和css是否有banner前缀
		"vm": true, //是否开启vm编译
        "handlebars":true,
		"compressJs": true,//是否开启压缩js文件
		"compressCss": true,//是否开启压缩css文件
		"compressPng": true,//是否开启压缩png图片

		"comment": true,//是否输出文件中的注释

		"cssSprite": true, //是否开启css sprite功能
		"cssSpriteMargin": 10, //css sprite图片之间的间距
		"imagesSuffix": false,//图片后缀

		"jsRemove": []//移除js中函数或者方法,比如console,y.log即配置为['console','y.log']
	},

	"widget":{
		//widget预览所依赖的js
		"js": [],
		//widget预览所依赖的css
		"css": [],
		//新建widget文件夹的文件类型
		"createFiles": ["vm"]
	},
    "svn":{
        "html":"https://poco:8443/svn/html",
        "code":"https://poco:8443/svn/code",
        "program":"https://poco:8443/svn/test",
        "widget":"https://poco:8443/svn/widget",
        "htmlonlinedir":"online",
        "name":"",
        "password":"",
        "svnwidget":"",
        "debug":2
    }
}