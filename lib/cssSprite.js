/**
 * @css sprite
 * @ctime 2014-6-30
 * @todo : support repeat-x,repeat-y
 */
var $ = require('./base.js');
var f = require('./file.js');
var jdf = require('./jdf.js');

var path = require('path');
var Images = require('node-images');

var cssSprite = module.exports = {};

/**
 * @addgetProjectPath
 */
function addgetProjectPath(str){
	if(!jdf.config.cdn && !/^\.\./.test(str)){
		str = '..'+str;
	}
	return str ;
}

/**
 * @imagesUrlAddCdn
 */
function imagesUrlAddCdn(imageUrl){
	var res ='';
	if(jdf.config.cdn){
		res = $.replaceSlash(imageUrl);
		res = jdf.config.cdn + res;
	}else{
		res = addgetProjectPath(imageUrl+'.css');
	}
	return  res;
}

/**
 * @init
 * @param {String} source css路径文件夹
 */
cssSprite.init = function(source){
	cssSprite.core(source);
}
/**
 * @core
 * @param {String} source css路径
 * @param {String} content css源码内容
 * @example
 	background:#ffd4ae url(i/i-arrws.png?__sprite) no-repeat;
	--> 
	background:#ffd4ae url(i/sptire_menu.png?__sprite) no-repeat;background-position:12px 10px;
 */
cssSprite.core = function(source){
   	var reg_background = /background(?:-image)?:([\s\S]*?)(?:;|$)/gi;
   	var reg_img_url = /url\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^)}]+)\s*\)/i;
	var reg_position = /(0|[+-]?(?:\d*\.|)\d+px|left|right)\s*(0|[+-]?(?:\d*\.|)\d+px|top)/i;
	var reg_repeat = /\brepeat-(x|y)/i;
	var reg_is_sprite = /[?&]__sprite/i;

	
	var result = [];
	var resultNew = [];
	var maxWidth = 0;
	var heightTotal = 0;
	var margin = jdf.config.output.cssSpriteMargin;//高度阈值

	var cssFiles = f.getdirlist(source, '.css$');
	var background = [];
	cssFiles.forEach(function(file, index){
		var content = f.read(file);
		var cssBg = content.match(reg_background);
		var dir = path.dirname(file);

		if(cssBg){
			cssBg.forEach(function(bg, index){
				background.push({
					bg: bg,
					dir: dir
				});
			});
		}
	});
	
	if(background){
		var resultTemp = {};
		background.forEach(function(item, index){
			var img_url = item.bg.match(reg_img_url);

			if(img_url && reg_is_sprite.test(img_url[0]) ){
				var res = {
					content:null,
					url:null,
					position:null,
					repeat:null
				};

				var url = img_url[0].replace(/url\(|\)|\'|\"/gi,'');

				res.urlOrigin = url;
				url = url.replace(reg_is_sprite, '');
				res.url = path.join(item.dir, url);

				if(f.exists(res.url)){
					res.content = Images(res.url);
				
					//去重
					if(!resultTemp[res.url]){
						res.item = item.bg;
						res.width = res.content.size().width;
						res.height = res.content.size().height;
						if(res.width > maxWidth){
							maxWidth = res.width;
						}
						heightTotal += res.height + margin;

						if(item.bg.match(reg_position)){
							res.position = item.bg.match(reg_position)[0];
						}
						if(item.bg.match(reg_repeat)){
							res.repeat = item.bg.match(reg_repeat)[0];
						}
						result.push(res);
					}
					resultTemp[res.url] = res.url;
					
				}else{
					console.log('jdf warning: [' + res.url + '] may be not exist.');
				}
			}
		});
	}

	if(result.length>0){
		var outputName = jdf.getProjectPath().replace(/\//g, '_');
        if(outputName=="")outputName=jdf.config.outputDirName;
		var outputExtname = '.png';

		var imagesOutput = Images(maxWidth, heightTotal);
		var h = 0;
		result.forEach(function(item, i){
			if(!item.repeat){
				var positonArray = [];
				var x = 0, y = h, y2 = -h;

				if(item.position){
					var position = item.position.split(' ');
					var x1 = parseInt(position[0], 10);
					if(x1){ 
						x += x1;
					}
					var y1 = parseInt(position[1], 10);
					if(y1){
						y += y1;
						y2 -= y1;
					}
				}

				//绘制cssSprite图片
				imagesOutput.draw(item.content, 0, y);

				var urlOrigin = item.urlOrigin;

				//将需要合并的图片名称替换为合并后的新图片名称
				var urlOriginNew = urlOrigin.replace(path.basename(item.url, path.extname(item.url)), outputName);
				
				//将图片的存放目录统一替换为css/i
				urlOriginNew = urlOriginNew.replace(path.dirname(urlOriginNew), '/css/i');

				//给图片添加cdn
				urlOriginNew = imagesUrlAddCdn('/' + jdf.getProjectPath() + urlOriginNew);
				
				var backgroundNew = item.item.replace(urlOrigin, urlOriginNew);
				backgroundNew += 'background-position:'+x+'px '+y2+'px;';

				item['backgroundNew'] = backgroundNew;
				resultNew.push(item);
				
				h = h + item.height + margin;
			}
		});

		cssFiles.forEach(function(file, index){
			var content = escape(f.read(file));

			resultNew.forEach(function(item, index){

				//替换css中的图片路径
				content = content.replace(new RegExp(escape(item.item), 'gi'), escape(item.backgroundNew));
			});

			f.write(file, unescape(content));
		});
		
		//保存合并完成的cssSprite图片
        var proname=jdf.getProjectPath();
        proname=proname?"/"+proname:"";
        var outputDirName = jdf.config.outputDirName + proname +'/css/i/';
		f.mkdir(outputDirName);
		try{
			imagesOutput.save(outputDirName + outputName + outputExtname);
		}catch(e){
			console.log(e);
		}
	}
}
