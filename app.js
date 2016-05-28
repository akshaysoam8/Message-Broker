var kue = require('kue');
var mailParser = require('mailparser').MailParser;
var fs = require('fs');
var http = require('http');
var path = require('path');
var chokidar = require('chokidar');
var redis = require('redis');
var nodemailer = require('nodemailer');
var chalk = require('chalk');
var nconf = require('nconf');

nconf.file(path.join('Config', 'config.json'));

var client = redis.createClient();
var mailparser = new mailParser();
var server = http.createServer();
var queue = kue.createQueue();

var logStream = fs.createWriteStream(path.join('Logs', 'log.txt'));

console.log = function (data, color) {
  if(color == 'undefined')
    color = 'white';

  process.stdout.write(chalk[color](data + '\n'));
  logStream.write(data + '\n');
}

server.listen(nconf.get('serverPort'), function () {
  console.log('Server is running on port ' + nconf.get('serverPort') +'...', 'green');
});

client.on('error', function (err) {
  console.log('Error while connecting to redids', 'red');
  console.log(err);
});

client.on('ready', function () {
  console.log('Redis Cache is ready', 'green');
});

chokidar.watch('Data/Email').on('all', function (event, filename) {
  if(event == 'add' && filename)
  {
    if(getFileExtension(filename) == '.eml')
      newEmail(filename);

    else
      console.log('Invalid file format... "' + filename + '" skipped', 'red');
  }
});

function getFileExtension(filename) {
  var index = filename.lastIndexOf('.');

  return filename.substring(index);
}

function newEmail(filename) {
  console.log('New Email to be sent', 'blue');

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
        console.log('New Email queued', 'blue');
        console.log('job.id : ' + job.id, 'yellow');
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
          user: nconf.get('adminEmail'),
          pass: nconf.get('adminPassword')
      }
  });

  var mailOptions = {
    from: data.from,
    to: data.to,
    subject: data.subject,
    text: data.text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    console.log('Sending the mail', 'magenta');

    if (error)
      console.log(error, 'red');

    else
      console.log('Message sent : ' + info.response, 'cyan');

    done();
  });
}

process.once('SIGTERM', function (sig) {
  queue.shutdown(5000, function(err) {
    console.log('Kue shutdown: ', err ||'' );
    process.exit( 0 );
  });
});
