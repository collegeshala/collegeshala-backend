const AWS = require("aws-sdk");
const dotenv = require("dotenv");
const Notes = require("./notes");
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
        credits,
        creditsPurchaseRecord,
        notesPurchaseRecord,
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
            cart,
            credits,
            creditsPurchaseRecord,
            notesPurchaseRecord,
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
            console.log(
                "GetItem succeeded:",
                JSON.stringify(data.Item, null, 2)
            );
        }
    });

    return student;
};

const GetPurchasedNotes = (data) => {
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
                Notes.GetBatchNotes(notes);
            }
        }
    );
};

// shifts notes in cart to purchasedNotes section
const UpdateCart = (data) => {
    const { email, fullName } = data;

    const getParams = {
        TableName: "students",
        Key: {
            email,
            fullName,
        },
    };

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
        }
    });
};

const CheckoutCredits = (data) => {
    const { email, fullName } = data;

    const params = {
        TableName: "students",
        Key: {
            email,
            fullName,
        },
    };

    // getting list of cart notes' ids
    docClient.get(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            const { credits, cart } = data.Item;

            const keys = cart.map((noteid) => {
                return { noteid: { S: noteid } };
            });

            const params = {
                RequestItems: {
                    notes: {
                        Keys: keys,
                    },
                },
            };

            console.log(keys);

            // getting requiredCredits for each note in student's cart
            dynamodb.batchGetItem(params, function (err, data) {
                if (err) console.log(err, err.stack);
                // an error occurred

                else {
                    // console.log(JSON.stringify(data.Responses.notes)); // successful response
                    let cost = 0;
                    for (note of data.Responses.notes) {
                        cost += note.requiredCredits.N * 1;
                        // console.log(note.requiredCredits.N);
                    }
                    // console.log(cost);

                    if (credits < cost) {
                        console.log("Insufficient credits!");
                        return;
                    }
                    const newCredits = credits - cost;

                    let date_obj = new Date();
                    const timeOfCreation = date_obj.toISOString();

                    const record = [{
                        notesPurchased: cart,
                        totalCredits: cost,
                        timestamp: timeOfCreation,
                    },]

                    const updateParams = {
                        TableName: "students",
                        Key: { email, fullName },
                        UpdateExpression: "set credits = :c, notesPurchaseRecord = list_append (notesPurchaseRecord, :rcd)",
                        ExpressionAttributeValues: {
                            ":c": newCredits,
                            ":rcd": record,
                        },
                        ReturnValues: "UPDATED_NEW",
                    };

                    // updating the student's current credits
                    docClient.update(updateParams, (err, data) => {
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
                }
            });
        }
    });
};

const DeleteStudent = (data) => {
    const { email, fullName } = data;

    const params = {
        Key: {
            email: { S: email },
            fullName: { S: fullName },
        },
        TableName: "students",
    };

    dynamodb.deleteItem(params, function (err, data) {
        if (err) console.log(err, err.stack);
        // an error occurred
        else console.log("Deleted successfully.", data); // successful response
    });
};

