const fs = require('fs');
const path = require('path');
const express = require('express');
const {response} = require("express");
const exP = express();
const body_parser = require('body-parser'); //парсить данные из формы

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
    console.log(author);
    console.table(ascen.slice(0,30)); // красивая табличка на каждого человека
    //console.log(author,'\n',names_posts[author]);
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

exP.post('/sendFile',(request,response)=>{
    chatArray = [];
    names_posts = {};
    let ch = '';
    request.on('data',chunk=> ch+=chunk);
    request.on('end', ()=>{
            console.log('1: received full file data');

        let cuttedString = ch.slice(144,ch.length-44); //обрезанное без лишних вебкит-строк
        chatArray = JSON.parse(cuttedString).messages;

            if(chatArray.length > 0){
                console.log('2: chat array filled,length:', chatArray.length);
            } else return

        //заполнение объекта именами и счётчиками сообщений
        chatArray.forEach(message => {

            if(message.from !== undefined){
                names_posts[message.from]?
                    names_posts[message.from].total++ :
                    names_posts[message.from]={total:1};

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

        Object.keys(names_posts).forEach(author => {
            personal(author)
        });
        console.table(names_posts); //Объект вида {Автор: {total:567, ownText:123, fwded:43, allWords:{'не':34}}}

        console.log(names_posts['Понтелей Мтс'])
        // setTimeout(()=>{
        //     personal('Понтелей Мтс');
        // },3000);

        response.render('stats',{names_posts:names_posts})

/*        fs.writeFileSync('./uploads/out.json',entrary);
            console.log('2: file wrote to disk');
        fs.readFile('./uploads/out.json', (err, data) => {
            if (err) throw err;
            chatArray = JSON.parse(data.toString()).messages;
            //заполнение объекта именами и счётчиками сообщений
            chatArray.forEach(message => {

                if(message.from !== undefined){
                    names_posts[message.from]?
                        names_posts[message.from].total++ :
                        names_posts[message.from]={total:1};

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
            //массив из пар К-З и его сортировка по числу сообщений total:
            let ascen = Object.entries(names_posts).sort(function (nc1,nc2){
                return nc2[1].total-nc1[1].total
            });
            names_posts = Object.fromEntries(ascen);

            Object.keys(names_posts).forEach(author => {
                personal(author)
            });
            console.table(names_posts);

            // setTimeout(()=>{
            //     personal('Понтелей Мтс');
            // },3000);
            response.render('stats',{x:names_posts})
        });*/
    });
})