const path = require('path')
const express = require('express')
const favicon = require('serve-favicon')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const config = require('config-lite')(__dirname)
const routes = require('./routes')
const pkg = require('./package')
// const ejs = require('ejs');
const winston = require('winston')
const expressWinston = require('express-winston')

const app = express()
const server = require('http').createServer(app)
const io = require('socket.io').listen(server)

// 设置模板目录
app.set('views', path.join(__dirname, 'views'))
// 設置模板引擎為 html
// app.engine('.html', ejs.__express);
// app.set('view engine', 'html');
// 设置模板引擎为 ejs
app.set('view engine', 'ejs')

app.use(favicon(path.join(__dirname, 'public', '123.ico')))

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')))
// session 中间件
app.use(session({
  name: config.session.key, // 设置 cookie 中保存 session id 的字段名称
  secret: config.session.secret, // 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
  resave: true, // 强制更新 session
  saveUninitialized: false, // 设置为 false，强制创建一个 session，即使用户未登录
  cookie: {
    maxAge: config.session.maxAge// 过期时间，过期后 cookie 中的 session id 自动删除
  },
  store: new MongoStore({// 将 session 存储到 mongodb
    url: config.mongodb// mongodb 地址
  })
}))
// flash 中间件，用来显示通知
app.use(flash())

// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
    uploadDir: path.join(__dirname, 'public/img'), // 上传文件目录
    keepExtensions: true// 保留后缀
  }))

// 设置模板全局常量
app.locals.blog = {
    title: pkg.name,
    description: pkg.description
  }
  
  // 添加模板必需的三个变量
app.use(function (req, res, next) {
    res.locals.user = req.session.user
    res.locals.success = req.flash('success').toString()
    res.locals.error = req.flash('error').toString()
    next()
  })

// 正常请求的日志
app.use(expressWinston.logger({
    transports: [
    //   new (winston.transports.Console)({
    //     json: true,
    //     colorize: true
    //   }),
      new winston.transports.File({
        filename: 'logs/success.log'
      })
    ]
}))

// 路由
routes(app)

// 错误请求的日志
app.use(expressWinston.errorLogger({
    transports: [
      new winston.transports.Console({
        json: true,
        colorize: true
      }),
      new winston.transports.File({
        filename: 'logs/error.log'
      })
    ]
}))

//錯誤處理
app.use(function (err, req, res, next) {
  console.error(err)
  req.flash('error', err.message)
  res.redirect('/posts')
})

// 监听端口，启动程序
server.listen(config.port, function () {
  console.log(`${pkg.name} listening on port ${config.port}`)
})

let users = [];
io.on('connection', function(socket) {
  // 在线统计
  socket.on('login', function(nickName) {
      if ( users.indexOf(nickName) > -1 ) {
          socket.emit('nickExisted')
      } else {
          socket.userIndex = users.length;//这里很巧妙,索引0对应第一个昵称
          socket.nickName = nickName;
          users.push(nickName);//push进去后数组长度是1,此时昵称索引是0
          socket.emit('loginSuccess');//向自己發送登錄成功的消息

          io.sockets.emit('system', nickName, users.length, 'login');//system向所有人发送当前用户登录的信息
      }
  });

  socket.on('disconnect', function() {
      users.splice(socket.userIndex, 1);//服務斷開時，從users里去掉離開的人

      socket.broadcast.emit('system', socket.nickName, users.length, 'logout');//system向所有人發送當前用戶離開的信息
  });

  // 分发信息
  socket.on('postMsg', function(msg, color) {
      socket.broadcast.emit('newMsg', socket.nickName, msg, color);
  });

  // 分发图片
  socket.on('img', function(imageData, color) {
      socket.broadcast.emit('newImg', socket.nickName, imageData, color);
  })
});