//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<script src=\"https://button.glitch.me/button.js\" data-style=\"glitch\"></script><div class=\"glitchButton\" style=\"position:fixed;top:20px;right:20px;\"></div></body></html>";

// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post('/webhook', function (req, res) {
  console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);   
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
        case'Hi':
          sendTextMessage(senderID,"Hi there\n How can I help you ?");
          break;
        case'I love you':
          sendTextMessage(senderID,"I love you too <3");
          break;
        case'ban thi':
          BanBlock(senderID);
        break;
      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
//  sendTextMessage(senderID, "Postback called");
  switch(payload){
      case'GET_STARTED':
      sendGetStarted(senderID);
      break;
      case'BanThi':
      BanBlock(senderID);
      break;
      case('BanXaHoi'):
          sendTextMessage(senderID,"Tạo thêm bảng các khối thi :v")
      break;
      case('BanTuNhien'):
          sendTextMessage(senderID,"Tạo thêm bảng các khối thi :v")
      break;
      case('HaiBan'):
          sendTextMessage(senderID,"Tạo thêm bảng các khối thi :v")
      break;
  }
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});

// nhấn button Bắt đầu rồi sẽ hiện ra các lĩnh vực 
function linhVucBlock(recipientId) {             //ban thi
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: " 🙈🙈🙉 Bạn có thiên hướng về lĩnh vực nào nhỉ ?🙉🙊🙊",
          buttons:[{
              type: "postback",
              title: "Tự Nhiên  ",
              payload: "tunhien"
          },       {
            type: "postback",
            title: "Xã Hội",
            payload: "xahoi"
          }, {
            type: "postback",
            title: "Văn Hóa Nghệ Thuật",
            payload: "nghethuat"
          } 
          ]
        }
      }
    }
  };

  callSendAPI(messageData);
}
 //Khi nhấn vào Lĩnh vực tự nhiên sẽ hiện ra nhóm ngành
function linhVucTuNhien(recipientId) {            
  request
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: " 🙈🙈🙉 Tiếp theo, để tư vấn rõ hơn, bạn hãy cho chúng tôi biết nhóm ngành mà bạn thích học 🙉🙊🙊",
          buttons:[{
              type: "postback",
              title: "Logic-Tính Toán ",
              payload: "logictinhtoan"
          },       {
            type: "postback",
            title: "Thiên Nhiên-",
            payload: "thiennhien"
          }, {
            type: "postback",
            title: "Kinh Doanh",
            payload: "kinhdoanh"
          } 
          ]
        }
      }
    }
  };

  callSendAPI(messageData);
}
 //Khi nhấn vào Lĩnh vực xã hội sẽ hiện ra nhóm ngành
function linhVucXaHoi(recipientId) {            
  request
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: " 🙈🙈🙉 Tiếp theo, để tư vấn rõ hơn, bạn hãy cho chúng tôi biết nhóm ngành mà bạn thích học  🙉🙊🙊",
          buttons:[{
              type: "postback",
              title: "Biểu Đạt Ngôn Ngữ ",
              payload: "bieudatngonngu"
          },       {
            type: "postback",
            title: "Giao Tiếp",
            payload: "giaotiep"
          }
          ]
        }
      }
    }
  };

  callSendAPI(messageData);
}
//Khi nhấn vào Lĩnh vực xã hội sẽ hiện ra nhóm ngành
function linhVucVanHoaNgheThuat(recipientId) {            
  request
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: " 🙈🙈🙉 Tiếp theo, để tư vấn rõ hơn, bạn hãy cho chúng tôi biết nhóm ngành mà bạn thích học  🙉🙊🙊",
          buttons:[{
            type: "postback",
            title: "Văn hóa - Du Lịch",
            payload: "vanhoadulich"
          }, {
            type: "postback",
            title: "Thể Thao",
            payload: "thethao"
          } 
          ]
        }
      }
    }
  };

  callSendAPI(messageData);
}
//Khi nhấn vào Lĩnh vực xã hội sẽ hiện ra nhóm ngành
function logicTinhToan(recipientId) {            
  request
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: " 🙈🙈🙉 Tiếp theo hãy cùng chọn khối thi sở trường của bạn nào !!!🙉🙊🙊",
          buttons:[{
              type: "postback",
              title: "Khối: A,A1,K ",
              payload: "AAK"
          },       {
            type: "postback",
            title: "Khối: A,A1,D1",
            payload: "AAD"
          }, {
            type: "postback",
            title: "Khối: A",
            payload: "A"
          } 
          ]
        }
      }
    }
  };

  callSendAPI(messageData);
}
// hiện danh sách chọn nằm ngang 
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },

    message: {
      text: "TIMETABLE",
      quick_replies: [
        {
          content_type: "text",
          title: "Mon",
          payload: "Mon"
        },
        {
          content_type: "text",
          title: "Tue",
          payload: "Tue"
        },
        {
          content_type: "text",
          title: "Wed",
          payload: "Wed"
        },
        {
          content_type: "text",
          title: "Thu",
          payload: "Thu"
        },
        {
          content_type: "text",
          title: "Fri",
          payload: "Fri"
        },
        {
          content_type: "text",
          title: "Sat",
          payload: "Sat"
        },
        {
          content_type: "text",
          title: "Sun",
          payload: "Sun"
        }
      ]
    }
  };

  console.log("quick test success");
  callSendAPI(messageData);
}
// Khi nhấn BẮT ĐẦU thì hiện ra " lời chào " + button : Bắt đầu 
function sendGetStarted(recipientId) {                                      
  request(
    {
      url: "https://graph.facebook.com/v2.6/" + recipientId,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: ""
      },
      method: "GET"
    },
    function(error, response, body) {
      if (error) {
        console.log("error getting username");
      } else {
        var bodyObj = JSON.parse(body);
        var name = bodyObj.first_name;
        var lname = bodyObj.last_name;
        var pc = bodyObj.profile_pic;
        var locale = bodyObj.locale;
        var timezone = bodyObj.timezone;
        var gender = bodyObj.gender;

        //console.log(JSON.parse(body))

        var messageData = {
          recipient: {
            id: recipientId
          },
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text:
                  "Chào mừng " +name +" đến với Trang Tư Vấn Tuyển Sinh Đà Nẵng. Hãy nhấn “Bắt đầu” để nhận được sự tư vấn từ Trang chúng tôi.",
                buttons: [
                  {
                    type: "postback",
                    title: "Bắt Đầu",
                    payload: "start"
                  }
                ]
              }
            }
          }
        };
        callSendAPI(messageData);
      }
    }
  );
} 


