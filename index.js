var through = require('through2');
var path = require('path'); // 获取路径

/**
* 合并对象
* @global
* @param {Object} defaultObj 默认的对象
* @param {Object} addobj 要合并的对象
* @return {Object} 返回修改值后的默认对象
*/
function extend(defaultObj, addobj) { // 合并对象
    if (!addobj) {
        return defaultObj;
    }
    defaultObj = defaultObj || {};
    for (var item in addobj) {
        if (addobj[item]) {
            defaultObj[item] = addobj[item];
        }
    }
    return defaultObj;
}

module.exports = replaceText;

/**
 * 替换内容里的css路径
 * @param {Object} options  处理参数
 * @returns {String}
 */
function replaceText(options) {
    options = extend({extname: 'wxss'}, options);

    var ret = through.obj(function (file, enc, cb) {
        // 如果文件为空，不做任何操作，转入下一个操作，即下一个 .pipe()

        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        // 插件不支持对 Stream 对直接操作，跑出异常
        if (file.isStream()) {
            // this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            this.push(file);
            return cb();
        }
        var _filepath = file.path,
            _extname = path.extname(_filepath);

        if (_extname && _extname.toLowerCase() === '.wxss') {
            var content = contentHandle(file.contents.toString(), options);
            file.contents = new Buffer(content);
        }

        // 下面这两句基本是标配啦，可以参考下 through2 的API
        this.push(file);
        cb();
    });

    return ret;
}

/**
 * 处理内容
 * 
 * @param {String} text 需要处理的文本
 * @param {Object} options 处理参数
 * @returns {String}
 */
function contentHandle(text, options) {
    // 处理@import url(xxxx.css)
    text = text.replace(new RegExp('\\s*(?!@import )url\\(([^\'"\\n\\r$)]*.css)\\s*\\);*', 'gi'), function($1, $2) {
        return setContText(options, $1, $2);
    });

    // 处理@import url("xxxx.css")
    text = text.replace(new RegExp('\\s*(?!@import )url\\((?:\'|")([^\'"\\n\\r$)]*.css)\\s*(?:\'|")\\);*', 'gi'), function($1, $2) {
        return setContText(options, $1, $2);
    });

    // 处理@import "xxxx.css"
    text.replace(new RegExp('\\s*(?!@import )(?:\'|")([^\'\\n\\r"$)]*.css)\\s*(?:\'|")(\\s|\'|"|$|;)', 'gi'), function($1, $2) {
        return setContText(options, $1, $2);
    });

    return text;
}

/**
 * 设置替换的文本内容
 *
 * @param {Object} options 处理参数
 * @param {String} param 完整内容
 * @param {String} param1 url
 * @returns {String}
 */
function setContText(options, param, param1) {
    var res;
    var textArr;
    if (param1) {
        textArr = (param1 + '').split('.');
        if (textArr[textArr.length - 1].toLowerCase() === 'css') {
            textArr[textArr.length - 1] = options.extname || 'css';
            res = ' "' + textArr.join('.') + '";';
        }
    }
    return res || param;
}