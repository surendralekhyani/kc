const mysql = require('mysql2');
const connection = mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'',
	database:'kc'
});
connection.connect(function(error){
	if(!!error) {
		console.log(error);
	} else {
		console.log('Database Connected Successfully..!!');
	}
});

module.exports = connection;