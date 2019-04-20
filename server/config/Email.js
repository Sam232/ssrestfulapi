const MailGun = require("mailgun-js")({
  apiKey: "key-2bf5ab8b449e59b04ebdfdf9aa622ba1",
  domain: "redeemertech.net"
});

const sendMail = (to, subject, html) => {
  return new Promise((resolve, reject) => {
    const recipientData = {
      from : "Support System <support@redeemertech.net>",
      to,
      subject,
      html
    };

    MailGun.messages().send(recipientData, (error, body) => {
      if(error){
        return reject({
          errorMsg: "Unable to send email",
          error
        });
      }

      resolve({
        msg: "Email Sent",
        body
      });
    });
  });
};

module.exports = sendMail;