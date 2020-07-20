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
let total = 0;

const scanStudents = (params) => {
    dynamodb.scan(params, (err, data) => {
        if (err) console.error(err);
        else {
            const students = data.Items;
            students.forEach(check);

            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                scanStudents(params);
            } else {
                console.log("Total:", total);
            }
        }
    });
};

const check = (student) => {
    try {
        const record = student.creditsPurchaseRecord.L;
        if (record.length > 0) {
            let totalForEach = 0;
            record.forEach(({ M }) => {
                const credits = M.creditsPurchased.N;
                const amount = credits * 10;
                totalForEach += amount;
            });
            console.log(`${totalForEach}: ${student.email.S}`);
            total += totalForEach;
        }
    } catch (error) {
        console.log("Error in:", student.email.S);
    }
};

scanStudents({
    ProjectionExpression: "email, creditsPurchaseRecord",
    TableName: "students",
    Limit: 50,
});
