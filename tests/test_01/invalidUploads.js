const fs = require("fs");
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
// const docClient = new AWS.DynamoDB.DocumentClient();

const scanProfessors = (params) => {
    dynamodb.scan(params, (err, data) => {
        if (err) console.error(err);
        else {
            const uploads = data.Items.filter((obj) => obj.myUploads).map(
                (obj) => {
                    return {
                        email: obj.email.S,
                        notes: obj.myUploads.L.map((noteObj) => {
                            return {
                                noteId: noteObj.M.noteId.S,
                                chaptername: noteObj.M.chaptername.S,
                                subjectname: noteObj.M.subjectname.S,
                            };
                        }),
                    };
                }
            );
            checkNotes(uploads);

            if (typeof data.LastEvaluatedKey != "undefined") {
                // console.log(data.LastEvaluatedKey);
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                scanProfessors(params);
            }
        }
    });
};

const checkNotes = (uploads) => {
    const raw_notes = fs.readFileSync("tests/test_01/notes.json", "utf8");
    const setOfNotes = new Set();
    const notes = JSON.parse(raw_notes).notes;
    notes.forEach((noteId) => {
        setOfNotes.add(noteId);
    });

    uploads.forEach((upload) => {
        const { email, notes } = upload;
        if (notes.length != 0) {
            notes.forEach((noteObj) => {
                const { noteId, chaptername, subjectname } = noteObj;
                if (!setOfNotes.has(noteId)) {
                    console.log("email:", email);
                    console.log(noteId, chaptername, subjectname, "\n");
                }
            });
        }
    });
};

scanProfessors({
    ProjectionExpression: "myUploads, email",
    TableName: "professors",
    Limit: 30,
});
