//設定
const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;
const line = require("@line/bot-sdk");
var fs = require('fs');
var ids = require('ids');
const { resolve } = require("path");
require('date-utils');

//LINE API設定
const config = {
  channelAccessToken: process.env.ACCESS_TOKEN,
  channelSecret: process.env.SECRET_KEY
};
const client = new line.Client(config);

express()
  .use(express.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get('/', (req, res) => { res.send('Hello World!') })
  .post("/hook/", line.middleware(config), (req, res) => lineBot(req, res))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


function lineBot(req, res) {
  //とりあえず200番を返す
  res.status(200).end();
  // ボディからイベントを取得
  const events = req.body.events;
  const promises = [];
  console.log(events)
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    switch (ev.type) {
      case 'follow':
        promises.push(greeting_follow(ev));
        break;
      case 'message':
        promises.push(handleMessageEvent(ev));
        break;
      case 'postback':
        promises.push(handlePostbackEvent(ev));
        break;
    }
  }
  Promise
    .all(promises)
    .then(console.log('all promises passed'))
    .catch(e => console.error(e.stack));
}

const greeting_follow = async (ev) => {
  return client.replyMessage(ev.replyToken, {
    "type": "text",
    "text": `フォローありがとうございます!`
  });
}

const handleMessageEvent = async (ev) => {
  //ユーザー名を取得
  const text = (ev.message.type === 'text') ? ev.message.text : '';
  const data = (ev.postback) ? ev.postback.data : '';
  const splitData = data.split('&');
  await client.getProfile(ev.message.userId).then((profile) => {
    console.log(profile);
  });
  //返事を送信
  // if (text === '聞いて') {
  //   return client.replyMessage(ev.replyToken, {
  //     type: "text",
  //     text: `どうしました？`,
  //     values: 'what'
  //   });
  // } else if (splitData[0] === 'what') {
  //   const splitData = data.split('&');
  //   const Whatareudoing = splitData[1]
  //   askfeel(ev, Whatareudoing)
  // } else if (splitData[0] === 'feel') {
  //   const Whatareudoing = splitData[1]
  //   const Howdoufeel = splitData[2]
  //   return client.replyMessage(ev.replyToken, {
  //     type: "text",
  //     text: `どうしてそう感じたのですか？`,
  //     values: `why&${Whatareudoing}&${Howdoufeel}`
  //   });
  // } else if (splitData[0] === 'why') {
  //   const Whatareudoing = splitData[1]
  //   const Howdoufeel = splitData[2]
  //   const whyareufeelso = splitData[3]
  //   return client.replyMessage(ev.replyToken, {
  //     type: "text",
  //     text: `そこから何を学びましたか？`,
  //     values: `learn&${Whatareudoing}&${Howdoufeel, whyareufeelso}`
  //   });
  // } else if (splitData[0] === 'learn') {
  //   const Whatareudoing = splitData[1]
  //   const Howdoufeel = splitData[2]
  //   const whyareufeelso = splitData[3]
  //   const whatdoulearn = splitData[4]
  //   return client.replyMessage(ev.replyToken, {
  //     type: "text",
  //     text: `そこから何を学びましたか？`,
  //     values: `learn&${Whatareudoing}&${Howdoufeel, whyareufeelso}`
  //   });
  //} else {
  return client.replyMessage(ev.replyToken, {
    type: "text",
    text: `${profile.displayName}さん、今「${ev.message.text}」って言いました？`
  });
  //}
}


const handlePostbackEvent = async (ev) => {
  const profile = await client.getProfile(ev.source.userId);
  const data = ev.postback.data;
  const splitData = data.split('&');

  if (splitData[0] === 'place') {
    const orderedPlace = splitData[1];
    askDate(ev, orderedPlace);
  } else if (splitData[0] === 'date') {
    const orderedPlace = splitData[1];
    const selectedDate = ev.postback.params.date;
    askTime(ev, orderedPlace, selectedDate);
  } else if (splitData[0] === 'time') {
    const orderedPlace = splitData[1];
    const selectedDate = splitData[2];
    const selectedTime = splitData[3];
    confirmation(ev, orderedPlace, selectedDate, selectedTime);
  } else if (splitData[0] === 'yes') {


  } else if (splitData[0] === 'no') {
    client.replyMessage(ev.replyToken, {
      "type": "text",
      "text": "予約を終了しました。"
    });
  } else if (splitData[0] === 'richconfirm') {
    console.log("予約確認")
    const nextResrvation = await checkPersonalReservation(ev);
    const formatDate = nextResrvation[0].scheduledate.toFormat('YYYY-MM-DD');
    const splitDate = formatDate.split('-');
    const orderedPlace = nextResrvation[0].place;
    const strTime = timeDir[nextResrvation[0].scheduletime];

    return client.replyMessage(ev.replyToken, {
      "type": "text",
      "text": `次回予約は${placeDic[orderedPlace]}の${splitDate[1]}月${splitDate[2]}日 ${strTime}です`
    });
  };
}




const askfeel = (ev) => {
  return client.replyMessage(ev.replyToken, {
    "type": "flex",
    "altText": "その時どんな感情でした？",
    "contents":
    {
      "type": "bubble",
      "header": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "その時どんな感情でした？",
            "wrap": true,
            "size": "lg"
          },
          {
            "type": "separator"
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "button",
                "action": {
                  "type": "postback",
                  "label": "喜び",
                  "data": `feel&${Whatareudoing}&喜び`
                },
                "style": "primary",
                "color": "#00AA00",
                "margin": "md"
              },
              {
                "type": "button",
                "action": {
                  "type": "postback",
                  "label": "悲しみ",
                  "data": `feel&${Whatareudoing}&悲しみ`
                },
                "style": "primary",
                "color": "#00AA00",
                "margin": "md"
              },
              {
                "type": "button",
                "action": {
                  "type": "postback",
                  "label": "怒り",
                  "data": `feel&${Whatareudoing}&怒り`
                },
                "style": "primary",
                "color": "#00AA00",
                "margin": "md"
              },
              {
                "type": "button",
                "action": {
                  "type": "postback",
                  "label": "驚き",
                  "data": `feel&${Whatareudoing}&驚き`
                },
                "style": "primary",
                "color": "#00AA00",
                "margin": "md"
              },
              {
                "type": "button",
                "action": {
                  "type": "postback",
                  "label": "恐れ",
                  "data": `feel&${Whatareudoing}&恐れ`
                },
                "style": "primary",
                "color": "#00AA00",
                "margin": "md"
              },
              {
                "type": "button",
                "action": {
                  "type": "postback",
                  "label": "楽しい",
                  "data": `feel&${Whatareudoing}&楽しい`
                },
                "style": "primary",
                "color": "#00AA00",
                "margin": "md"
              },
              {
                "type": "button",
                "action": {
                  "type": "postback",
                  "label": "終了",
                  "data": "end"
                },
                "style": "primary",
                "color": "#0000ff",
                "margin": "md"
              }
            ],
            "margin": "md"
          }
        ]
      }
    }
  });
};

