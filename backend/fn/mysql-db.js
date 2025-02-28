var mysql = require('mysql')
var	q = require('q');
require('dotenv').config();

// var configdb = {
// 	host: 'localhost',
// 	user: 'root',
// 	password: '',
// 	database: 'dbsitedaugia'
// }

var configdb = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
};

// var configdb = {
// 	host: 'crossover.proxy.rlwy.net',
// 	user: 'root',
// 	password: 'GhKBYSqkUGpSsdMFOeekKMYSiyvYRTII',
// 	database: 'railway'
// }

exports.load = function(sql) {
	var d = q.defer();

    var cn = mysql.createConnection(configdb);

	cn.connect((error) => {
		if (error) {
			console.log('err', error);
		} else {
			console.log('connection database success !')
		}
	});
	
	cn.query(sql, function (error, rows, fields) {
		if (error) {
			d.reject(error);
		} else {
			d.resolve(rows);
		}
		cn.end();
	});

	return d.promise;
}

exports.save = function(sql) {
	
    var cn = mysql.createConnection(configdb);

	cn.connect((error) => {
		if (error) {
			console.log(error);
		} else {
			console.log('connection database success !')
		}
	});

	cn.query(sql, function (error, value) {
		if (error) {
			console.log(error);
		} else {
			console.log(value);
		}

		cn.end();
	});
}


exports.insert = function (sql) {
	var d = q.defer();
	
	var cn = mysql.createConnection(configdb);

	cn.connect();
	cn.query(sql, function (error, value) {
		if (error) {
			d.reject(error);
		} else {
			d.resolve(value.insertId);
		}

		cn.end();
	});

	return d.promise;	
}

exports.delete = function (sql) {
	var d = q.defer();
	
	var cn = mysql.createConnection(configdb);

	cn.connect();
	cn.query(sql, function (error, value) {
		if (error) {
			d.reject(error);
		} else {
			d.resolve(value.affectedRows);
		}

		cn.end();
	});

	return d.promise;	
}