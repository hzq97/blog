var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');
var md5 = require('md5');
var moment = require('moment');
// moment().format();
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/project');

var model = require('../model/model.js');

var UserModel = model.UserModel();
var TypeModel = model.TypeModel();
var ArticleModel = model.ArticleModel();


//建立图片上传日期文件夹
var dat = new Date();
var date = dat.getMonth() + 1 + '-' + dat.getDate();
if (!fs.existsSync("./public/imgs/" + date)) {
    fs.mkdir("./public/imgs/" + date, function(err) {
        if (err) {
            console.log('创建文件夹失败');
        }
    })
}


/* GET 用户 listing. */
router.get('/admin', function(req, res, next) {
    res.render('admin/admin');
});
router.get('/user/create', function(req, res) {
    var msg = req.flash('error').toString();
    res.render('admin/user/create', { msg: msg });
});
router.post('/user', function(req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir = "./public/imgs/" + date;
    form.keepExtensions = true;
    // var email = false
    // var nickname = false
    form.parse(req, function(err, fields, files) {

        UserModel.find({ email: fields.email }, function(err, doc) {
            if (doc.length > 0) {
                req.flash('error', '邮箱已注册');
                res.redirect('back');
                return;
            } else {
                UserModel.find({ nickname: fields.nickname }, function(err, data) {
                    if (data.length > 0) {
                        req.flash('error', '昵称已被使用');
                        res.redirect('back');
                        return;
                    } else {
                        var imgpath = files.img.path.replace(/\\/g, '/');
                        var index = imgpath.indexOf('/');
                        imgpath = imgpath.substr(index);
                        fields.img = imgpath;
                        fields.date = new Date();
                        fields.password = md5(fields.password);
                        var UserEntity = UserModel(fields);
                        UserEntity.save(function(err, data) {
                            if (err) {
                                res.render('admin/conmon/error', { title: '注册失败', time: 3000, url: '/user/create' });
                            } else {
                                res.render('admin/conmon/success', { title: '注册成功', time: 3000, url: '/user' });
                            }
                        })
                    }
                })
            }

        })


    })
})

router.get('/user', function(req, res) {
    var page = req.query.page ? parseInt(req.query.page) : 1;
    var limit = 5;
    var skip = (page - 1) * limit;
    var count = 0;
    var html = '<li class="paginate_button previous" aria-controls="dataTables-example" tabindex="0" id="dataTables-example_previous"><a href="/user?page=' + (page - 1) + '">Previous</a></li>';
    UserModel.count(function(err, data) {
        count = Math.ceil(data / limit);
        for (var i = 1; i <= count; i++) {
            if (i == page) {
                html += '<li class="paginate_button active" aria-controls="dataTables-example" tabindex="0"><a href="/user?page=' + i + '">' + i + '</a></li>'
            } else {
                html += '<li class="paginate_button" aria-controls="dataTables-example" tabindex="0"><a href="/user?page=' + i + '">' + i + '</a></li>'
            }

        }
        html += '<li class="paginate_button next" aria-controls="dataTables-example" tabindex="0" id="dataTables-example_next"><a href="/user?page=' + (page + 1) + '">Next</a></li>';
    })


    var code = 0;
    UserModel.find({}).skip(skip).limit(limit).exec(function(err, data) {
        if (page <= 1) {
            code = 0
        } else if (page >= count) {
            code = 1;
        } else {
            code = 2;
        }
        res.render('admin/user/users', { user: data, html: html, code: code });
    })
})

router.get('/user/:id/edit', function(req, res) {
    var id = req.params.id;
    UserModel.findById(id, function(err, data) {
        res.render('admin/user/edit', { data: data })
    })
})

router.get('/user/:id/del', function(req, res) {
    var id = req.params.id;
    UserModel.findById(id, function(err, data) {
        data.remove(function(err, data) {
            if (err) {
                res.render('admin/conmon/error', { title: '删除失败', time: 3000, url: '/user' });
            }
        })
        data.save(function(err, data) {
            if (err) {
                console.log(err)
            } else {
                res.render('admin/conmon/success', { title: '删除成功', time: 5000, url: '/user' })
            }
        })
    })
})

