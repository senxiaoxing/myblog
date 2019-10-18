module.exports = function (app) {
    app.get('/', function (req, res) {
      res.redirect('/posts')
    })
    app.use('/signup', require('./signup'))
    app.use('/password', require('./password'))
    app.use('/signin', require('./signin'))
    app.use('/signout', require('./signout'))
    app.use('/posts', require('./posts'))
    app.use('/tags', require('./tags'))
    app.use('/comments', require('./comments'))
    app.use('/chatroom', require('./chatroom'))
    // 404 page
    app.use(function (req, res) {
      //查看http响应是否响应了http头
      if (!res.headersSent) {
        res.status(404).render('404')
      }
    })
  }