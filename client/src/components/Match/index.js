import "../../match.scss";

import React, { useEffect, useMemo } from "react";
import { useAPI, useData, useTimeout, useTitle } from "../../hooks/";
import { Loader } from "../UI/";
import { isEmpty } from "./utils";
import MatchGame from "./MatchGame";

const Match = props => {
  // destructure props, e.g., id from router
  const { match: { params: { id: matchId = null } = {} } = {} } = props;

  // direct API interactions (ephemeral)
  const { POST: firePing } = useAPI({ url: "/api/ping" });

  // API data
  const { data: game, error, initialized } = useData({
    url: "/api/match/" + matchId,
    deps: [matchId]
  });

  // timer to show loader
  const [inDelay, setDelay] = useTimeout(2000);

  // side effect that initiates delay (on mount only)
  useEffect(() => {
    setDelay(true);
  }, [setDelay]);

  // memoized calculation; determines if game not found
  const notFound = useMemo(() => {
    return initialized && isEmpty(game);
  }, [game, initialized]);

  // When to show loader
  const showLoader = !game || inDelay || !initialized;

  // set page title
  useTitle({
    title: showLoader ? "Loading..." : notFound ? "Game Not Found" : game.title,
    deps: [game, notFound, showLoader]
  });

  return (
    <div className="full-page purple">
      {(showLoader && <Loader content="LOADING..." />) ||
        (notFound && <NotFound id={matchId} />) || (
          <MatchGame
            game={game}
            onPing={results =>
              firePing({ gameId: matchId, gameType: "M", results })
            }
          />
        )}
    </div>
  );
};

export default Match;

const NotFound = ({ matchId = null }) => {
  return (
    <div>
      <h3>Match Game {matchId}- Not Found</h3>
      <pre>Details go here...</pre>
    </div>
  );
};
