var express = require("express"),
  nodeMailer = require("nodemailer"),
  bodyParser = require("body-parser"),
  request = require("request");

var config = require("./config.json");

var app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

// START things i've added hmmm
var urlencodedParser = bodyParser.urlencoded({extended:false});
const mongoose = require('mongoose');
var url = 'mongodb://localhost:27017';
User = require('user-model.js');
// END things i've added

var port = 3000;

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/contact", function (req, res) {
  res.render("contact", {
    msg: ""
  });
});

app.get("/privacy-policy", function (req, res) {
  res.render("privacy-policy");
});

app.get("/gallery", function (req, res) {
  res.render("gallery");
});

app.get("/admin", function (req, res) {
   res.render("admin");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/send", function (req, res) {
  // g-recaptcha-response is the key that browser will generate upon form submit.
  // if its blank or null means user has not selected the captcha, so return the error.
  if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    return res.json({
      "responseCode": 1,
      "responseDesc": "Please select captcha"
    });
  }
  // Put your secret key here.
  var secretKey = config.secretKey;
  // req.connection.remoteAddress will provide IP address of connected user.
  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
  // Hitting GET request to the URL, Google will respond with success or error scenario.
  request(verificationUrl, function (error, response, body) {
    body = JSON.parse(body);
    // Success will be true or false depending upon captcha validation.
    if (body.success !== undefined && !body.success) {
      return res.json({
        "responseCode": 1,
        "responseDesc": "Failed captcha verification"
      });
    }
    if (!error) {
      const output = `
    <p><strong>You have a new inquiry!</strong></p>
    <h3>Contact Details</h3>
    <ul>
        <li>Name: ${req.body.name}</li>
        <li>Subject: ${req.body.subject}</li>
        <li>Email: ${req.body.email}</li>
        <li>Telephone: ${req.body.telephone}</li>
    </ul>
    <h3>Message</h3>
    <p>${req.body.message}</p>
    `;

      let transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: config.username,
          pass: config.password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      let mailOptions = {
        from: `Contact ${config.from}`, // sender address
        to: config.to, // list of receivers
        subject: "New Inquiry", // Subject line
        text: "", // plain text body
        html: output // html body
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }

        console.log("Message %s sent: %s", info.messageId, info.response);
        res.render("contact", {
          msg: "Email has been sent successfully!"
        });
      });
    }
  });
});

app.post('/registerToDb', urlencodedParser, (req, res) => {
    console.log(req.body.email);


    mongoose.connect(url, (err) => {
        if (err) throw err;
        // db.collection('admin').insertOne(jsonObj);
        var user = User({
            username: req.body.email,
            password: req.body.password
        });

        user.save(function (err) {
            if (err) throw err;
        });

    });

});

app.post('/login', urlencodedParser, (req, res) => {
    debugger;
    mongoose.connect(url, (err) => {
        if (err) throw err;

        User.findOne({username: req.body.email}, (err, user) => {
            if (err) throw err;

            if (!user)
                return;

            user.comparePassword(req.body.password, (err, isMatch) => {

                if (err) throw err;
                if (isMatch)
                    res.send('/');
            });
        });
    });
});

// 404
app.use(function (req, res, next) {
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', {
      url: req.url
    });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({
      error: 'Not found'
    });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

app.listen(process.env.PORT || port, function () {
  console.log("Server is running at port: ", port);
});