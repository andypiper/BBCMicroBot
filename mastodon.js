
const ENABLE_TEXT_REPLY = false;
const log            = require('npmlog');
log.level = process.env.LOG_LEVEL || 'verbose';
const Mastodon  = require('mastodon');
require('dotenv').config();
const config = {
	access_token: process.env.ACCESS_TOKEN,
	api_url: `https://${process.env.API_HOST}/api/v1/`,
	hashtag: process.env.HASHTAG,
};
const toot   = new Mastodon(config);

const fs	   = require('fs');

function post (path, params) {
	log.info("Post",path,params)
}

function get (path,params) {
		log.info("get",path,params)
}

async function videoReply(filename,mediaType,replyTo,text,tweet,checksum,hasAudio,program,mode){


	if (tweet.spoiler_text == ""){
		console.log("No CW on bot source post")
	}

	try {
		 let progData = encodeURIComponent(JSON.stringify({
                        "v":1,
                        "program":program,
                        "author":text,
                        "date": Date.now(),
												"id": replyTo
                }));

		progData = progData.replace(/\(/g, '%28').replace(/\)/g, '%29');

		let resp = await toot.post('media', { file: fs.createReadStream(filename), description:"BBC Micro Bot graphics output - "+tweet.spoiler_text });
		log.info(resp)
		let id = resp.data.id; // Source: https://bbcmic.ro/#"+progData
		let params = { status:"I ran "+text+"'s program and got this.", media_ids: [id],in_reply_to_id:replyTo};
		params.visibility = "public";

		let response = await toot.post('statuses', params);

		//log.info(response)

		await toot.post('statuses/:id/favourite', { id: [tweet.id]});
		log.info("Favourited "+tweet.id);

		log.info("Media post DONE ");

		// let record = {
		// 		"v":2,
		// 		"author":tweet.user.screen_name,
		// 		"program":program,
		// 		"mode":mode,
		// 		"date":Math.floor(new Date(tweet.created_at))/1000,
		// 		"in_reply_to_id":tweet.id
		// 		}
		//
		// await fs.writeFileSync('./output/'+response.id, JSON.stringify(record,null,4));

		}

		catch(e) {
			log.info("Media post FAILED");
			log.info(e);
		}
	}

	function noOutput(tweet) {
		console.warn("NO VIDEO CAPTURED");
		if (!ENABLE_TEXT_REPLY) return;
		try {
			post('statuses/update', {status: "@"+tweet.user.screen_name+" Sorry, no output captured from that program", in_reply_to_status_id: tweet.id});
		}
		catch(e) {
			log.info("Non-media post FAILED");
			log.info(e);
		}
	}

	function block(tweet) {
		post('blocks/create',{screen_name: tweet.user.screen_name});
	}

	module.exports = {
		videoReply: videoReply,
		noOutput: noOutput,
		block: block,
		post: post,
		get: get
	};
