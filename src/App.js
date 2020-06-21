import React, { Component } from 'react';
import './App.css';
import io from 'socket.io-client';

class App extends Component{

  constructor(props){
    super(props);
    this.localVideoref = React.createRef()
    this.remoteVideoref = React.createRef()
    this.socket = null;
    this.candidates = []
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
      this.textref.value = JSON.stringify(sdp)
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
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
     // console.log("remote srcObject", e.streams)
      this.remoteVideoref.current.srcObject = e.streams[0]
    }
    const constraints = {
      video : true,
      audio: {
        noiseSuppression: true,
        echoCancellation : true
      }
    }
    navigator.mediaDevices.getUserMedia(constraints).then((stream) =>{
      window.localStream = stream
      this.localVideoref.current.srcObject = stream
      this.pc.addStream(stream)
    },(streamError) => {
      console.log("Stream Error: ",streamError)
    })
  }

  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID : this.socket.id,
      payload
    })
  }

  createOffer = () => {
    console.log('offer')
    alert("call made sucessfully wait for user to answer")
    this.pc.createOffer({offerToReceiveVideo:1}).then(sdp => {
      // console.log(JSON.stringify(sdp))
      this.pc.setLocalDescription(sdp).then(() => console.log("local descp added"))
      this.sendToPeer('offerOrAnswer', sdp)
    })
  }
  setRemoteDescription = () => {
    const desc = JSON.parse(this.textref.value)
    this.pc.setRemoteDescription(new RTCSessionDescription(desc)).then(() => console.log("remote descp added"))
    
  }

  createAnswer = () => {
    console.log("Answer")
    this.pc.createAnswer({offerToReceiveVideo: 1, offerToReceiveAudio: 1}).then(sdp => {
      // console.log(JSON.stringify(sdp)
      this.sendToPeer('offerOrAnswer', sdp)

      this.pc.setLocalDescription(sdp)
    })
  }

  addCandidate = () => {
    // const candidate = JSON.parse(this.textref.value)
    // console.log('Adding candidate:', candidate)
    this.candidates.forEach(candidate => {
      console.log(JSON.stringify(candidate))
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    })
  }
  render(){

    return (
      <>
      <div >
        <video style={{width:400,height:400,backgroundColor:"black", margin:20}} ref={this.localVideoref} autoPlay ></video>
        <video style={{width:400,height:400,backgroundColor:"black",margin:20}} ref={this.remoteVideoref} autoPlay ></video>
      </div>
      <h1> Hello </h1>
      <button onClick={this.createOffer}>Call</button>
      <button onClick={this.createAnswer}>Answer</button>
      <br/>
      <textarea ref={ref => {this.textref= ref}}/>
      <br/>
      {/* <button onClick={this.setRemoteDescription}>set Remote Description</button>
      <button onClick={this.addCandidate}>Add candidate</button> */}
      </>
    );
  }
}

export default App;
