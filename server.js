const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const colors = require('colors');
const cors = require('cors');
var crypto = require("crypto");
const axios = require("axios");
// Route Files
const main = require('./routes/main');
var bodyParser = require("body-parser")

// DB Connection
const db = require('./config/keys').MongoURI;
// Connect MongoDB
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then( () => console.log('MongoDB Connected'.green.bold) )
    .catch(err => console.log(err));


const app = express();

app.use(cors());
app.use(express.json());

// Routing for API Service
app.use('/api/v1/main', main);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));
app.get("/geturl", function (req, resp) {
    var  data=req.query;
    var amount = data.amt;
    var name = data.name;
    var emailId = data.emailId;
    var productname = data.productname;
    var description = data.description;
    //    resp.json(amount);
    var login = "9132";
    var pass = "Test@123";
    var prodid = "NSE";
    var ttype = "NBFundTransfer";
    var transid = "1000";
    var txncur = "INR";
    var custacc = "100000036600";
    var datepick = new Date(); // replace with current date
   
    var cc = "NAVIN";
    var final = new Buffer(cc).toString("base64"); // clientcode
    var url = `http://localhost:5000/Response/${data.otp}`;
    var udf1 = name;
    var udf2 = emailId;
    var udf3 = productname;
    var udf4 = description;
  
    var key = "KEY123657234";
    var req_enc_key = "A4476C2062FFA58980DC8F79EB6A799E";
    var req_salt = "A4476C2062FFA58980DC8F79EB6A799E";
    var sign = login + pass + ttype + prodid + transid + amount + txncur;
  
    function sig(sign, key) {
      return crypto
        .createHmac("sha512", key)
        .update(new Buffer(sign, "utf-8"))
        .digest("hex");
    }
    var signature = sig(sign, key);
    var text =
      "login=" +
      login +
      "&pass=" +
      pass +
      "&ttype=" +
      ttype +
      "&prodid=" +
      prodid +
      "&amt=" +
      amount +
      "&txncurr=" +
      txncur +
      "&txnscamt=" +
      amount +
      "&clientcode=" +
      encodeURIComponent(final) +
      "&txnid=" +
      transid +
      "&date=" +
      datepick +
      "&custacc=" +
      custacc +
      "&udf1=" +
      udf1 +
      "&udf2=" +
      udf2 +
      "&udf3=" +
      udf3 +
      "&udf4=" +
      udf4 +
      "&ru=" +
      url +
      "&signature=" +
      signature +
      "";
  
    const algorithm = "aes-256-cbc";
    const password =  Buffer.from(req_enc_key, "utf8");
    const salt =  Buffer.from(req_salt, "utf8");
    const iv =  Buffer.from(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      "utf8"
    );
  
    const encrypt = (text) => {
      var derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, "sha1");
      const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return `${encrypted.toString("hex")}`;
    };
  
    var encdata = encrypt(text);
  
    var options = {
      host: "https://paynetzuat.atomtech.in",
      path: "/paynetz/epi/fts?login=" + login + "&encdata=" + encdata,
    };
    url = options["host"] + options["path"];

    resp.writeHead(301,
      {Location:url}
    );
    resp.end();
  });
  
  app.post("/Response/:otp", async (req, resp) => {
    var res_enc_key = "75AEF0FA1B94B3C10D4F5B268F757F11";
    var res_salt = "75AEF0FA1B94B3C10D4F5B268F757F11";
    const algorithm = "aes-256-cbc";
    
    const password =  Buffer.from(res_enc_key, "utf8");
    const salt =  Buffer.from(res_salt, "utf8");
    const iv =  Buffer.from(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      "utf8"
    );
    const decrypt = (text) => {
      const encryptedText =  Buffer.from(text, "hex");
      var derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, "sha1");
      const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
      let decrypted = decipher.update(encryptedText);
      decrypted =  Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString();
    };
    var decrypted_data =  decrypt(req.body.encdata);
    var arr = decrypted_data.split("&").map(function (val) {
      return val;
    });
    var data = {};
    for (var i = 0; i < arr.length; i++) {
      var val = arr[i].split("=");
      data[val[0]] = val[1];
    }
  
  
    if (data.desc === "SUCCESS") {
      try {
        const res = await axios.put(
          `http://localhost:1337/details/me/${req.params.otp}`,{
          Status:"Completed"
          },
        );
        resp.sendFile(__dirname+"/views/index.html");
      } catch (err) {
        console.log(err);
        resp.sendFile(__dirname+"/views/index.html");
      }
    } else {
      resp.sendFile(__dirname+"/views/index.html");
    }
  });
  

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`.yellow.bold));