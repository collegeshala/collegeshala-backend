const fs = require("fs");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();

AWS.config.update({
    region: "ap-south-1",
    accessKeyId: process.env.S3_Access_Key_ID,
    secretAccessKey: process.env.S3_Secret_Access_Key,
});

const S3 = new AWS.S3({
    apiVersion: "2006-03-01",
    endpoint: "https://s3.ap-south-1.amazonaws.com",
});

const getNoteObjs = (params) => {
    S3.listObjectsV2(params, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            // console.log(data.Contents);
            const idArray = data.Contents.map((obj) => obj.Key.slice(0, -4));
            writeNotes(idArray);
            checkNotes(idArray);
        }
    });
};

const writeNotes = (ids = []) => {
    const data = JSON.stringify({
        length: ids.length,
        S3_notes: ids,
    });
    fs.writeFileSync("tests/test_04/s3_notes.json", data);
    console.log("S3 notes written successfully");
};

const checkNotes = (ids = []) => {
    const raw_notes = fs.readFileSync("tests/test_04/notes.json", "utf8");
    const setOfNotes = new Set();
    const notes = JSON.parse(raw_notes).notes;
    notes.forEach((noteId) => {
        setOfNotes.add(noteId);
    });
    const unfoundNotes = [];

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (!setOfNotes.has(id)) {
            unfoundNotes.push(id);
        }
    }

    const data = JSON.stringify({
        length: unfoundNotes.length,
        unfoundNotes,
    });
    fs.writeFileSync("tests/test_04/missing_notes.json", data);
    console.log("File written successfully");
};

getNoteObjs({
    Bucket: "collegeshala-notes",
});
