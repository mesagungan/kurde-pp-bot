const sqlite = require('sqlite3')
const assigmentsConfig = require('./website/limits.json')
const { randomInt } = require('node:crypto');
class Database {

	constructor() {
		this.database = new sqlite.Database("data.db");
		this.database.run("CREATE TABLE IF NOT EXISTS messages(author VARCHAR,content VARCHAR,atachments VARCHAR, snowflake VARCHAR, channel VARCHAR )", (err) => {
			if (err) { console.log(err) }
		})
		this.database.run("CREATE TABLE IF NOT EXISTS assigments(subclass VARCHAR,subject VARCHAR,title VARCHAR,description VARCHAR, due INT, userid INT, created INT,aid VARCHAR , files VARCHAR)", (err) => {
			if (err) { console.log(err) }
		})
		this.database.run("CREATE TABLE IF NOT EXISTS users(uid TEXT, created INT, name TEXT, discord TEXT, password TEXT , salt TEXT, last_login INT, token TEXT)", (err) => {
			if (err) { console.log(err) }
		})
	}
	savemessage(msg) {
		let stm = this.database.prepare("INSERT INTO messages (author,content,atachments,snowflake,channel) VALUES (?,?,?,?,?)");
		let att = ""
		msg.attachments.forEach((element) => {
			att += element.url + ";"
		})
		stm.run(msg.author.id, msg.content, att, msg.id, msg.channel.id);
		stm.finalize();

	}
	addAssigment(assigmentObj, userid) {
		let tilte = assigmentObj.title;
		let description = assigmentObj.description
		let due = Number(assigmentObj.due)
		let subject = assigmentObj.subject;
		let group = assigmentObj.group;

		if (tilte.length < assigmentsConfig['title-max'] && description.length < assigmentsConfig['description-max']
			&& tilte.length > assigmentsConfig['title-min'] && description.length > assigmentsConfig['description-min']
			&& due != undefined && due != NaN && due > 0 && assigmentsConfig.groups.includes(group)
			&& assigmentsConfig.subjects.includes(subject)) {
			let stm = this.database.prepare("INSERT INTO assigments (subclass,subject,title,description,due,userid,created,aid) VALUES (?,?,?,?,?,?,?,?)")
			let randomstring = ""
			let chars = "abcdefghijklmnoprstuvwxz01234567890ABCDEFGHIJKLMNOPRSTQUV"
			for (let i = 0; i < 32; i++) {
				randomstring += chars[randomInt(chars.length - 1)]
			}
			stm.run(group, subject, tilte, description, due, 1, new Date().getTime(), randomstring);
			stm.finalize()
			return true
		}
		else {
			return false
		}
	}
	getAssigments(params) {



		let sql = "SELECT * FROM assigments WHERE "
		if (params.group != undefined) {
			sql += "subclass = ? AND "
		}
		if (params.subject != undefined) {
			sql += "subject = ? AND "
		}
		if (params.due != undefined && Number(params.due) != NaN) {
			sql += "due >= ? AND "
		}
		if (params.aid != undefined) {
			sql += "aid = ? AND "
		}
		if (sql.includes('AND')) {
			sql = sql.substr(0, sql.length - 5)
		}
		else {
			sql = sql.substr(0, sql.length - 7)
		}
		sql += " ORDER BY due ASC"
		let stm = this.database.prepare(sql)
		let bindings = []
		if (params.group != undefined) {
			bindings.push(params.group)
		}
		if (params.subject != undefined) {
			bindings.push(params.subject)
		}
		if (params.due != undefined) {
			bindings.push(params.due)
		}
		if (params.aid != undefined) {
			bindings.push(params.aid)
		}
		stm.run(bindings)



		let promis = new Promise((resolve, reject) => {
			let assigs = []
			stm.each((err, row) => {
				if (err) {
					console.log(err)
				}

				assigs.push(row)
			}, (err, num) => {
				if (err) {
					console.log(err)
				}
				resolve(assigs)
			})
			stm.finalize()

		})
		return promis


	}
	getLessons(day, time) {
		let stm = this.database.prepare("SELECT * FROM lessons WHERE hour = ? AND day = ?  ")
		stm.run(time, day)
		let promise = new Promise((resolve, reject) => {
			let obj = {}
			stm.each((err, row) => {
				if (err) {
					console.log(err)
				}
				obj = row

			}, (err, num) => { resolve(obj) })
		})
		return promise
	}
	getUser = (params) => {
		let bindings = []
		let sql = "SELECT * FROM users WHERE "
		if (params.uid != undefined) {
			sql += " uid = ? AND "
			bindings.push(params.uid)
		}
		if (params.discord != undefined) {
			sql += " discord = ? AND "
			bindings.push(params.discord)
		}
		if (params.token != undefined) {
			sql += " token = ? AND "
			bindings.push(params.token)

		}
		if (params.nick != undefined) {
			sql += "nick = ? AND "
			bindings.push(params.nick)
		}
		if (sql.includes('AND')) {
			sql = sql.substr(0, sql.length - 5)
		}
		else {
			sql = sql.substr(0, sql.length - 7)
		}
		let stm = this.database.prepare(sql)
		stm.bind(bindings)
		stm.run()
		console.log(sql)
		console.log(bindings)
		let promise = new Promise((resolve, reject) => {
			stm.each((err, row) => {
				if (err) {
					console.log(err)
				}
				
				resolve(row)
			}, (err, rows) => {
				if(rows == 0 ){
					resolve({})
				}
			})

		})
		return promise

	}
	addUser = (user) => {
		let sql = "INSERT INTO users (uid,nick,created,password,token,salt,discord,status) VALUES(?,?,?,?,?,?,?,0)"
		let stm = this.database.prepare(sql);
		stm.bind(user.uid, user.nick, user.created, user.password, user.token, user.salt, user.discord)
		stm.run()
		stm.finalize()
	}
}
module.exports.DatabaseApp = Database;