#/!\ Work in process /!\

###**Initialisation :**
- Crée un serveur
- Ce connecter en ssh

- Installer git && curl
  - apt-get update
  - apt-get install git-core curl

- Installer node
  - sudo apt-get install -y build-essential
  - curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs

- Installer mongodb
  - sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
  - echo "deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
  - sudo apt-get update
  - sudo apt-get install -y mongodb-org

- Crée un snapshot de l'image que l'on veux utiliser
- Crée une clef ssh rsa sur le serveur alpha
- Donner la clef ssh rsa public à ovh

- crée un utilisateur à mongo
  mongo
  use elastic
  db.createUser({user:'kaaarot', pwd:'***', roles:[ {role:'readWrite', db:'elactic'}]});

- Configurer /ect/mongodb.conf
  
  security:
    authorization: enabled

###**Usage :**
````js
var ovh = require('kaaalastic-ovh');

var param = {
  appKey: 'qdsffffsqdfqdsf',
  appSecret: 'qsdfsqdfqsdfqsdfdqsfsqdfsqdfqsfdqsdf',
  consumerKey: 'qdsfqdsfsqfdsqdfSQFDdsqfsqFDQsqqsd',
  install: 'git clone https://kaaa:321@github.com/florianbellazouz/kaaalastic && cd kaaalastic && npm install',
  cli: 'kaaalastic/test/utils/cli.js',
  sshOvhKeyId: '5a6d7876636d6c2344234',
  regions: ['MVT1', 'SBG1'], // default ['SBG1']
  serverType: 'ram-1', // default 'vps-ssd-1';
}

service.setProvider(ovh, param);
````
