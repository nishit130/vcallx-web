const express = require("express");
const { Console } = require("console");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
({
  path: "/vcallx-web",
});

const PORT = process.env.PORT || 8080;
// io.listen(server)
// const app = express()
app.use(express.static(__dirname + "/build"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/build/index.html");
});
server.listen(PORT, () => {
  console.log("Server listening on Port ", PORT);
});
// const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// io.listen(server)

const peers = io.of("/webrtcPeer");
let connectedPeers = new Map();
var usernames = {};
let passwords = {};
peers.on("connection", (socket) => {
  console.log(socket.id);
  console.log("connected");
  socket.emit("connection-success", { success: socket.id });
  connectedPeers.set(socket.id, socket);
  // console.log(peers.connected[])

  socket.on("check-user", (data) => {
    var username = data.username;
    var password = data.password;
    var message = "";
    var isValid = false;
    if (usernames[username] == null) {
      isValid = false;
      message = "user does not exist !";
    } else {
      if (passwords[username] == password) {
        isValid = true;
        message = "login sucessfull!";
        usernames[username] = data.socketID;
        socket.username = data.username;
        socket.password = data.password;
        console.log(usernames);
      } else {
        isValid = false;
        message = "password is incorrect!";
      }
    }
    peers.sockets[data.socketID].emit("check-user", message, isValid);
  });

  socket.on("addUser", (data) => {
    socket.username = data.username;
    socket.password = data.password;
    var password = data.password;
    let username = data.username;
    passwords[username] = password;
    usernames[username] = data.socketID;
    console.log(usernames);
  });
  socket.on("disconnect", () => {
    console.log("disconnected");
    connectedPeers.delete(socket.id);
  });

  socket.on("offerOrAnswer", (data) => {
    // send to the oter peers if anyi
    // console.log(`sent sdp to ${data.username}`)
    var username = data.username;
    //var password = data.password;
    //passwords[username] = password;
    console.log(data);
    peers.sockets[usernames[username]].emit(
      "offerOrAnswer",
      socket.username,
      data.payload
    );
    //peers.connected(
    //io.to(usernames[data.username]).emit('offerOrAnswer',socket.username,data.payload);
    // for (const [socketID, socket] of connectedPeers.entries()){
    //     if(socketID !== data.socketID){
    //         console.log(socketID,data.payload.type)
    //         socket.emit('offerOrAnswer',data.payload)
    //     }
    // }
  });
  socket.on("candidate", (data) => {
    // send to the oter peers if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      //dont send to self
      if (socketID !== data.socketID) {
        //console.log(socketID,data.payload)
        socket.emit("candidate", data.payload);
      }
    }
  });

  socket.on("password", (data) => {
    for (const [socketID, socket] of connectedPeers.entries()) {
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload);
        socket.emit("password", data.payload);
      }
    }
  });

  socket.on("disconnect-call", (data) => {
    for (const [socketID, socket] of connectedPeers.entries()) {
      if (socketID !== data.socketID) {
        console.log("disconnect-call for", socketID, data.payload);
        socket.emit("disconnect-call", data.payload);
      }
    }
  });

  socket.on("accepted-call", (data) => {
    for (const [socketID, socket] of connectedPeers.entries()) {
      if (socketID !== data.socketID) {
        console.log("accepted-call for", socketID, data.payload);
        socket.emit("accepted-call", data.payload);
      }
    }
  });
});
