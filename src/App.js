import React, { Component } from 'react';
import './App.css';
import io from 'socket.io-client';
import Login from '../src/components/login'
class App extends Component{

  constructor(props){
    super(props);
    this.localVideoref = React.createRef()
    this.remoteVideoref = React.createRef()
    this.state = {
      password_client: '',
      socket : io(
        '/webrtcPeer',
        {
          part: '/vcallx-web',
          query: {}
        }
       ),
    }
    this.candidates = []
    this.password = ''
    this.textref = ''
    this.login = true;
    this.reciver = ''
    // this.setState({
      
  }
  componentDidMount(){

     
    this.state.socket.on('connection-success', success => {
      console.log("success",success)
    })
    this.state.socket.on('offerOrAnswer', (username,sdp) => {
      //this.textref.value = JSON.stringify(sdp)
      //alert(`${username} is trying to call you`);
      console.log("sdp recived! ",username);
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })
    this.state.socket.on('password',(password) => {
      this.password = password
    })
    this.state.socket.on('candidate', (candidate) => {
      //this.candidates = [...this.candidates, candidate]
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    })
    this.state.socket.on('disconnect-call',(data) => {
    	console.log('diss call')
      //this.disconnect();
    })
    this.createPc();
  }
    
  //   // const pc_config = null
  //   this.createPc();
    
  //   // this.pc.onicecandidate = (e) => {
  //   //   // if(e.candidate) console.log(JSON.stringify(e.candidate))

  //   //   if(e.candidate){
  //   //     this.sendToPeer('candidate', e.candidate)
  //   //   }
  //   // }

  //   // this.pc.oniceconnectionstatechange = (e) => {
  //   //   console.log(e)
  //   // }

  //   // this.pc.ontrack = (e) => {
  //   //   console.log("remote srcObject", e.streams[0])
  //   //   this.remoteVideoref.current.srcObject = e.streams[0]
  //   // }
  //   //this.setLocalVideo();
  // }
  
  handleiceState = (e) => {
    	console.log('ice state ',this.pc.iceConnectionState)
    	if(this.pc.iceConnectionState == 'disconnected')
    	{
		this.disconnect();
		this.sendToPeer('disconnect-call','');
	}
}
   

  handleICEcandidateEvent = (e) => {
    if(e.candidate){
      this.sendToPeer('candidate', e.candidate)
    }
  }

  handleTrackEvent = (e) => {
    this.remoteVideoref.current.srcObject = e.streams[0]
  }

  // handleNegotiationNeededEvent = () => {
  //   this.pc.createOffer().then((offer) => {
  //     return this.pc.setLocalDescription(offer);
  //   }).then(() => {
  //     this.sendToPeer('offerOrAnswer',this.pc.localDescription)
  //   })
  // }
  createPc = () => {
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
    this.pc.onicecandidate = this.handleICEcandidateEvent;
    this.pc.ontrack = this.handleTrackEvent;
    this.pc.oniceconnectionstatechange = this.handleiceState;
    this.setLocalVideo();
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
  setLocalVideo = () => {
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
  sendToPeer = (messageType, payload) => {
    if(messageType === 'offerOrAnswer')
    {
      console.log('reciver:',this.reciver);
      this.state.socket.emit(messageType,{
        username:this.reciver,
        payload
      })
    }
    else
    {
      console.log('offer wala nahi hai ye')
      this.state.socket.emit(messageType, {
        socketID : this.state.socket.id,
        payload
      })
    }
  }
  
  createOffer = () => {
    console.log('offer')
    if(!this.pc)
    {
      this.createPc();
    }
    this.pc.createOffer({offerToReceiveVideo:1,iceRestart: true}).then(sdp => {
      // console.log(JSON.stringify(sdp))
      this.pc.setLocalDescription(sdp).then(() => console.log("local descp added"))
      this.sendToPeer('offerOrAnswer',sdp)
      
      this.sendToPeer('password',this.state.password_client)
    })
    this.setState({
      password_client : this.makeid(5)
    })
    console.log("pass: ",this.state.password_client)
  }

  createAnswer = () => {
    console.log("caller pass: ",this.password)
    if(!this.pc)
    {
      this.createPc();
    }
    if(this.password === this.textref)
    {
      console.log("Answer")
      this.pc.createAnswer({offerToReceiveVideo: 1, offerToReceiveAudio: 1,iceRestart:true}).then(sdp => {
        // console.log(JSON.stringify(sdp)
        this.sendToPeer('offerOrAnswer', sdp)
        this.pc.setLocalDescription(sdp).then(this.sendToPeer('accepted-call',''))
      })
      
    }
    else{
      console.log("pass dint matchn you entered", this.textref)
    }
  }
  disconnect = () => {
    // this.sendToPeer('disconnect-call','')
    if(this.localVideoref.current.srcObject)
    {
      this.localVideoref.current.srcObject.getTracks().forEach(track => track.stop())
      this.localVideoref.current.srcObject = null
    }
    if(this.remoteVideoref.current.srcObject) {
      this.remoteVideoref.current.srcObject.getTracks().forEach(track => track.stop())
      this.remoteVideoref.current.srcObject = null
    }
    if(this.pc)
    {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.close();
      this.pc = null;
    }
    this.candidates = [];
    // this.setLocalVideo();
    this.createPc();
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
          <Login socket={this.state.socket}/>
        <div className="videoView">
          <div className="">
            <video className="localVideo" ref={this.localVideoref} autoPlay />
          </div>
          <div className="">
            <video className="remoteVideo" ref={this.remoteVideoref} autoPlay />
          </div>
        </div>
        <p id="password">{this.state.password_client}</p>
        <input className="inputArea" placeholder="Enter Username" onChange={(event) => {this.reciver = event.target.value}}/>
        <input className="inputArea" placeholder="Enter Video Call ID" onChange={(event) => {this.textref = event.target.value}}/>
        <div>
          <button className="btn" onClick={this.createOffer}>Make Call</button>
          <button className="btn" onClick={this.createAnswer}>Connect to Call</button>
          <button className="btn" onClick={() => {this.disconnect(); this.sendToPeer('disconnect-call','')}}>diconnect to Call</button>
        </div>
        {/* <button onClick={this.setRemoteDescription}>set Remote Description</button>
        <button onClick={this.addCandidate}>Add candidate</button> */}
        </view>
      );
  }
}

export default App;