router.post('/user/:id/update', function(req, res) {
    var id = req.params.id;
    var form = new formidable.IncomingForm();
    form.uploadDir = "./public/imgs/" + date;
    form.keepExtensions = true;
    UserModel.findById(id, function(err, data) {
        form.parse(req, function(err, fields, files) {
            if (files.img.size != 0) {
                if (fs.existsSync('./public/' + data.img)) {
                    fs.unlink('./public/' + data.img, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('删除原来图片')
                        }
                    })
                }
                var imgpath = files.img.path.replace(/\\/g, '/');
                var index = imgpath.indexOf('/');
                imgpath = imgpath.substr(index);
                fields.img = imgpath;
                data.img = fields.img;
            }
            data.username = fields.username;
            data.nickname = fields.nickname;
            data.email = fields.email;
            data.username = fields.username;
            data.save(function(err, data) {
                if (err) {
                    res.render('admin/conmon/error', { title: '更新失败', time: 3000, url: '/user' });
                } else {
                    res.render('admin/conmon/success', { title: '修改成功', time: 5000, url: '/user' })
                }
            })
        })
    })

});
//用户验证
router.get('/userMsg', function(req, res) {
    var email = req.query.email;
    UserModel.find({ email: email }).exec(function(err, doc) {
        console.log(doc)
        if (doc.length > 0) {
            res.send('此邮箱已注册');
        } else {
            res.send('');
        }
    })

})





// 分类路由设置
//
router.get('/type/create', function(req, res) {
    res.render('admin/type/create');
});
router.post('/type', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        if (!fields.typename) {
            req.flash('error', '分类名不能为空');
            res.redirect('back');
            return;
        } else {
            console.log(fields)
            var TypeEntity = TypeModel(fields);
            TypeEntity.save(function(err, data) {
                if (err) {
                    res.render('admin/conmon/error', { title: '添加失败', time: 3000, url: '/type/create' });
                } else {
                    res.render('admin/conmon/success', { title: '添加成功', time: 3000, url: '/type' });
                }
            })
        }

    });
});
router.get('/type', function(req, res) {
    TypeModel.find({}).exec(function(err, data) {
        console.log(data)
        res.render('admin/type/type', { type: data });
    })

});
router.get('/type/:id/edit', function(req, res) {
    var id = req.params.id;
    TypeModel.findById(id, function(err, data) {
        res.render('admin/type/edit', { data: data })
    })
});
router.post('/type/:id/update', function(req, res) {
    var id = req.params.id;
    TypeModel.findById(id, function(err, data) {
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            data.typename = fields.typename;
            data.save(function(err, data) {
                if (!err) {
                    res.render('admin/conmon/success', { title: '修改成功', time: 5000, url: '/type' })
                }
            })
        })
    })
});
router.get('/type/:id/del', function(req, res) {
    var id = req.params.id;
    TypeModel.findById(id, function(err, data) {
        data.remove(function(err, data) {
            if (!err) {
                res.render('admin/conmon/success', { title: '删除成功', time: 5000, url: '/type' })
            }
        })
        // res.render('admin/type/edit', { data: data })
    })
});
// 类别验证
router.get('/typeMsg', function(req, res) {
    var type = req.query.type;
    TypeModel.find({ typename: type }).exec(function(err, doc) {
        if (doc.length > 0) {
            res.send('分类名已经存在');
        } else {
            res.send('')
        }
    })
})


