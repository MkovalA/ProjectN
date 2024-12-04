const express = require("express");
const http = require("http");
const app = express();
const authRouter = require('./routers/authRouter');
const usersRouter = require('./routers/usersRouter');
const postRouter = require('./routers/postRouter');
const categoryRouter = require('./routers/categoryRouter');
const commentRouter = require('./routers/commentRouter');
const server = http.createServer(app);
const path = require("path");
const config = require("./config");
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "*",
    methods: ["*"],
    allowedHeaders: ["*"]
}));

app.use(authRouter);
app.use(usersRouter);
app.use(postRouter);
app.use(categoryRouter);
app.use(commentRouter);

app.use("/uploads/avatars", express.static(path.join(__dirname, "uploads", "avatars")));

server.listen(5868, () => {
    console.log("Server is listening at http://localhost:" + 5868);
});
