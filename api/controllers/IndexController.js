/**
 * IndexController
 *
 * @description :: Server-side logic for managing indices
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var gm = require('gm');
var util = require('util');

module.exports = {
    /**
     * `IndexController.rotate()`
     */
    rotate: function (req, res) {

        var io = sails.io;
        var resizeX = 343;
        var resizeY = 257;


//        sqs = new AWS.SQS().client;

        gm('assets/images/gtv.jpg')
                .colorize(200, 200, 256)
                .resize(resizeX, resizeY)
                .autoOrient()
                .write('assets/images/gtv_new.jpg', function (err) {
                    if (!err) {
                        console.log('done');

                    }
                });


       return res.json({
//            todo: 'rotate() is not implemented yet!'
       });
    }
};

