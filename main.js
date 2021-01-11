const path = require('path')
const fs = require('fs')
const { default: Axios } = require('axios')
const httpProxy = require('http-proxy');
const { request } = require('http')
var https = require('https');
const { promisify } = require('util');
const { readdir, stat, mkdir } = require("fs").promises
const { join } = require("path")
const cheerio = require('cheerio')

const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Pragma': 'no-cache',
    'Proxy-Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Origin': 'https://www.showdoc.com.cn',
    'Referer': 'https://www.showdoc.com.cn/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36'
}
const token = "88ff3b65d32d2e3f1069cfcc1957dcc743986bd80b936bd83d612ba728080c15"
function downloadPage(parentName, pageName, pageId) {
    parentName = parentName.replace(/\//g, '-');
    pageName = pageName.replace(/\//g, '-');
    Axios.post('https://www.showdoc.cc/server/index.php?s=/api/page/info',
        { "page_id": pageId, "user_token": token },
        { headers }
    )
        .then(res => {
            var filepath = "./" + parentName;
            var p = ".";
            for (let i = 0; i < filepath.split(",").length; i++) {
                p += `/${filepath.split(",")[i]}`
                if (!fs.existsSync(p)) {
                    fs.mkdirSync(p);
                }
            }
            if (res.data.data.page_content.length < 1) {
                console.log(filepath, res.data)
            }
            if (fs.existsSync(p + '/' + pageName + '.md')) {
                return;
            }
            fs.writeFile(p + '/' + pageName + '.md', res.data.data.page_content, { 'flag': 'a' }, function (err) {
                if (err) {
                    console.log(p + '/' + pageName + '.md', '写入失败！！！！！！！！！！！！！！！！！！！！！！！！')
                }
                console.log(p + '/' + pageName + '.md', 'ok!', 'success!!!!!!!');
            });

        })
}
function tree(parentList) {
    parentList.forEach(parent => {
        if (parent.pages.length > 0) {
            parent.pages.forEach(page => {
                downloadPage(parent.cat_name, page.page_title, page.page_id)
            })
        } else {
            parent.catalogs.forEach(f => { f.cat_name = parent.cat_name + "," + f.cat_name })
            tree(parent.catalogs)
        }
    })
}
const rootDir = "doc"
async function start() {
    var res = await Axios.post("https://www.showdoc.cc/server/index.php?s=/api/item/myList", { "user_token": token }, { headers });
    for (let idx = 0; idx < res.data.data.length; idx++) {
        const f = res.data.data[idx];
        var obj = (await Axios.post("https://www.showdoc.com.cn/server/index.php?s=/api/item/info", { "user_token": token, "item_id": f.item_id, "default_page_id": 0 }, { headers })).data
        parentList = obj.data.menu.catalogs;
        parentList.forEach(pp => {
            pp.cat_name = rootDir + "," + obj.data.item_name + "," + pp.cat_name
        })
        tree(parentList)
    }
}
//start()
async function convertDoc() {
    if (!fs.existsSync(docFilePath)) {
        console.log('路径不存在，', docFilePath)
        return;
    };
    var doc = fs.readFileSync(docFilePath).toString();
    doc = doc.replace(/\| name  \|  value  \|  required  \| desc  \|\n\| ------------ \| ------------ \| ------------ \| ------------ \| ------------ \|/g, "| name  |  value  |  required  | desc  \r\n|------------ | ------------ | ------------ | ------------ |")
        .replace(/### BASIC/g, "### 基本信息")
        .replace(/Path：\*\* /g, `请求URL：** /${projectName}`)
        .replace(/Method：/g, "请求方式：")
        .replace(/Desc：/g, "简要描述：")
        .replace(/### REQUEST/g, `**负责人：** ${author}

**创建时间：** ${new Date().toLocaleString()}

### 请求方式`)
        .replace(/Headers：/g, "请求头：")
        .replace(/ name  /g, "参数名")
        .replace(/  value  /g, "值")
        .replace(/ required  /g, "必填")
        .replace(/ desc  /g, "参数描述")
        .replace(/ type  /g, "类型")
        .replace(/ default /g, "默认")

        .replace(/Query：/g, "参数")
        .replace(/ name /g, "参数名")
        .replace(/ type /g, "类型")
        .replace(/ required /g, "必填")
        .replace(/ desc /g, "参数描述")

        .replace(/### RESPONSE/g, "### 响应信息")
        .replace(/Header：/g, "响应头")
        .replace(/Body：/g, "响应体")
        .replace(/Response Demo：/g, "响应示例")
        .replace(/Request Demo：/g, "请求示例：")
    var methodArr = doc.split(/\n---\n/g);
    var filePath = docFilePath.split('\\').filter(f => !f.includes(".md")).join('\\')+"\/docs"
    for (let idx = 0; idx < methodArr.length; idx++) {
        const item = methodArr[idx];
        if (!item.includes('## ')) { continue; }
        var methodName = item.match(/## (.+)/)[1];
        var fullFileName=filePath+"\\"+ methodName.replace(/\//, '-')+ ".md"
        if(!fs.existsSync(filePath)){
            fs.mkdirSync(filePath);
        }
        console.log(fullFileName,'生成成功！！！')
        fs.writeFileSync(fullFileName, item);
    }
    fs.writeFileSync(docFilePath, doc);
}
//文档路径
const docFilePath = "C:\\Users\\terrywang\\Desktop\\easy-api.md";
const author = "王天";//文档作者,负责人
const projectName = "masterfile";
convertDoc();





