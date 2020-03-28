const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.signToken = id => {
    return jwt.sign({ id }, process.env.JWT, {
        expiresIn: "45 seconds"
    });
};

exports.sendToken = (user, statusCode, res) => {
    const token = this.signToken(user._id);
    res.cookie("jwt", token, {
        httpOnly: true,
        expires: new Date(
            Date.now() + process.env.EXPIRES * 24 * 60 * 60 * 1000
        )
    });
    res.status(statusCode).json({
        msg: "success!",
        user: user,
        token
    });
};

exports.checkPass = async (toCheck, pass) => {
    return await bcrypt.compare(toCheck, pass);
};

exports.verifyToken = async token => {
    return await jwt.verify(token, process.env.JWT);
};
