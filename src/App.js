import React, { Component } from "react";
import "./App.css";
import io from "socket.io-client";
import Login from "../src/components/login";
class App extends Component {
  constructor(props) {
    super(props);
    this.localVideoref = React.createRef();
    this.remoteVideoref = React.createRef();
    this.state = {
      password_client: "",
      socket: io("/webrtcPeer", {
        part: "/vcallx-web",
        query: {},
      }),
      login: true,
    };
    this.candidates = [];
    this.password = "";
    this.textref = "";
    this.caller = "";
    this.reciver = "";
    this.isMute = true;
  }
  componentDidMount() {
    this.state.socket.on("connection-success", (success) => {
      console.log("success", success);
    });
    this.state.socket.on("offerOrAnswer", (username, sdp) => {
      this.caller = username;
      if (this.pc.signalingState === "stable") {
        alert(username + " is calling you! ");
      }
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });
    this.state.socket.on("password", (password) => {
      this.password = password;
    });
    this.state.socket.on("candidate", (candidate) => {
      //this.candidates = [...this.candidates, candidate]
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
    this.state.socket.on("disconnect-call", (data) => {
      console.log("diss call");
      //this.disconnect();
    });
    this.state.socket.on("check-user",(value, message) =>{
      if(!value)
      {
        alert("no user with username exist!")
      }
    })
    this.createPc();
  }

  handleiceState = (e) => {
    console.log("ice state ", this.pc.iceConnectionState);
    if (this.pc.iceConnectionState === "disconnected") {
      this.disconnect();
      this.sendToPeer("disconnect-call", "");
    }
  };

  handleICEcandidateEvent = (e) => {
    if (e.candidate) {
      this.sendToPeer("candidate", e.candidate);
    }
  };

  handleTrackEvent = (e) => {
    this.remoteVideoref.current.srcObject = e.streams[0];
  };

  // handleNegotiationNeededEvent = () => {
  //   this.pc.createOffer().then((offer) => {
  //     return this.pc.setLocalDescription(offer);
  //   }).then(() => {
  //     this.sendToPeer('offerOrAnswer',this.pc.localDescription)
  //   })
  // }
  createPc = () => {
    const pc_config = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "turn:numb.viagenie.ca",
          credential: process.env.REACT_APP_TURN_CREDINTIAL,
          username: process.env.REACT_APP_TURN_USERNAME,
        },
      ],
    };
    this.pc = new RTCPeerConnection(pc_config);
    this.pc.onicecandidate = this.handleICEcandidateEvent;
    this.pc.ontrack = this.handleTrackEvent;
    this.pc.oniceconnectionstatechange = this.handleiceState;
    this.setLocalVideo();
  };
  setLocalVideo = () => {
    const constraints = {
      video: true,
      audio: true,
    };
    navigator.mediaDevices.getUserMedia(constraints).then(
      (stream) => {
        window.localStream = stream;
        this.localVideoref.current.srcObject = stream;
        this.pc.addStream(stream);
      },
      (streamError) => {
        console.log("Stream Error: ", streamError);
      }
    );
  };
  sendToPeer = (messageType, payload, username) => {
    if (messageType === "offerOrAnswer") {
      console.log("reciver:", this.reciver);
      this.state.socket.emit(messageType, {
        username: username,
        socketID: this.state.socket.id,
        payload,
      });
    } else {
      console.log("offer wala nahi hai ye");
      this.state.socket.emit(messageType, {
        socketID: this.state.socket.id,
        payload,
      });
    }
  };

  LoginToogle = (value) => {
    this.setState({
      login: value,
    });
  };
  createOffer = () => {
    console.log("offer");
    if (!this.pc) {
      this.createPc();
    }
    this.pc
      .createOffer({
        offerToReceiveVideo: 1,
        offerToReceiveAudio: 1,
        iceRestart: true,
      })
      .then((sdp) => {
        // console.log(JSON.stringify(sdp))
        this.pc
          .setLocalDescription(sdp)
          .then(() => console.log("local descp added"));
        this.sendToPeer("offerOrAnswer", sdp, this.reciver);
        //this.sendToPeer('password',this.state.password_client)
      });
  };

  createAnswer = () => {
    if (!this.pc) {
      this.createPc();
    }
    console.log("Answer");
    this.pc
      .createAnswer({
        offerToReceiveVideo: 1,
        offerToReceiveAudio: 1,
        iceRestart: true,
      })
      .then((sdp) => {
        // console.log(JSON.stringify(sdp)
        this.sendToPeer("offerOrAnswer", sdp, this.caller);
        this.pc
          .setLocalDescription(sdp)
          .then(this.sendToPeer("accepted-call", ""));
      });
  };
  disconnect = () => {
    // this.sendToPeer('disconnect-call','')
    if (this.localVideoref.current.srcObject) {
      this.localVideoref.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
      this.localVideoref.current.srcObject = null;
    }
    if (this.remoteVideoref.current.srcObject) {
      this.remoteVideoref.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
      this.remoteVideoref.current.srcObject = null;
    }
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.close();
      this.pc = null;
    }
    this.candidates = [];
    // this.setLocalVideo();
    this.createPc();
  };

  // addCandidate = () => {
  //   // const candidate = JSON.parse(this.textref.value)
  //   // console.log('Adding candidate:', candidate)
  //   this.candidates.forEach(candidate => {
  //     console.log(JSON.stringify(candidate))
  //     this.pc.addIceCandidate(new RTCIceCandidate(candidate))
  //   })
  // }

  render() {
    if (this.state.login) {
      return <Login socket={this.state.socket} onLogin={this.LoginToogle} />;
    } else {
      return (
        <view className='page'>
          <div className='heading'>
            <h1>Vcallx Video Call</h1>
          </div>
          <div className='videoView'>
            <div className=''>
              <video
                className='localVideo'
                ref={this.localVideoref}
                autoPlay
                muted
              />
            </div>
            <div className=''>
              <video
                className='remoteVideo'
                ref={this.remoteVideoref}
                autoPlay
              />
            </div>
          </div>
          <p id='password'>{this.state.password_client}</p>
          <input
            className='inputArea'
            placeholder='Enter Username'
            onChange={(event) => {
              this.reciver = event.target.value;
            }}
          />
          {/* <input className="inputArea" placeholder="Enter Video Call ID" onChange={(event) => {this.textref = event.target.value}}/> */}
          <div>
            <button className='btn' onClick={this.createOffer}>
              Make Call
            </button>
            <button className='btn' onClick={this.createAnswer}>
              Connect to Call
            </button>
            <button
              className='btn'
              onClick={() => {
                this.disconnect();
                this.sendToPeer("disconnect-call", "");
              }}
            >
              diconnect to Call
            </button>
          </div>
          {/* <button onClick={this.setRemoteDescription}>set Remote Description</button>
          <button onClick={this.addCandidate}>Add candidate</button> */}
        </view>
      );
    }
  }
}

export default App;
