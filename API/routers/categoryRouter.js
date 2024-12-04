const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const valid_func = require("../utils/protectPathChecker");

router.get("/api/categories", valid_func.validToken, categoryController.allCategories);
router.get("/api/categories/:category_id", valid_func.validToken, categoryController.infoCategory);
router.get("/api/categories/:category_id/posts", valid_func.validToken, categoryController.allPostsCategory);
router.post("/api/categories", valid_func.validToken, valid_func.checkAdmin, categoryController.createCategory);
router.patch("/api/categories/:category_id", valid_func.validToken, valid_func.checkAdmin, categoryController.editCategory);
router.delete("/api/categories/:category_id", valid_func.validToken, valid_func.checkAdmin, categoryController.delCategory);

module.exports = router;