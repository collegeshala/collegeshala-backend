const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:3000",
    accessKeyId: process.env.Access_Key_ID,
    secretAccessKey: process.env.Secret_Access_Key,
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

const CreateTable = () => {
    const params = {
        TableName: "professors",
        KeySchema: [
            { AttributeName: "email", KeyType: "HASH" },
            { AttributeName: "fullName", KeyType: "RANGE" },
        ],
        AttributeDefinitions: [
            { AttributeName: "email", AttributeType: "S" },
            { AttributeName: "fullName", AttributeType: "S" },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1000,
            WriteCapacityUnits: 1000,
        },
    };

    dynamodb.createTable(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to create table. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            console.log(
                "Created table. Table description JSON:",
                JSON.stringify(data, null, 2)
            );
        }
    });
};

const AddItem = (data) => {
    const {
        fullName,
        email,
        password,
        college,
        dept,
        subject,
        phoneNo,
        credit,
    } = data;

    let date_obj = new Date();
    const timeOfCreation = date_obj.toISOString();

    var params = {
        TableName: "professors",
        Item: { fullName, email, password, college, dept, subject, phoneNo, timeOfCreation, credit },
    };

    console.log("Adding a new item...");

    docClient.put(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to add item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
        }
    });
};

const ScanTable = () => {
    var params = {
        TableName: "professors",
        // ProjectionExpression: "#yr, title, info.rating",
        // FilterExpression: "#yr between :start_yr and :end_yr",
        // ExpressionAttributeNames: {
        //     "#yr": "year",
        // },
        // ExpressionAttributeValues: {
        //     ":start_yr": 1950,
        //     ":end_yr": 1959,
        // },
    };

    console.log("Scanning professors table.");
    docClient.scan(params, onScan);

    function onScan(err, data) {
        if (err) {
            console.error(
                "Unable to scan the table. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            // print all the professors
            console.log("Scan succeeded.");
            data.Items.forEach(function (professor) {
                console.log(JSON.stringify(professor));
            });

            // continue scanning if we have more professors, because
            // scan can retrieve a maximum of 1MB of data
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            }
        }
    }
};

const GetItem = (data) => {
    const { email, fullName } = data;

    const params = {
        TableName: "professors",
        Key: {
            email,
            fullName,
        },
    };

    docClient.get(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
        }
    });
};

const GetCredits = data => {

    const { email, fullName, rate } = data;

    const params = {
        TableName: "professors",
        Key: { email, fullName }
    }

    docClient.get(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            const { credit } = data.Item;
            const value = credit * (rate || 10);

            console.log("GetCredits succeeded:", JSON.stringify({ credit, value }, null, 2));
        }
    });
}

// CreateTable();

// AddItem({
//     fullName: "Test Professor 1",
//     email: "testprof1@gmail.com",
//     password: "qwerty",
//     college: "HIT-K",
//     dept: "CSE",
//     subject: "Programming in C",
//     phoneNo: "9477388223",
//     credit: 14,
// });

// ScanTable();

// GetItem({
//     fullName: "Mujtaba Basheer",
//     email: "mujtababasheer14@gmail.com"
// })

GetCredits({
    email: "testprof1@gmail.com",
    fullName: "Test Professor 1",
    // rate: 10,
});