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
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'cache-control': 'no-cache',
    'cookie': 'UM_distinctid=176e68552f72a0-0143a6ad5c850e-c791039-1fa400-176e68552f8434; CNZZDATA1278970723=1364019149-1610181340-%7C1610181340',
    'pragma': 'no-cache',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
}
async function getPage(url) {
    console.log(`请求url:${url}`)
    return await Axios.get(url, { headers })
}
var hrefs=[];
async function getDetailPage(href,filepath) {
    if(hrefs.includes(href)){
        return;
    }
    hrefs.push(href);
    var html_string = (await getPage(href)).data.toString();
    var $ = cheerio.load(html_string);
    var $imgs = $(".content>img")
    for (let idx = 0; idx < $imgs.length; idx++) {
        const element = $imgs[idx];
        var src = element.attribs["src"];
        await downloadFile(src, filepath, element.attribs["alt"].replace(/\/|\.|:/g,"")+".jpg");
        var nextHref=$("#pages .a1:eq(1)")[0].attribs["href"]
        getDetailPage(nextHref,filepath)
    }
}
async function downloadFile(url, filepath, name) {
    //name=name.replace(/\/|\.|:/g,"")
    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(filepath);
    }
    const mypath = path.resolve(filepath, name);
    try {
        var res = fs.statSync(mypath);
        if (res.isFile())
            return;
    } catch (e) {
    }
    return Axios({
        url,
        method: "GET",
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36',
        },
        responseType: 'arraybuffer'
      }).then(
        ({ data }) => {
          fs.writeFileSync(mypath, data, 'binary'); console.log('下载保存成功！', mypath)
        }, (err) => console.log('下载失败', url, mypath)
      );
}
async function start() {
    var pageRes = await getPage("https://www.tujigu.com/");
    var html_string = pageRes.data.toString();
    //console.log(html_string)
    var $ = cheerio.load(html_string);
    //console.log($)
    var $imgs = $('.hezi:eq(1)').find('ul>li>a')//$('.hezi:eq(1)>ul>li>a[target="_blank"]')
    for (let index = 0; index < $imgs.length; index++) {
        var elm = $imgs[index];
        var href = elm.attribs["href"];
        console.log(href)
        await getDetailPage(href,"images/"+href.replace(/\/|\.|:/g,""))
    }
}
start();