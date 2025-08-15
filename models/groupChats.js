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
    await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    });
}

const grpChatSchema = new mongoose.Schema({
    groupName: String,
    sender: String,
    content: String,
    date: {
        type: Date,
        default: Date.now
    }
});

const GroupChat = new mongoose.model("GroupChat", grpChatSchema);
module.exports = GroupChat;