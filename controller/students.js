const AWS = require("aws-sdk");
const dotenv = require("dotenv");
const GetNotes = require("./notes");
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
        TableName: "students",
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
        degree,
        semester,
        phoneNo,
        purchasedNotes,
        cart,
    } = data;

    let date_obj = new Date();
    const timeOfCreation = date_obj.toISOString();

    const params = {
        TableName: "students",
        Item: {
            fullName,
            email,
            password,
            college,
            degree,
            semester,
            phoneNo,
            purchasedNotes,
            timeOfCreation,
            cart
        },
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
        TableName: "students",
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

    console.log("Scanning students table.");
    docClient.scan(params, onScan);

    function onScan(err, data) {
        if (err) {
            console.error(
                "Unable to scan the table. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            // print all the students
            console.log("Scan succeeded.");
            data.Items.forEach(function (student) {
                console.log(JSON.stringify(student));
            });

            // continue scanning if we have more students, because
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
    // const { email } = data;

    const params = {
        TableName: "students",
        Key: {
            email,
            fullName,
        },
    };

    let student;

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

    return student;
};

const GetPurchasedNotes = data => {
    const { email, fullName } = data;

    docClient.get(
        {
            TableName: "students",
            Key: {
                email,
                fullName,
            },
        },
        (err, data) => {
            if (err) {
                console.error(
                    "Unable to read item. Error JSON:",
                    JSON.stringify(err, null, 2)
                );
            } else {
                notes = data.Item.purchasedNotes;
                //console.log(JSON.stringify(notes));
                notes.map(noteid => GetNotes({ noteid }))
                // console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            }
        }
    );
};

const UpdateCart = data => {
    const { email, fullName } = data;

    const getParams = {
        TableName: "students",
        Key: {
            email,
            fullName,
        },
    }

    docClient.get(getParams, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            const { cart, purchasedNotes } = data.Item;
            const updatedPurchasedNotes = purchasedNotes.concat(cart);

            const updateParams = {
                TableName: "students",
                Key: { email, fullName },
                UpdateExpression: "set cart = :c, purchasedNotes = :p",
                ExpressionAttributeValues: {
                    ":c": [],
                    ":p": updatedPurchasedNotes,
                },
                ReturnValues: "UPDATED_NEW",
            };

            console.log("Updating the item...");
            docClient.update(updateParams, (err, data) => {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                }
            });
        }
    });
}

// CreateTable();

// AddItem({
//     fullName: "Test Student 2",
//     email: "teststudent2@gmail.com",
//     password: "qwerty",
//     college: "HIT-K",
//     degree: "B. Tech. CSE",
//     semester: 5,
//     phoneNo: "9477388223",
//     purchasedNotes: ["fr56yvfrt6uj",],
//     cart: ["jki76trfcvbhy5esx",]
// });

// ScanTable();

// GetItem({ fullName: "Test Student 2", email: "teststudent2@gmail.com" });

// GetPurchasedNotes({
//     email: "teststudent1@gmail.com",
//     fullName: "Test Student 1",
// });

// UpdateCart({ fullName: "Test Student 2", email: "teststudent2@gmail.com" });