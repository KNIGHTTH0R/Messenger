var Promise = require('bluebird');
var Sequelize = require('sequelize');

module.exports = function(sequelize){

	var methods = {};
	var Chat = sequelize.define('Chat', {
	  name: Sequelize.STRING,
	  instance: Sequelize.STRING,
	  type: Sequelize.STRING,
	  image: Sequelize.STRING,
	  lastUpdated: Sequelize.STRING
	})

	var Contact = sequelize.define('Contact', {
	  name: Sequelize.STRING,
	  instance: Sequelize.STRING,
	  type: Sequelize.STRING,
	  image: Sequelize.STRING
	})

	var Message = sequelize.define('Message',
		{
		  content: Sequelize.STRING,
		  instance: Sequelize.STRING,
		  type: Sequelize.STRING,
		  contact: Sequelize.STRING,
		  lastUpdated: Sequelize.STRING
		}
	)

	Chat.hasMany(Message, {as: 'messages'})

	methods.models = {}
	methods.models.chat = Chat;
	methods.models.contact = Contact;
	methods.models.message = Message;

	methods.addChat = function(name, id, lastUpdated, type){
		return new Promise(function(res,rej){
			Chat.findOne({where: {instance: id, type: type}})
			.then(function(r){
				if(!r){
					console.log("[Database "+type+"] Adding chat "+name)
					return Chat.create({name: name, instance: id, type: type, lastUpdated: lastUpdated, image: 'test'})
				}else{
					console.log("[Database "+type+"] Updating chat "+name)
					r.name = name;
					r.instance = id;
					r.type = type;
					r.image = '';
					r.lastUpdated = lastUpdated;
					return r.save()
				}
			})
			.then(function(r){
				console.log("[Database "+type+"] Saved chat "+r.name);
				res(r);
			})
			.catch(function(e){
				console.log("[ERROR] [Database "+type+"]", e);
			})
		})
	};

	
	methods.addMessage = function(content, instance, chatIdInstance, username, lastUpdated, type){
		if(!content || !instance || !chatIdInstance || !username || !type){
			return;
		}
		var chId;
		return new Promise(function(res,rej){
			Chat.findOne({where: {instance: chatIdInstance}})
			.then(function(r){
				if(!r){
					throw "No Chat Found";
				}else{
					chId = r.id;
					return Message.findOne({where: {instance: instance, type: type}})
				}
			})
			.then(function(r){
				if(!r){
					var send = {content: content, instance: instance, type: type, ChatId: chId, contact: username, lastUpdated: lastUpdated};
					global.mainWindow.webContents.executeJavaScript('loadMessage('+chId+','+JSON.stringify(send)+')')
					return Message.create(send)
				}else{
					console.log("[Database "+type+"] Updating message from chatID "+chatIdInstance)
					r.content = content;
					r.instance = instance;
					r.type = type;
					r.ChatId = chId;
					r.contact = username;
					r.lastUpdated = lastUpdated;
					return r.save()
				}
			})
			.then(function(r){
				//console.log("[Database] Saved message. (Chat ID: "+chatIdInstance+")");
				res()
			})
			.catch(function(e){
				console.log("[ERROR] [Database "+type+"]", e);
			})
		})	
	},

	methods.addContact = function(name, instance, image, type){
		return new Promise(function(res,rej){
			Contact.findOne({where: {instance: instance, type: type}})
			.then(function(r){
				if(!r){
					//console.log("[Database "+type+"] Adding chat "+name)
					return Contact.create({name: name, instance: instance, type: type, image: image})
				}else{
					//console.log("[Database "+type+"] Updating chat "+name)
					r.name = name;
					r.instance = instance;
					r.type = type;
					r.image = image;
					return r.save()
				}
			})
			.then(function(r){
				console.log("[Database "+type+"] Saved contact "+r.name);
				res(r);
			})
			.catch(function(e){
				console.log("[ERROR] [Database "+type+"]", e);
			})
		})
	};

	return methods;
}