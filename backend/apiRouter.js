  
// Imports

// var express      = require('express');
// var usersCtrl    = require('./routes/usersCtrl');
// var messagesCtrl = require('./routes/messagesCtrl');
// var likesCtrl    = require('./routes/likesCtrl');

const express = require('express');
const usersCtrl = require('./routes/usersCtrl');
const messagesCtrl = require('./routes/messagesCtrl');
const likesCtrl = require('./routes//likesCtrl');
// const commentCtrl = require('../controllers/commentCtrl');
const multer = require('./middleware/multer-config');

//Création du routeur et Instanciation de celui-ci ()
exports.router = (function(){
  let apiRouter = express.Router();

  // Assignation des différentes routes
  /*
  Appeler la méthode route de apiRouter.suivi du verbe HTTP,
  Renseigner la route, Depuis le controller concerné, exectuer la fonction voulu [Ex. usersCtrl.register]
  */

  // Users routes
  apiRouter.post('/users/register/', usersCtrl.register);
  apiRouter.post('/users/login/', usersCtrl.login);
  apiRouter.get('/users/me/', usersCtrl.getUserProfile);
  apiRouter.put('/users/me/', usersCtrl.updateUserProfile);
  apiRouter.delete('/users/unsubscribe/', usersCtrl.deleteProfile);
  
  // Messages routes
  apiRouter.get('/messages/', messagesCtrl.listMessage);
  apiRouter.post('/messages/new/', multer, messagesCtrl.createMessage);
  apiRouter.post('/messages/new/preview/', multer, messagesCtrl.Preview);
  apiRouter.put('/messages/:messageId/', multer, messagesCtrl.putMyMessage);
  apiRouter.delete('/messages/:messageId/', multer, messagesCtrl.deleteMyMessage);
  apiRouter.delete('/messages/new/preview/', multer, messagesCtrl.DeletePreview);
  
  // Comments routes
  // apiRouter.get('/messages/comment/', commentCtrl.listComment);
  // apiRouter.post('/messages/comment/:messageId/new/', commentCtrl.createComment);
  // apiRouter.delete('/messages/comment/:messageId/:commentId/', commentCtrl.deleteMyComment);

  // Moderation routes
  apiRouter.put('/messages/:messageId/moderate/', multer, messagesCtrl.moderateMessage);
  apiRouter.delete('/messages/:messageId/moderate/', multer, messagesCtrl.deleteMessage);
  // apiRouter.delete('/messages/comment/:messageId/:commentId/moderate/', multer, commentCtrl.deleteComment);

  // Likes routes
  apiRouter.post('/messages/:messageId/vote/like', likesCtrl.likePost);
  apiRouter.post('/messages/:messageId/vote/dislike', likesCtrl.dislikePost);

  // Administration routes
  apiRouter.post('/users/', usersCtrl.getOneUserProfile);
  apiRouter.put('/users/add', usersCtrl.updateUserAddRights);
  apiRouter.put('/users/remove', usersCtrl.updateUserRemoveRights);

  // Enfin, on retourne l'objet
  return apiRouter;

})();