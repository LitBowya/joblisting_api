import express from "express"
import helmet from "helmet"
import cors from "cors"
import cookieParser from "cookie-parser"
import compression from "compression"

// Middlewares
import {errorHandler, notFoundHandler} from "./shared/middlewares/error.middleware.js";

// Routes
import authRoutes from "./features/auth/routes/auth.routes.js"
import userRoutes from "./features/user/routes/user.routes.js"
import recruiterRoutes from "./features/recruiter/routes/recruiter.routes.js"
import jobSeekerRoutes from "./features/jobSeeker/routes/jobSeeker.routes.js"

const app = express()

// Important middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

app.get('/', (req, res) => res.send('Welcome to MeetAI'))
app.get('/api', (req, res) => res.send('Welcome to MeetAI API'))

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/recruiter", recruiterRoutes)
app.use("/api/job-seeker", jobSeekerRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app