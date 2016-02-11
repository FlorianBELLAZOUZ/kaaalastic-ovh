var SSH = require('simple-ssh');
var _ = require('lodash');
var Ovh = require('ovh');
var Fs = require('fs');
var Os = require('os');
var ovh;
var conf = {};

// exports
var instances = exports.instances = [];
exports.init = init;
exports.create = create;
exports.close = close;

// Index class
function init(obj) {
  if (!('appKey' in obj
    && 'appSecret' in obj
    && 'consumerKey' in obj
    && 'install' in obj
    && 'cli' in obj
    && 'sshOvhKeyId' in obj)) {
    throw new Error('this object don\'t have all properties appKey, appSecret, consumerKey, install, cli, sshOvhKeyId');
  }

  ovh = Ovh({
    appKey: obj.appKey,
    appSecret: obj.appSecret,
    consumerKey: obj.consumerKey,
  });

  conf.cmdInstall = obj.install;
  conf.pathCli = obj.cli;
  conf.sshKeyId = obj.sshOvhKeyId;
  conf.regions = obj.regions || ['SBG1'];
  conf.serverType = obj.serverType || 'vps-ssd-1';

  ovh.request('GET', '/cloud/project', function(err, data) {
    if (err) throw err;
    conf.projectId = data[0];
    console.info(data[0]);
  });

  var pathRsaKey = [
    './id_rsa.key',
    './id_rsa',
    Os.homedir() + '/.ssh/id_rsa.key',
    Os.homedir() + '/.ssh/id_rsa',
    './key/id_rsa',
    './key/id_rsa.key',
  ]

  fileFirstFileMatch(pathRsaKey, function(err, data) {
    if (err) throw err;
    conf.id_rsa = data;
  });
}

function create(name, publicPort, privatePort, cb) {
  _create(name, publicPort, privatePort, cb);
}

function close(id) {
  var url = '/cloud/project/{serviceName}/instance/{instanceId}';
  var object = {
    serviceName:conf.projectId,
    instanceId:id,
  };
  console.log('[kaaalastic-ovh] close beta ', id);
  ovh.request('DELETE', url, object, function(err, data) {
    if (err) {
      throw err;
      console.log('err closing beta ', err);
    }else {
      console.log('beta close', id, data);
    }
  });
}

///////////////////////////////////////////

function Instance(name, region, publicPort, privatePort) {
  this.name = name;
  this.createIn = 0; // en ms
  this.region = region;
  this.publicPort = publicPort;
  this.privatePort = privatePort;
  this.publicAdresse = '';
  this.privateAdresse = '';
  this.state = '';
  this.ip = '';
}

function _create(name, publicPort, privatePort, cb) {
  console.info('create');
  var time = process.hrtime();

  var region = conf.regions[_.random(conf.regions.length - 1)];

  var instance = new Instance(name, region, publicPort, privatePort);
  instances.push(instance);

  getFlavor();

  function getFlavor() {
    if(!conf.projectId) return setTimeout(getFlavor, 200);
    var url = '/cloud/project/{serviceName}/flavor';
    var object = {
      serviceName:conf.projectId,
    };
    console.log('conf.projectId', conf.projectId);
    ovh.request('GET', url, object, function(err, data) {
      if(err) throw err
      var flavor = _.find(data, { region:instance.region, name:conf.serverType });
      instance.flavorId = flavor.id;

      console.info('getFlavor', flavor.id);
      getImageSnapShoot();
    });
  }

  function getImageSnapShoot() {
    var url = '/cloud/project/{serviceName}/snapshot';
    var object = {
      serviceName:conf.projectId,
      region:instance.region,
    };
    console.log('conf.projectId', conf.projectId, instance.region);
    ovh.request('GET', url, object, function(err, data) {
      instance.imageId = data[0].id;
      console.info('getImageSnapShoot', data[0].id);
      createInstance();
    });
  }

  function createInstance() {
    var url = '/cloud/project/{serviceName}/instance';
    var object = {
      serviceName:conf.projectId,
      flavorId:instance.flavorId,
      monthlyBilling:false,
      imageId:instance.imageId,
      name:instance.name,
      region:instance.region,
      sshKeyId:conf.sshKeyId
    };
    console.log("instance",object);
    ovh.request('POST', url, object, function(err, data) {
      if (err) {
        throw err;
        cb(null);
      }

      instance.id = data.id;
      instance.state = 'BUILD';
      checkBuild();
    });
  }

  function checkBuild() {
    console.info('checkBuild');
    var url = '/cloud/project/{serviceName}/instance/{instanceId}';

    var object = {
      serviceName:conf.projectId,
      instanceId:instance.id,
    };

    ovh.request('GET', url, object, function(err, data) {
      if (err || data.status == 'BUILD') {
        setTimeout(checkBuild, 1000);
      }else {
        console.info('RUNNING', data.ipAddresses[0].ip);
        instance.ip = data.ipAddresses[0].ip;
        instance.state = 'INSTALL';
        setTimeout(installServer, 15000);
      }
    });
  }

  function installServer() {
    var cmd = 'forever start ' + conf.pathCli + ' beta ' + instance.name;
    console.info('exec', conf.cmdInstall, cmd);

    var ssh = new SSH({
      host: instance.ip,
      user: 'admin',
      key: conf.id_rsa,
    });

    ssh
    .exec(conf.cmdInstall, {
      out: function(stdout) {
        console.info('stdout', stdout);
      },
    })
    .exec(cmd, {
      out: function(stdout) {
        console.info('stdout', stdout);
      },

      err: function(stderr) {
        console.log(stderr);
      },
    })
    .exec('echo be an artist', {
      out: function(stdout) {
        console.info('stdout', stdout);
      },
    })
    .exec('exit 0', {
      exit: function() {
        var timeEnd = process.hrtime(time);
        instance.state = 'RUNNING';
        instance.publicAdresse = 'ws://' + instance.ip + ':' + instance.publicPort;
        instance.privateAdresse = 'ws://' + instance.ip + ':' + instance.privatePort;

        console.info('finish', instance.createIn);

        setTimeout(function() {
          instance.createIn = Math.round(timeEnd[0] + timeEnd[1] / 1000);
          cb(instance);
        }, 1500);
      },
    }).start();
  };

  return instance;
};

function fileFirstFileMatch(array, cb) {
  var i = 0;
  function getFile(path) {
    Fs.readFile(path, { encoding:'utf-8' }, function(err, data) {
      if (data && cb) {
        cb(null, data, path);
      }else
      if (err) {
        if (i === array.length - 1) {
          cb('files not found');
        }

        i++;
        getFile(array[i]);
      }
    });
  }

  getFile(array[i]);
}
