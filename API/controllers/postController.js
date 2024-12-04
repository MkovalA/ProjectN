const sequelize = require("../db");
const Sequelize = require("sequelize");
const Post = require("../models/post")(sequelize, Sequelize.DataTypes);
const Comment = require("../models/comment")(sequelize, Sequelize.DataTypes);
const Category = require("../models/category")(sequelize, Sequelize.DataTypes);
const Like = require("../models/likes")(sequelize, Sequelize.DataTypes);
const User = require("../models/user")(sequelize, Sequelize.DataTypes);
const postCategory = require("../models/postCategory")(sequelize, Sequelize.DataTypes);
const dayjs = require('dayjs');
const joi = require("joi");

Post.belongsToMany(Category, { through: postCategory, foreignKey: "post_id", otherKey: "category_id" });
Category.belongsToMany(Post, { through: postCategory, foreignKey: "category_id", otherKey: "post_id" });

Post.hasMany(Like, { foreignKey: "post_id" });
Like.belongsTo(Post, { foreignKey: "post_id" });

async function getPostsByLikes(role, status, date, categories, id, limit, offset, own) {
    try {
        const whereVal = {};
        let whereValCategory = {};
        if (role === "user") {
            whereVal[Sequelize.Op.or] = [{ status: "active"}, { author: id, status: "inactive" }];
        }
        if (status) {
            whereVal.status = status;
        }
        if (date) {
            const fromDate = date.split("-")[0];
            const toDate = date.split("-")[1];
            whereVal.publish_date = {[Sequelize.Op.between]: [fromDate, toDate]};
        }
        if (categories) {
            whereValCategory = { title: categories };
        }
        if (own) {
            whereVal.author = id;
        }
        const {count, rows: posts} = await Post.findAndCountAll({
            where: whereVal,
            include: [
                {
                    model: Category,
                    where: whereValCategory,
                    attributes: []
                }
            ],
            attributes: {
                include: [
                    [Sequelize.literal('(SELECT COUNT(*) FROM likes WHERE likes.post_id = post.id)'), 'like_count']
                ]
            },
            order: [[Sequelize.literal('like_count'), 'DESC']],
            limit: limit,
            offset: offset
        });
        return {count, posts};
    } catch (err) {
        throw err;
    }
}

async function getPostByDate(role, status, date, categories, id, limit, offset, own) {
    try {
        const whereVal = {};
        let whereValCategory = {};
        if (role === "user") {
            whereVal[Sequelize.Op.or] = [{ status: "active"}, { author: id, status: "inactive" }];
        }
        if (status) {
            whereVal.status = status;
        }
        if (date) {
            const fromDate = date.split("-")[0];
            const toDate = date.split("-")[1];
            whereVal.publish_date = {[Sequelize.Op.between]: [fromDate, toDate]};
        }
        if (categories) {
            whereValCategory = { title: categories };
        }
        if (own) {
            whereVal.author = id;
        }
        const {count, rows: posts} = await Post.findAndCountAll({
            where: whereVal,
            include: [
                {
                    model: Category,
                    where: whereValCategory,
                    attributes: []
                }
            ],
            order: [["publish_date", "DESC"]],
            limit: limit,
            offset: offset
        });
        return {count, posts};
    } catch (err) {
        throw err;
    }
}

