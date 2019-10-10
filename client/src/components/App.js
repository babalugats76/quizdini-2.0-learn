import React from "react";
import { Switch, Route } from "react-router-dom";

import Landing from "./Landing";
import Match from "./Match/";
import NotFound from "./NotFound/";

/* Game-specific routes will set their titles once info has been fetched */
const App = props => {
  return (
    <Switch>
      <Route exact path="/match/:id" component={Match} />
      <Route exact path="/404" component={NotFound} />
      <Route path="/" component={Landing} />
    </Switch>
  );
};

export default App;
