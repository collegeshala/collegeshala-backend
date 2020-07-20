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
    ProjectionExpression: "purchasedNotes, email",
    TableName: "students",
    Limit: 30,
};

const scanStudents = (params) => {
    dynamodb.scan(params, (err, data) => {
        if (err) console.error(err);
        else {
            const students = data.Items.filter((studentObj) => {
                if (studentObj.purchasedNotes) return true;
                else return false;
            });
            const reqStudents = students.map((student) => {
                if (student.purchasedNotes) {
                    return {
                        email: student.email.S,
                        notes: student.purchasedNotes.L.map((obj) => obj.S),
                    };
                }
            });
            // console.log(reqStudents);
            checkNotes(reqStudents);

            if (typeof data.LastEvaluatedKey != "undefined") {
                // console.log(data.LastEvaluatedKey);
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                scanStudents(params);
            }
        }
    });
};

const checkNotes = (purchasedNotes = []) => {
    const raw_notes = fs.readFileSync("tests/test_01/notes.json", "utf8");
    const setOfNotes = new Set();
    const notes = JSON.parse(raw_notes).notes;
    notes.forEach((noteId) => {
        setOfNotes.add(noteId);
    });

    purchasedNotes.forEach((student) => {
        const { email, notes } = student;
        if (notes.length != 0) {
            notes.forEach((id) => {
                if (!setOfNotes.has(id)) {
                    console.log("email:", email);
                    console.log("unfound note in purchasedNotes:", id);
                }
            });
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

const scanNotes = (params, notes = []) => {
    dynamodb.scan(params, (err, data) => {
        if (err) console.error(err);
        else {
            const incomingNotes = data.Items.map((item) => item.noteId.S);
            notes = notes.concat(incomingNotes);
            if (typeof data.LastEvaluatedKey != "undefined") {
                // console.log(data.LastEvaluatedKey);
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                scanNotes(params, notes);
            } else {
                console.log(notes);
                const data = JSON.stringify({ notes });
                fs.writeFileSync("tests/test_01/notes.json", data);
                console.log("File written successfully!");
            }
        }
    });
};

// scanNotes({
//     ProjectionExpression: "noteId",
//     TableName: "notes",
//     Limit: 30,
// });

scanStudents(params);

// checkValidity();
