

/**
 * Custom application error class
 */
export class AppError extends Error {
    constructor(message, statusCode, code = null, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}


/**
 * Not found error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
    const error = new AppError(
        `Not found - ${req.originalUrl}`,
        404,
        "NOT_FOUND"
    );
    next(error);
};

/**
 * Development error response
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            details: err.details,
            stack: err.stack,
        },
    });
};

/**
 * Production error response
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            success: false,
            error: {
                message: err.message,
                code: err.code,
                details: err.details,
            },
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error("ERROR 💥", err);
        res.status(500).json({
            success: false,
            error: {
                message: "Something went wrong",
                code: "INTERNAL_ERROR",
            },
        });
    }
};

/**
 * Handle Drizzle ORM errors
 * @param {Error} error - Error object
 * @returns {AppError} Formatted error
 */
const handleDrizzleError = error => {
    // Foreign key constraint error
    if (error.code === "23503") {
        return new AppError(
            "Referenced record not found",
            400,
            "FOREIGN_KEY_ERROR"
        );
    }

    // Unique constraint error
    if (error.code === "23505") {
        const field = error.detail?.match(/Key \((.*?)\)/)?.[1] || "field";
        return new AppError(
            `Duplicate value for ${field}`,
            400,
            "DUPLICATE_ERROR",
            { field }
        );
    }

    // Not null constraint error
    if (error.code === "23502") {
        const field = error.column || "field";
        return new AppError(`${field} is required`, 400, "REQUIRED_FIELD", {
            field,
        });
    }

    // Check constraint error
    if (error.code === "23514") {
        return new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    return error;
};

/**
 * Handle JWT errors
 * @param {Error} error - Error object
 * @returns {AppError} Formatted error
 */
const handleJWTError = error => {
    if (error.name === "JsonWebTokenError") {
        return new AppError("Invalid token", 401, "INVALID_TOKEN");
    }

    if (error.name === "TokenExpiredError") {
        return new AppError("Token expired", 401, "TOKEN_EXPIRED");
    }

    return error;
};

/**
 * Handle validations errors
 * @param {Error} error - Error object
 * @returns {AppError} Formatted error
 */
const handleValidationError = error => {
    if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map(e => e.message);
        return new AppError("Validation failed", 400, "VALIDATION_ERROR", {
            errors,
        });
    }

    if (error.name === "ZodError") {
        const errors = error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
        }));
        return new AppError("Validation failed", 400, "VALIDATION_ERROR", {
            errors,
        });
    }

    return error;
};

/**
 * Handle multer file upload errors
 * @param {Error} error - Error object
 * @returns {AppError} Formatted error
 */
const handleMulterError = error => {
    if (error.code === "LIMIT_FILE_SIZE") {
        return new AppError("File too large", 400, "FILE_TOO_LARGE");
    }

    if (error.code === "LIMIT_FILE_COUNT") {
        return new AppError("Too many files", 400, "TOO_MANY_FILES");
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return new AppError("Unexpected field", 400, "UNEXPECTED_FIELD");
    }

    return error;
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Log error
    console.error({
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
        stack: error.stack,
    });

    // Handle specific error types
    if (error.code && error.code.startsWith("23")) {
        error = handleDrizzleError(error);
    }

    if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
    ) {
        error = handleJWTError(error);
    }

    if (error.name === "ValidationError" || error.name === "ZodError") {
        error = handleValidationError(error);
    }

    if (error.name === "MulterError") {
        error = handleMulterError(error);
    }

    // Handle Redis errors
    if (error.message?.includes("Redis") || error.code === "ECONNREFUSED") {
        error = new AppError("Cache service unavailable", 503, "CACHE_ERROR");
    }

    // Handle database connection errors
    if (error.code === "ECONNREFUSED" && error.message?.includes("database")) {
        error = new AppError(
            "Database service unavailable",
            503,
            "DATABASE_ERROR"
        );
    }

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(error, res);
    } else {
        sendErrorProd(error, res);
    }

    next();
};

/**
 * Handle unhandled promise rejections
 */
process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    console.error(err.stack);

    // Give time to log the error before shutting down
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

/**
 * Handle uncaught exceptions
 */
process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    console.error(err.stack);

    process.exit(1);
});

/**
 * CORS error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const corsErrorHandler = (req, res) => {
    console.error(`CORS error for origin: ${req.headers.origin}`);
    res.status(403).json({
        success: false,
        error: {
            message: "CORS policy violation",
            code: "CORS_ERROR",
        },
    });
};
