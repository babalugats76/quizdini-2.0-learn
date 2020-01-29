const mongoose = require('mongoose');
const Match = mongoose.model('matches');

module.exports = (app, memcache) => {
  app.get('/api/match/:id', async (req, res, next) => {
    try {
      // throw new Error('Testing match error...');
      const cacheKey = `match-${req.params.id}`;
      const cached = await memcache.get(cacheKey);
      if (cached) return res.send(cached);
      let match = await Match.findOne({
        matchId: req.params.id
      }).populate('user_id', 'title firstName lastName author', 'users');
      if (!match) return res.send({}); // empty object signifies not found
      match = match.toJSON(); // convert to POJO
      match.author = match.user_id.author; // map author
      delete match.user_id; // remove populated user object
      memcache.set(cacheKey, match);
      res.send(match);
    } catch (e) {
      next(e);
    }
  });
};
