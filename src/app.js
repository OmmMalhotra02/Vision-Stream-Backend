import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

const corsOptions = {
  origin: [
    "https://vision-stream-backend.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

app.use(express.json({limit: "16kb"}))

app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(express.static("public"))

app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'
import commentRouter from './routes/comment.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import likeRouter from './routes/like.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"

//routes declaration
//base url - /api/v1/users
//original url - /api/v1/users/register
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/comments', commentRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/likes', likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)

app.get('/', (req, res) => {
res.send('Servers survived 😈 Vision Stream Backend is live and ready. No bugs detected… yet 🐛');
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {

  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "CORS error: origin not allowed",
    });
  }

  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"
  const errors = err.errors || []

  res.status(statusCode).json({
    success: false,
    message,
    errors
  })
})

export default app