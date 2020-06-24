import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import './App.css';
import io from 'socket.io-client';

class App extends Component{

  constructor(props){
    super(props);
    this.localVideoref = React.createRef()
    this.remoteVideoref = React.createRef()
    this.state = {
      password_client : '',
    }
    this.socket = null;
    this.candidates = []
    this.password = ''
    this.textref = 'xyz'
  }
  componentDidMount(){

    this.socket = io(
      '/webrtcPeer',
      {
        part: '/vcallx-web',
        query: {}
      }
    )

    this.socket.on('connection-success', success => {
      console.log("success",success)
    })

    this.socket.on('offerOrAnswer', (sdp) => {
      //this.textref.value = JSON.stringify(sdp)
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })
    this.socket.on('password',(password) => {
      this.password = password
    })
    this.socket.on('candidate', (candidate) => {
      //this.candidates = [...this.candidates, candidate]
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    })

    // const pc_config = null
    const pc_config = {
      "iceServers": [
        {
          urls : 'stun:stun.l.google.com:19302'
        },
        {
          urls: 'turn:numb.viagenie.ca',
          credential: process.env.REACT_APP_TURN_CREDINTIAL,
          username: process.env.REACT_APP_TURN_USERNAME
        },
      ]
    }

    this.pc = new RTCPeerConnection(pc_config)
    this.pc.onicecandidate = (e) => {
      // if(e.candidate) console.log(JSON.stringify(e.candidate))

      if(e.candidate){
        this.sendToPeer('candidate', e.candidate)
      }
    }

    this.pc.oniceconnectionstatechange = (e) => {
      console.log(e)
    }

    this.pc.ontrack = (e) => {
      console.log("remote srcObject", e.streams[0])
      this.remoteVideoref.current.srcObject = e.streams[0]
    }
    const constraints = {
      video : true,
      //audio: true,
    }
    navigator.mediaDevices.getUserMedia(constraints).then((stream) =>{
      window.localStream = stream
      this.localVideoref.current.srcObject = stream
      this.pc.addStream(stream)
    },(streamError) => {
      console.log("Stream Error: ",streamError)
    })
  }
    makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
 
  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID : this.socket.id,
      payload
    })
  }

  createOffer = () => {
    console.log('offer')
    this.pc.createOffer({offerToReceiveVideo:1}).then(sdp => {
      // console.log(JSON.stringify(sdp))
      this.pc.setLocalDescription(sdp).then(() => console.log("local descp added"))
      this.sendToPeer('offerOrAnswer', sdp)
      
      this.sendToPeer('password',this.state.password_client)
    })
    this.setState({
      password_client : this.makeid(5)
    })
    console.log("pass: ",this.state.password_client)
  }
  // setRemoteDescription = () => {
  //   //const desc = JSON.parse(this.textref.value)
  //   this.pc.setRemoteDescription(new RTCSessionDescription(desc)).then(() => console.log("remote descp added"))
    
  // }

  createAnswer = () => {
    if(this.password === this.textref)
    {
      console.log("Answer")
      this.pc.createAnswer({offerToReceiveVideo: 1, offerToReceiveAudio: 1}).then(sdp => {
        // console.log(JSON.stringify(sdp)
        this.sendToPeer('offerOrAnswer', sdp)

        this.pc.setLocalDescription(sdp)
      })
    }
    else{
      console.log("pass dint matchn you entered", this.textref)
    }
  }
  
  // addCandidate = () => {
  //   // const candidate = JSON.parse(this.textref.value)
  //   // console.log('Adding candidate:', candidate)
  //   this.candidates.forEach(candidate => {
  //     console.log(JSON.stringify(candidate))
  //     this.pc.addIceCandidate(new RTCIceCandidate(candidate))
  //   })
  // }

  render(){

    return (
      <view className="page">
        <div className="heading">
          <h1>Vcallx Video Call</h1>
        </div>
      <div className="videoView">
        <div className="">
          <video className="localVideo" ref={this.localVideoref} autoPlay />
        </div>
        <div className="">
          <video className="remoteVideo" ref={this.remoteVideoref} autoPlay />
        </div>
      </div>
      <p id="password">{this.state.password_client}</p>
      <input className="inputArea" placeholder="Enter Video Call ID" onChange={(event) => {this.textref = event.target.value}}/>
      <div>
        <button className="btn" onClick={this.createOffer}>Make Call</button>
        <button className="btn" onClick={this.createAnswer}>Connect to Call</button>
      </div>
      {/* <button onClick={this.setRemoteDescription}>set Remote Description</button>
      <button onClick={this.addCandidate}>Add candidate</button> */}
      </view>
    );
  }
}

export default App;
