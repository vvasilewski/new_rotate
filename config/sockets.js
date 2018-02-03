/**
 * WebSocket Server Settings
 * (sails.config.sockets)
 *
 * These settings provide transparent access to the options for Sails'
 * encapsulated WebSocket server, as well as some additional Sails-specific
 * configuration layered on top.
 *
 * For more information on sockets configuration, including advanced config options, see:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.sockets.html
 */

//var gm = require('gm');
var gm = require('gm').subClass({imageMagick: true});
//var gm = require('imagemagick');
var util = require('util');
buffer = require('buffer');
var http = require('http');
mime = require('mime');
var easyim = require('easyimage');

module.exports.sockets = {
    /***************************************************************************
     *                                                                          *
     * This custom onConnect function will be run each time AFTER a new socket  *
     * connects (To control whether a socket is allowed to connect, check out   *
     * `authorization` config.) Keep in mind that Sails' RESTful simulation for *
     * sockets mixes in socket.io events for your routes and blueprints         *
     * automatically.                                                           *
     *                                                                          *
     ***************************************************************************/
    onConnect: function (session, socket) {
        var io = sails.io;
        var util = require('util');
        var path;

        socket.roomName = 'wasilewski';

        console.log('connect');

        socket.on('checkQueue', function (name, fn) {
            console.log('checkQueue');
            var params = {
                QueueUrl: 'https://sqs.us-east-1.amazonaws.com/833679955307/IMAGE_ROTATE'
            };

            var aw = aws.setService();
            var sqs = new aw.SQS();
            sqs.receiveMessage(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                } else {

                    var io = sails.io;
                    var s3 = awsS3.getService();


                    var callback = function (path) {
                      //console.log(path);
                        sqs.purgeQueue(params, function (err, data) {
                            if (err) {
                                console.log(err, err.stack); // an error occurred
                            } else {
                                console.log('queue removed');
                                //console.log(path);
                                socket.emit('colorized', path);

                            }
                        });
                    };

                    http.get('http://s3.amazonaws.com/' + data.Messages[0].Body, function (res) {
                    //http.get('http://s3-website-us-east-1.amazonaws.com/' + data.Messages[0].Body, function (res) {
                    //http.get('http://s3.amazonaws.com/wasilewskibucket/25f74cd3-77be-447e-b758-deda98a6fdfb.jpg', function (res) {
                      console.log(data.Messages[0].Body);
                      console.log(res.statusCode);
                      console.log(data.Messages[0]);

                      //console.log(res);

                        if (res.statusCode != 200) {
                            console.log('Err problem with getting in sockets.js>');
                        } else {
                          //console.log(res._header);
                          //console.log(res);

                          console.log('Before colorized');
                          path = res.path;
                         /* gm('/path/to/image.jpg')
                            .resize(353, 257)
                            .autoOrient()
                            .write(writeStream, function (err) {
                              if (!err) console.log(' hooray! ');
                            });
                          */

                            //gm('http://s3.amazonaws.com/' + data.Messages[0].Body)
                              //gm(res)
                                //.colorize(0/0/50)
                              //gm('assets/images/gtv.jpg')
                                //.resize(353, 257)
                                //.colorize(200, 200, 256)
                            //gm(res).colorize(200, 200, 256)
                                //.autoOrient()
                             gm(res)
                               .colorize(7,21,50)
                               .resize('800x800')
                               .stream(function (err, stdout, stderr) {

                                        if (err) {
                                            callback('err');
                                            return;
                                        }
                                        //console.log('This is path:');
                                        //console.log(res);
                                        //console.log('End of path');
                                        console.log('Colorized is done');
                                        var name = data.Messages[0].Body.split("/");
                                        //console.log('What is in dataMassage[0]: ' + name);

                                        var buf = new Buffer(0);

                                 stdout.on('data', function (d) {

                                          console.log("stdout.data");
                                          //buf.maxBuffer(64);
                                          //Buffer.isBuffer(buf);
                                          buf = Buffer.concat([buf, d]);
                                          console.log('What is in buf, after concat: ' + buf.size);
                                          console.log('Concat is done');
                                          callback(buf);
                                        });
                                        stdout.on('end', function (data) {

                                            var data = {
                                                Bucket: name[0],
                                                Key: name[1],
                                                Body: buf,
                                                ContentType: "image/jpeg",
                                                ContentEncoding: "base64",
                                                ACL: "public-read"

                                              //ContentType: mime.lookup(name[1])
                                            };
                                          var options ={
                                            partSize: 10 * 1024 * 1024, 
                                            queueSize: 1}
                                          
                                          console.log('**data.bucket:' + name[0] );
                                          console.log('**data.key'+ name[1]);
                                          console.log('**rest: '+ name[2] + name[3] + name[4] + name[5]);
                                          //console.log('**data.body' + buf);
                                          console.log('**data.contenttype' + mime.lookup(name[1]));
                                          console.log('end is Done, waiting for put and finish');

                                            s3.putObject(data, options, function (err, resp) {
                                              console.log('What is in resp when putting to s3:' + resp);
                                            console.log('Done' + name[1]);
                                               
                                            });

                                        });
                                    });
                        }
                    });
                }
            });
        });
    },
    /***************************************************************************
     *                                                                          *
     * This custom onDisconnect function will be run each time a socket         *
     * disconnects                                                              *
     *                                                                          *
     ***************************************************************************/
    onDisconnect: function (session, socket) {
        var io = sails.io;

        io.sockets.emit('userLeft');
        socket.leave(socket.roomName);

        var userList = {};
        io.sockets.clients(socket.roomName).forEach(function (socket) {
            userList[socket.user.id] = socket.user;
        });

        io.sockets.in(socket.roomName).emit('userList', userList);

        console.log('disconnected');
    },
    /***************************************************************************
     *                                                                          *
     * `transports`                                                             *
     *                                                                          *
     * A array of allowed transport methods which the clients will try to use.  *
     * The flashsocket transport is disabled by default You can enable          *
     * flashsockets by adding 'flashsocket' to this list:                       *
     *                                                                          *
     ***************************************************************************/
    // transports: [
    //   'websocket',
    //   'htmlfile',
    //   'xhr-polling',
    //   'jsonp-polling'
    // ],

    /***************************************************************************
     *                                                                          *
     * Use this option to set the datastore socket.io will use to manage        *
     * rooms/sockets/subscriptions: default: memory                             *
     *                                                                          *
     ***************************************************************************/

    // adapter: 'memory',

    /***************************************************************************
     *                                                                          *
     * Node.js (and consequently Sails.js) apps scale horizontally. It's a      *
     * powerful, efficient approach, but it involves a tiny bit of planning. At *
     * scale, you'll want to be able to copy your app onto multiple Sails.js    *
     * servers and throw them behind a load balancer.                           *
     *                                                                          *
     * One of the big challenges of scaling an application is that these sorts  *
     * of clustered deployments cannot share memory, since they are on          *
     * physically different machines. On top of that, there is no guarantee     *
     * that a user will "stick" with the same server between requests (whether  *
     * HTTP or sockets), since the load balancer will route each request to the *
     * Sails server with the most available resources. However that means that  *
     * all room/pubsub/socket processing and shared memory has to be offloaded  *
     * to a shared, remote messaging queue (usually Redis)                      *
     *                                                                          *
     * Luckily, Socket.io (and consequently Sails.js) apps support Redis for    *
     * sockets by default. To enable a remote redis pubsub server, uncomment    *
     * the config below.                                                        *
     *                                                                          *
     * Worth mentioning is that, if `adapter` config is `redis`, but host/port  *
     * is left unset, Sails will try to connect to redis running on localhost   *
     * via port 6379                                                            *
     *                                                                          *
     ***************************************************************************/

    // adapter: 'redis',
    // host: '127.0.0.1',
    // port: 6379,
    // db: 'sails',
    // pass: '<redis auth password>'


    /***************************************************************************
     *                                                                          *
     * `authorization`                                                          *
     *                                                                          *
     * Global authorization for Socket.IO access, this is called when the       *
     * initial handshake is performed with the server.                          *
     *                                                                          *
     * By default (`authorization: false`), when a socket tries to connect,     *
     * Sails allows it, every time. If no valid cookie was sent, a temporary    *
     * session will be created for the connecting socket.                       *
     *                                                                          *
     * If `authorization: true`, before allowing a connection, Sails verifies   *
     * that a valid cookie was sent with the upgrade request. If the cookie     *
     * doesn't match any known user session, a new user session is created for  *
     * it. (In most cases, the user would already have a cookie since they      *
     * loaded the socket.io client and the initial HTML page.)                  *
     *                                                                          *
     * However, in the case of cross-domain requests, it is possible to receive *
     * a connection upgrade request WITHOUT A COOKIE (for certain transports)   *
     * In this case, there is no way to keep track of the requesting user       *
     * between requests, since there is no identifying information to link      *
     * him/her with a session. The sails.io.js client solves this by connecting *
     * to a CORS endpoint first to get a 3rd party cookie (fortunately this     *
     * works, even in Safari), then opening the connection.                     *
     *                                                                          *
     * You can also pass along a ?cookie query parameter to the upgrade url,    *
     * which Sails will use in the absense of a proper cookie e.g. (when        *
     * connection from the client):                                             *
     * io.connect('http://localhost:1337?cookie=smokeybear')                    *
     *                                                                          *
     * (Un)fortunately, the user's cookie is (should!) not accessible in        *
     * client-side js. Using HTTP-only cookies is crucial for your app's        *
     * security. Primarily because of this situation, as well as a handful of   *
     * other advanced use cases, Sails allows you to override the authorization *
     * behavior with your own custom logic by specifying a function, e.g:       *
     *                                                                          *
     *    authorization: function authSocketConnectionAttempt(reqObj, cb) {     *
     *                                                                          *
     *        // Any data saved in `handshake` is available in subsequent       *
     *        requests from this as `req.socket.handshake.*`                    *
     *                                                                          *
     *        // to allow the connection, call `cb(null, true)`                 *
     *        // to prevent the connection, call `cb(null, false)`              *
     *        // to report an error, call `cb(err)`                             *
     *     }                                                                    *
     *                                                                          *
     ***************************************************************************/

    // authorization: false,

    /***************************************************************************
     *                                                                          *
     * Whether to run code which supports legacy usage for connected sockets    *
     * running the v0.9 version of the socket client SDK (i.e. sails.io.js).    *
     * Disabled in newly generated projects, but enabled as an implicit default *
     * (i.e. legacy usage/v0.9 clients be supported if this property is set to  *
     * true, but also if it is removed from this configuration file or set to   *
     * `undefined`)                                                             *
     *                                                                          *
     ***************************************************************************/

    // 'backwardsCompatibilityFor0.9SocketClients': false,

    /***************************************************************************
     *                                                                          *
     * Whether to expose a 'get /__getcookie' route with CORS support that sets *
     * a cookie (this is used by the sails.io.js socket client to get access to *
     * a 3rd party cookie and to enable sessions).                              *
     *                                                                          *
     * Warning: Currently in this scenario, CORS settings apply to interpreted  *
     * requests sent via a socket.io connection that used this cookie to        *
     * connect, even for non-browser clients! (e.g. iOS apps, toasters, node.js *
     * unit tests)                                                              *
     *                                                                          *
     ***************************************************************************/

    // grant3rdPartyCookie: true,

    /***************************************************************************
     *                                                                          *
     * Match string representing the origins that are allowed to connect to the *
     * Socket.IO server                                                         *
     *                                                                          *
     ***************************************************************************/

    // origins: '*:*',

};
