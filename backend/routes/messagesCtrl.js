// Activation du mode STRICT de Javascript
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
// Routes

module.exports = {
    createMessage: function(req, res, next){
        // Récupération de l'en-tête d'autorisation
        let headerAuth = req.headers['authorization'];

        // Vérifier que ce token est valide pour faire une requête en BDD
        let userId = jwtUtils.getUserId(headerAuth);

        // Params (récupération du title & du contenue) et de l'image si existante
        let title = req.body.title;
        let content = req.body.content;
        let image = req.body.image;
        let attachment = req.body.attachment;
        // let attachment = JSON.parse(req.body.attachment);
        let mediaUrl = "";
        
        if(attachment){
            // Renseigner le chemin du stockage de l'image
            mediaUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        }

        // Vérification de données non null & cohérente
        if (title == null || content == null){
            return res.status(400).json({'error':'invalid parameters'})
        }

        if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT){
            return res.status(400).json({'error':'invalid parameters'})
        }

        asyncLib.waterfall([
            // Récupérer l'utilisateur dans la base de données (correspondant au token)
            // Function (callback)
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    // Si l'utilisateur est trouvé, on continue (premier paramètre null)
                    done(null, userFound);
                })
                .catch(function(err){
                    // Sinon, on retourne une erreur
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
                        // Si tout s'est bien passé, le message est envoyé.
                        done(newMessage);
                    })
                    .catch(function(err){
                        // En cas d'erreur serveur, un message d'erreur est retourné.
                        return res.status(500).json({'error':'unable to create message in DB'});
                    });
                } else {
                    // En cas de problème, un message d'erreur est retourné.
                    res.status(404).json({'error':'user not found'});
                }
            },
        ],
        function(newMessage){
            if(newMessage){
                // post du message OK
                return res.status(201).json(newMessage);
            } else {
                // Le message n'est pas passé.
                return res.status(500).json({'error':'cannot post message'});
            }
        });
    },

    Preview:function(req,res,next){
        // Récupération de l'en-tête d'autorisation
        let headerAuth = req.headers['authorization'];

        // Vérifier que ce token est valide pour faire une requête en BDD
        let userId = jwtUtils.getUserId(headerAuth);

        // Params récupération de l'image
        let image = req.body.image;
        let mediaUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;

        asyncLib.waterfall([
            // Récupérer l'utilisateur dans la base de données (correspondant au token)
            // Function (callback)
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(){
                    // Si l'utilisateur est trouvé, on continue
                    mediaUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
                    done(mediaUrl);
                })
                .catch(function(err){
                    // Sinon, on retourne une erreur
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },
        ],
        function(mediaUrl){
            if(mediaUrl){
                console.log(mediaUrl);
                // post du message OK
                return res.status(201).json(mediaUrl);
            } else {
                // Le message n'est pas passé.
                return res.status(500).json({'error':'fail to upload Preview'});
            }
        });
    },

    DeletePreview:function(req,res,next){
        // Récupération de l'en-tête d'autorisation
        let headerAuth = req.headers['authorization'];

        // Vérifier que ce token est valide pour faire une requête en BDD
        let userId = jwtUtils.getUserId(headerAuth);

        // Params récupération de l'image
        const queryObject = url.parse(req.url,true).query;
        let image = queryObject.image;

        asyncLib.waterfall([
            // Récupérer l'utilisateur dans la base de données (correspondant au token)
            // Function (callback)
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(){
                    // Si l'utilisateur est trouvé, on continue (premier paramètre null)
                    let filename = image.split('/images/')[1];
                    fs.unlinkSync(`images/${filename}`);
                    done(filename);
                })
                .catch(function(err){
                    // Sinon, on retourne une erreur
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },
        ],
        function(filename){
            if(filename){
                console.log(filename);
                // post du message OK
                return res.status(201).json(filename);
            } else {
                // Le message n'est pas passé.
                return res.status(500).json({'error':'fail to delete Preview'});
            }
        });
    },

    moderateMessage: function(req, res, next){
        // Récupération de l'en-tête d'autorisation
        let headerAuth = req.headers['authorization'];

        // Vérifier que ce token est valide pour faire une requête en BDD
        let userId = jwtUtils.getUserId(headerAuth);

        // Params (recupération du title & du contenue) & de l'état Admin - et de l'image si existante
        let messageId = parseInt(req.params.messageId);
        let title = req.body.title;
        let content = req.body.content;
        let attachment = req.body.attachment;
        let deleted = JSON.parse(req.body.deleted);
        let mediaUrl = "";

        if(deleted){
            console.log('data: ' + attachment);
            // Supprimer l'immage
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
                // Récupérer l'utilisateur dans la base de données
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    // Si l'utilisateur est rouvé, le retourner
                    done(null,userFound);
                })
                .catch(function(err){
                    // Sinon envoyer une erreur
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },

            function(userFound, done){
                // Vérifier si l'utilisateur dispose des droits admin
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
                // Récupérer l'id du message concerné

                models.Message.findOne({
                    attributes: ['id', 'title', 'content'],
                    where : {id: messageId}
                })
                .then(function(messageId){
                    // Si le message est trouvé, procéder à la modification

                    messageId.update({
                        title : (title? title : userFound.title),
                        content : (content? content : userFound.content),
                        attachment : (mediaUrl? mediaUrl : mediaUrl)
                    })
                    .then(function(moderateMessage){
                        // Si tout s'est bien passé, le message est envoyé.
                        done(moderateMessage.id);
                    })
                    .catch(function(err){
                        console.log(messageId);
                        // En cas d'erreur serveur, un message d'erreur est retourné.
                        return res.status(500).json({'error':'unable to modify message in DB'});
                    });
                })
                .catch(function(err){
                    // En d'erreur serveur, un message d'erreur est retourné.
                    return res.status(404).json({'error':'message not found'});
                });

            },

        ], function(moderateMessage){
            if(moderateMessage){
                // put du message OK
                return res.status(201).json({'message':'moderate message number ' + moderateMessage});
            } else {
                // Le message n'est pas passé.
                return res.status(500).json({'error':'cannot put message'});
            }
        });
    },

    listMessage: function(req, res, next){
        // Récupération des paramètres dans l'Url
        // fields, permet de sélectionner les colonnes à afficher
        // limit & offset, permet de récupérer les messages par ségmentation (pour limiter la qté)
        // Order, sert à sortir les messages via un ordre particulier
        let fields = req.query.fields;
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);
        let order = req.query.order;

        // Récupération de tous les messages via findAll
        models.Message.findAll({
            // Vérification des entrées utilisateurs, si vide mettre des données par défaut.
            order: [(order != null) ? order.split(':'):['title','ASC']],
            attributes : (fields !== '*' && fields != null) ? fields.split(',') :null,
            limit: (!isNaN(limit)) ? limit : null,
            offset: (!isNaN(offset)) ? offset : null,

            // Inclusion de la table User
            include: [{
                model: models.User,
                attributes: ['username']
            }]
        })
        .then(function(messages){
            // Vérification non null
            if(messages){
                // retour des données en JSON
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
        // Récupération de l'en-tête d'autorisation
        let headerAuth = req.headers['authorization'];

        // Vérifier que ce token est valide pour faire une requête en BDD
        let userId = jwtUtils.getUserId(headerAuth);

        // Récupération des paramètres
        let messageId = parseInt(req.params.messageId);

        asyncLib.waterfall([
            // Récupérer l'utilisateur dans la base de données (correspondant au token)
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    // Si l'utilisateur est trouvé, on continue (premier paramètre null)
                    done(null, userFound);
                })
                .catch(function(err){
                    // Sinon, on retourne une erreur
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },

            function(userFound, done){
                // Vérifier si l'utilisateur dispose des droits admin
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
                // Suppression des images uploadées (si présentes)
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
                // S'il y a des likes liés aux messages, ils seront supprimés.
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
                // S'il y a des Commentaires liés aux messages, ils seront supprimés.
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
                // Récupérer l'id du message concerné
                if(messageId){
                    models.Message.destroy({
                        where : {id: messageId.id}
                    })
                    .then(function(deleteMessage){
                        // Si tout s'est bien passé, une information de réussite est envoyée.
                        done(deleteMessage);
                    })
                    .catch(function(err){
                        // En cas de problème, un message d'erreur est retourné.
                        res.status(500).json({'error':'unable to delete message in DB'});
                    });
                } else {
                    // En cas de problème, un message d'erreur est retourné.
                    res.status(404).json({'error':'message not found'});
                }
            },

        ], function(deleteMessage){
            if(deleteMessage){
                // delete du message OK
                return res.status(201).json({'message':'message deleted successfully'});
            } else {
                // Le message n'est pas présent.
                return res.status(500).json({'error':'message not found'});
            }
        });
    },

    putMyMessage: function(req, res, next){
        // Récupération de l'en-tête d'autorisation
        let headerAuth = req.headers['authorization'];

        // Vérifier que ce token est valide pour faire une requête en BDD
        let userId = jwtUtils.getUserId(headerAuth);

        // Params (recupération du title & du contenue) et de l'image si existante
        let messageId = parseInt(req.params.messageId);
        let title = req.body.title;
        let content = req.body.content;
        let attachment = req.body.attachment;
        let deleted = JSON.parse(req.body.deleted);
        let mediaUrl = "";

        if(deleted){
            console.log('data: ' + attachment);
            // Supprimer l'image
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

        // Vérification de données non null & cohérente
        if (title == null || content == null){
            return res.status(400).json({'error':'invalid parameters'})
        }

        if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT){
            return res.status(400).json({'error':'invalid parameters'})
        }

        asyncLib.waterfall([
            // Récupérer l'utilisateur dans la base de données (correspondant au token)
            // Function (callback)
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    // Si l'utilisateur est trouvé, on continue (premier paramètre null)
                    done(null, userFound);
                })
                .catch(function(err){
                    // Sinon, on retourne une erreur
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },

            function(userFound, done){
                // Récupération de l'ID du message
                models.Message.findOne({
                    where: {id : messageId}
                })
                .then(function(messageFound){
                    // Si trouvé, il est comparé a l'UserId
                    if(messageFound.UserId == userFound.id){
                        done(null, messageFound.id);
                    } else {
                        // Sinon, on retourne une erreur d'accès
                        return res.status(403).json({'error':'this is not your message.'});
                    }
                })
                .catch(function(err){
                    // Sinon, on retourne une erreur serveur
                    return res.status(500).json({'error':'faillure - ' + err});
                });
            },

            function(userFound, done){
                // Récupérer l'id du message concerné

                models.Message.findOne({
                    attributes: ['id', 'title', 'content', 'attachment'],
                    where : {id: messageId}
                })
                .then(function(messageId){
                    // Si le message est trouvé, procéder à la modification

                    messageId.update({
                        title : (title? title : userFound.title),
                        content : (content? content : userFound.content),
                        attachment : (mediaUrl? mediaUrl : mediaUrl)
                    })
                    .then(function(putMessage){
                        // Si tout s'est bien passé, le message est envoyé.
                        done(putMessage.id);
                    })
                    .catch(function(err){
                        console.log(messageId);
                        // En cas d'erreur serveur, un message d'erreur est retourné.
                        return res.status(500).json({'error':'unable to modify message in DB'});
                    });
                })
                .catch(function(err){
                    // En d'erreur serveur, un message d'erreur est retourné.
                    return res.status(404).json({'error':'message not found'});
                });
            },
        ],
        function(putMessage){
            if(putMessage){
                // post du message OK
                return res.status(201).json({'message':'modified message number : ' + putMessage});
            } else {
                // Le message n'est pas passé.
                return res.status(500).json({'error':'cannot put message'});
            }
        });
    },

    deleteMyMessage: function(req, res, next){
        // Récupération de l'en-tête d'autorisation
        let headerAuth = req.headers['authorization'];

        // Vérifier que ce token est valide pour faire une requête en BDD
        let userId = jwtUtils.getUserId(headerAuth);

        // Récupération des paramètres
        let messageId = parseInt(req.params.messageId);

        asyncLib.waterfall([
            // Récupérer l'utilisateur dans la base de données (correspondant au token)
            function(done){
                models.User.findOne({
                    where: {id: userId}
                })
                .then(function(userFound){
                    // Si l'utilisateur est trouvé, on continue (premier paramètre null)
                    done(null, userFound);
                })
                .catch(function(err){
                    // Sinon, on retourne une erreur
                    return res.status(500).json({'error':'unable to verify user'});
                });
            },

            function(userFound, done){
                // Récupération de l'ID du message
                models.Message.findOne({
                    where: {id : messageId}
                })
                .then(function(message){
                    // Si trouvé, il est comparé a l'UserId
                    if(message.UserId == userId){
                        done(null, message.id);
                    } else {
                        // Sinon, on retourne une erreur d'accès
                        return res.status(403).json({'error':'this is not your message.'});
                    }
                })
                .catch(function(err){
                    // Sinon, on retourne une erreur serveur
                    return res.status(500).json({'error':'faillure - ' + err});
                });
            },

            function(userFound, done){
                // Suppression des images uploadés (si presentes)
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
                // S'il y a des likes liée aux messages, ils seront supprimés.
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
                // S'il y a des Commentaires liée aux messages, ils seront supprimés.
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
                // Récupérer l'id du message concerné
                models.Message.destroy({
                    where : {
                        id : messageId.id,
                        userId
                    }
                })
                .then(function(deleteMessage){
                    // Si tout s'est bien passé, une information de réussite est envoyée.
                    done(deleteMessage);
                })
                .catch(function(err){
                    // En cas de problème, un message d'erreur est retourné.
                    res.status(500).json({'error':'unable to delete message in DB' +err});
                });
            },

        ], function(deleteMessage){
            if(deleteMessage){
                // delete du message OK
                return res.status(201).json({'message':'message deleted successfully'});
            } else {
                // Le message n'est pas présent.
                return res.status(500).json({'error':'message not found'});
            }
        });
    }
}