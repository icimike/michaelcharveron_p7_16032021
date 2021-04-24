// Activation du mode STRICT JS
"use strict";

// Imports
let models = require('../models');
let asyncLib = require('async');
let jwtUtils = require('../utils/jwt.utils');
let fs = require('fs');
let url = require('url');

// Constants
const TITLE_LIMIT = 2;
const CONTENT_LIMIT = 4;


module.exports = {
    createMessage: function(req, res, next){
        let headerAuth = req.headers['authorization'];

        let userId = jwtUtils.getUserId(headerAuth);

        let title = req.body.title;
        let content = req.body.content;
        let image = req.body.image;
        let attachment = req.body.attachment;
        // let attachment = JSON.parse(req.body.attachment);
        let mediaUrl = "";
        
        if(attachment){
            mediaUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        }

        if (title == null || content == null){
            return res.status(400).json({'error':'invalid parameters'})
        }

        if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT){
            return res.status(400).json({'error':'invalid parameters'})
        }

        asyncLib.waterfall([
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    done(null, userFound);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },
            function(userFound, done){
                if(userFound){
                    models.Message.create({
                        title : title,
                        content : content,
                        attachment : mediaUrl,
                        likes : 0,
                        UserId : userFound.id
                    })
                    .then(function(newMessage){
                        done(newMessage);
                    })
                    .catch(function(err){
                        return res.status(500).json({'error':'unable to create message in DB'});
                    });
                } else {
                    res.status(404).json({'error':'user not found'});
                }
            },
        ],
        function(newMessage){
            if(newMessage){
                return res.status(201).json(newMessage);
            } else {
                return res.status(500).json({'error':'cannot post message'});
            }
        });
    },

    Preview:function(req,res,next){
        let headerAuth = req.headers['authorization'];

        let userId = jwtUtils.getUserId(headerAuth);

        let image = req.body.image;
        let mediaUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;

        asyncLib.waterfall([
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(){
                    mediaUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
                    done(mediaUrl);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },
        ],
        function(mediaUrl){
            if(mediaUrl){
                console.log(mediaUrl);
                return res.status(201).json(mediaUrl);
            } else {
                return res.status(500).json({'error':'fail to upload Preview'});
            }
        });
    },

    DeletePreview:function(req,res,next){
        let headerAuth = req.headers['authorization'];

        let userId = jwtUtils.getUserId(headerAuth);

        const queryObject = url.parse(req.url,true).query;
        let image = queryObject.image;

        asyncLib.waterfall([
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(){
                    let filename = image.split('/images/')[1];
                    fs.unlinkSync(`images/${filename}`);
                    done(filename);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },
        ],
        function(filename){
            if(filename){
                console.log(filename);
                return res.status(201).json(filename);
            } else {
                return res.status(500).json({'error':'fail to delete Preview'});
            }
        });
    },

    moderateMessage: function(req, res, next){
        let headerAuth = req.headers['authorization'];

        let userId = jwtUtils.getUserId(headerAuth);

        let messageId = parseInt(req.params.messageId);
        let title = req.body.title;
        let content = req.body.content;
        let attachment = req.body.attachment;
        let deleted = JSON.parse(req.body.deleted);
        let mediaUrl = "";

        if(deleted){
            console.log('data: ' + attachment);
            let filename = attachment.split('/images/')[1];
                if(filename !=null){
                    fs.unlinkSync(`images/${filename}`);
                    console.log('deleted File!');
                }
            mediaUrl = "";
        }
        else {
            mediaUrl = attachment;
        }
    
        asyncLib.waterfall([
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    done(null,userFound);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },

            function(userFound, done){
                models.User.findOne({
                    attributes : ['isAdmin'],
                    where : {isAdmin: userFound.isAdmin}
                })
                .then(function(userFound){
                    if(userFound.isAdmin == true){
                    done(null, userFound);
                    } else {
                        return res.status(403).json({'error':'you do not have sufficient privileges'});
                    }
                })
                .catch(function(err){
                    return res.status(500).json({err});
                });
            },

            function(userFound, done){

                models.Message.findOne({
                    attributes: ['id', 'title', 'content'],
                    where : {id: messageId}
                })
                .then(function(messageId){

                    messageId.update({
                        title : (title? title : userFound.title),
                        content : (content? content : userFound.content),
                        attachment : (mediaUrl? mediaUrl : mediaUrl)
                    })
                    .then(function(moderateMessage){
                        done(moderateMessage.id);
                    })
                    .catch(function(err){
                        console.log(messageId);
                        return res.status(500).json({'error':'unable to modify message in DB'});
                    });
                })
                .catch(function(err){
                    return res.status(404).json({'error':'message not found'});
                });

            },

        ], function(moderateMessage){
            if(moderateMessage){
                return res.status(201).json({'message':'moderate message number ' + moderateMessage});
            } else {
                return res.status(500).json({'error':'cannot put message'});
            }
        });
    },

    listMessage: function(req, res, next){
        let fields = req.query.fields;
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);
        let order = req.query.order;

        models.Message.findAll({
            order: [(order != null) ? order.split(':'):['title','ASC']],
            attributes : (fields !== '*' && fields != null) ? fields.split(',') :null,
            limit: (!isNaN(limit)) ? limit : null,
            offset: (!isNaN(offset)) ? offset : null,

            include: [{
                model: models.User,
                attributes: ['username']
            }]
        })
        .then(function(messages){
            if(messages){
                res.status(200).json(messages);
            } else {
                res.status(404).json({'error':'no messages found'});
            }
        })
        .catch(function(err){
            console.log(err);
            res.status(500).json({'error':'invalid fields'});
        });
    },

    deleteMessage: function(req, res, next){
        let headerAuth = req.headers['authorization'];

        let userId = jwtUtils.getUserId(headerAuth);

        let messageId = parseInt(req.params.messageId);

        asyncLib.waterfall([
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    done(null, userFound);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },

            function(userFound, done){
                models.User.findOne({
                    attributes : ['isAdmin'],
                    where : {isAdmin: userFound.isAdmin}
                })
                .then(function(userFound){
                    if(userFound.isAdmin == true){
                    done(null);
                    } else {
                        return res.status(403).json({'error':'you do not have sufficient privileges'});
                    }
                })
                .catch(function(err){
                    return res.status(500).json({err});
                });
            },

            function(done){
                models.Message.findOne({
                    where : {id : messageId}
                })
                .then(function(message){
                    let filename = message.attachment.split('/images/')[1];
                    if(filename !=null){
                        fs.unlinkSync(`images/${filename}`);
                    }
                    done(null, message);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to delete file! - ' + err});
                })
            },

            function(messageId, done){
                if(messageId){
                    models.Like.destroy({
                        where: {messageId : messageId.id}
                    })
                    .then(function(){
                        done(null, messageId);
                    })
                    .catch(function(err){
                        return res.status(500).json({'error':'unable to remove Likes in DB' + err});
                    })
                } else {
                    done(null);
                }
            },

            function(messageId, done){
                if(messageId){
                    models.Comment.destroy({
                        where: {messageId : messageId.id}
                    })
                    .then(function(){
                        done(null, messageId);
                    })
                    .catch(function(err){
                        return res.status(500).json({'error':'unable to remove Likes in DB' + err});
                    })
                } else {
                    done(null);
                }
            },

            function(messageId, done){
                if(messageId){
                    models.Message.destroy({
                        where : {id: messageId.id}
                    })
                    .then(function(deleteMessage){
                        done(deleteMessage);
                    })
                    .catch(function(err){
                        res.status(500).json({'error':'unable to delete message in DB'});
                    });
                } else {
                    res.status(404).json({'error':'message not found'});
                }
            },

        ], function(deleteMessage){
            if(deleteMessage){
                return res.status(201).json({'message':'message deleted successfully'});
            } else {
                return res.status(500).json({'error':'message not found'});
            }
        });
    },

    putMyMessage: function(req, res, next){
        let headerAuth = req.headers['authorization'];

        let userId = jwtUtils.getUserId(headerAuth);

        let messageId = parseInt(req.params.messageId);
        let title = req.body.title;
        let content = req.body.content;
        let attachment = req.body.attachment;
        let deleted = JSON.parse(req.body.deleted);
        let mediaUrl = "";

        if(deleted){
            console.log('data: ' + attachment);
            let filename = attachment.split('/images/')[1];
                if(filename !=null){
                    fs.unlinkSync(`images/${filename}`);
                    console.log('deleted File!');
                }
            mediaUrl = "";
        }
        else {
            mediaUrl = attachment;
        }

        if (title == null || content == null){
            return res.status(400).json({'error':'invalid parameters'})
        }

        if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT){
            return res.status(400).json({'error':'invalid parameters'})
        }

        asyncLib.waterfall([
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    done(null, userFound);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },

            function(userFound, done){
                models.Message.findOne({
                    where: {id : messageId}
                })
                .then(function(messageFound){
                    if(messageFound.UserId == userFound.id){
                        done(null, messageFound.id);
                    } else {
                        return res.status(403).json({'error':'this is not your message.'});
                    }
                })
                .catch(function(err){
                    return res.status(500).json({'error':'faillure - ' + err});
                });
            },

            function(userFound, done){

                models.Message.findOne({
                    attributes: ['id', 'title', 'content', 'attachment'],
                    where : {id: messageId}
                })
                .then(function(messageId){

                    messageId.update({
                        title : (title? title : userFound.title),
                        content : (content? content : userFound.content),
                        attachment : (mediaUrl? mediaUrl : mediaUrl)
                    })
                    .then(function(putMessage){
                        done(putMessage.id);
                    })
                    .catch(function(err){
                        console.log(messageId);
                        return res.status(500).json({'error':'unable to modify message in DB'});
                    });
                })
                .catch(function(err){
                    return res.status(404).json({'error':'message not found'});
                });
            },
        ],
        function(putMessage){
            if(putMessage){
                return res.status(201).json({'message':'modified message number : ' + putMessage});
            } else {
                return res.status(500).json({'error':'cannot put message'});
            }
        });
    },

    deleteMyMessage: function(req, res, next){
        let headerAuth = req.headers['authorization'];

        let userId = jwtUtils.getUserId(headerAuth);

        let messageId = parseInt(req.params.messageId);

        asyncLib.waterfall([
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    done(null, userFound);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },

            function(userFound, done){
                models.Message.findOne({
                    where: {id : messageId}
                })
                .then(function(message){
                    if(message.UserId == userId){
                        done(null, message.id);
                    } else {
                        return res.status(403).json({'error':'this is not your message.'});
                    }
                })
                .catch(function(err){
                    return res.status(500).json({'error':'faillure - ' + err});
                });
            },

            function(userFound, done){
                models.Message.findOne({
                    where : {userId}
                })
                .then(function(message){
                    let filename = message.attachment.split('/images/')[1];
                    if(filename !=null){
                        fs.unlinkSync(`images/${filename}`);
                    }
                    done(null, message);
                })
                .catch(function(err){
                    return res.status(500).json({'error':'unable to delete file! - ' + err});
                })
            },

            function(messageId, done){
                if(messageId){
                    models.Like.destroy({
                        where: {messageId : messageId.id}
                    })
                    .then(function(){
                        done(null, messageId);
                    })
                    .catch(function(err){
                        return res.status(500).json({'error':'unable to remove Likes in DB' + err});
                    })
                } else {
                    done(null);
                }
            },

            function(messageId, done){
                if(messageId){
                    models.Comment.destroy({
                        where: {messageId : messageId.id}
                    })
                    .then(function(){
                        done(null, messageId);
                    })
                    .catch(function(err){
                        return res.status(500).json({'error':'unable to remove Likes in DB' + err});
                    })
                } else {
                    done(null);
                }
            },

            function(messageId, done){
                models.Message.destroy({
                    where : {
                        id : messageId.id,
                        userId
                    }
                })
                .then(function(deleteMessage){
                    done(deleteMessage);
                })
                .catch(function(err){
                    res.status(500).json({'error':'unable to delete message in DB' +err});
                });
            },

        ], function(deleteMessage){
            if(deleteMessage){
                return res.status(201).json({'message':'message deleted successfully'});
            } else {
                return res.status(500).json({'error':'message not found'});
            }
        });
    }
}