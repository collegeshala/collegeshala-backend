const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();

AWS.config.update({
    region: "ap-south-1",
    accessKeyId: process.env.Ses_Access_Key_ID,
    secretAccessKey: process.env.Ses_Secret_Access_Key,
});

const ses = new AWS.SES();

const params = {
    Message: {
        Body: {
            Html: {
                Data: "<h1>Hey, <em>Mujtaba</em> here.</h1>",
                Charset: "UTF-8",
            },
            Text: {
                Data: "Hey, Mujtaba here." /* required */,
                Charset: "UTF-8",
            },
        },
        Subject: {
            Data: "Testing AWS SES" /* required */,
            Charset: "UTF-8",
        },
    },
    Destination: {
        ToAddresses: ["collegeshala2020@gmail.com"],
    },
    Source: "collegeshala2020@gmail.com",
};

ses.sendEmail(params, function (err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else console.log(JSON.stringify(data)); // successful response
});
