
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

function detokenise(string){
	const tokens = ["AND ","DIV ","EOR ","MOD ","OR ","ERROR ","LINE ","OFF ","STEP ","SPC","TAB(","ELSE ","THEN ","line no. ","OPENIN","PTR","PAGE ","TIME ","LOMEM ","HIMEM ","ABS","ACS","ADVAL","ASC","ASN","ATN","BGET","COS","COUNT ","DEG","ERL ","ERR ","EVAL","EXP","EXT","FALSE ","FN","GET ","INKEY","INSTR","INT","LEN","LN","LOG","NOT ","OPENIN","OPENOUT","PI ","POINT(","POS ","RAD","RND","SGN","SIN","SQR","TAN","TO ","TRUE ","USR","VAL","VPOS ","CHR$","GET$ ","INKEY$","LEFT$(","MID$(","RIGHT$(","STR$","STRING$(","EOF ","AUTO ","DELETE ","LOAD ","LIST ","NEW ","OLD ","RENUMBER ","SAVE ","PUT","PTR","PAGE ","TIME ","LOMEM ","HIMEM ","SOUND ","BPUT","CALL ","CHAIN ","CLEAR ","CLOSE","CLG ","CLS ","DATA ","DEF ","DIM ","DRAW ","END ","ENDPROC ","ENVELOPE ","FOR ","GOSUB ","GOTO ","GCOL ","IF ","INPUT ","LET ","LOCAL ","MODE ","MOVE ","NEXT ","ON ","VDU ","PLOT ","PRINT ","PROC","READ ","REM ","REPEAT ","REPORT ","RESTORE ","RETURN ","RUN ","STOP ","COLOUR ","TRACE ","UNTIL ","WIDTH ","OSCLI"];

	var output = "";

	for (let i = 0; i<graphemes.length; i++){
		var g = graphemes[i].codePointAt(0) & 0xff;
		output += g>=0x80 ? " "+tokens[g-0x80] : graphemes[i];
	}
	return output;
}

function post (path, params) {
	log.info("Post",path,params)
}

function get (path,params) {
		log.info("get",path,params)
}

async function videoReply(filename,mediaType,replyTo,text,tweet,checksum,hasAudio,program,mode){


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
		// 		"in_reply_to_id_str":tweet.id_str
		// 		}
		//
		// await fs.writeFileSync('./output/'+response.id_str, JSON.stringify(record,null,4));

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
			post('statuses/update', {status: "@"+tweet.user.screen_name+" Sorry, no output captured from that program", in_reply_to_status_id: tweet.id_str});
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
