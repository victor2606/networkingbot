exports = {}
exports.differenceTime = (time) => Math.abs( new Date().getTime() - time);
exports.differenceTimeDate = (time) => exports.mathTime( exports.differenceTime(time) );
exports.mathTime = (time) => {
	let t = time,
		back = {};
	t /= 1000;	
	back.years = Math.floor( t / 31536000 );
	t %= 31536000;
	back.weeks = Math.floor( t / 604800 );
	t %= 604800;
	back.days = Math.floor( t / 86400 );
	t %= 86400;
	back.hours = Math.floor( t / 3600 );
	t %= 3600;	
	back.minutes = Math.floor( t / 60 );
	t %= 60;	
	back.seconds = Math.floor(t);
	back.str = (back.years ? `${back.years}г ` : '') + 
		(back.weeks ? `${back.weeks}н ` : '') + 
		(back.days ? `${back.days}д ` : '') +
		(back.hours ? `${back.hours}ч ` : '') +
		(back.minutes ? `${back.minutes}м ` : '') + 
		(back.seconds ? `${back.seconds}с ` : ''); 
	return back;		
	
}

formatting = (tbl, string) => {
	for (const i in tbl){
		string = string.replaceAll(`%${i}`, tbl[i]);
	}
	return string;
}

padZero = (value) => `${value}`.padStart(2, '0');

exports.timeFormat = ( format, time ) => {
	time = new Date(time || new Date().getTime());
	return formatting({
		S: time.getMilliseconds(),
		s: padZero(time.getSeconds()),
		m: padZero(time.getMinutes()),
		d: padZero(time.getDate()),
		h: padZero(time.getHours()),
		M: padZero(time.getMonth() + 1),
		y: time.getFullYear()
	}, format)
}

exports.utcTimeFormat = ( format, time ) => {
	time = new Date(time || new Date().getTime());
	return formatting({
		S: time.getUTCMilliseconds(),
		s: padZero(time.getUTCSeconds()),
		m: padZero(time.getUTCMinutes()),
		d: padZero(time.getUTCDate()),
		h: padZero(time.getUTCHours()),
		M: padZero(time.getUTCMonth() + 1),
		y: time.getUTCFullYear()
	}, format)
}


module.exports = exports;