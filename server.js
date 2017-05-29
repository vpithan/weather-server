"use strict"
var http = require("http")
var fs = require("fs")
var path = require("path")
class Server {
	constructor(port, appPath) {
		this.log = {
			write(message) {
  			console.log(`[${this.getCurrentDate()}] ${message}`);
			},
			info(message) {
				return this.write(`[INFO] ${message}`)
			},
			err(message) {
				return this.write(`[ERROR] ${message}`)
			},
			warning(message) {
				return this.write(`[WARNING] ${message}`)
			},
			getCurrentDate() {
				let date = new Date();
				return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getSeconds()}`
			}
		}
		this.host = {
			port: port,
			path: appPath,
			url: "0.0.0.0"
		}
		this.http = {
			contentTypes: {
				".html" : "text/html",
				".js": "application/javascript",
				".css": "text/css",
				".txt": "text/plain",
				".jpg": "image/jpeg",
				".png": "image/png"
			},
			code: {
				"200": (res, extention, contents, file) => {
					let contentType = this.http.contentTypes[extention];
					if (contentType) {
						res.setHeader("Content-Type", contentType);
					}
					this.log.info(`Serving file: ${file}`);
					res.setHeader("Content-Length", contents.length);
					res.end(contents);
					res.statusCode = 200;
				},
				"404": (res, file) => {
					this.log.warning(`File not found: ${file}`);
					res.writeHead(404);
					res.end();
				},
				"500": (res) => {
					this.log.err(`Internal server error.`);
					res.writeHead(500);
					res.statusCode = 500;
					res.end();
				}
			}
		}
	}
	create() {
		http.createServer( (req, res) => {
			let localPath = `${__dirname}/${this.host.path}`;  
			let filename = req.url || "index.html";
			let extention = path.extname(filename);
			this.findFile(localPath, filename, res, extention);
		}).listen(this.host.port, this.host.url);
		this.log.info(`Starting web server ${this.host.path} at ${this.host.url}:${this.host.port}`)
	}	
	getFile(file, res, extention) {
		fs.readFile(file, (err, contents) => {
			if(!err) {
				return this.http.code[200](res, extention, contents, file);
			}
			return this.http.code[500](res)
		});
	}
	findFile(path, file, res, extention) {
		fs.exists(`${path}${file}`, (exists) => {
			if(exists) {
				return this.getFile(`${path}${file}`, res, extention);
			}
			return this.http.code[404](res, file)
		});
	}
}

let server = new Server(8080, "app").create();