exports.allPosts = async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const offset = (page - 1) * limit;
    const status = req.query.status ? req.query.status : "";
    const categories = req.query.categories ? req.query.categories : "";
    const date = req.query.date ? req.query.date : "";
    const own = req.query.own ? req.query.own : false;
    try {
        const checkRole = await User.findByPk(req.id);
        let result = {count: 0, posts: {}};
        if (checkRole.role === "admin") {
            if (req.query.sort) {
                result = await getPostByDate("admin", status, date, categories, req.id, limit, offset, own);
            } else {
                result = await getPostsByLikes("admin", status, date, categories, req.id, limit, offset, own);
            }
        } else {
            if (req.query.sort) {
                result = await getPostByDate("user", status, date, categories, req.id, limit, offset, own);
            } else {
                result = await getPostsByLikes("user", status, date, categories, req.id, limit, offset, own);
            }
        }

        
        result.count = Math.ceil(result.count / limit);
        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

exports.infoPost = async (req, res) => {
    try {
        const checkRole = await User.findByPk(req.id);
        let result = {};
        if (checkRole.role === "admin") {
            result = await Post.findByPk(req.params.post_id);
        } else {
            result = await Post.findOne({ where: { [Sequelize.Op.or]: [{ id: req.params.post_id, status: "active"}, { id: req.params.post_id, author: req.id, status: "inactive" }]}});
        }

        if (!result) {
            return res.status(400).json({ error: "Post with this ID does not exist"})
        }

        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

exports.allCommentsPost = async (req, res) => {
    try {
        const checkPost = await Post.findByPk(req.params.post_id);

        if (!checkPost) {
            return res.status(400).json({ error: "Post with this ID does not exist"})
        }
        const checkRole = await User.findByPk(req.id);
        let result = {};
        if (checkRole.role === "admin") {
            result = await Comment.findAll({ where: { post_id: req.params.post_id}});
        } else {
            result = await Comment.findAll({ where: { post_id: req.params.post_id, status: "active" }});
        }

        if (!result) {
            return res.status(400).json({ error: "No comments for this post"})
        }

        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

const createCommentSchema = joi.object({
    content: joi.string().required().min(1).max(65535).messages({
        "any.required": "Content is required",
        "string.min": "The content must contain at least 1 characters",
        "string.max": "The maximum content length is 65535 characters"
    })
});

exports.createComment = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }
    const checkRole = await User.findByPk(req.id);
    const checkPost = await Post.findByPk(req.params.post_id);
    if (!checkPost) {
        return res.status(400).json({ error: "Post not found" });
    }

    if (checkPost.status !== "active" && checkRole.role !== "admin") {
        return res.status(403).json( { error: "You do not have rights to this resource"});
    }

    const { error, value } = createCommentSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    const newCommentPost = {
        author: req.id,
        publish_date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        post_id: req.params.post_id,
        content: value.content
    }

    try {
        await Comment.create(newCommentPost);
        res.status(201).json({ message: "Success create comment"});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.allCategoriesPost = async (req, res) => {
    try {
        const checkRole = await User.findByPk(req.id);
        const checkPost = await Post.findByPk(req.params.post_id);
        if (!checkPost) {
            return res.status(400).json({ error: "Post not found" });
        }

        if (checkPost.status !== "active" && checkRole.role !== "admin") {
            return res.status(403).json( { error: "You do not have rights to this resource"});
        }

        const result = await Category.findAll({ include: { model: Post, where: { id: req.params.post_id }, attributes: []}});
        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

exports.allLikesPost = async (req, res) => {
    try {
        const checkRole = await User.findByPk(req.id);
        const checkPost = await Post.findByPk( req.params.post_id);
        if (!checkPost) {
            return res.status(400).json({ error: "Post not found" });
        }
        
        if (checkPost.status !== "active" && checkRole.role !== "admin") {
            return res.status(403).json( { error: "You do not have rights to this resource"});
        }

        const result = await Like.findAll({ where: { post_id: req.params.post_id }});
        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

const createPostSchema = joi.object({
    title: joi.string().required().min(1).max(128).messages({
        "any.required": "Content is required",
        "string.min": "The content must contain at least 1 characters",
        "string.max": "The maximum content length is 128 characters"
    }),
    content: joi.string().required().min(1).max(65535).messages({
        "any.required": "Content is required",
        "string.min": "The content must contain at least 1 characters",
        "string.max": "The maximum content length is 65535 characters"
    }),
    categories: joi.array().required().min(1).unique().items(joi.string()).messages({
        "any.required": "Categories is required",
        "array.min": "Post must contain at least 1 category",
        "array.unique": "All categiries must be unique"
    })
});

exports.createPost = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }

    const { error, value } = createPostSchema.validate(req.body);

    console.log(value);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    try {
        for (const element of value.categories) {
            const result = await Category.findOne({ where: { title: element } });
            if (!result) {
              return res.status(400).json({ error: "Category does not exist" });
            }
        }
        const date = dayjs();

        const newPost = {
            author: req.id,
            title: value.title,
            content: value.content,
            publish_date: date
        }

        const createdPost = await Post.create(newPost);
        console.log(createdPost);
        for (const element of value.categories) {
            const category = await Category.findOne({ where: {title: element}});
            const newCategoryPost = {
                post_id: createdPost.id,
                category_id: category.id
            }
            console.log(newCategoryPost);
            await postCategory.create(newCategoryPost);
        }
    

        res.status(201).json({ message: "Success create post"});
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

const createLikeSchema = joi.object({
    type: joi.string().required().valid("like", "dislike").messages({
        "any.required": "type is required",
        "any.only": "Type must be like/dislike"
    })
});

exports.createLikePost = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }

    const { error, value } = createLikeSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    const newLike = {
        author: req.id,
        publish_date: dayjs().format("YYYY-MM-DD"),
        post_id: req.params.post_id,
        type: value.type
    }

    try {
        const checkPost = await Post.findByPk(req.params.post_id);
        if (!checkPost) {
            return res.status(400).json({ error: "Post not found" });
        }

        const checkRole = await User.findByPk(req.id);
        if (checkPost.status !== "active" && checkRole.role !== "admin") {
            return res.status(403).json( { error: "You do not have rights to this resource"});
        }

        const userPost = await User.findByPk(checkPost.author);
        const checkLike = await Like.findOne({where: { post_id: req.params.post_id, author: req.id }});
        if (checkLike) {
            await checkLike.destroy();
            if (checkLike.type === "like") {
                userPost.rating -= 1;
            } else {
                userPost.rating += 1;
            }
        }

        await Like.create(newLike);
        if (newLike.type === "like") {
            userPost.rating += 1;
        } else {
            userPost.rating -= 1;
        }
        await userPost.save({ fields: ["rating"] });
        res.status(201).json({ message: "Success create like/dislike"});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const editPostSchema = joi.object({
    title: joi.string().min(1).max(128).messages({
        "string.min": "The content must contain at least 1 characters",
        "string.max": "The maximum content length is 128 characters"
    }),
    content: joi.string().min(1).max(65535).messages({
        "string.min": "The content must contain at least 1 characters",
        "string.max": "The maximum content length is 65535 characters"
    }),
    categories: joi.array().min(1).unique().items(joi.string()).messages({
        "array.min": "Post must contain at least 1 category",
        "array.unique": "All categiries must be unique"
    }),
    status: joi.string().valid("active", "inactive").messages({
        "any.required": "Status is required",
        "any.only": "Status must be active/inactive"
    })
});

exports.editPost = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }

    const { error, value } = editPostSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    try {
        const result = await Post.findByPk(req.params.post_id);
        if (!result) {
            return res.status(400).json({ error: "Post not found" });
        }

        if (value.categories) {
            for (const element of value.categories) {
                const checkCategory = await Category.findOne({ where: { title: element } });
                if (!checkCategory) {
                  return res.status(400).json({ error: "Category does not exist" });
                }
            }
        }
        
        const checkUser = await User.findByPk(req.id);
        if (checkUser.role === "admin") {
            result.categories = value.categories || result.categories;
            result.status = value.status || result.status;
        } else if (result.author == req.id) {
            result.title = value.title || result.title;
            result.content = value.content || result.content;
            result.categories = value.categories || result.categories;
        } else {
            return res.status(400).json({ error: "You do not have rights to this resource"});
        }

        await result.save();
        res.status(200).json({ message: "Post updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delPost = async (req, res) => {
    try {
        const result = await Post.findByPk(req.params.post_id);
        if (!result) {
            return res.status(400).json({ error: "Post not found" });
        }

        const checkUser = await User.findByPk(req.id);
        if (checkUser.role !== "admin" || result.author !== req.id) {
            return res.status(400).json({ error: "You do not have rights to this resource"});
        }

        await result.destroy();
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delLikePost = async (req, res) => {
    try {
        const result = await Like.findOne({ where: {post_id: req.params.post_id }});
        if (!result) {
            return res.status(400).json({ error: "Like not found" });
        }

        const checkUser = await User.findByPk(req.id);
        if (checkUser.role !== "admin" || result.author !== req.id) {
            return res.status(400).json({ error: "You do not have rights to this resource"});
        }

        await result.destroy();
        res.status(200).json({ message: "Like/dislike deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};