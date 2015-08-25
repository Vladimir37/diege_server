var mysql = require('mysql');

var connection;

//Обработка ошибок
function handleDisconnect(db_config) {
	console.log('Disconnect работает');
	connection = mysql.createConnection(db_config);

	connection.connect(function(err) {
		if(err) {
			console.log('error when connecting to db:', err);
			setTimeout(handleDisconnect, 2000);
		}
	});

	connection.on('error', function(err) {
		console.log('db error', err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST') {
			handleDisconnect();
		} 
		else {
			throw err;
		}
	});
}

//Возврат дескриптора
function connection_desc() {
	if(connection) {
		return connection;
	}
	else {
		setTimeout(connection_desc, 200);
	}
}

exports.activate = handleDisconnect;
exports.connection = connection_desc;