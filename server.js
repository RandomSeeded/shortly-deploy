var app = require('./server-config.js');

var port = process.env.port || 3000;

app.listen(port);

console.log('Server now listening on port ' + port);
