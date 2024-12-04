var DataTypes = require("sequelize").DataTypes;
var _category = require("./category");
var _comment = require("./comment");
var _likes = require("./likes");
var _post = require("./post");
var _postCategory = require("./postCategory");
var _user = require("./user");

function initModels(sequelize) {
  var category = _category(sequelize, DataTypes);
  var comment = _comment(sequelize, DataTypes);
  var likes = _likes(sequelize, DataTypes);
  var post = _post(sequelize, DataTypes);
  var postCategory = _postCategory(sequelize, DataTypes);
  var user = _user(sequelize, DataTypes);

  category.belongsToMany(post, { as: 'post_id_posts', through: postCategory, foreignKey: "category_id", otherKey: "post_id" });
  post.belongsToMany(category, { as: 'category_id_categories', through: postCategory, foreignKey: "post_id", otherKey: "category_id" });
  postCategory.belongsTo(category, { as: "category", foreignKey: "category_id"});
  category.hasMany(postCategory, { as: "postCategories", foreignKey: "category_id"});
  likes.belongsTo(comment, { as: "comment", foreignKey: "comment_id"});
  comment.hasMany(likes, { as: "likes", foreignKey: "comment_id"});
  comment.belongsTo(post, { as: "post", foreignKey: "post_id"});
  post.hasMany(comment, { as: "comments", foreignKey: "post_id"});
  likes.belongsTo(post, { as: "post", foreignKey: "post_id"});
  post.hasMany(likes, { as: "likes", foreignKey: "post_id"});
  postCategory.belongsTo(post, { as: "post", foreignKey: "post_id"});
  post.hasMany(postCategory, { as: "postCategories", foreignKey: "post_id"});
  comment.belongsTo(user, { as: "author_user", foreignKey: "author"});
  user.hasMany(comment, { as: "comments", foreignKey: "author"});
  likes.belongsTo(user, { as: "author_user", foreignKey: "author"});
  user.hasMany(likes, { as: "likes", foreignKey: "author"});
  post.belongsTo(user, { as: "author_user", foreignKey: "author"});
  user.hasMany(post, { as: "posts", foreignKey: "author"});

  return {
    category,
    comment,
    likes,
    post,
    postCategory,
    user,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
