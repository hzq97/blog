var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var md5 = require('md5');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/project');
var markdown = require("markdown").markdown;
var model = require('../model/model');

var UserModel = model.UserModel();
var TypeModel = model.TypeModel();
var ArticleModel = model.ArticleModel();


/* GET home page. */
router.get('/', function(req, res, next) {
    var page = req.query.page ? parseInt(req.query.page) : 1;
    var limit = 8;
    var skip = (page - 1) * limit;

    var con = {};
    var typeID = '';
    var msg = '';
    var keywords = '';

    if (req.query.keywords) {
        con.title = { $regex: new RegExp(req.query.keywords) }
    }
    if (req.query.type && req.query.type != 'all') {
        con.type_id = req.query.type;
        typeID = req.query.type;
    } else {
        typeID = 'all'
    }

    ArticleModel.count(con, function(err, number) {
        var num = Math.ceil(number / limit);
        var maxnum = num;
        var minnum = 1;
        if (num > 5 && page - 2 >= 1 && page + 2 <= num) {
            maxnum = page + 2;
            minnum = page - 2;
        }
        if (num > 5 && page <= 2 && page + 4 <= num) {
            maxnum = 5;
            minnum = 1;
        }
        if (num > 5 && page - 2 >= 1 && page + 2 >= num) {
            maxnum = num;
            minnum = page - 2;
        }
        ArticleModel.find(con).skip(skip).limit(limit).exec(function(err, article) {
            if (article.length <= 0) {
                msg = '此信息暂无收录文章';
            }
            if (!err) {
                // console.log(article)

                ArticleModel.find().sort({ addtime: 1 }).exec(function(err, news) {
                    if (!err) {
                        ArticleModel.find().sort({ num: -1 }).exec(function(err, hot) {
                            if (!err) {
                                TypeModel.find(function(err, type) {
                                    if (!err) {
                                        // res.end('132')
                                        res.render('index/index', {
                                            type: type,
                                            hot: hot,
                                            news: news,
                                            article: article,
                                            markdown: markdown,
                                            num: num,
                                            page: page,
                                            typeID: typeID,
                                            keywords: req.query.keywords,
                                            msg: msg,
                                            maxnum: maxnum,
                                            minnum: minnum
                                        });

                                    }
                                });
                            }
                        })
                    }
                })
            }

        })
    })
});
//内容详情
router.get('/:id.html', function(req, res) {
    var id = req.params.id;
    ArticleModel.find().sort({ addtime: 1 }).exec(function(err, news) {
        if (!err) {
            ArticleModel.find().sort({ num: -1 }).exec(function(err, hot) {
                if (!err) {
                    TypeModel.find(function(err, type) {
                        if (!err) {
                            ArticleModel.findById(id).exec(function(err, doc) {
                                if (!err) {
                                    var reg = /<p>.*?<\/p>/;
                                    if (!reg.test(doc.content)) {
                                        doc.content = markdown.toHTML(doc.content);
                                    }
                                    var typeID = doc.type_id;
                                    res.render('index/content', {
                                        type: type,
                                        hot: hot,
                                        news: news,
                                        typeID: typeID,
                                        content: doc
                                    });
                                }
                            })


                        }
                    })
                }
            })
        }
    })
})
//登录
router.get('/login', function(req, res) {
    res.render('index/login');
});
//登录
router.post('/admin', function(req, res) {

    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        UserModel.find({ email: fields.email }, function(err, doc) {
            if (doc.length > 0) {
                if (doc[0].password == md5(fields.password)) {
                    req.session.uid = doc[0]._id;
                    res.render('index/conmon/success', { title: '登录成功', time: 3000, url: '/user' });
                } else {
                    res.render('index/conmon/success', { title: '密码错误', time: 3000, url: '/login' });
                }
            } else {
                res.render('index/conmon/success', { title: '用户名不存在', time: 3000, url: '/login' });
            }
        })
    })
});


router.get('/loginMsg', function(req, res) {
    var username = req.query.username;
    var password = req.query.password ? req.query.password : '';
    var con = {
        email: username
    }
    UserModel.find(con, function(err, doc) {
        if (doc.length > 0) {
            if (password != '') {
                if (doc[0].password == md5(password)) {
                    res.send('');
                } else {
                    res.send('密码错误');
                }
            } else {
                res.send('');
            }
        } else {
            res.send('用户名不存在');
        }
    })

})

//退出登陆
router.get('/logout', function(req, res) {
    req.session.destroy();
    res.render('index/conmon/success', { title: '退出登陆', time: 4000, url: '/login' });
});
mongoose.connection.close();
module.exports = router;