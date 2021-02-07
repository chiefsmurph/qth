const gmailSend = require('gmail-send');
const { gmail: credentials } = require('../config');
// console.log({credentials })
const send = gmailSend({
  user: credentials.username,
  pass: credentials.password
});

module.exports = (subject, text = '', to = credentials.username, files = []) => 
  new Promise((resolve, reject) => {
    console.log(`sending email...to ${to}...`);
    console.log('subject', subject, 'text', text.slice(0, 20));
    send({
        subject: `qth alerts: ${subject}`,
        text,
        to,
        files
    }, (err, res) => err 
      ? console.error(err) && resolve() 
      : resolve(res));
  });
