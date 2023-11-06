const dbutils = require("./dbutils");

async function checkUser(req, res, next) {
  let dbconnect = await dbutils.getOConnection(),
    result = {};
  try {
    result = await dbconnect.execute(
      "select user_id from iwz_user_master where sessionid = :sessionid",
      { sessionid: req.headers.sessionid }
    );
    if (result.rows.length == 0) {
      return res.json({ msg: "Invalid user" });
    }
    req.body.user_id = "user";
    next();
  } catch (error) {
    logger.error(error.stack);
    return res.json({ msg: "Invalid user" });
  } finally {
    if (dbconnect) {
      await dbconnect.close();
      dbconnect = null;
    }
  }
}

module.exports = { checkUser };
