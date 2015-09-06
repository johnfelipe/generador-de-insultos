'use strict';


var fs = require('fs');

var Promise = require('bluebird');
require('neon');

var Conjugator = require('./Conjugator');

var InsultGenerator = Class({}, "InsultGenerator")({
  prototype : {
    file : null,
    verbs: null,
    nouns: null,

    _maxTries: 10,
    _loaded: false,
    _verbRe: /^[0-9]+\-v\s+?lemma\s+?([^ ]+)/,
    _nounRe: /^[0-9]+\-n\s+?lemma\s+?([^ ]+)/,
    _conjugator: null,

    init : function init(config) {
      config = config || {};

      Object.keys(config).forEach(function (property) {
        this[property] = config[property];
      }, this);

      this._conjugator = new Conjugator();
    },

    generate : function generate(config) {
      var selectedVerb;
      return this._load()
          .then(function () {
            return this._getVerb();
          }.bind(this)).then(function (verb) {
            return this._conjugateVerb(verb);
          }.bind(this)).then(function (conjugatedVerb) {
            selectedVerb = conjugatedVerb;
            return this._getNoun();
          }.bind(this)).then(function (noun) {
            return this._generateInsult(selectedVerb, noun);
          }.bind(this));
    },

    _load : function _load() {
      return this._loadFile()
          .then(function () {
            return this._loadVerbs();
          }.bind(this)).then(function () {
            return this._loadNouns();
          }.bind(this));
    },

    _loadFile : function _loadFile() {
      return new Promise(function (resolve, reject) {
        if (this._loaded) {
          return resolve();
        }

        fs.readFile(this.file, {encoding: 'utf8'}, function (err, contents) {
          if (err) {
            return reject(err);
          }

          this._contents = contents;
          this._loaded = true;
          resolve();
        }.bind(this));
      }.bind(this));
    },

    _loadVerbs : function _loadVerbs() {
      return new Promise(function (resolve, reject) {
        if (this.verbs) {
          return resolve();
        }

        this.verbs = [];
        this._contents.split('\n').forEach(function (line) {
          var matches;
          matches = line.match(this._verbRe);

          if (matches) {
            if (this.verbs.indexOf(matches[1]) === -1) {
              this.verbs.push(matches[1])
            }
          }
        }, this);

        resolve();
      }.bind(this));
    },

    _loadNouns : function _loadNouns() {
      return new Promise(function (resolve, reject) {
        if (this.nouns) {
          return resolve();
        }

        this.nouns = [];
        this._contents.split('\n').forEach(function (line) {
          var matches;
          matches = line.match(this._nounRe);

          if (matches) {
            if (this.nouns.indexOf(matches[1]) === -1) {
              this.nouns.push(matches[1])
            }
          }
        }, this);

        resolve();
      }.bind(this));
    },

    _getVerb : function _getVerb() {
      var index;
      index = Math.floor(Math.random()*this.verbs.length);
      return Promise.resolve(this.verbs[index]);
    },

    _conjugateVerb : function _conjugateVerb(verb) {
      return new Promise(function (resolve, reject) {
        var tries;

        tries = 0;

        var attemptConjugation = function attemptConjugation(verb, tries) {
          if (tries > this._maxTries) {
            return reject(new Error("Couldn't find a proper verb"));
          };

          this._conjugator.conjugate(verb)
              .then(function (conjugatedVerb) {
                resolve(conjugatedVerb);
              })
              .catch(function (err) {
                this._getVerb().then(function (verb) {
                  attemptConjugation.bind(this)(verb, tries + 1);
                }.bind(this))
              }.bind(this));
        };

        setTimeout(attemptConjugation.bind(this, verb, 0), 0);
      }.bind(this));
    },

    _getNoun : function _getNoun() {
      var index;
      index = Math.floor(Math.random()*this.nouns.length);
      return Promise.resolve(this.nouns[index]);
    },

    _generateInsult : function _generateInsult(verb, noun) {
      return Promise.resolve(verb + this._pluralize(noun));
    },

    // Super dumb pluralizer
    _pluralize : function _pluralize(noun) {
      console.log(noun);
      if (["a","e","i","o","u"].indexOf(noun[noun.length - 1]) >= 0) {
        return noun + "s"
      }

      return noun + "es";
    }
  }
});

module.exports = InsultGenerator;
