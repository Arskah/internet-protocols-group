const canvas = document.getElementById('preview');
const context = canvas.getContext('2d');
canvas.width = 1980;
canvas.height = 1080;
context.width = canvas.width;
context.height = canvas.height;
const video = document.getElementById('video');
const socket = io();

logger = (msg) => {
  $('#logger').text(msg);
};

loadCamera = (stream) => {
  try {
    video.srcObject = stream;
  } catch (error) {
    video.src = URL.createObjectURL(stream);
  };
  logger('Camera connected');
};

loadFail = () => {
  logger('Camera not connected');
};

viewVideo = (video, context) => {
  context.drawImage(video, 0, 0, context.width, context.height);
  socket.emit('stream', canvas.toDataURL('image/webp'));
};

$(function() {
  navigator.getUserMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msgGetUserMedia
  );

  if (navigator.getUserMedia) {
    navigator.getUserMedia({
      video: true,
      audio: false,
    }, loadCamera, loadFail);
  }

  setInterval(function() {
    viewVideo(video, context);
  }, 5);
});
