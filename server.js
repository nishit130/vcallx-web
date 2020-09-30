const express = require("express");
const { Console } = require("console");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
// eslint-disable-next-line no-unused-expressions
({
  path: "/vcallx-web",
});

const PORT = process.env.PORT || 8080;

app.use(express.static(__dirname + "/build"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/build/index.html");
});
server.listen(PORT, () => {
  console.log("Server listening on Port ", PORT);
});


const peers = io.of("/webrtcPeer");
let connectedPeers = new Map();
var usernames = { nishit: "0", jaini: "0" };
let passwords = { nishit: "patel", jaini: "patel" };
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}
peers.on("connection", (socket) => {
  console.log(socket.id);
  console.log("connected");
  socket.emit("connection-success", { success: socket.id });
  connectedPeers.set(socket.id, socket);
  // console.log(peers.connected[])

  socket.on("login-user", (data) => {
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
    peers.sockets[data.socketID].emit("login-user", message, isValid);
  });

  socket.on("check-user", (data) => {
    var username = data.username;
    var isValid = false;
    var message = ""
    if (usernames[username] == null) {
      isValid = true;
    } else {
      isValid = false;
    }
    peers.sockets[data.socketID].emit("check-user", isValid,message);
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
    
    var username = getKeyByValue(usernames,socket.id);
    usernames[username] = '0';
    console.log(username," disconnected");
    connectedPeers.delete(socket.id);
  });

  socket.on("offerOrAnswer", (data) => {
    // send to the oter peers if anyi
    // console.log(`sent sdp to ${data.username}`)
    var username = data.username;
    //var password = data.password;
    //passwords[username] = password;
    console.log(data.username);
    if(usernames[username] === '0')
    {
      peers.sockets[data.socketID].emit(
        "check-user", false,`${username} is not online`
      );
      console.log('user is not online')
    }
    else if(!usernames[username]){
      peers.sockets[data.socketID].emit(
        "check-user", false, "user does not exist!"
      );
    }
    else{
      peers.sockets[usernames[username]].emit(
        "offerOrAnswer",
        socket.username,
        data.payload
      );
    }
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
