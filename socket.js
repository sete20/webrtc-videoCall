'use strict';
class SocketServer {
      constructor(socket) {
            this.io = socket;
            this.users = [];
            this.status = '';
         
      }
      ioConfig() {
            this.io.use((socket, next) => {
                  socket['username'] = socket.handshake.query.username;
                  next();
            });
      }
      
      socketConnection() {
            this.ioConfig();
            this.io.on('connection', (socket) => {
                  this.users.push(socket.id);
                  console.log(this.users);
                  this.disconnect(socket);
                  this.sendOffer(socket)
                  this.sendAnswer(socket)
                  this. callerCandidate(socket);
                  this.calleeCandidate(socket);


            });
      }

      disconnect(socket) {
            socket.on('disconnect', (data) => {
                  this.users.splice(socket.id);
                  this.users.splice(socket.username);
                  console.log(data, socket.id, this.users);
            });
      }
      sendOffer(socket) {
            
            socket.on('sendOffer', data => {
                  console.log(data.toSocketId, socket.id);
                  socket.to(data.toSocketId).emit('receiveOffer', {
                        'offer': data.offer,
                        'type': data.type,
                        'toSocketId': data.toSocketId,
                        'fromSocketId': socket.id
                  });
            });
      };
      sendAnswer(socket) {
            socket.on('sendAnswer', data => {
                  console.log('answer', data.destination);
                  socket.to(data.destination).emit('receiveAnswer', {
                        'answer': data.answer,
                        'type': "answer", 
                  });
            });
      }

      callerCandidate(socket) {
            socket.on('callerCandidate', data => {
                  socket.to(data.toSocketId).emit('callerCandidate', data.candidate)
            });
      }
      calleeCandidate(socket) {
            socket.on('calleeCandidate', data => {
                  console.log('candidating to', data.destination)
                        socket.to(data.destination).emit('calleeCandidate', data.candidate)
                  })
      }

}
module.exports=SocketServer;
