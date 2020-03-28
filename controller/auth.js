const bcrypt = require("bcrypt");
const authFeatures = require("./../helper/authFeatures");

exports.signup = async (req, res, db) => {
    let data = req.body;
    const user = await db
        .collection("users")
        .findOne({ username: data.username });
    if (!user) {
        data.date = new Date().toISOString();
        data.password = bcrypt.hashSync(req.body.password, 10);
        db.collection("users")
            .insertOne(data)
            .then(user => {
                authFeatures.sendToken(user.ops[0], 200, res);
            })
            .catch(err => console.error(err));
    } else {
        authFeatures.sendErrorStatus(400, res, "User already exists");
    }
};

exports.login = async (req, res, db) => {
    let data = req.body;
    const user = await db
        .collection("users")
        .findOne({ username: data.username });
    if (user) {
        if (await authFeatures.checkPass(data.password, user.password)) {
            authFeatures.sendToken(user, 200, res);
        } else {
            authFeatures.sendErrorStatus(400, res, "Incorrect Password!");
        }
    } else {
        authFeatures.sendErrorStatus(400, res, "User does not exist");
    }
};

exports.protect = (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
        authFeatures
            .verifyToken(token)
            .then(() => {
                return next();
            })
            .catch(err => {
                authFeatures.sendErrorStatus(400, res, err.message);
            });
    } else {
        authFeatures.sendErrorStatus(400, res, "Not Authorized");
    }
};
