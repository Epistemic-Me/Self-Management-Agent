import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'client-portal' },
  transports: [
    new winston.transports.File({ 
      filename: '../dev-logs/issue-2/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '../dev-logs/issue-2/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
