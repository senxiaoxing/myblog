const express = require('express');
const router = express.Router();
const PostModel = require('../models/posts');

const checkLogin = require('../middlewares/check').checkLogin;

router.get('/:tag', checkLogin, function (req, res, next) {
  const author = req.query.author;
  const tag = req.params.tag;
  let count = 0;
  let page = 0;
  const size = 1;

  // 页码
  let pagenum = req.query.pagenum || 1;

  PostModel.getPoststag(author, tag)
    .then(function (posts) {
        let newPosts = posts.map(item => {
            item.content = ''
            item.tagsArr = item.tag.split(/[,， ]/)
            return item
          })

        if (posts.length > size) {
            count = posts.length; // 数据条数

            page = Math.ceil(count / size); // 总共的页数
            pagenum = pagenum < 1 ? 1 : pagenum; // 页面小于1, 显示1
            pagenum = pagenum > page ? page : pagenum;// 页码大于总页数；显示总页数
            // console.log(pagenum);
            PostModel.getPoststagpage(author, tag, size, pagenum)
            .then(function (posts) {
                newPosts = posts.map(item => {
                    item.content = ''
                    item.tagsArr = item.tag.split(/[,， ]/)
                    return item
                })

                res.render('tags', {
                posts: newPosts,
                page: page,
                count: count,
                pagenum: pagenum,
                size: size,
                tag: tag
                });
            }).catch(next);
        } else {
            page = 1;
            res.render('tags', {
            posts: newPosts,
            page: page,
            count: count,
            pagenum: pagenum,
            size: size,
            tag: tag
            });
        }
    }).catch(next);
});

module.exports = router;