var Mocha = require('mocha');
var Should = require('chai').should();

var Alpha = require('kaaalastic').Alpha;
var Doorman = require('kaaalastic').Doorman;
var Client = require('kaaalastic').Client;
var Service = require('kaaalastic').Service;
var Conf = require('../Conf');

var Ovh = require('../index');
var keys = require('../keys');

var doorman;
var game;

function Game (){
  Service.prototype.constructor.apply(this, arguments);
  this.setProvider(Ovh, keys);
}

Game.prototype = Object.create(Service.prototype)

Game.prototype.constructor = Game;

describe('On connection to doorman', function() {
  before(function(done) {
    doorman = new Doorman(Conf, end);
    game = new Game('alpha', 'game', Conf, end);

    var nb = 0;
    function end() { if(++nb == 2) done(); }
  });

  it('should create 2 beta', function(done) {
    this.timeout(400000);
    var C1 = new Client('wss://localhost:8888', '1', '321');
    var C2 = new Client('wss://localhost:8888', '2', '321');
    var C3 = new Client('wss://localhost:8888', '3', '321');
    C1.on('opengame', count)
    C2.on('opengame', count)
    C3.on('opengame', count)

    var nb = 0;
    function count() {
      if(++nb == 3){
        game.betas[0].net.send.close();
        done();
      } 
    }
  });  
});