window.addEventListener('load', () => {
  // Local Video
  const localImageEl = $('#local-image');
  const localVideoEl = $('#local-video');

  // Remote Videos
  const remoteVideoTemplate = Handlebars.compile($('#remote-video-template').html());
  const remoteVideosEl = $('#remote-videos');
  let remoteVideosCount = 0;

  // Hide cameras until they are initialized
  localVideoEl.hide();

  // create our $.webrtc connection
  $.webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    localVideoEl: 'local-video',
    // the id/element dom element that will hold remote videos
    remoteVideosEl: 'remote-videos',
    // immediately ask for camera access
    autoRequestMedia: true,
    debug: false,
    detectSpeakingEvents: true,
    autoAdjustMic: false,
  });

  // We got access to local camera
  $.webrtc.on('localStream', () => {
    localImageEl.hide();
    localVideoEl.show();
  });

  // Remote video was added
  $.webrtc.on('videoAdded', (video, peer) => {
    // eslint-disable-next-line no-console
    const id = $.webrtc.getDomId(peer);
    const html = remoteVideoTemplate({ id });
    if (remoteVideosCount === 0) {
      remoteVideosEl.html(html);
    } else {
      remoteVideosEl.append(html);
    }
    $(`#${id}`).html(video);
    $(`#${id} video`).addClass('ui image medium'); // Make video element responsive
    remoteVideosCount += 1;
  });

  // Join existing Chat Room
  const joinRoom = (roomName) => {
    // eslint-disable-next-line no-console
    console.log(`Joining Room: ${roomName}`);
    $.webrtc.joinRoom(roomName);
    postMessage(`${username} joined chatroom`);
  };

  // Receive message from remote user
  $.webrtc.connection.on('message', (data) => {
    if (data.type === 'chat') {
      const message = data.payload.message;
      console.log('WebRTC');
      console.log(message);
    }
  });

  $((event) => {
    username = 'testuser' + remoteVideosCount;
    const roomName = 'test';
    joinRoom(roomName);
    return false;
  });
});

// Post Local Message
function postMessage(message) {
  const chatMessage = {
    message,
    postedOn: new Date().toLocaleString('en-GB'),
  };
  // Send to all peers
  $.webrtc.sendToAll('chat', chatMessage);
};

function updateBandwidthRestriction(sdp, bandwidth) {
  let modifier = 'AS';
  if (adapter.browserDetails.browser === 'firefox') {
    bandwidth = (bandwidth >>> 0) * 1000;
    modifier = 'TIAS';
  }
  if (sdp.indexOf('b=' + modifier + ':') === -1) {
    // insert b= after c= line.
    sdp = sdp.replace(/c=IN (.*)\r\n/, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
  } else {
    sdp = sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'), 'b=' + modifier + ':' + bandwidth + '\r\n');
  }
  return sdp;
}

function removeBandwidthRestriction(sdp) {
  return sdp.replace(/b=AS:.*\r\n/, '').replace(/b=TIAS:.*\r\n/, '');
}

// https://github.com/andyet/SimpleWebRTC/issues/556
function lowerBandwidth(bandwidth) {
  var remote = $.webrtc.getPeers()[0].pc.pc;
  remote.createOffer()
    .then(offer => remote.setLocalDescription(offer))
    .then(() => {
      const desc = {
        type: remote.remoteDescription.type,
        sdp: bandwidth === 'unlimited'
          ? removeBandwidthRestriction(remote.remoteDescription.sdp)
          : updateBandwidthRestriction(remote.remoteDescription.sdp, bandwidth)
      };
      console.log('Applying bandwidth restriction to setRemoteDescription:\n' +
        desc.sdp);
      return remote.setRemoteDescription(desc);
    })
    .catch(onSetSessionDescriptionError);
}

function connectMQTT() {
  $.client = mqtt.connect("wss://test.mosquitto.org:8081");
  $.client.on('connect', () => {
    $.client.subscribe('presence', (err) => {
      if (!err) {
        $.client.publish('presence', 'Hello mqtt')
      };
    });
  });

  $.client.subscribe("game/data");

  $.client.on('message', (topic, message) => {
    console.log('MQTT: ' + message.toString());
    postMessage(message);
  });
};

function sendMQTT(data) {
  $.client.publish("game/data", data);
};
