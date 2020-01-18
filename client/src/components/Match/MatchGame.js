import React, { useCallback, useEffect, useReducer, useRef } from "react";
import PropTypes from "prop-types";
import shortid from "shortid";
import { shuffleArray } from "./utils";

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
      options: { colorScheme = "rainbow", duration = 90, itemsPerBoard = 9 } = {}
    } = {}
  } = props;

  /**
   * Augments match objects with additional info (needed by game).
   *
   * @param {Array} matches   match objects to augment
   * @return {Array}          augmented match objects
   */
  const transformData = matches => {
    return matches.map(match => {
      return { ...match, id: shortid.generate() };
    });
  };

  /**
   * Augments match objects with additional info (needed by game).
   *
   * @param {Array} matches        match objects to assign color
   * @param {string} colorScheme   game color scheme, i.e., 'rainbow'
   * @return {Array}               augmented match objects
   */
  const addColor = (matches, colorScheme) => {
    let colors = [
      "red",
      "orange",
      "yellow",
      "lime",
      "green",
      "cyan",
      "blue",
      "purple",
      "magenta",
      "navy",
      "gray",
      "teal"
    ];

    switch (colorScheme.toLowerCase()) {
      case "rainbow":
        return matches.map(match => {
          let rand = Math.floor(Math.random() * colors.length);
          let color = colors[rand];
          colors.splice(rand, 1);
          return {
            ...match,
            color
          };
        });
      default:
        return matches.map(match => {
          return {
            ...match,
            color: "" // empty string for color represents default
          };
        });
    }
  };

  /***
   * Game reducer to maintain state.
   *
   * Extra { } are added to each case to enable block-scope for variables, e.g., terms
   * Refer to: `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch`
   */
  const [state, setState] = useReducer((state, action) => {
    switch (action.type) {
      case "LOAD_MATCH_BANK": {
        const matchBank = transformData(action.matches);
        return { ...state, matchBank, termCount: matchBank.length };
      }
      case "DEAL_MATCHES": {
        const shuffled = shuffleArray(state.matchBank); // Shuffle all available matches
        const sliced = shuffled.slice(0, Math.min(itemsPerBoard, shuffled.length)); // Grab subset (based on itemsPerBoard)
        let terms = sliced.map(match => {
          return { ...match, show: false, matched: false };
        }); // Add additional properties
        let definitions = [...terms]; // Clone definitions (from terms)
        terms = addColor(terms, colorScheme); // Add colors (terms only)
        terms = shuffleArray(terms); // Shuffle terms
        definitions = shuffleArray(definitions); // Shuffle definitions
        return { ...state, terms, definitions, unmatched: definitions.length };
      }
      case "START_GAME": {
        return {
          ...state,
          correct: 0,
          incorrect: 0,
          score: 0,
          showSplash: false
        };
      }
      case "SHOW_BOARD": {
        return {
          ...state,
          showBoard: action.show
        };
      }
      case "SHOW_MATCHES": {
        const terms = state.terms.map(term => {
          term.show = action.show;
          return term;
        }); // update visibility
        const definitions = state.definitions.map(def => {
          def.show = action.show;
          return def;
        }); // update visibility
        return { ...state, definitions, terms };
      }
      default: {
        return state;
      }
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
  useEffect(() => dispatch({ type: "LOAD_MATCH_BANK", matches }), [dispatch, matches]);

  useEffect(() => {
    console.log(JSON.stringify(state, null, 3));
  }, [state]);

  const handleDealMatches = event => {
    event.preventDefault();
    dispatch({ type: "DEAL_MATCHES" });
  };

  const handleShowMatches = (event, show) => {
    dispatch({ type: "SHOW_MATCHES", show });
  };

  const handleShowBoard = (event, show) => {
    dispatch({ type: "SHOW_BOARD", show });
  };

  return (
    <div>
      <h3>{title}</h3>
      <button onClick={event => handleDealMatches(event)}>Deal Matches</button>
      <button onClick={event => handleShowMatches(event, true)}>Show Matches</button>
      <button onClick={event => handleShowMatches(event, false)}>Hide Matches</button>
      <button onClick={event => handleShowBoard(event, true)}>Show Board</button>
      <button onClick={event => handleShowBoard(event, false)}>Hide Board</button>
      <pre>{JSON.stringify(state.terms, null, 3)}</pre>
    </div>
  );
};

MatchGame.propTypes = {
  game: PropTypes.object.isRequired,
  onPing: PropTypes.func.isRequired
};

export default MatchGame;
