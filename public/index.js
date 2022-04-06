const socket = io()
const fromSocket = document.getElementById('userId')
let fromSocketId, toSocketId
let localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById('remoteVideo')
const canvasEl = document.getElementById('canvasEl')
const videoEl = document.getElementById('videoEl')
ctx = canvas.getContext('2d');
let callButton = document.getElementById("call");
let stopButton = document.getElementById("stop");
let muteButton = document.getElementById("mute");
let unmuteButton = document.getElementById("unMute");
let eraseButton = document.getElementById("erase");
let tracks = [];
let toSocketInput = document.getElementById("toSocket");
configuration = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }], iceTransportPolicy: 'all' }
canvasEl.hidden = true;
let peer = new RTCPeerConnection(configuration)
// console.log(peer.createOffer());


//Get socket Id
socket.on('connect', () => {
    fromSocket.innerHTML = socket.id
    fromSocketId = socket.id
});
// using media stream
let stream = new MediaStream();
const getCanvasStream = async () => {
    try {
        let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        localVideo.srcObject = stream
        tracks = stream.getTracks()
        let canvasStream = canvas.captureStream()
        if (stream.getAudioTracks()[0]) {
            canvasStream.addTrack(stream.getAudioTracks()[0])
        }
        console.log('canvasStream tracks: ', canvasStream.getTracks())
        return canvasStream
    } catch (error) {
        console.log(error)
    }
}
// get local video mediea

const openMediaDevices = async () => {
    try {
        let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        localVideo.srcObject = stream
        tracks = stream.getTracks()
        return stream
    } catch (error) {
        console.log(error)
    }
};
callButton.addEventListener("click", () => {
    if (toSocketInput.value.length > 6) {
        canvasEl.hidden = false;
        videoEl.hidden = true;
        getCanvasStream();  
        createOffer(toSocketInput.value);
        openMediaDevices();
    } else {
        alert("please inter valid user code");
    }
})
localVideo.addEventListener('loadedmetadata', () => {        
    canvas.width = localVideo.videoWidth
    canvas.height = localVideo.videoHeight
})
localVideo.addEventListener('play', () => {

    const loop = () => {
        if (!localVideo.paused && !localVideo.ended) {
            ctx.drawImage(localVideo, 0, 0)
            setTimeout(loop, 30)
        }
    }
    loop()

})
//create Offer
const createOffer = async (receiverId) => {
    try {
       
        let stream = await getCanvasStream()
        stream.getTracks().forEach(track => peer.addTrack(track))
        // console.log(stream);
        let offer = await peer.createOffer()
        peer.setLocalDescription(new RTCSessionDescription(offer))
        //Ice Candidate
        peer.addEventListener('icecandidate', e => {
            if (e.candidate) {
                socket.emit('callerCandidate', {
                    'candidate': e.candidate,
                    "fromSocketId": fromSocketId,
                    'toSocketId': toSocketId
                })
            }
        })
        //send Offer to Server
        toSocketId = toSocketInput.value
        socket.emit('sendOffer', {
            'toSocketId': receiverId,
            'offer': offer,
        });
    } catch (err) {
        console.log(err);
    }
   
}
const createAnswer = async (destination) => {
   
    let stream = await openMediaDevices();
    // console.log(stream);
    stream.getTracks().forEach(track => peer.addTrack(track));
    let answer = await peer.createAnswer()
    peer.setLocalDescription(new RTCSessionDescription(answer))
    peer.addEventListener('icecandidate', e => {
        if (e.candidate) {
            socket.emit('calleeCandidate', { 'candidate': e.candidate, 'destination': destination })
        }
    })
    socket.emit('sendAnswer', {
        'destination': destination,
        'answer': answer,
        'type': "answer"
    });
};
muteButton.addEventListener("click", () => {
    tracks.forEach(track => track.enabled = false);
 
})

unmuteButton.addEventListener("click", () => {
    tracks.forEach(track => track.enabled = true);
})
eraseButton.addEventListener("click", () => {
    localVideo.srcObject = null;
})
stopButton.addEventListener("click",()=> {
    tracks.forEach(track => track.stop());

})



socket.on('receiveOffer', data => {
    peer.setRemoteDescription(data.offer)
    let stream = new MediaStream()
    createAnswer(data.fromSocketId)
    peer.ontrack = e => {
        stream.addTrack(e.track)
        remoteVideo.srcObject = stream
    }
});

socket.on('receiveAnswer',  data => {
    peer.setRemoteDescription(data.answer)
    let stream = new MediaStream()
    peer.ontrack = e => {
        stream.addTrack(e.track)
        remoteVideo.srcObject = stream
    }
})

socket.on('callerCandidate', data => {
    // peer.addIceCandidate(data)

    peer.addIceCandidate(data)
});
socket.on('calleeCandidate', data => {
    // peer.addIceCandidate(data)
    peer.addIceCandidate(data)


});
