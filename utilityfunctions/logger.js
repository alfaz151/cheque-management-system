const env = process.env.NODE_ENV === "development" ? "debug" : "info";
const fs = require("fs");
const logDir = "Logs";
const winston = require("winston");
let split = require('split');
const rTracer = require('cls-rtracer');
global.rTracer = rTracer;
require("winston-daily-rotate-file");

var logger;

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: `${logDir}/%DATE%-result.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '3d'
});

logger = winston.createLogger({
  level: env,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss"
    }),
    winston.format.printf(
      info => {
        const rid = rTracer.id()
        return rid
          ? `${info.timestamp} [request-id:${rid}]: ${info.level}: ${info.message}`
          : `${info.timestamp} ${info.level}: ${info.message}`;
      }
    )
  ),

  transports: [
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => {
            const rid = rTracer.id()
            return rid
              ? `${info.timestamp} [request-id:${rid}]: ${info.level}: ${info.message}`
              : `${info.timestamp} ${info.level}: ${info.message}`;
          }
        )
      )
    }),
    dailyRotateFileTransport
  ]
});

logger.stream = split().on('data', function (message) {
  logger.info(message);
});


module.exports = logger