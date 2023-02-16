const fs = require('fs');
const { Markup } = require('telegraf')

const basic_options = { parse_mode: 'HTML', disable_web_page_preview: true };

module.exports = (ctx) => {
	Object.assign(ctx, {

		send: async function(text, extra = {}) { 
			const chat_id = extra.chat_id || this.chat.id;
			delete extra.chat_id;
			return this.telegram.sendMessage(chat_id, text, Object.assign(extra, basic_options));
		}
		
	});
};

function chunk (arr, size) {
    return Array.from({
      length: Math.ceil(arr.length / size)
    })
    .fill(null)
    .map(() => arr.splice(0, size));
  }