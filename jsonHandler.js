const fs = require('fs');
const path = require('path');
const express = require('express');
const {response} = require("express");
const exP = express();

/* запуск сервера */
const port = process.env.PORT || 3000;
exP.listen(port,()=>{console.log(`server's listening on port ${port}`)});

/* задаём папку со статикой */
exP.use(express.static('public'));

/* задаём шаблонизатор */
exP.set('view engine','pug');

let chatArray = [];
let names_posts = {};

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
    let ascen = Object
        .entries(names_posts[author].allWords)
        .sort(function (nc1,nc2){
        return nc2[1]-nc1[1]
        });
    names_posts[author].allWords = Object.fromEntries(ascen);
    //console.log(author);
    //console.table(ascen.slice(0,30)); // красивая табличка на каждого человека
    console.log(ascen)
    //console.log(author,'\n',names_posts[author]);
    return ascen.slice(0,500);
}

function editString(rawString){
    return rawString
        // .replace(/[\s.,%()"'_?!-:]+/gm,' ')
        // .replace(/[\s]+/gm,' ')
        .toLowerCase()
        .replace(/[^а-яё]/gm,' ')
        .trim()
}

exP.get('/', (request,response)=>{
    response.render('form');
})

exP.get('/personal/*', (request,response)=>{
    let slug = request.params[0];
    console.log(slug);
    //нафуя это тут??
    // Object.keys(names_posts).forEach(author => {
    //     personal(author, names_posts, chatArray)
    // });
    let persWordsArray = personal(slug);
    response.render('personal',{slug,names_posts,persWordsArray});
})

exP.post('/sendFile',(request,response)=>{
    chatArray = [];
    names_posts = {};
    let chunks = [];
    let chatName = '--';
        console.log('RH = ',request.headers);
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
        let ascen = Object.entries(names_posts).sort
                        (function (nc1,nc2){
                            return nc2[1].total-nc1[1].total
                        });
        //новый объект из уже отсортированного массива
        names_posts = Object.fromEntries(ascen);

        //console.table(names_posts); //Объект вида {Автор: {total:567, ownText:123, fwded:43, allWords:{'не':34}}}

        response.render('stats',{names_posts,chatName})
    });
})