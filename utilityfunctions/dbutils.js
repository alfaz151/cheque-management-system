const oracledb = require("oracledb");
oracledb.fetchAsString = [oracledb.DATE, oracledb.NUMBER];

async function validateOracleConnection() {
  let connection = null;
  try {
    connection = await oracledb.getConnection({
      user: config.database[0].user,
      password: config.database[0].password,
      connectString: config.database[0].connectString,
    });
    logger.info("Oracle Connected");
  } catch (error) {
    logger.error(error);
  } finally {
    if (connection) await connection.close();
  }
}

async function getOConnection() {
  let connection = null;
  try {
    connection = await oracledb.getConnection({
      user: config.database[0].user,
      password: config.database[0].password,
      connectString: config.database[0].connectString,
    });
    await connection.execute(
      "alter session set nls_date_format = '" + config.DATE_FORMAT + "'"
    );
    return connection;
  } catch (error) {
    logger.error(error);
  }
}

module.exports = { getOConnection, validateOracleConnection };
