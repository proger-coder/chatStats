const express = require('express');
const exP = express();

const PORT = process.env.PORT || 3000;

const mongoose = require("mongoose");
const { Schema} = require('mongoose');

const telegramSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
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
            const document = new telegramModel({
                title: ''+Math.random()*10,
                completed: true
            });
            document.save();
        });
    } catch (e) {
        console.log(e);
    }
}

start();


