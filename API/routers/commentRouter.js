const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const valid_func = require("../utils/protectPathChecker");

router.get("/api/comments/:comment_id", valid_func.validToken, commentController.infoComment);
router.get("/api/comments/:comment_id/like", valid_func.validToken, commentController.infoLikesComment);
router.post("/api/comments/:comment_id/like", valid_func.validToken, commentController.createCommentLike);
router.patch("/api/comments/:comment_id", valid_func.validToken, commentController.editComment);
router.delete("/api/comments/:comment_id", valid_func.validToken, commentController.delComment);
router.delete("/api/comments/:comment_id/like", valid_func.validToken, commentController.delLikeComment);

module.exports = router;