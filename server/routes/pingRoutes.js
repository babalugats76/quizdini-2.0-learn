const mongoose = require('mongoose');
const Ping = mongoose.model('pings');

module.exports = app => {
  app.post('/api/ping', async (req, res, next) => {
    const { gameId, gameType, results } = req.body;
    const ipAddress = req.ip;
    try {
      const ping = await new Ping({
        ipAddress: ipAddress.replace('::ffff:', ''),
        gameId,
        gameType,
        results,
        createDate: Date.now()
      }).save();
      res.send(ping);
    } catch (e) {
      next(e);
    }
  });
};
