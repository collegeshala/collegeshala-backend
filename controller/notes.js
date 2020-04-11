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
        TableName: "notes",
        KeySchema: [{ AttributeName: "noteid", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "noteid", AttributeType: "S" }],
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
    const { noteid, name, professor, url } = data;

    var params = {
        TableName: "notes",
        Item: { noteid, name, professor, url },
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
        TableName: "notes",
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

    console.log("Scanning notes table.");
    docClient.scan(params, onScan);

    function onScan(err, data) {
        if (err) {
            console.error(
                "Unable to scan the table. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            // print all the notes
            console.log("Scan succeeded.");
            data.Items.forEach(function (note) {
                console.log(JSON.stringify(note));
            });

            // continue scanning if we have more notes, because
            // scan can retrieve a maximum of 1MB of data
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            }
        }
    }
};

exports.GetItem = (data) => {
    const { noteid } = data;

    const params = {
        TableName: "notes",
        Key: { noteid },
    };

    docClient.get(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            console.log(
                "GetItem succeeded:",
                JSON.stringify(data.Item, null, 2)
            );
        }
    });
};

const DeleteNote = note => {

    const { noteid } = note;

    const params = {
        Key: { "noteid": { "S": noteid } },
        TableName: "notes",
    }

    dynamodb.deleteItem(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });
}

exports.GetBatchNotes = (noteids) => {
    const keys = noteids.map((noteid) => {
        return { noteid: { S: noteid } };
    });
    // const keys = noteids.map(noteid => { return { noteid } });

    const params = {
        RequestItems: {
            notes: {
                Keys: keys,
            },
        },
    };

    dynamodb.batchGetItem(params, function (err, data) {
        if (err) console.log(err, err.stack);
        // an error occurred
        else console.log(JSON.stringify(data.Responses.notes)); // successful response
    });
};

exports.AddNotes = (toAddNotes) => {

    const notes = toAddNotes.map((note) => {
        const { noteid, name, professor, url } = note;
        return {
            PutRequest: {
                Item: {
                    noteid: { S: noteid },
                    name: { S: name },
                    professor: { S: professor },
                    url: { S: url },
                },
            },
        };
    });

    const params = {
        RequestItems: {
            notes,
        },
    };

    dynamodb.batchWriteItem(params, function (err, data) {
        if (err) console.log(err, err.stack);
        // an error occurred
        else console.log("Batch Write Notes successfull", data); // successful response
    });
};

// ScanTable();

// CreateTable();

// AddItem({
//     noteid: "sdfghi98765re",
//     name: "Test Subject 3",
//     professor: "Test Professor 3",
//     url: "what_ever.com"
// });

// GetItem({ noteid: "fr56yvfrt6uj" });

// GetBatchNotes(["jki76trfcvbhy5esx", "nvfde4567ujn", "sdfghi98765re"]);

DeleteNote({ noteid: "note_id_1" })
