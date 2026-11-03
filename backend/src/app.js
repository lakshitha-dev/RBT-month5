require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');
const path = require('path');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const commentRoutes = require('./routes/comment.routes');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// number of proxy hops in front of the API (nginx locally; ingress + nginx + ingress in prod)
// — needed for correct client IPs in rate limiting
const trustProxy = process.env.TRUST_PROXY || '1';
app.set('trust proxy', /^\d+$/.test(trustProxy) ? parseInt(trustProxy) : trustProxy === 'true');
app.disable('x-powered-by');

app.use(requestLogger);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));

// health checks and metrics scrapes are mounted before the limiter so they are never throttled
app.use(healthRoutes);

// 100 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' }
  }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
const swaggerDoc = YAML.load(fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// remember the mount path for metrics labels — Express clears req.baseUrl when an error leaves the router
const mount = (base, router) => app.use(base, (req, res, next) => { req.routeBase = base; next(); }, router);
mount('/api/auth', authRoutes);
mount('/api/users', userRoutes);
mount('/api/posts', postRoutes);
mount('/api/comments', commentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `${req.method} ${req.path} not found` }
  });
});

app.use(errorHandler);

module.exports = app;
