const fs = require('fs').promises;
const path = require('path');

/**
 * 递归遍历路径,返回所有文件名
 * @param {String} dir 要遍历的文件夹名
 * @param {Function} filter 文件名过滤器,可以不传
 * @param {Function} cutter 对文件名进行裁剪,可以不传
 * @return {Array} 所有文件的完整文件名
 */
module.exports.walk = async function walk(dir, filter, cutter) {
    let files = await fs.readdir(dir);
    files = await Promise.all(files.map(async file => {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
            return this.walk(filePath, filter, cutter);
        } else if (stats.isFile()) {
            return filePath;
        }
    }));
    return files.reduce((all, folderContents) => {
        if (filter && !Array.isArray(folderContents)) {
            folderContents = filter(folderContents) ? folderContents : [];
        }
        if (cutter) {
            if (Array.isArray(folderContents)) {
                folderContents = folderContents.map(cutter);
            } else {
                folderContents = cutter(folderContents);
            }
            return all.concat(folderContents);
        } else {
            return all.concat(folderContents);
        }
    }, []);
};

/**
 * 文件扩展名过滤器
 * @param {String} ext 需要的文件扩展名
 * @param {Function} 对应的过滤器函数
 */
module.exports.extFilter = function(ext) {
    return function(file) {
        return path.extname(file) === ext;
    };
};

/**
 * 提取文件名的函数生成器
 * @param {String} ext 可选的扩展名,不传代表保留扩展名
 * @param {Function} 对应的函数
 */
module.exports.fileNameCutter = function(ext) {
    return function(file) {
        return path.basename(file, ext);
    };
};
