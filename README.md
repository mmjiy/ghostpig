# 参考jdf
# GhostPig doc

config.json说明

{
    "localServerPort": 1080,                                 //本地测试端口【同一个项目最好测试的端口都一致】
    "cdn": "http://172.18.4.201:1080",                       //本地测试的路径
    "combocdn": "http://cb-c.poco.cn/pocowap",               //combo 服务器存放的SVN
    "comborealcdn":"http://cb-c.poco.cn/assets/pocowap",     //combo 服务器对应的真实目录路径【为了WIDGET CSS里面的图片能够正常显示】
    "testcdn":"http://m.poco.cn/vision/test",                //html 存放测试的html的路径
    "programcdn":"http://m.poco.cn/vision/test/viewcode",    //项目存放的路径

    "svn":{
        //HTML发布的SVN
        "html":"http://svn.poco.cn:8088/repos/htdocs232_repo/poco/new_mobile/vision/test/html",

        //js/css/image 的combo svn
        "code":"http://svn.poco.cn:8088/repos/htdocs232_repo/poco/combo/assets/pocowap",

        //项目存放的svn
        "program":"http://svn.poco.cn:8088/repos/htdocs232_repo/poco/new_mobile/vision/test/viewcode",

        //widget库的svn
        "widget":"http://svn.poco.cn:8088/repos/htdocs232_repo/poco/combo/assets/widget",

        //是否开启svn的debug信息(0,1,2)
        "debug":0
    },
    "ContentType":"GBK", //设置项目的编码(默认是utf8)
    "build":{
        "widgetIncludeComment":false,  //是否使用widget注释
        "alias":{
            "Handlebars":"H"           配置seajs 依赖
        }
    }
}



**配置的URL都不要以斜线结尾

命令说明:

    install[i]      install init dir, demo,svn
    build[b]        build project
      -open xxx     build and open a page
      -intime       save html|tpl|handlebars file auto to svn for test
      -nosvn        build without svn

    upload          upload html for test
      -html         upload output your own custom dirname

    widget
      -all          preview all widget
      -list         get widget list from server
      -preview xxx  preview a widget
      -install xxx  install a widget to local
      -publish xxx  publish a widget to server
      -create xxx   create a widget to local

    online          package and svn to server
      -no           package but no svn to server
    -h              get help information
    -v              get the version number


###


### update
2015-03-10


