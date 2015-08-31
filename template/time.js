//Нынешнее время
function current() {
    var now = new Date(); 
    var now_utc = Date.parse(now);
    var now_st = String(now_utc);
    var result = now_st.slice(0, -3)
    return result;
};

//Преобразование времени
function conversion(time) {
    var timeUnix = time + '000';
    var timeJS = new Date(+timeUnix);
    var year = timeJS.getFullYear();
    var mounth = String(timeJS.getUTCMonth() + 1);
    if(mounth.length == 1) {
        mounth = '0' + mounth;
    }
    var day = String(timeJS.getDate());
    if(day.length == 1) {
        day = '0' + day;
    }
    var hour = timeJS.getHours();
    var minute = timeJS.getMinutes();
    var result = day + '.' + mounth + '.' + year + ' ' + hour + ':' + minute;
    return result;
};

function conversion_arr(time) {
    var timeUnix = time + '000';
    var timeJS = new Date(+timeUnix);
    var year = timeJS.getFullYear();
    var mounth = String(timeJS.getUTCMonth() + 1);
    if(mounth.length == 1) {
        mounth = '0' + mounth;
    }
    var day = String(timeJS.getDate());
    if(day.length == 1) {
        day = '0' + day;
    }
    var hour = timeJS.getHours();
    var minute = timeJS.getMinutes();
    var result = [day, mounth, year, hour, minute];
    return result;
};

exports.current = current;
exports.conversion = conversion;
exports.conversion_arr = conversion_arr;