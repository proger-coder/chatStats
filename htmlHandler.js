const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

let htmls = [];
let activeMembers = [];
let messagesByMember = {};

// читаем директорию. Загоняем в массив htmls только .html-файлы
fs.readdir('./chatFolder',(err,files) => {

    files.forEach(el =>{
        if(path.extname(el) === '.html'){
            htmls.push(el);
            chatMembersFinder(el,activeMembers,messagesByMember);
        }
    })
    // КОСТЫЛЬ УСТРАНИТЬ!!!
    setTimeout(() => {console.log(messagesByMember);},500)
    //console.log(messagesByMember);
})

function chatMembersFinder(file,members=[],messagesBy={}) {
    //работая над одним файлом
    fs.readFile('./chatFolder/' + file, (err, data) => {
        const dom = new JSDOM(data.toString());
        let docT = dom.window.document;

        docT.querySelectorAll('.from_name').forEach(el => {
            //console.log(el.innerHTML)
            if (el.innerHTML.search(/.\d\d.202\d/gm) <0 ){
                let member = el.innerHTML.trim();
                    // заполнение массива активных участников
                if (!members.includes(member)){
                    members.push(member);
                }
                    //заполнение объекта с сообщениями
                if(!messagesBy[member]){
                    messagesBy[member] = 1;
                } else if (messagesBy[member]){
                    messagesBy[member]++;
                }
            }
        })
        console.log(messagesBy);
    })

    return [members,messagesBy]
}


// // вычленить уникальных участников
// let participants = [];
// let allParticip = document.querySelectorAll('.from_name');
// allParticip.forEach(el => {
//     let text = el.innerText;
//
//     if (text.search(/.\d\d.202\d/gm) <0 ){
//         if (!participants.includes(el.innerText)){
//             participants.push(el.innerText)
//         }
//     }
//
// })
// console.log(participants);

// // работа с собсна одним участником
// let koch = []
// let byWord = {};
// let temp = document.querySelectorAll('.message.default.clearfix');
// console.log(temp[0].innerText);
// temp.forEach(el => {
//     if(el.innerText.indexOf('Кочетков') >= 0 && el.innerText.indexOf('Not included') <0){
//         let stringToPush = el.innerText
//             .replaceAll('In reply to this message','')
//             .slice(24)
//             .replaceAll('\n','')
//             .replace(/[\s.,%]/g, ' ')
//             .toLowerCase()  ;
//         let trueString = stringToPush.split(' ').filter(el => el!=='');
//         koch.push(...trueString);
//     }
// })
// // koch.sort(function(word1,word2){
// //     return word1.localeCompare(word2);
// // })
// koch.forEach(word => {
//     if (!byWord[word]){
//         byWord[word] = 1;
//     } else {
//         byWord[word]++;
//     }
// })
//
// //console.log(koch)
// console.log(byWord)
// //console.log(typeof (Object.values(byWord)[888]))
// console.log(Object.values(byWord).sort(function (a, b) {
//     return b - a;
// }))