const PurchaseCredits = (data) => {
    const { add_credits, email, fullName } = data;

    let date_obj = new Date();
    const timeOfCreation = date_obj.toISOString();

    const record = [{
        creditsPurchased: add_credits,
        cost: add_credits * 10,
        timestamp: timeOfCreation,
    },]

    const params = {
        TableName: "students",
        Key: {
            email,
            fullName,
        },
        UpdateExpression: "set credits = credits + :val, creditsPurchaseRecord = list_append (creditsPurchaseRecord, :rec)",
        ExpressionAttributeValues: {
            ":val": add_credits,
            ":rec": record
        },
        ReturnValues: "UPDATED_NEW",
    };

    console.log("Updating credits...");
    docClient.update(params, (err, data) => {
        if (err) {
            console.error(
                "Unable to update item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        }
    });
};

// adds given notes to student's cart
const AddToCart = (data) => {
    const { email, fullName, noteids } = data;

    const getParams = {
        TableName: "students",
        Key: {
            email,
            fullName,
        },
    };

    docClient.get(getParams, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            const { cart } = data.Item;
            const updatedCart = cart.concat(noteids);

            const updateParams = {
                TableName: "students",
                Key: { email, fullName },
                UpdateExpression: "set cart = :c",
                ExpressionAttributeValues: {
                    ":c": [],
                    ":p": updatedCart,
                },
                ReturnValues: "UPDATED_NEW",
            };

            console.log("Updating the item...");
            docClient.update(updateParams, (err, data) => {
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
        }
    });
};

const UpdateStudent = args => { 

    if(Object.values(args.params).length == 0) {
        return new Error("No values to update")
    }

    const { email, fullName } = args;
    let exp = "set", i = 1, attr = {}, val = {};

    for(prop in args.params) {
        if(args.params[prop] != undefined) {
            exp += ` #prop${i} = :val${i},`;
            attr[`#prop${i}`] = prop;
            val[`:val${i}`] = args.params[prop]
        }
        i++;
    }
    exp = exp.slice(0, -1);

    const updateParams = {
        TableName: "students",
        Key: { email, fullName },
        UpdateExpression: exp,
        ExpressionAttributeNames: attr,
        ExpressionAttributeValues: val,
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
                "UpdateItem succeeded:",
                JSON.stringify(data, null, 2)
            );
        }
    });
}

const GetStudentNotes = data => {
    const { email, fullName } = data;

    const getParams = {
        TableName: "students",
        ProjectionExpression: "cart",
        Key: {
            email,
            fullName,
        },
    };

    docClient.get(getParams, (err, data) => {
        if (err) {
            console.error(
                "Unable to read item. Error JSON:",
                JSON.stringify(err, null, 2)
            );
        } else {
            console.log(JSON.stringify(data.Item)) // => {cart: [,,,]}
        }
    });
};

const getData = data => {
    const { email, fullName } = data;

    const getParams = {
        TableName: "students",
        Key: {
            email,
            fullName,
        },
    };

    return new Promise((resolve, reject) => {
        docClient.get(getParams, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Item);
            }
        });
    })
};

// getData({ fullName: "Test Student 4", email: "teststudent4@gmail.com" })
//     .then(res => console.log(res))
//     .catch(err => console.error(err));

// CreateTable();

// AddItem({
//     fullName: "Test Student 4",
//     email: "teststudent4@gmail.com",
//     password: "qwerty",
//     college: "HIT-K",
//     degree: "B. Tech. CSE",
//     semester: 3,
//     phoneNo: "9477388223",
//     purchasedNotes: ["fr56yvfrt6uj",],
//     cart: ["note_id4", "note_id1",],
//     credits: 200,
//     creditsPurchaseRecord: [],
//     notesPurchaseRecord: [],
// });

// ScanTable();

// GetItem({ fullName: "Test Student 4", email: "teststudent4@gmail.com" });

// GetPurchasedNotes({
//     email: "teststudent1@gmail.com",
//     fullName: "Test Student 1",
// });

// UpdateCart({ fullName: "Test Student 2", email: "teststudent2@gmail.com" });

// DeleteStudent({ fullName: "Test Student 4", email: "teststudent4@gmail.com" })

// CheckoutCredits({
//     fullName: "Test Student 4",
//     email: "teststudent4@gmail.com",
// });

// PurchaseCredits({
//     email: "teststudent4@gmail.com",
//     fullName: "Test Student 4",
//     add_credits: 25,
// });

// UpdateStudent({
//     email: "teststudent4@gmail.com",
//     fullName: "Test Student 4",
//     params: {
//         password: "asdfgh",
//         college: "MSIT",
//         semester: 6,
//         phoneNo: undefined,
//     }
// })

// GetStudentNotes({ fullName: "Test Student 4", email: "teststudent4@gmail.com" })