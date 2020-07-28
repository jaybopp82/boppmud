'use strict';

const path = require('path');
const jsonfile = require('jsonfile');

const EntityDatabase = require('./EntityDatabase');
const Social = require('./Social');

const file = path.join(__dirname, '..', 'data', 'socials.json');

class SocialDatabase extends EntityDatabase {

	constructor() {
		super();
	}

	load() {
		this.map.clear();
		const dataArray = jsonfile.readFileSync(file);
		dataArray.forEach(dataObject => {
			const social = new Social();
			social.load(dataObject);
			this.add(social);
		});
	}

}

module.exports = SocialDatabase;
