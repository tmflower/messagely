const express = require("express");
const router = new express.Router();
const Message = require("../models/message");
const {ensureLoggedIn } = require("../middleware/auth");
const ExpressError = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);
        const userFrom = message.from_user.username;        
        const userTo = message.to_user.username;
        if (req.user.username === userFrom || req.user.username === userTo) {
            return res.json({message: message});
        }
        throw new ExpressError("Not authorized to view message details.", 401);
    }
    catch(err) {
        return next(err);
    }
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async (req, res, next) => {
    try {
        let message = await Message.create({
            from_username: req.user.username, 
            to_username: req.body.to_username, 
            body: req.body.body});
        return res.json({message: {id: message.id, 
            from_username: message.from_username, 
            to_username: message.to_username, 
            body: message.body, 
            sent_at: message.sent_at}});
    }
    catch(err) {
        return next(err);
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);
        if (req.user.username === message.to_user.username) {
            await Message.markRead(req.params.id);
            return res.json({message: {id: req.params.id, read_at: message.read_at}})
        }
        throw new ExpressError("Not authorized to mark this message as read.")
    }
    catch(err) {
        return next(err);
    }
});

module.exports = router;
 