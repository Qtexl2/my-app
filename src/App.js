import React, {Component} from 'react';


class App extends Component {

  constructor(props) {
    super(props);
    this.localVideoref = React.createRef();
    this.remoteVideoref = React.createRef();
    this.socket = null;
    this.idCorrespondent = null;
    this.isSendIceCandidate = false;
  }


  componentDidMount() {

    const pc_config = null;

    this.pc = new RTCPeerConnection(pc_config);

    this.pc.onicecandidate = (e) => {
      console.log("НАЧИНАЮ ГЕНЕРИТЬ айсов");
      console.log(e.candidate);
      if (e.candidate) {
        const candidate = JSON.stringify(e.candidate);
        const iceCandidate = this.createJson(this.idCorrespondent, candidate, 'ICE_CANDIDATE');
        this.socket.send(JSON.stringify(iceCandidate));
      } else {
        const iceCandidate = this.createJson(this.idCorrespondent, null, 'ICE_CANDIDATE');
        this.socket.send(JSON.stringify(iceCandidate));
      }
    };

    //
    this.pc.onconnectionstatechange = (e) => {
      console.log(e)
    };
    //
    this.pc.onaddstream = (e) => {
      this.remoteVideoref.current.srcObject = e.stream
    };
    //
    const constraints = {video: true};
    //
    const success = (stream) => {
      window.localStream = stream;
      this.localVideoref.current.srcObject = stream;
      this.pc.addStream(stream)
    };
    //
    const failure = (e) => {
      console.log('getUserMedia Error: ' + e);
    };
    //
    //
    console.log("STARRT")
    navigator.mediaDevices.getUserMedia(constraints)
        .then(success)
        .catch(failure);
  }

  createWebSocket = () => {
    const name = document.getElementById("name");
    const usersButton = document.getElementById("users");
    this.socket = new WebSocket("ws://192.168.33.38:8080/socket?name=" + name.value);
    this.socket.onmessage = (event) => {

      const json = JSON.parse(event.data);
      const type = json.typeMessage;
      switch (type) {
        case 'UPDATE_USERS': this.updateUsers(json.users, usersButton); break;
        case 'OFFER': this.setOffer(json); break;
        case 'ANSWER': this.setAnswer(json); break;
        // case 'ICE_CANDIDATE': this.setIceCandidate(json); break;
      }
    };
  };

  // setIceCandidate = (json) => {
  //   console.log("ПРИНЯЛ АЙСОВ");
  //   const iceCandidate = json.message;
  //   const candidate = JSON.parse(iceCandidate);
  //   console.log(candidate);
  //   console.log(candidate.type);
  //   this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  // };

  setAnswer = async (answerJson) => {
    const answer = answerJson.message;
    console.log("ПРИШЕЛ АНСВЕР");
    console.log(answer);
    this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  setOffer = async (offerJson) => {
    const offer = offerJson.message;
    console.log("ПРИШЕЛ ОФЕР");
    console.log(offer);
    this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.createAnswer();
    const jsonAnswer = this.createJson(offerJson.sessionId, answer, 'ANSWER');
    this.socket.send(JSON.stringify(jsonAnswer));
  };

  updateUsers = (users, usersButton) => {
    usersButton.innerHTML = '';
    users.forEach((elem) => {
      const key = Object.keys(elem)[0];
      const name = elem[key].name;
      this.createBlock(key, name, usersButton);
    })
  };

  createBlock = (key, name, usersButton) => {
    const divElement = document.createElement("button");
    divElement.id = key;
    divElement.innerText = name;
    divElement.addEventListener("click", this.handleClick);
    usersButton.appendChild(divElement);
  };

  handleClick = async (event) => {
    const button = event.target;
    this.idCorrespondent = button.id;
    const offer = await this.createOffer();
    const jsonOffer = this.createJson(this.idCorrespondent, offer, 'OFFER');
    this.socket.send(JSON.stringify(jsonOffer));
  };


  createOffer = async () => {
    console.log('Offer');
    const sdp = await this.pc.createOffer({offerToReceiveVideo: 1});
    this.pc.setLocalDescription(sdp);
    // this.socket.emit('signal', {'sdp': sdp});
    return sdp;
  };

  createJson = (sessionId, message, type) => {
    const jsonData = {};
    jsonData["sessionId"] = sessionId;
    jsonData["message"] = message;
    jsonData["typeMessage"] = type;
    return jsonData;
  };

  createAnswer = async () => {
    console.log('Гененрируем ансвер');
    const sdp = await this.pc.createAnswer({offerToReceiveVideo: 1});
    this.pc.setLocalDescription(sdp);
    return sdp;
  };

  addCandidate = () => {
    const candidate = JSON.parse(this.textref.value);
    console.log('Adding candidate:', candidate);

    this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  setRemoteDescription = () => {
    const desc = JSON.parse(this.textref.value)

    this.pc.setRemoteDescription(new RTCSessionDescription(desc))
  };


  render() {
    return (
        <div>
          <div className="container">
            <input id="name"/>
            <button id="reg" onClick={this.createWebSocket}>Reg</button>
          </div>
          <div id="users"></div>


          <video style={{
            width: 240, height: 240, margin: 5, background: 'black'
          }} ref={this.localVideoref} autoPlay></video>

          <video style={{
            width: 240, height: 240, margin: 5, background: 'black'
          }} ref={this.remoteVideoref} autoPlay></video>

          {/*<button onClick={this.createOffer}>Offer</button>*/}
          {/*<button onClick={this.createAnswer}>Answer</button>*/}
          {/*<br/>*/}
          {/*<textarea ref={ref => { this.textref = ref }}/>*/}
          {/*<br/>*/}
          {/*<button onClick={this.setRemoteDescription}>Set Remote Desc</button>*/}
          {/*<button onClick={this.addCandidate}>Add Candidate</button>*/}
        </div>
    );
  }
}

export default App;
