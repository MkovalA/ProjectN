const sequelize = require("../db");
const Sequelize = require("sequelize");
const Comment = require("../models/comment")(sequelize, Sequelize.DataTypes);
const Like = require("../models/likes")(sequelize, Sequelize.DataTypes);
const User = require("../models/user")(sequelize, Sequelize.DataTypes);
const dayjs = require('dayjs');
const joi = require("joi");

Comment.hasMany(Like, { foreignKey: "post_id" });
Like.belongsTo(Comment, { foreignKey: "post_id" });

exports.infoComment = async (req, res) => {
    try {
        const checkRole = await User.findByPk(req.id);
        let result = {};
        if (checkRole.role === "admin") {
            result = await Comment.findOne(req.params.comment_id);
        } else {
            result = await Comment.findOne({ where: { [Sequelize.Op.or]: [{ id: req.params.comment_id, status: "active"}, { id: req.params.comment_id, author: req.id, status: "inactive" }]}});
        }

        if (!result) {
            return res.status(400).json({ error: "Comment with this ID does not exist"})
        }

        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

exports.infoLikesComment = async (req, res) => {
    try {
        const checkRole = await User.findByPk(req.id);
        let checkComment = {};
        if (checkRole.role === "admin") {
            checkComment = await Comment.findByPk(req.params.comment_id);
        } else {
            checkComment = await Comment.findOne({ where: { [Sequelize.Op.or]: [{id: req.params.comment_id, status: "active"}, {id: req.params.comment_id, author: req.id, status: "inactive" }]}});
        }
        
        if (!checkComment) {
            return res.status(400).json({ error: "Comment with this ID does not exist"})
        }
        
        const result = await Like.findAll({ where: { comment_id: req.params.comment_id}});
        if (!result) {
            return res.status(400).json({ error: "No likes for this comment"})
        }

        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

const createLikeSchema = joi.object({
    type: joi.string().required().valid("like", "dislike").messages({
        "any.required": "type is required",
        "any.only": "Type must be like/dislike"
    })
});

exports.createCommentLike = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }

    const { error, value } = createLikeSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    const newLike = {
        author: req.id,
        publish_date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        comment_id: req.params.comment_id,
        type: value.type
    }

    try {
        const checkComment = await Comment.findByPk(req.params.comment_id);
        if (!checkComment) {
            return res.status(400).json({ error: "Comment not found" });
        }

        const checkRole = await User.findOne(req.id);
        if (checkComment.status !== "active" && checkRole.role !== "admin") {
            return res.status(403).json( { error: "You do not have rights to this resource"});
        }

        const userComment = await User.findByPk(checkComment.author);
        const checkLike = await Like.findOne({where: { post_id: req.params.post_id, author: req.id }});
        if (checkLike) {
            await checkLike.destroy();
            if (checkLike.type === "like") {
                userComment.rating -= 1;
            } else {
                userComment.rating += 1;
            }
        }

        await Like.create(newLike);
        if (newLike.type === "like") {
            userComment.rating += 1;
        } else {
            userComment.rating -= 1;
        }
        await userComment.save({ fields: ["rating"] });
        res.status(201).json({ message: "Success create like/dislike"});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const editCommentSchema = joi.object({
    status: joi.string().valid("active", "inactive").messages({
        "any.only": "Status must be active/inactive"
    })
});

exports.editComment = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }

    const { error, value } = editCommentSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    try {
        const result = await Comment.findByPk(req.params.comment_id);
        if (!result) {
            return res.status(400).json({ error: "Comment not found" });
        }

        const checkUser = await User.findByPk(req.id);
        if (checkUser.role !== "admin" || result.author !== req.id) {
            return res.status(400).json({ error: "You do not have rights to this resource"});
        }

        result.status = value.status || result.status;
        
        await result.save();
        res.status(200).json({ message: "Comment updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delComment = async (req, res) => {
    try {
        const result = await Comment.findByPk(req.params.comment_id);
        if (!result) {
            return res.status(400).json({ error: "Comment not found" });
        }

        const checkUser = await User.findByPk(req.id);
        if (checkUser.role !== "admin" || result.author !== req.id) {
            return res.status(400).json({ error: "You do not have rights to this resource"});
        }

        await result.destroy();
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delLikeComment = async (req, res) => {
    try {
        const result = await Like.findOne({ where: {comment_id: req.params.comment_id }});
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