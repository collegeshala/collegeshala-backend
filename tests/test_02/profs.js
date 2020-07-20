const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();

AWS.config.update({
    region: "ap-south-1",
    endpoint: "https://dynamodb.ap-south-1.amazonaws.com",
    accessKeyId: process.env.DynamoDB_Access_Key_ID,
    secretAccessKey: process.env.DynamoDB_Secret_Access_Key,
});

const dynamodb = new AWS.DynamoDB({
    apiVersion: "2012-08-10",
    endpoint: "https://dynamodb.ap-south-1.amazonaws.com",
});
const docClient = new AWS.DynamoDB.DocumentClient();

const scanNotes = () => {
    dynamodb.scan(
        {
            ProjectionExpression: "noteId, professorname",
            TableName: "notes",
            // Limit: 30,
        },
        (err, data) => {
            if (err) console.error(err);
            else {
                console.log(data.Items.length);
                // console.log(data.LastEvaluatedKey);
                data.Items.forEach(custom);
            }
        }
    );
};

const custom = (note) => {
    const professorname = note.professorname.S;
    if (professorname == "Prof. Harshvardhan Sanghi") {
        removeTitle(note, "Prof. CA Harshvardhan Sanghi");
    }
};

const check = (note) => {
    const professorname = note.professorname.S;
    const names = [
        "Rajiv Kumar Agarwal",
        "Indrajit Das",
        "Shruti chamaria",
        "Jeshmi Ghosh",
        "Rajiv Kumar Agarwal",
        "Tanmoy Saha",
    ];
    let flag = true;

    for (let i = 0; i < names.length; i++) {
        if (
            professorname.endsWith(names[i]) ||
            professorname.startsWith("Prof.")
        ) {
            flag = false;
            break;
        }
    }

    if (flag) {
        addTitle(note);
    }
};

const removeTitle = (noteObj, name) => {
    const noteId = noteObj.noteId.S;
    // name = "CS. " + name;

    const updateParams = {
        TableName: "notes",
        Key: { noteId },
        UpdateExpression: "set professorname = :u",
        ExpressionAttributeValues: {
            ":u": name,
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
};

const addTitle = (noteObj) => {
    const noteId = noteObj.noteId.S;
    const newName = "Prof. " + noteObj.professorname.S;

    const updateParams = {
        TableName: "notes",
        Key: { noteId },
        UpdateExpression: "set professorname = :u",
        ExpressionAttributeValues: {
            ":u": newName,
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
};

scanNotes();
