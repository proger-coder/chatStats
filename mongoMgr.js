const express = require('express');
const exP = express();

const PORT = process.env.PORT || 3000;

const {mongoose,Schema} = require('mongoose');
const telegramSchema = new Schema({
    parsedTime:{
        type:String,
        default:Date.now().toString()
    },
    chatName: {
        type: String,
        required: true
    },
    activeUsers: {
        type: Number,
        required: true
    },
    totalMessages: {
        type:Number,
        required: true
    }
},
    { collection : 'telegram-collection' }
);

const telegramModel = mongoose.model('_______',telegramSchema);

const uri = 'mongodb+srv://telegram-db-admin:telegram-db-admin@cluster0.kv1hn.mongodb.net/telegram-database?retryWrites=true&w=majority';

async function start() {
    try {
        await mongoose.connect(
            uri,
            {
                useNewUrlParser: true,
            }
        );
        exP.listen(PORT, () => {
            console.log('Server has been started...');
                let date = new Date();
                let month = date.getMonth()+1 > 9 ? `${date.getMonth()+1}`:`0${date.getMonth()+1}`;
                let day = date.getDate() > 9 ? `${date.getDate()}`:`0${date.getDate()}`;
                let hours = date.getHours() > 9? `${date.getHours()}`:`0${date.getHours()}`;
                let mins = date.getMinutes() > 9? `${date.getMinutes()}`:`0${date.getMinutes()}`;
            const document = new telegramModel({
                parsedTime:`${day}-${month}-${date.getFullYear()}, ${hours}:${mins}`,
                chatName: '4161-11',
                activeUsers: 15,
                totalMessages: 100
            });
            document.save();
        });
    } catch (e) {
        console.log(e);
    }
}

start();


