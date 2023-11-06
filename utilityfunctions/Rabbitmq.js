const amqp = require("amqplib");
global.ch = null;

async function connectToRMQ() {
  let conn = null;
  try {
    conn = await amqp.connect(
      {
        protocol: "amqp",
        hostname: config.rabbitmq.serverip,
        port: config.rabbitmq.port || 5672,
        username: config.rabbitmq.user,
        password: config.rabbitmq.password,
        locale: "en_US",
        frameMax: 0,
        heartbeat: 0,
        vhost: "/",
      },
      {}
    );
    logger.info("RabbitMQ Connected");
    ch = await conn.createChannel();
  } catch (error) {
    if (ch) {
      ch.close();
    }
    if (conn) {
      conn.close();
    }
    logger.error(error.stack);
    throw `Rabbitmq: ${error}`;
  }
  return null;
}

async function sendToMq(msg, key, exchange = config.rabbitmq.exchange) {
  try {
    await connectToRMQ();
    await ch.assertExchange(exchange, "topic", { durable: true });
    await ch.publish(exchange, key, Buffer.from(JSON.stringify(msg)));
    logger.info(
      `Publishing to ${exchange} with key ${key} and message: ${JSON.stringify(
        msg
      )}`
    );
    return null;
  } catch (error) {
    logger.error(error.stack);
    throw "Rabbit Mq error";
  }
}

module.exports = { sendToMq, connectToRMQ };
