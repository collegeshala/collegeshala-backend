const AWS = require("aws-sdk");
const Notes = require("./notes");
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
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "email", AttributeType: "S" }],
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
        credits,
        uploadedNotes,
        amountEarnedRecord,
    } = data;

    let date_obj = new Date();
    const timeOfCreation = date_obj.toISOString();

    var params = {
        TableName: "professors",
        Item: {
            fullName,
            email,
            password,
            college,
            dept,
            subject,
            phoneNo,
            timeOfCreation,
            credits,
            uploadedNotes,
            amountEarnedRecord,
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

const DeleteProf = (prof) => {
    const { email, fullName } = prof;

    const params = {
        Key: {
            email: { S: email },
            fullName: { S: fullName },
        },
        TableName: "professors",
    };

    dynamodb.deleteItem(params, function (err, data) {
        if (err) console.log(err, err.stack);
        // an error occurred
        else console.log(data); // successful response
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
        // },email
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

const GetCredits = (data) => {
    const { email, fullName, rate } = data;

    const params = {
        TableName: "professors",
        Key: { email, fullName },
    };

    docClient.get(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            const { credit } = data.Item;
            const value = credit * (rate || 10);

            console.log(
                "GetCredits succeeded:",
                JSON.stringify({ credit, value }, null, 2)
            );
        }
    });
};

const GetUploadedNotes = (data) => {
    const { email, fullName } = data;

    const params = {
        TableName: "professors",
        Key: { email, fullName },
    };

    docClient.get(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            const { uploadedNotes } = data.Item;

            console.log("Getting uploaded notes...");
            Notes.GetBatchNotes(uploadedNotes);
        }
    });
};

const UploadNotes = (args) => {
    // args = {
    //     professor: { email: '<email>', fullName: '<full_name>' },
    //     notes: [
    //         { noteid: '<note_id>', name: '<name>', professor: '<prof_name>', url: '<note_url>' },
    //         ......
    //     ]
    // }

    const { professor, notes } = args;
    const { email, fullName } = professor;
    // console.log(JSON.stringify(professor));

    const params = {
        TableName: "professors",
        Key: professor,
    };

    docClient.get(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            const { uploadedNotes } = data.Item;

            console.log("Uploading notes...");
            Notes.AddNotes(notes);

            const newNotesId = notes.map((note) => note.noteid);
            const updatedUploadedNotes = uploadedNotes.concat(newNotesId);

            const updateParams = {
                TableName: "professors",
                Key: { email, fullName },
                UpdateExpression: "set uploadedNotes = :u",
                ExpressionAttributeValues: {
                    ":u": updatedUploadedNotes,
                },
                ReturnValues: "UPDATED_NEW",
            };

            docClient.update(updateParams, (err, data) => {
                if (err) {
                    console.error(
                        "Unable to update item. Error JSON:",
                        JSON.stringify(err, null, 2)
                    );
                } else {
                    console.log(
                        "uploadedNotes successfully updated:",
                        JSON.stringify(data, null, 2)
                    );
                }
            });
        }
    });
};

const AddEarning = async (data) => {
    const { studentEmail, noteids } = data;
    let profs = {};

    let date_obj = new Date();
    const timeOfCreation = date_obj.toISOString();

    const getNotes = (noteids) => {
        return new Promise((resolve, reject) => {
            dynamodb.batchGetItem(
                {
                    RequestItems: {
                        notes: {
                            Keys: noteids,
                        },
                    },
                },
                function (err, data) {
                    if (err) reject(err);
                    // an error occurred
                    else resolve(data.Responses.notes);
                }
            );
        });
    };

    const addRecord = (prof) => {
        const { email, record } = prof;
        let creditsToAdd = 0;
        record["notesPurchased"].forEach(
            (rec) => (creditsToAdd += rec.amountEarned)
        );

        const params = {
            TableName: "professors",
            Key: {
                email,
                // "title": title,
            },
            UpdateExpression:
                "set credits = credits + :to_add, amountEarnedRecord = list_append (amountEarnedRecord, :rec)",
            ExpressionAttributeValues: {
                ":to_add": creditsToAdd,
                ":rec": [record],
            },
            ReturnValues: "UPDATED_NEW",
        };
        docClient.update(params, (err, data) => {
            if (err) {
                console.error(
                    "Unable to update item. Error JSON:",
                    JSON.stringify(err, null, 2)
                );
            } else {
                console.log(
                    "UpdateItem succeeded:",
                    JSON.stringify(data, null, 2)
                );
            }
        });
    };

    const res = await getNotes(noteids);

    res.forEach((note) => {
        if (!(note.professorEmail.S in profs)) {
            profs[note.professorEmail.S] = {
                studentEmail,
                timestamp: timeOfCreation,
                notesPurchased: [
                    {
                        noteId: note.noteid.S,
                        amountEarned: 0.6 * note.requiredCredits.N,
                    },
                ],
            };
        } else {
            profs[note.professorEmail.S].notesPurchased.push({
                noteId: note.noteid.S,
                amountEarned: 0.6 * note.requiredCredits.N,
            });
        }
    });

    for (let email in profs) {
        addRecord({ email, record: profs[email] });
    }
};

// CreateTable();

// AddItem({
//     fullName: "Test Professor 3",
//     email: "testprof3@gmail.com",
//     password: "qwerty",
//     college: "HIT-K",
//     dept: "CSE",
//     subject: "Test Subject 5",
//     phoneNo: "9477388223",
//     credits: 23,
//     uploadedNotes: ["ki7thy54es", "jki76trfcvbhy5esx", "fr56yvfrt6uj"],
//     amountEarnedRecord: []
// });

// ScanTable();

// GetItem({
//     email: "testprof2@gmail.com"
// })

// GetCredits({
//     email: "testprof1@gmail.com",
//     fullName: "Test Professor 1",
//     // rate: 10,
// });

// GetUploadedNotes({
//     email: "testprof5@gmail.com",
//     fullName: "Test Professor 5",
// });

// UploadNotes({
//     professor: {
//         email: "testprof5@gmail.com",
//         fullName: "Test Professor 5",
//     },
//     notes: [
//         {
//             noteid: "note_id_1", name: "Note 1", professor: "Test Professor 5", url: "randomurl.com"
//         },
//         {
//             noteid: "note_id_2", name: "Note 2", professor: "Test Professor 5", url: "randomurl.com"
//         },
//     ]
// });

// DeleteProf({ email: "testprof5@gmail.com", fullName: "Test Professor 5" });

module.exports = AddEarning;
