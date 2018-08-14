const url = require('url');
const path = require('path');
const fs = require('fs');

function getErrorInfo(errorType) {
  // 错误信息列表
   const errorInfo = {
     'NOT_FOUND' : ['404', 'Not Found'],
     'FORBIDDEN' : ['403', 'Forbidden']
   }
   return errorInfo[errorType];
}

function writeErrorPage(response, errorType) {
  // 错误页面模板
  const errorPageTemplate = `
    <html>
      <head>
        <title>{{ errorText }}</title>
      </head>
      <body>
        <h1>Error: {{ errorCode }} - {{ errorText }}</h1>
      </body>
    </html>
  `;
  // 获取错误码和错误文字提示
  var [errorCode, errorText] = getErrorInfo(errorType);
  response.writeHeader(parseInt(errorCode), {
    "Content-Type" : "text/html"
  });
  response.end(errorPageTemplate
    .replace(/{{ errorText }}/g, errorText)
    .replace(/{{ errorCode }}/g, errorCode)
  );
}

exports.register = function(request, response, mapping) {
  // 解析请求路径
  var pathName = url.parse(request.url).pathname;
  // 执行相应请求路径的回调函数
  for(let i = 0, len = mapping.length;i < len;i++) {
    if(mapping[i].url === pathName) {
      mapping[i].handler(request, response);
      return;
    }
  }
  // 请求路径为文件返回文件内容
  var file = path.resolve(__dirname, '.' + pathName);
  fs.exists(file, function(exists) {
    // 请求路径不存在返回404页面
    if(!exists) {
      writeErrorPage(response, 'NOT_FOUND');
    }
    else {
      var stat = fs.statSync(file);
      // 请求路径为目录返回403页面
      if(stat.isDirectory()) {
        writeErrorPage(response, 'FORBIDDEN');
      }
      else {
        response.writeHeader(200, {
          "Content-Type" : "text/html"
        });
        response.end(
          fs.readFileSync(file, 'utf-8')
        );
      }
    }
  });
}
