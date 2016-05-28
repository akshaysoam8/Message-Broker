var kue = require('kue');
var mailParser = require('mailparser').MailParser;
var fs = require('fs');
var http = require('http');
var path = require('path');
var chokidar = require('chokidar');
var redis = require('redis');
var nodemailer = require('nodemailer');
var chalk = require('chalk');

var client = redis.createClient();
var mailparser = new mailParser();
var server = http.createServer();
var queue = kue.createQueue();

server.listen(1000, function () {
  console.log(chalk.green('Server is running...'));
});

client.on('error', function (err) {
  console.log(chalk.red('Error while connecting to redids'));
  console.log(err);
});

client.on('ready', function () {
  console.log(chalk.green('Redis Cache is ready'));
});

chokidar.watch('Data/Email').on('all', function (event, filename) {
  if(event == 'add' && filename)
    newEmail(filename);
});

function newEmail(filename) {
  console.log(chalk.blue('New Email to be sent'));

  mailparser.on('end', function(mail_object){
    var options = {
      title : mail_object.subject,
      subject : mail_object.subject,
      to : mail_object.to,
      from : mail_object.from,
      text : mail_object.text
    }

    var job = queue.create('email', options).save(function(err) {
      if(err)
        console.log(chalk.red(err));

      else {
        console.log(chalk.blue('New Email queued'));
        console.log(chalk.yellow('job.id : ' + job.id));
      }
    });
  });

  var stream = fs.createReadStream(filename);

  stream.on('data', function (data) {
    mailparser.write(data.toString());
  });

  stream.on('end', function (err) {
    mailparser.end();
  });
}

queue.process('email', function (job, done) {
  sendEmail(job.data, done);
});

function sendEmail(data, done) {
  var transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: 'dockerresourcemanagement@gmail.com',
          pass: 'Akshay24@'
      }
  });

  var mailOptions = {
    from: data.from,
    to: data.to,
    subject: data.subject,
    text: data.text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    console.log(chalk.magenta('Sending the mail'));

    if (error)
      console.log(chalk.red(error));

    else
      console.log(chalk.cyan('Message sent : ' + info.response));

    done();
  });
}

process.once( 'SIGTERM', function (sig) {
  queue.shutdown( 5000, function(err) {
    console.log('Kue shutdown: ', err ||'' );
    process.exit( 0 );
  });
});
