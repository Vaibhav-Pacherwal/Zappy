const mongoose = require("mongoose");
const moment = require("moment");
require("dotenv").config();

main()
.then(()=>{
    console.log("connected to mongodb successfully!");
}).catch((err)=>{
    console.log("failed to connect with mongodb!");
})

async function main() {
    mongoose.connect(process.env.MONGO_URI);
}

const reqSchema = new mongoose.Schema({
    user: String,
    admin: String,
    groupName: String,
    date: {
        type: String,
        default: moment().format("DD MMM YYYY")
    },
    sendAt: {
        type: String,
        default: moment().format("h:mm A")
    }
});

const Request = new mongoose.model("Request", reqSchema);
module.exports = Request;