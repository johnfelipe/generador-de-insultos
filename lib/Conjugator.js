'use strict';


var Promise = require('bluebird');
var cheerio = require('cheerio');
require('neon');
var request = require('request');


var Conjugator = Class({}, "Conjugator")({
  prototype : {
    _baseUrl: "http://www.spanishdict.com/conjugate/",
    _selector: ".aa .neoConj tr td",

    init : function init(config) {
      config = config || {};

      Object.keys(config).forEach(function (property) {
        this[property] = config[property];
      }, this);
    },

    conjugate : function conjugate(verb) {
      return new Promise(function (resolve, reject) {
        request(this._baseUrl + verb, function (err, res, body) {
          var $, result, finalVerb ;
          if (err) {
            return reject(err);
          }
          $ = cheerio.load(body);
          result = $('.vtable-word')[10];

          if (!result) {
            console.log("Verb not found: ", verb);
            return reject(new Error("Not a valid verb"));
          }

          finalVerb = this._extractWord(result);

          console.log(verb, finalVerb);
          resolve(finalVerb);
        }.bind(this));
      }.bind(this));
    },

    _extractWord : function _extractWord(node) {
      var word = "", components;

      node.children.forEach(function (child) {
        if (child.type === "text") {
          word += child.data;
        } else {
          word += this._extractWord(child);
        }
      }, this);

      word = word.split(",")[0]; // multiple conjugations, take 1
      components = word.split(" "); // some special cases have two words
                                    // use the last, why not

      return components[components.length - 1];
    }
  }
});

module.exports = Conjugator;
