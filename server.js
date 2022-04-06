'use strict';
const express = require('express');
const cors = require('cors');
const corsOptions ={
    origin:'http://127.0.0.1:8000',
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
// express.use(cors());
const http = require('http');
const socket = require('socket.io');
const socketServer = require('./socket');
class Server{
    constructor() {
        this.port = 3000;
        this.host = 'localhost';
        this.app = express();
        this.app.use(cors());
        this.http = http.Server(this.app);
        this.socket = socket(this.http,{
        cors: {
        methods: ["GET", "POST"]
        }
        });
        this.app.use(express.static('public'));
    }

    runServer() {
        new socketServer(this.socket).socketConnection();
            this.http.listen(this.port, this.host, () => {
            console.log(`the server has been started at http://${this.host}:${this.port}`);
        });
    }
}
const app = new Server();
app.runServer();

