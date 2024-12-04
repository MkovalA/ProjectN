const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const valid_func = require("../utils/protectPathChecker");

router.get("/api/posts", valid_func.validToken, postController.allPosts);
router.get("/api/posts/:post_id", valid_func.validToken, postController.infoPost);
router.get("/api/posts/:post_id/comments", valid_func.validToken, postController.allCommentsPost);
router.post("/api/posts/:post_id/comments", valid_func.validToken, postController.createComment);
router.get("/api/posts/:post_id/categories", valid_func.validToken, postController.allCategoriesPost);
router.get("/api/posts/:post_id/like", valid_func.validToken, postController.allLikesPost);
router.post("/api/posts/", valid_func.validToken, postController.createPost);
router.post("/api/posts/:post_id/like", valid_func.validToken, postController.createLikePost);
router.patch("/api/posts/:post_id", valid_func.validToken, postController.editPost);
router.delete("/api/posts/:post_id", valid_func.validToken, postController.delPost);
router.delete("/api/posts/:post_id/like", valid_func.validToken, postController.delLikePost);

module.exports = router;