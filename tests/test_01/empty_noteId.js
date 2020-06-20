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

const params = {
    ProjectionExpression: "cart, email",
    TableName: "students",
    Limit: 30,
};

const scanStudents = (params) => {
    dynamodb.scan(params, (err, data) => {
        if (err) console.error(err);
        else {
            // console.log("data fetched successfully!");
            const notes = data.Items;
            // console.log(JSON.stringify(notes));
            // console.log("total number of students:", data.Count);
            checkValidity(notes);

            if (typeof data.LastEvaluatedKey != "undefined") {
                // console.log(data.LastEvaluatedKey);
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                scanStudents(params);
            }
        }
    });
};

const checkValidity = (cart = []) => {
    const raw_notes = fs.readFileSync("tests/test_01/notes.json", "utf8");
    const setOfNotes = new Set();
    const notes = JSON.parse(raw_notes).notes.map(
        (noteObj) => noteObj.noteId.S
    );
    notes.forEach((noteId) => {
        setOfNotes.add(noteId);
    });
    // console.log(setOfNotes);

    cart.forEach((note) => {
        const id = note.cart.L;
        if (id.length != 0) {
            id.forEach((idObj) => {
                const id = idObj.S;
                if (!setOfNotes.has(id)) {
                    console.log("email:", note.email.S);
                    console.log("unfound note in cart:", id);
                }
            });
        }
    });
};

const scanNotes = () => {
    dynamodb.scan(
        {
            ProjectionExpression: "noteId",
            TableName: "notes",
            Limit: 3,
        },
        (err, data) => {
            if (err) console.error(err);
            else {
                console.log(data.Items);
                console.log(data.LastEvaluatedKey);
            }
        }
    );
};

// scanNotes();

scanStudents(params);

// checkValidity();
