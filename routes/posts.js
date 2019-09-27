const express = require('express')
const router = express.Router()

const checkLogin = require('../middlewares/check').checkLogin
const PostModel = require('../models/posts')
const CommentModel = require('../models/comments')
const config = require('config-lite')(__dirname)

// GET /posts 所有用户或者特定用户的文章页
//   eg: GET /posts?author=xxx
router.get('/', function (req, res, next) {
  const author = req.query.author
  let count = 0;
  let page = 0;
  const size = config.size.postSize;
  // 页码
  let pagenum = req.query.pagenum || 1;
  
  PostModel.getPosts(author)
    .then(function (posts) {
      let newPosts = posts.map(item => {
        item.tagsArr = item.tag.split(/[,， ]/)
        return item
      })

      if (posts.length > size) {
        count = posts.length; // 数据条数
        page = Math.ceil(count / size); // 总共的页数
        pagenum = pagenum < 1 ? 1 : pagenum; // 页面小于1, 显示1
        pagenum = pagenum > page ? page : pagenum; // 页码大于总页数；显示总页数

        PostModel.getPostspage(author, size, pagenum)
          .then(function (posts) {
            newPosts = posts.map(item => {
              item.tagsArr = item.tag.split(/[,， ]/)
              return item
            })
            res.render('posts', {
              posts: newPosts,
              page: page,
              count: count,
              pagenum: pagenum,
              size: size
            });
          }).catch(next);
      } else {
        res.render('posts', {
          posts: newPosts,
          page: 1,
          count: count,
          pagenum: pagenum,
          size: size
        });
      }
    })
    .catch(next)
})

// POST /posts/create 发表一篇文章
router.post('/create', checkLogin, function (req, res, next) {
  const author = req.session.user._id
  const title = req.fields.title
  const tag = req.fields.tag;
  const content = req.fields.content

  // 校验参数
  try {
    if (!title.length) {
      throw new Error('请填写标题')
    }
    if (!tag.length) {
      throw new Error('请填写标签');
    }
    if (!content.length) {
      throw new Error('请填写内容')
    }
  } catch (e) {
    req.flash('error', e.message)
    return res.redirect('back')
  }

  let post = {
    author: author,
    title: title,
    tag: tag,
    content: content,
    pv: 0
  }

  PostModel.create(post)
    .then(function (result) {
      // 此 post 是插入 mongodb 后的值，包含 _id
      post = result.ops[0]
      req.flash('success', '发表成功')
      // 发表成功后跳转到该文章页
      res.redirect(`/posts/${post._id}`)
    })
    .catch(next)
})

// GET /posts/create 发表文章页
router.get('/create', checkLogin, function (req, res, next) {
  res.render('create')
})

// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', function (req, res, next) {
  const postId = req.params.postId
  
    Promise.all([
      PostModel.getPostById(postId), // 获取文章信息
      CommentModel.getComments(postId), // 获取该文章所有留言
      PostModel.incPv(postId)// pv 加 1
    ])
      .then(function (result) {
        const post = result[0]
        const comments = result[1]
        if (!post) {
          throw new Error('该文章不存在')
        }
  
        post.tagsArr = post.tag.split(/[,， ]/)
        res.render('post', {
          post: post,
          comments: comments
        })

        req.flash('success', false)
      })
      .catch(next)
})

// GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit', checkLogin, function (req, res, next) {
  const postId = req.params.postId
  const author = req.session.user._id

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if (!post) {
        throw new Error('该文章不存在')
      }
      if (author.toString() !== post.author._id.toString()) {
        throw new Error('权限不足')
      }
      post.tagsArr = post.tag.split(/[,， ]/)
      res.render('edit', {
        post: post
      })
    })
    .catch(next)
})

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function (req, res, next) {
  const postId = req.params.postId
  const author = req.session.user._id
  const title = req.fields.title
  const tag = req.fields.tag;
  const content = req.fields.content

  // 校验参数
  try {
    if (!title.length) {
      throw new Error('请填写标题')
    }
    if (!tag.length) {
      throw new Error('请填写标签');
    }
    if (!content.length) {
      throw new Error('请填写内容')
    }
  } catch (e) {
    req.flash('error', e.message)
    return res.redirect('back')
  }

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if (!post) {
        throw new Error('文章不存在')
      }
      if (post.author._id.toString() !== author.toString()) {
        throw new Error('没有权限')
      }
      PostModel.updatePostById(postId, { title: title, tag: tag, content: content })
        .then(function () {
          req.flash('success', '编辑文章成功')
          // 编辑成功后跳转到上一页
          res.redirect(`/posts/${postId}`)
        })
        .catch(next)
    })
})

// GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, function (req, res, next) {
  const postId = req.params.postId
  const author = req.session.user._id

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if (!post) {
        throw new Error('文章不存在')
      }
      if (post.author._id.toString() !== author.toString()) {
        throw new Error('没有权限')
      }
      PostModel.delPostById(postId)
        .then(function () {
          req.flash('success', '删除文章成功')
          // 删除成功后跳转到主页
          res.redirect('/posts')
        })
        .catch(next)
    })
})

module.exports = router