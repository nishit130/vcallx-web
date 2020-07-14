const express =  require('express');
const { Console } = require('console');
var app     = express();
var server  = require('http').createServer(app);
var io      = require('socket.io').listen(server);
({
    path: '/vcallx-web'
})
// io.listen(server)
// const app = express()
app.use(express.static(__dirname + '/build'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/build/index.html')
})
server.listen('8080', () => {
    console.log('Server listening on Port 8080');
})
// const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// io.listen(server)

const peers = io.of('/webrtcPeer')
let connectedPeers =  new Map()
var usernames = {}
let passwords = {};
peers.on('connection', socket => {
    console.log(socket.id)
    console.log("connected")
    socket.emit('connection-success', { success: socket.id })
    connectedPeers.set(socket.id, socket)
   // console.log(peers.connected[])



    socket.on('addUser', (data) => {
        socket.username = data.username;
        socket.password = data.password;
        passwords[data.password] = data.password;
        let username  = data.username;
        usernames[username] = data.socketID;
        console.log(usernames)
    })
    socket.on('disconnect', () => {
        console.log('disconnected')
        connectedPeers.delete(socket.id)
    })

    socket.on('offerOrAnswer', (data) => {
        // send to the oter peers if anyi
       // console.log(`sent sdp to ${data.username}`)
       let username = data.username;
        console.log(data)
        peers.sockets[usernames[username]].emit('offerOrAnswer',socket.username,data.payload);
        //peers.connected(
        //io.to(usernames[data.username]).emit('offerOrAnswer',socket.username,data.payload);
        // for (const [socketID, socket] of connectedPeers.entries()){
        //     if(socketID !== data.socketID){
        //         console.log(socketID,data.payload.type)
        //         socket.emit('offerOrAnswer',data.payload)
        //     }
        // }
    })
    socket.on('candidate', (data) => {
        // send to the oter peers if any
        for (const [socketID, socket] of connectedPeers.entries()){
            //dont send to self
            if(socketID !== data.socketID){
                //console.log(socketID,data.payload)
                socket.emit('candidate',data.payload)
            }
        }
    })

    socket.on('password', (data) => {
        for(const [socketID,socket] of connectedPeers.entries()){
            if(socketID !== data.socketID){
                console.log(socketID,data.payload)
                socket.emit('password',data.payload)
            }
        }
    })

    socket.on('disconnect-call', (data) => {
        for(const [socketID,socket] of connectedPeers.entries()){
            if(socketID !== data.socketID){
                console.log("disconnect-call for",socketID,data.payload)
                socket.emit('disconnect-call',data.payload)
            }
        }
    })
    
    socket.on('accepted-call', (data) => {
        for(const [socketID,socket] of connectedPeers.entries()){
            if(socketID !== data.socketID){
                console.log("accepted-call for",socketID,data.payload)
                socket.emit('accepted-call',data.payload)
            }
        }
    })
})
