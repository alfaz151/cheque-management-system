const dbutils = require("../utilityfunctions/dbutils");
const rabbitmq = require("../utilityfunctions/Rabbitmq");
const notify = require("../utilityfunctions/notification");

async function addPaymentDetails(Obj) {
  let dbconnect = null,
    result = {};
  try {
    dbconnect = Obj.connection || await dbutils.getOConnection();
    result = await dbconnect.execute(
      "SELECT seq_paymentid_alfaz.NEXTVAL id FROM dual"
    );
    Obj.reqData.id = result.rows[0].toString();
    Obj.reqData.user_id = Obj.user_id;
    qry = `begin insert into alfaz_payment_management columns (payment_id,drawer_name, payee_name, payment_date, bank_name, bank_code, amount, amount_in_words, email, paymentmode) values (:id,:drawer_name,:payee_name,:payment_date,:bank_name,:bank_code,:amount,:amount_in_words,:email,:paymentmode );INSERT INTO audit_alfaz_payment_management select b.*,'Create payment data' sys_auditreason, :user_id sys_userid, sysdate sys_auditdate, 'create' sys_operation,1 sys_audit_id from alfaz_payment_management b where   payment_id = :id;end;`;
    bind = Obj.reqData;
    result = await dbconnect.execute(qry, Obj.reqData, { autoCommit: false });
    msg = { eventname: "Transaction.create", id: Obj.reqData.id };

    await rabbitmq.sendToMq(msg, "payment");
    if (dbconnect && !Obj.connection) await dbconnect.commit();
    return { status: "success", msg: "Payment detail inserted Successfully" };
  } catch (error) {
    if (dbconnect) await dbconnect.rollback();
    logger.error(error.stack);
    return {
      status: "unsuccess",
      error: "Error occured while inserting data",
      msg: "",
    };
  } finally {
    if (dbconnect) {
      await dbconnect.close();
      dbconnect = null;
    }
  }
}

async function authoriseTransaction(Obj) {
  let dbconnect = Obj.connection || await dbutils.getOConnection();
  try {
    await dbconnect.execute(
      "begin update alfaz_payment_management set authorization_status = '1' where payment_id = :payment_id;INSERT INTO audit_alfaz_payment_management select b.*,'Update Auth status' sys_auditreason, :user_id sys_userid, sysdate sys_auditdate, 'create' sys_operation,1 sys_audit_id from alfaz_payment_management b where payment_id =:payment_id;end;",
      { payment_id: Obj.reqData.payment_id, user_id: Obj.user_id },
      { autoCommit: false }
    );
    msg = { eventname: "Transaction.Authorise", id: Obj.reqData.payment_id };
    await rabbitmq.sendToMq(msg, "payment");
    if (dbconnect && !Obj.connection) await dbconnect.commit();
    await notify.sendNotification({payment_id:Obj.reqData.payment_id,subject:"Payment authorization",text:"Payment authorized successfully by"+Obj.user_id})
    return {
      status: "success",
      error: "",
      msg: "Transaction authorised successfully",
    };
  } catch (error) {
    if (dbconnect) await dbconnect.rollback();
    logger.error(error.stack);
    return {
      status: "unsuccess",
      error: "Error occured while Authorising transaction",
      msg: "",
    };
  } finally {
    if (dbconnect) {
      await dbconnect.close();
      dbconnect = null;
    }
  }
}

async function unauthoriseTransaction(Obj) {
  let dbconnect = Obj.connection || await dbutils.getOConnection();
  try {
    await dbconnect.execute(
      "begin update alfaz_payment_management set authorization_status = '0' where payment_id = :payment_id;INSERT INTO audit_alfaz_payment_management select b.*,'Update Auth status' sys_auditreason, :user_id sys_userid, sysdate sys_auditdate, 'create' sys_operation,1 sys_audit_id from alfaz_payment_management b where payment_id =:payment_id;end;",
      { payment_id: Obj.reqData.payment_id, user_id: Obj.user_id },
      { autoCommit: false }
    );
    msg = { eventname: "Transaction.unauthorise", id: Obj.reqData.payment_id };
    await rabbitmq.sendToMq(msg, "payment");
    if (dbconnect && !Obj.connection) await dbconnect.commit();
    await notify.sendNotification({payment_id:Obj.reqData.payment_id,subject:"Payment Unauthorization",text:"Payment unauthorized successfully by"+Obj.user_id})
    return {
      status: "success",
      error: "",
      msg: "Transaction unauthorised successfully",
    };
  } catch (error) {
    if (dbconnect) await dbconnect.rollback();
    logger.error(error.stack);
    return {
      status: "unsuccess",
      error: "Error occured while unauthorising transaction",
      msg: "",
    };
  } finally {
    if (dbconnect) {
      await dbconnect.close();
      dbconnect = null;
    }
  }
}

async function updatePaymentDetail(Obj) {
  let dbconnect = Obj.connection || await dbutils.getOConnection();
  try {
    Obj.reqData.user_id = Obj.user_id
    await dbconnect.execute(
      "begin update alfaz_payment_management set payee_name = :payee_name,email=:email where payment_id = :payment_id;INSERT INTO audit_alfaz_payment_management select b.*,'Update other details' sys_auditreason, :user_id sys_userid, sysdate sys_auditdate, 'create' sys_operation,1 sys_audit_id from alfaz_payment_management b where payment_id =:payment_id;end;",
      Obj.reqData,
      { autoCommit: false }
    );
    msg = { eventname: "Transaction.update", id: Obj.reqData.payment_id };
    await rabbitmq.sendToMq(msg, "payment");
    if (dbconnect && !Obj.connection) await dbconnect.commit();
    return {
      status: "success",
      error: "",
      msg: "Payee Name and Email updated successfully",
    };
  } catch (error) {
    if (dbconnect) await dbconnect.rollback();
    logger.error(error.stack);
    return {
      status: "unsuccess",
      error: "Error occured while updating transaction",
      msg: "",
    };
  } finally {
    if (dbconnect) {
      await dbconnect.close();
      dbconnect = null;
    }
  }
}

module.exports = {
  updatePaymentDetail,
  addPaymentDetails,
  authoriseTransaction,
  unauthoriseTransaction,
};
