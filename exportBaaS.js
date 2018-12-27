/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
*/

var fs = require("fs");
var request = require("request");
var rp = require("request-promise");
var config = require('./config.js');
// object to hold all data from BaaS
var data = {};
// config data fro BaaS API calls
var url = config.baas.prot + config.baas.host + '/'+ config.baas.org + '/' + config.baas.app;	
var auth = 'Basic '+ new Buffer(config.baas.client_id +':'+config.baas.secret).toString('base64');
var headers = {'Host': config.baas.host, 'Authorization': auth}; 
// array to hold processEntities promises
var processEntityPromises = [];

module.exports.export = function(cb) 
{
	getCollections(cb);
}

function getCollections(cb) 
{
	var optionsCollections = {
		uri: url,
		headers: headers,
		json: true 	
	};

	// 1. Get all collections from BaaS
	// 2. Check collection that have data
	// 3. Get entities from collection with data
	// 4. Write data to data.json
	rp(optionsCollections)
	.then(function (parsedBody) { processCollections(parsedBody)})
	.then(function () { getEntities() })
	.then(function () {
		Promise.all(processEntityPromises)
		.then(function()            { cb(data) })
	});
}

function processCollections(parsedBody) 
{
	var collections = parsedBody.entities[0].metadata.collections;
	console.log("1. Processing collections. Checking for non-empty. Size = " + Object.keys(collections).length);
				
	Object.keys(collections).forEach(collection => {
		var nestedContent = collections[collection];	
		if(nestedContent.count > 0) data[nestedContent.name] = {};
	}); // forEach
}

function getEntities() 
{
	console.log("2. Processing collecions with data. Size = " + Object.keys(data).length);
	Object.keys(data).forEach(collection => {
		// get data from collection
		var optionsEntities = {
			uri: url + '/' + collection,
			headers: headers,
			json: true 	
		}; 
		processEntityPromises.push(rp(optionsEntities).then(function (parsedBody) { processEntities(collection, parsedBody)}));

	}); // forEach
}

function processEntities(collection, parsedBody)
{
	var entities = parsedBody.entities;
	console.log("3. Processing entities for collection " + collection + ". Size = " + entities.length);
	
	entities.forEach((entity, index) => {
				
		// var newEntity = {'docTitle': entity.uuid, 'data': {}};
		var newEntity = {};
		// traverse all elements
		Object.keys(entity).forEach(attr => {
			// filter attributes we do not want to migrate from BaaS
			if(!config.baas.filterAttributes.includes(attr)) { 
				newEntity[attr] = entity[attr];	
			}
		}); // forEach
		data[collection][entity.uuid] = newEntity;
	}); // forEach
}
