const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");
const validFunc = require("../utils/protectPathChecker");
const multer  = require("multer");

const avatar_upload = multer({ storage: multer.memoryStorage(),
    fileFilter(req, file, cb) {
        const mimetypesAllow = ["image/jpeg", "image/png", "image/webp", "image/avif"];
        if (mimetypesAllow.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});


router.get("/api/users", validFunc.validToken, validFunc.checkAdmin, userController.allUsers);
router.get("/api/users/:user_id", validFunc.validToken, userController.infoUser);
router.post("/api/users", validFunc.validToken, validFunc.checkAdmin, userController.create_user);
router.patch("/api/users/:user_id/avatar", validFunc.validToken, avatar_upload.single("avatar"), userController.editAvatar);
router.patch("/api/users", validFunc.validToken, userController.editProfileOwn);
router.patch("/api/users/:user_id", validFunc.validToken, validFunc.checkAdmin, userController.editProfile);
router.delete("/api/users/:user_id", validFunc.validToken, validFunc.checkAdmin, userController.deleteProfile);

module.exports = router;