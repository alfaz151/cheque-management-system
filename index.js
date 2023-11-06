const express = require("express");
const app = express();
const config = require("./config/dbconfig.json");
const bodyParser = require("body-parser");
const logger = require("./utilityfunctions/logger");
const collection = require("./payment_management/collection");
const { checkUser } = require("./utilityfunctions/logincheck");
const notification = require("./utilityfunctions/notification");
const dbutil = require("./utilityfunctions/dbutils")
const mq  = require("./utilityfunctions/Rabbitmq")
global.config = config;
global.logger = logger;

app.use(bodyParser.json());
app.use(checkUser);

app.post("/addPaymentDetails", checkUser, async (req, res) => {
  res.json(
    await collection.addPaymentDetails({
      reqData: req.body,
      user_id: req.body.user_id,
    })
  );
});

app.post("/authorise", checkUser, async (req, res) => {
  res.json(
    await collection.authoriseTransaction({
      reqData: req.body,
      user_id: req.body.user_id,
    })
  );
});

app.post("/unauthorise", checkUser, async (req, res) => {
  res.json(
    await collection.unauthoriseTransaction({
      reqData: req.body,
      user_id: req.body.user_id,
    })
  );
});

app.post("/action/notify", checkUser, async (req, res) => {
  res.json(
    await notification.notifyUser({
      reqData: req.body,
      user_id: req.body.user_id,
    })
  );
});

app.post("/update", checkUser, async (req, res) => {
  res.json(
    await collection.updatePaymentDetail({
      reqData: req.body,
      user_id: req.body.user_id,
    })
  );
});

process.on('SIGINT', () => {
  if (global.ch) { logger.info("Closing mq channel"); ch.close(); }
  if (server) { logger.info("Closing express server"); server.close(); }
  process.exit()
});

const port = 3000;
const server = app.listen(port, async () => {
  await dbutil.validateOracleConnection();
  await mq.connectToRMQ();
  logger.info(`Server is running on ${port}`);
});
