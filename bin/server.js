#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');

var Hapi = require('hapi');

var server = new Hapi.Server();
var InsultGenerator = require('../lib/InsultGenerator');

var insults = new InsultGenerator({
  file : path.resolve(__dirname, '../ext/words.tab')
});
var replaceRe = /{{insult}}/
var template;


server.connection({ 
    host: 'localhost', 
    port: 9200 
});

server.route({
    method: 'GET',
    path:'/', 
    handler: function (request, reply) {
      insults.generate().then(function (insult) {
        reply(template.replace(replaceRe, insult));
      });
    }
});

// Preload stuff, then run
console.log("Loading template...");
fs.readFile(path.resolve(__dirname, '../ext/index.html'), {encoding: 'utf8'}, function (err, contents) {

  if (err) {
    console.error(err);
    process.exit(1)
  }

  template = contents;
  console.log("Setting up insults...")
  insults.generate().then(function (insult) {
    server.start(function() {
      console.log('Server running at:', server.info.uri);
    });
  }).catch(function (err) {
    console.error(err);
    console.log("Error running insults... bad augur");
    process.exit(1);
  });
});
