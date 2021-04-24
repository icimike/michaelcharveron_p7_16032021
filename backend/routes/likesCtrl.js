// Activation du mode STRICT JS
"use strict";

// Imports
let models = require('../models')
let jwtUtils = require('../utils/jwt.utils');
let asyncLib = require('async');

// Routes
module.exports = {
    likePost: function(req, res, next){
        let headerAuth = req.headers['authorization'];

        let userId = jwtUtils.getUserId(headerAuth);

        //Params
        let messageId = parseInt(req.params.messageId);

        if(messageId <= 0){
            return res.status(400).json({'error':'invalid parameters'});
        }

        asyncLib.waterfall([
            function(done){
                models.Message.findOne({
                    where: {id:messageId}
                })
                .then(function(messageFound){
                    done(null, messageFound);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to verify message'});
                });
            },
            function(messageFound, done){
                if(messageFound){
                    models.User.findOne({
                        where: {id: userId}
                    })
                    .then(function(userFound){
                        done(null, messageFound, userFound);
                    })
                    .catch(function(err){
                        return res.status(500).json({'error':'unable to verify user'});
                    });
                } else {
                    res.status(404).json({'error':'post already liked'});
                }
            },
            function(messageFound, userFound, done){
                if(userFound){
                    models.Like.findOne({
                        where: {
                            userId: userId,
                            messageId: messageId
                        }
                    })
                    .then(function(isUserAlreadyLiked){
                        done(null,messageFound, userFound, isUserAlreadyLiked);
                    })
                    .catch(function(err){
                        return res.status(500).json({'error':'unable to verify is user already liked'});
                    });

                } else {
                    res.status(404).json({'error':'user not exist'});
                }
            },
            function(messageFound, userFound, isUserAlreadyLiked, done) {
                console.log("Inf:" + isUserAlreadyLiked);
                    if(!isUserAlreadyLiked){
                        models.Like.create({
                            messageId : messageId,
                            userId : userId,
                            isLike : 1
                        })
                        .then(function(alreadyLikeFound) {
                            done(null,messageFound, userFound);
                        })
                        .catch(function(err){
                            return res.status(500).json({'error':'unable to set user reaction'});
                        });
                    } else {
                        res.status(409).json({'error':'message already liked'});
                    }
            },
            function (messageFound, userFound, done) {
                messageFound.update({
                    likes: messageFound.likes + 1,
                })
                .then(function(){
                    done(messageFound);
                })
                .catch(function(err) {
                    console.log(err);
                    res.status(500).json({'error':'cannot message like counter' + err});
                });
            }
        ], function(messageFound){
            if(messageFound){
                return res.status(201).json(messageFound);
            } else {
                return res.status(500).json({'error':'cannot update message'});
            }
        });
    },

    dislikePost: function(req, res, next){
        let headerAuth = req.headers['authorization'];

        let userId = jwtUtils.getUserId(headerAuth);

        //Params
        let messageId = parseInt(req.params.messageId);

        if(messageId <= 0){
            return res.status(400).json({'error':'invalid parameters'});
        }

        asyncLib.waterfall([
            function(done){
                models.Message.findOne({
                    where: {id:messageId}
                })
                .then(function(messageFound){
                    done(null, messageFound);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to verify message'});
                });
            },
            function(messageFound, done){
                if(messageFound){
                    models.User.findOne({
                        where: {id: userId}
                    })
                    .then(function(userFound){
                        done(null, messageFound, userFound);
                    })
                    .catch(function(err){
                        return res.status(500).json({'error':'unable to verify user'});
                    });
                } else {
                    res.status(404).json({'error':'post already disliked'});
                }
            },
            function(messageFound, userFound, done){
                if(userFound){
                    models.Like.findOne({
                        where: {
                            userId: userId,
                            messageId: messageId
                        }
                    })
                    .then(function(isUserAlreadyLiked){
                        done(null,messageFound, userFound, isUserAlreadyLiked);
                    })
                    .catch(function(err){
                        return res.status(500).json({'error':'unable to verify is user already disliked'});
                    });

                } else {
                    res.status(404).json({'error':'user not exist'});
                }
            },
            function(messageFound, userFound, isUserAlreadyLiked, done) {
                    if(isUserAlreadyLiked){
                        isUserAlreadyLiked.destroy()
                        .then(function() {
                            done(null,messageFound, userFound);
                        })
                        .catch(function(err){
                            return res.status(500).json({'error':'cannot remove already disliked post'});
                        });
                    } else {
                        res.status(409).json({'error':'message already disliked'});
                    }
            },
            function (messageFound, userFound, done) {
                messageFound.update({
                    likes: messageFound.likes - 1,
                })
                .then(function(){
                    done(messageFound);
                })
                .catch(function(err) {
                    res.status(500).json({'error':'cannot mesage dislike counter'});
                });
            }
        ], function(messageFound){
            if(messageFound){
                return res.status(201).json(messageFound);
            } else {
                return res.status(500).json({'error':'cannot update message'});
            }
        });        
    }
}