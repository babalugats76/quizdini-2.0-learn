const mongoose = require("mongoose");
const Match = mongoose.model("matches");

module.exports = (app, memcache) => {
  app.get("/api/match/:id", async (req, res, next) => {
    try {
      // throw new Error('Testing match error...');

      // Lookup game in cache; if found, return...
      const gameKey = `m-${req.params.id}`;
      const cached = await memcache.get(gameKey);
      if (cached) return res.send(cached);

      // Otherwise, fetch data from database
      let match = await Match.findOne({
        matchId: req.params.id
      }).populate("user_id", "title firstName lastName author", "users");
      if (!match) return res.send({}); // empty object signifies not found
      match = match.toJSON(); // convert to POJO
      match.author = match.user_id.author; // map author
      delete match.user_id; // remove populated user object

      // Write game data to cache
      memcache.set(gameKey, match);

      res.send(match);
    } catch (e) {
      next(e);
    }
  });
};
