
const express = require('express');
const app = express();
const http = require('http');
const server = new http.Server(app);
const io = require('socket.io')(http);

const port = process.env.port || 3000;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.redirect('index.html');
});


io.on('connection', (socket) => {
  socket.on('stream', function(image) {
    socket.broadcast.emit('stream', image);
  });
});

server.listen(port, function() {
  console.log(`Server running at port ${port}`);
});
