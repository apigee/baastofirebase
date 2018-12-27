/* Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 */

const admin = require('./node_modules/firebase-admin');
const serviceAccount = require("./service-key.json");
var config = require('./config.js');

module.exports.import = function (data) {
	
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: "https://"+config.firestore.db+".firebaseio.com"
	});

	data & Object.keys(data).forEach(key => {
		const nestedContent = data[key];

		if(typeof nestedContent == "object") {
			Object.keys(nestedContent).forEach(docTitle => {
				admin.firestore()
					.collection(key)
					.doc(docTitle)
					.set(nestedContent[docTitle])
					/*.then((res) => {
						console.log("Document successfully written!");
					}) */
					.catch((error) => {
					console.error("Error writing document: ", error);
					});
			});
		}
	});
	console.log("done.");
}
