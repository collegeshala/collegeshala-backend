module.exports = sendErrorStatus = (statusCode, res, msg) => {
    res.status(statusCode).json({
        status: "failed",
        msg
    })
}