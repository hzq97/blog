/*
 * @Author: anchen
 * @Date:   2018-03-31 17:11:12
 * @Last Modified by:   anchen
 * @Last Modified time: 2018-04-05 14:16:50
 */

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/project');
//用户
var UserSchema = new mongoose.Schema({
    "username": String,
    "nickname": String,
    "password": String,
    "email": String,
    "date": Date,
    "img": String
});
//分类
var TypeSchema = new mongoose.Schema({
    "typename": String
});
//文章
var ArticleSchema = new mongoose.Schema({
    title: String,
    addtime: String, //添加时间
    content: String,
    num: Number, //浏览次数
    intro: String, //摘要
    pic: String,
    type_id: String //分类id
});
var model = {
    UserModel: function() {

        return mongoose.model('user', UserSchema);
    },
    TypeModel: function() {

        return mongoose.model('type', TypeSchema);
    },
    ArticleModel: function() {
        return mongoose.model('article', ArticleSchema);
    }
}




// module.exports = UserModel;
module.exports = model;
// module.exports = TypeModel;

// module.exports = ArticleModel;