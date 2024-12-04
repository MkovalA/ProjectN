const sequelize = require("../db");
const Sequelize = require("sequelize");
const Post = require("../models/post")(sequelize, Sequelize.DataTypes);
const Category = require("../models/category")(sequelize, Sequelize.DataTypes);
const postCategory = require("../models/postCategory")(sequelize, Sequelize.DataTypes);
const joi = require("joi");

Post.belongsToMany(Category, { through: postCategory, foreignKey: "post_id", otherKey: "category_id" });
Category.belongsToMany(Post, { through: postCategory, foreignKey: "category_id", otherKey: "post_id" });

exports.allCategories = async (req, res) => {
    try {
        const result = await Category.findAll();
        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

exports.infoCategory = async (req, res) => {
    try {
        const result = await Category.findByPk(req.params.category_id);

        if (!result) {
            return res.status(400).json({ error: "Category with this ID does not exist"})
        }

        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

exports.allPostsCategory = async (req, res) => {
    try {
        const checkCategory = await Category.findByPk(req.params.category_id);

        if (!checkCategory) {
            return res.status(400).json({ error: "Category with this ID does not exist"})
        }

        const result = await Post.findAll({ include: { model: Category, where: { id: req.params.category_id }, attributes: []}});

        if (!result) {
            return res.status(400).json({ error: "No posts for this category"})
        }

        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

const createCategorySchema = joi.object({
    title: joi.string().required().min(1).max(64).messages({
        "any.required": "Title is required",
        "string.min": "The title must contain at least 1 characters",
        "string.max": "The maximum title length is 64 characters"
    })
});

exports.createCategory = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }

    const { error, value } = createCategorySchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    const newCategory = {
        title: value.title,
        description: "Default description"
    }

    try {
        await Category.create(newCategory);
        res.status(201).json({ message: "Success create category"});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const editCategorySchema = joi.object({
    title: joi.string().min(1).max(64).messages({
        "string.min": "The title must contain at least 1 characters",
        "string.max": "The maximum title length is 64 characters"
    }),
    description: joi.string().min(1).max(65535).messages({
        "string.min": "The description must contain at least 1 characters",
        "string.max": "The maximum description length is 65535 characters"
    })
});

exports.editCategory = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }

    const { error, value } = editCategorySchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    try {
        const result = await Category.findByPk(req.params.category_id);
        if (!result) {
            return res.status(400).json({ error: "Category not found" });
        }

        result.title = value.title || result.title;
        result.description = value.description || result.description;
        
        await result.save();
        res.status(200).json({ message: "Category updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delCategory = async (req, res) => {
    try {
        const result = await Category.findByPk(req.params.category_id);
        if (!result) {
            return res.status(400).json({ error: "Category not found" });
        }
        await result.destroy();

        res.status(200).json({ message: "Category deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};