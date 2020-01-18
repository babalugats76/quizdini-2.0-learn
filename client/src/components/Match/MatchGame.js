import React, { useCallback, useEffect, useReducer, useRef } from "react";
import PropTypes from "prop-types";
import shortid from "shortid";

const initialState = {
  correct: 0, // correct matches
  definitions: [], // Definitions (on game board)
  incorrect: 0, // incorrect matches
  matchBank: [], // Matches defined by teacher (plus additional fields)
  playing: false, // Whether game is currently being played
  score: 0, // Points earned thus far
  showBoard: false, // Show/hide toggle of game board
  showResults: false, // Show/hide toggle of results
  showSplash: true, // Show/hide toggle of modal splash screen
  termCount: 0, // Total # terms in "bank" of matches
  terms: [], // Terms (on game board)
  unmatched: 0 // # terms still to match (on current game board)
};

/**
 * Match Game component.
 *
 * To debug:
 * ```
 *  useEffect(() => {
 *     console.log(JSON.stringify(state, null, 3));
 *  }, [state]);
 * ```
 */

const MatchGame = props => {
  const isCancelled = useRef(false); // for tracking dismounting
  // destructure props
  const {
    game: {
      author,
      id,
      instructions,
      matches,
      title,
      options: {
        colorScheme = "rainbow",
        duration = 90,
        itemsPerBoard = 9
      } = {}
    } = {}
  } = props;

  const [state, setState] = useReducer((state, action) => {
    switch (action.type) {
      case "LOAD_MATCH_BANK":
        return {
          ...state,
          matchBank: action.matchBank,
          termCount: action.matchBank.length
        };
      default:
        return state;
    }
  }, initialState);

  /***
   * Wraps `setState` to avoid no-ops.
   *
   * Attempts to `setState` on dismounted components will be short-circuited.
   * Relies upon `isCancelled` ref and side effect that maintains its value.
   *
   * @param {object} args  arguments to pass to `setState`
   */
  const dispatch = useCallback(
    (...args) => {
      !isCancelled.current && setState(...args);
    },
    [isCancelled, setState]
  );

  /***
   * Side effect transforms match data and updates state.
   * Runs once (on mount) and whenever dependencies change.
   */
  useEffect(() => {
    /**
     * Augments match object within additional info (needed by game).
     *
     * @param {Array} matches   match objects to augment
     * @return {Array}          augmented match objects
     */
    function transformData(matches) {
      return matches.map(match => {
        return { ...match, id: shortid.generate() };
      });
    }
    dispatch({ type: "LOAD_MATCH_BANK", matchBank: transformData(matches) });
  }, [dispatch, matches]);

  useEffect(() => {
    console.log(JSON.stringify(state, null, 3));
  }, [state]);

  return (
    <div>
      <h3>{title}</h3>
      <pre>{JSON.stringify(matches, null, 3)}</pre>
    </div>
  );
};

MatchGame.propTypes = {
  game: PropTypes.object.isRequired,
  onPing: PropTypes.func.isRequired
};

export default MatchGame;
