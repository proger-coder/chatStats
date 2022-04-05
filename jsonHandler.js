const express = require('express');
const {response} = require("express");
const exP = express();
const bcrypt = require('bcrypt');
const passHash = '$2b$10$heN/Fcg6GX/.AMhpX.Jdm.MJo.UmX.1huWp7ZT2UO4KTIl/td20.6'

/* мытьё мангуста */
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

/* запуск сервера */
const port = process.env.PORT || 3000;
exP.listen(port,()=>{console.log(`server's listening on port ${port}`)});

/* задаём папку со статикой */
exP.use(express.static('public'));
exP.use(express.urlencoded({extended:false}));

/* задаём шаблонизатор */
exP.set('view engine','pug');

let chatArray = [];
let names_posts = {};

// прогон всего чата по автору, создание массива его слов
function personal(author){
    names_posts[author].allWords = {};
    chatArray.forEach(message => {
        if(message.from === author
            && typeof(message.text)==='string' //чтобы не попасть на ссылки
            && !message.forwarded_from){
                let strEdited = editString(message.text); //форматированная строка
                let stringArray = strEdited.split(' ').filter(el => el!==''); // массив из этой форматированной строки

                stringArray.forEach(word => {
                    if(!names_posts[author].allWords[word]){
                        names_posts[author].allWords[word] = 1;
                    } else if (names_posts[author].allWords[word]){
                        names_posts[author].allWords[word]++;
                    }
                });
        }
    });

    // создаём из пар к-з отсортированный массив (сорт по убыванию встречаемости слова)
    let descenByAmount = Object
        .entries(names_posts[author].allWords)
        .sort(function (nc1,nc2){
        return nc2[1]-nc1[1]
        });
    // descenByAmount - массив вида [ [ 'не', 107 ],[ 'в', 67 ],['и', 63 ]...]

    // до этого объект names_posts[author].allWords был вперемешку: {'дима': 2, 'какие': 1,'сводки': 1,'с': 18}
    names_posts[author].allWords = Object.fromEntries(descenByAmount);
    // но теперь он отсортирован по убыванию встречаемости слова: {'не': 107,'в': 67,'и': 63,'что': 48}

    return descenByAmount;
}

// резка и обработка строки
function editString(rawString){
    return rawString
        .toLowerCase()
        .replace(/[^а-яё]/gm,' ')
        .trim()
}

exP.get('/', (request,response)=>{
    response.render('form');
})

//гайд
exP.get('/guide', (request,response)=>{
    response.render('guide')
})

// маршрут для отдельного участника
exP.get('/personal/*', (request,response)=>{
    let slug = request.params[0];
    console.log(slug);
    let persWordsArray = personal(slug);
    response.render('personal',{slug,names_posts,persWordsArray});
})

// маршрут для удаления
exP.get('/delete/*', (request,response)=>{
    let idToDel = request.params[0];
    try {
        mongoose.connect(uri, {useNewUrlParser: true,}).then(res => {
            console.log('Mongo DB responded in delete section');
            telegramModel.deleteOne({_id:idToDel},function (err){
                if(err) return console.log(err);
                console.log('deleted');

                telegramModel.find({},function (err,records){
                    if(err) return console.log(err);
                    response.render('adminPanel',{records});
                })
            });
        });
    } catch (e) {
        console.log(e);
    }
})

// маршрут для одмен-панели
exP.post('/adminPanel', (request,response)=>{
    //console.log(request.body);
    if(bcrypt.compareSync(request.body.password,passHash)){
        console.log('password match!');
        try {
            mongoose.connect(uri, {useNewUrlParser: true,}).then(res => {
                console.log('Mongo DB responded at admin Panel');
                telegramModel.find({},function (err,records){
                    if(err) return console.log(err);
                    //console.log('records = ',records)
                    response.render('adminPanel',{records});
                })
            });
        } catch (e) {
            console.log(e);
        }
    } else {
        console.log('unsuccessful logon into admin panel')
    }

})

// обработка прилёта формы
exP.post('/sendFile',(request,response)=>{
    chatArray = [];
    names_posts = {};
    let chunks = [];
    let chatName = '--';

    request.on('data',chunk=> chunks.push(chunk));
    request.on('end', ()=>{
            console.log('1: received full file data');
        let data = Buffer.concat(chunks).toString('utf8')

        let cuttedString = data.slice(144,data.length-44); //обрезанное без лишних вебкит-строк. А ЕСЛИ НЕТ ВЕБКИТ_СТРОК?!?!?

        let fullChatObject = JSON.parse(cuttedString);
        chatArray = fullChatObject.messages;
        chatName = fullChatObject.name;

            if(chatArray.length > 0){
                console.log('2: chat array filled,length:', chatArray.length);
            } else return

        //заполнение объекта именами и счётчиками сообщений
        chatArray.forEach(message => {

            if(message.from !== undefined){
                if(names_posts[message.from]){
                    names_posts[message.from].total++;
                    names_posts[message.from].from_id.total++;
                } else {
                    names_posts[message.from]={total:1};
                    names_posts[message.from].from_id = {total:1};
                }

                if(message.text && !message.forwarded_from && typeof(message.text)==='string'){
                    names_posts[message.from].ownText?
                        names_posts[message.from].ownText++ :
                        names_posts[message.from].ownText=1;
                }
                if(message.forwarded_from){
                    names_posts[message.from].fwded?
                        names_posts[message.from].fwded++ :
                        names_posts[message.from].fwded=1;
                }
            }
        })

        //массив из пар К-З и его сортировка по total числу сообщений :
        let descen = Object.entries(names_posts).sort
                        (function (nc1,nc2){
                            return nc2[1].total-nc1[1].total
                        });
        //новый объект из уже отсортированного массива
        names_posts = Object.fromEntries(descen);

        //console.table(names_posts); //Объект вида {Автор: {total:567, ownText:123, fwded:43, allWords:{'не':34}}}

        // работа с Мангустой
        try {
            let date = new Date();
            let month = date.getMonth()+1 > 9 ? `${date.getMonth()+1}`:`0${date.getMonth()+1}`;
            let day = date.getDate() > 9 ? `${date.getDate()}`:`0${date.getDate()}`;
            let hours = date.getHours() > 9? `${date.getHours()}`:`0${date.getHours()}`;
            let mins = date.getMinutes() > 9? `${date.getMinutes()}`:`0${date.getMinutes()}`;

            mongoose.connect(uri, {useNewUrlParser: true,}).then(res => {
                console.log('Mongo DB responded');
                const document = new telegramModel({
                    parsedTime:`${day}-${month}-${date.getFullYear()}, ${hours}:${mins}`,
                    chatName: chatName,
                    activeUsers: Object.keys(names_posts).length,
                    //считаем как сумму всех сообщений по каждому участнику
                    totalMessages: Object.values(names_posts).reduce((acc,val) => {return acc + val.total},0)
                });
                document.save();
            });
        } catch (e) {
            console.log(e);
        }

        response.render('stats',{names_posts,chatName})
    });
})