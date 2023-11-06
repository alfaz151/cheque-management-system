const dbutil = require("./dbutils");
const nodemailer = require("nodemailer");
const rabbitmq = require("./Rabbitmq");

async function notifyUser(Obj) {
  let dbconnect = Obj.connection || (await dbutil.getOConnection())
  try {
    Obj.reqData.user_id = Obj.user_id;
    await dbconnect.execute( "Insert into alfaz_paymentnotification columns (payment_id,notification_on,notification_by) values (:payment_id,sysdate,:user_id)", Obj.reqData, { autoCommit: false } );
    msg = { eventname: "Transaction.notify", id: Obj.reqData.payment_id };
    await rabbitmq.sendToMq(msg, "payment");
    if (dbconnect && !Obj.connection) await dbconnect.commit();
    await sendNotification({payment_id:Obj.reqData.payment_id,subject:"User Notification for authorization",text:"User Notification for authorization"})
    return { status: "success", msg: "Notification sent to the user" };
  } catch (error) {
    logger.error(error.stack);
    if (dbconnect) await dbconnect.rollback();
    return { status: "unsuccess", error: "Error Occured while notifying user" };
  } finally {
    if (dbconnect && !Obj.connection) {
      await dbconnect.close();
      dbconnect = null;
    }
  }
}

async function sendNotification(Obj){
  let dbconnect = await dbutil.getOConnection();
  try{
    userDetail = await dbconnect.execute( "select email from alfaz_payment_management where payment_id = :id", { id: Obj.payment_id } );
    if (userDetail.rows.length == 0) {
      return { status: "unsuccess", error: "Transaction does not exist" };
    }
    const transporter = nodemailer.createTransport({
      service: "gmail", // e.g., 'Gmail' or use your SMTP settings
      auth: {
        user: config.email.id,
        pass: config.email.password,
      },
    });
    const mailOptions = {
      from: config.email.id,
      to: userDetail.rows[0][0],
      subject: Obj.subject,
      text: Obj.text
    };
    result = await transporter.sendMail(mailOptions);
    logger.info("Message result :" + JSON.stringify(result))
    
  }catch(error) {
    logger.error(error.stack);
  }finally{
    if(dbconnect){
      await dbconnect.close();
    }
  }
}

module.exports = { notifyUser, sendNotification };
