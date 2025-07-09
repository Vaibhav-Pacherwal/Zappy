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

const groupSchema = new mongoose.Schema({
    groupName: String,
    groupAdmin: String,
    members: [{
        type: String,
        require: true
    }],
    date: {
        type: String,
        default: moment().format("DD MMM YYYY")
    },
    createdAt: {
        type: String,
        default: moment().format("h:mm A")
    }
});

const Group = new mongoose.model("Group", groupSchema);
module.exports = Group;