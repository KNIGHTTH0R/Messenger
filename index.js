var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;

//Simple
global.appRoot = __dirname;

var Sequelize = require('sequelize');
var sequelize = new Sequelize({dialect: 'sqlite', storage: global.appRoot+'/db.sqlite', logging: false});
var database = require(global.appRoot+'/database.js')(sequelize);

var services = {};
var config = require(global.appRoot+'/config.js')
global.mainWindow;


function init(){
  sequelize.sync()
  .then(function() {
    global.mainWindow = new BrowserWindow({width: 1000, height: 800});
    global.mainWindow.loadURL('file://' + __dirname + '/views/startup.html');
    global.mainWindow.webContents.openDevTools();
    global.mainWindow.on('closed', function() {
      global.mainWindow = null;
    });
  })
  .catch(function(e){
   console.error(e);
  })
}
app.on('ready', function () {
  init();
});
app.on('window-all-closed', function () {
  process.exit(1)
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

