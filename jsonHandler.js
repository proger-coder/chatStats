const fs = require('fs');
const path = require('path');

let chatArray = [];
let names_posts = {};

fs.readFile('./chatFolder/result.json', (err, data) => {
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

    // Object.keys(names_posts).forEach(author => {
    //     personal(author)
    // });
    console.table(names_posts);
    setTimeout(()=>{
        personal('Ayrat');
    },3000)

});

function personal(author){
    names_posts[author].allWords = {};
    chatArray.forEach(message => {
        if(message.from === author
            && typeof(message.text)==='string' //чтобы не попасть на ссылки
            && !message.forwarded_from){
                let strEdited = editString(message.text); //форматированная строка
                let stringArray = strEdited.split(' '); // массив из этой форматированной строки

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
    console.log(author,'\n',names_posts[author]);
}

function editString(rawString){
    return rawString
        .replace(/[\s.,%()"'_?!-:]+/gm,' ')
        .replace(/[\s]+/gm,' ')
        .toLowerCase()
        .trim()
}