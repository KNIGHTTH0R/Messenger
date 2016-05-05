var RtmClient = require('slack-client').RtmClient;
var WebClient = require('slack-client').WebClient;
var RTM_EVENTS = require('slack-client').RTM_EVENTS;
var Promise = require('bluebird');
var database;
var rtm;
var web;

var conversations = [];

function getChannelInfo(id){
	return new Promise(function(res,rej){
		web.channels.info(id, function(err,info){
			var ts;

			if(info.channel.latest){
				ts = info.channel.latest.ts.split('.')[0];
			}else{
				ts = info.channel.created
			}

			database.addChat(info.channel.name, info.channel.id, ts, 'slack')
			conversations.push(info.channel.id);
			res()
		});
	})
}

var contactCache = {};

function getContactFromUser(id){
	return new Promise(function(res,rej){
		if(contactCache[id]){
			return res(contactCache[id])
		}
		web.users.info(id, function(err, user){
			var send = {avatar: user.user.profile['image_original'], name: user.user['real_name'], id: user.user.id, username: user.user.name}
			contactCache[user.user.id] = send;
			res(send)
		})
	})
}

function getContacts(){
	return new Promise(function(res,rej){
		web.users.list(function(err,users){
			Promise.map(users.members, function(user){
				contactCache[user.id] = {avatar: user.profile['image_original'], name: user['real_name'], id: user.id, username: user.name}
				return database.addContact(user['real_name'], user.id, user.profile['image_original'], 'slack')
			})
			.then(function(r){
				res()
			})
		})
	})
}

function getChannelMessages(conversation){
	return new Promise(function(resp, rejp){
		web.channels.history(conversation, {}, function(err,r){
			Promise.map(r.messages, function(message){
				var username;
				return new Promise(function(res,rej){
					getContactFromUser(message.user)
					.then(function(r){
						username = message.user;
						return database.addContact(r.name, message.user, r.avatar, 'slack')
					})
					.then(function(r){
						return database.addMessage(message.text, message.ts, conversation, username, message.ts.split('.')[0], 'slack')
					})
					.then(function(r){
						res();
					})
				})
			})
			.then(function(r){
				resp();
			})
		})
	})
}

module.exports = function(data, localSequelize){
	database = require(global.appRoot+'/database.js')(localSequelize);
	rtm = new RtmClient(data.token);
	
	web = new WebClient(data.token);
	getContacts()
	.then(function(r){
		web.channels.list(function(err,list){
			var channels = list.channels;
			Promise.map(channels, function(channel){
				return getChannelInfo(channel.id);
			})
			.then(function(r){
				Promise.map(conversations, function(conversation){
					getChannelMessages(conversation);
				})
			})
			.catch(function(e){
				console.error(e);
			})
		})
	})
	
	rtm.start();


	rtm.on(RTM_EVENTS.MESSAGE, function (message) {
		database.addMessage(message.text, message.ts, message.channel, message.user, message.ts.split('.')[0], 'slack')
	});
}