// 文章路由操作
router.get('/article/create', function(req, res) {
    TypeModel.find({}).exec(function(err, data) {
        if (err) {
            console.log(123)
        } else {
            res.render('admin/article/create', { type: data });
        }

    })

});
router.post('/article', function(req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir = "./public/imgs/" + date;
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
        var imgpath = files.img.path.replace(/\\/g, '/');
        var index = imgpath.indexOf('/');
        imgpath = imgpath.substr(index);
        fields.pic = imgpath;
        fields.addtime = new Date();
        var datestr = moment(new Date()).format('YYYY年MM月DD日 HH:mm');
        fields.addtime = datestr;
        fields.num = 0;
        var ArticleEntity = new ArticleModel(fields);
        ArticleEntity.save(function(err, doc) {
            if (err) {
                res.render('admin/conmon/error', { title: '添加失败', time: 5000, url: '/article/create' })
            } else {
                res.render('admin/conmon/success', { title: '添加成功', time: 5000, url: '/article' })
            }
        })
    });
});
router.get('/article', function(req, res) {
    var page = req.query.page ? parseInt(req.query.page) : 1;
    var limit = 5;
    var skip = (page - 1) * limit;
    var count = 0;
    var html = '<li class="paginate_button previous" aria-controls="dataTables-example" tabindex="0" id="dataTables-example_previous"><a href="/article?page=' + (page - 1) + '">Previous</a></li>';

    ArticleModel.count(function(err, data) {
        count = Math.ceil(data / limit);

        for (var i = 1; i <= count; i++) {
            if (i == page) {
                html += '<li class="paginate_button active" aria-controls="dataTables-example" tabindex="0"><a href="/article?page=' + i + '">' + i + '</a></li>'
            } else {
                html += '<li class="paginate_button" aria-controls="dataTables-example" tabindex="0"><a href="/article?page=' + i + '">' + i + '</a></li>'
            }

        }
        html += '<li class="paginate_button next" aria-controls="dataTables-example" tabindex="0" id="dataTables-example_next"><a href="/article?page=' + (page + 1) + '">Next</a></li>';
    })

    var code = 0;
    ArticleModel.find({}).skip(skip).limit(limit).exec(function(err, data) {
        if (page <= 1) {
            code = 0
        } else if (page >= count) {
            code = 1;
        } else {
            code = 2;
        }
        res.render('admin/article/article', { article: data, html: html, code: code });
    })

});
router.post('/uploads', function(req, res) {
    //文件上传
    var form = new formidable.IncomingForm();
    form.uploadDir = "./public/imgs/" + date;
    form.keepExtensions = true;

    form.parse(req, function(err, fields, files) {
        console.log(files)
        var imgpath = files['editormd-image-file'].path.replace(/\\/g, '/');
        var index = imgpath.indexOf('/');
        imgpath = imgpath.substr(index);
        res.json({
            success: 1,
            message: "添加成功",
            url: imgpath
        })
    })

});

router.get('/article/:id/edit', function(req, res) {
    var id = req.params.id;
    ArticleModel.findById(id, function(err, data) {
        if (!err) {
            TypeModel.find({}).exec(function(err, type) {
                if (err) {
                    console.log(123)
                } else {
                    res.render('admin/article/edit', { data: data, type: type })
                }

            })
        }

    })
});

router.post('/article/:id/update', function(req, res) {
    var id = req.params.id;
    var form = new formidable.IncomingForm();
    form.uploadDir = "./public/imgs/" + date;
    form.keepExtensions = true;
    ArticleModel.findById(id, function(err, data) {
        form.parse(req, function(err, fields, files) {
            if (files.img.size != 0) {
                if (fs.existsSync('./public/' + data.img)) {
                    fs.unlink('./public/' + data.img, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('删除原来图片')
                        }
                    })
                }
                var imgpath = files.img.path.replace(/\\/g, '/');
                var index = imgpath.indexOf('/');
                imgpath = imgpath.substr(index);
                fields.pic = imgpath;
                data.pic = fields.pic;
            }
            data.title = fields.title;
            data.content = fields.content;
            data.intro = fields.content;
            data.type_id = fields.type_id;
            data.save(function(err, data) {
                if (!err) {
                    res.render('admin/conmon/success', { title: '修改成功', time: 5000, url: '/article' })
                }
            })
        })
    })
});
router.get('/article/:id/del', function(req, res) {
    var id = req.params.id;
    ArticleModel.findById(id, function(err, data) {
        data.remove(function(err, data) {
            if (!err) {
                res.render('admin/conmon/success', { title: '删除成功', time: 5000, url: '/article' })
            }
        })
    })
});
mongoose.connection.close();
module.exports = router;