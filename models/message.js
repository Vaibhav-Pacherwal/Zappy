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

const messageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    content: String,
    sendAt: {
        type: Date,
        default: Date.now
    },
    users: [
        {
            type: String,
            required: true
        }
    ]
});

const Message = new mongoose.model("Message", messageSchema);
module.exports = Message;
