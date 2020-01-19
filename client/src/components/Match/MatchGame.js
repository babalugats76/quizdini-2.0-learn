import React, { useEffect, useReducer } from "react";
import PropTypes from "prop-types";
import shortid from "shortid";
import { addColor, shuffleArray } from "./utils";

function init({ colorScheme, onPing, itemsPerBoard, matches }) {
  const matchBank = matches.map(match => ({ ...match, id: shortid.generate() }));
  return {
    colorScheme, // color scheme (from props)
    correct: 0, // correct matches
    definitions: [], // Definitions (on game board)
    onPing, // function to call at end of game
    incorrect: 0, // incorrect matches
    itemsPerBoard, // items per board (from props)
    matchBank: matchBank, // Matches defined by teacher (plus additional fields)
    playing: false, // Whether game is currently being played
    score: 0, // Points earned thus far
    showBoard: false, // Show/hide game board
    showScore: false, // Show/hide score
    showSplash: true, // Show/hide splash screen
    termCount: matchBank.length, // Total # terms in "bank" of matches
    terms: [], // Terms (on game board)
    unmatched: 0 // # terms still to match (on current game board)
  };
}

/***
 * Game reducer to maintain state.
 *
 * Extra { } are added to each case to enable block-scope for variables, e.g., terms
 * Refer to: `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch`
 */
function matchReducer(state, action) {
  switch (action.type) {
    case "DEAL_MATCHES": {
      const { colorScheme, itemsPerBoard, matchBank } = state;
      const shuffled = shuffleArray(matchBank); // Shuffle all available matches
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
    case "GAME_OVER": {
      const { correct, incorrect, onPing, score } = state;
      onPing({ correct, incorrect, score });
      return { ...state, showScore: true, showSplash: true };
    }
    case "PLAYING": {
      return { ...state, playing: action.playing };
    }
    case "SHOW_BOARD": {
      return { ...state, showBoard: action.show };
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
    case "START_GAME": {
      return { ...state, correct: 0, incorrect: 0, score: 0, showBoard: false, showSplash: false };
    }
    default:
      return state;
  }
}

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
  // destructure props
  const {
    game: {
      author,
      id,
      instructions,
      matches,
      title,
      options: { colorScheme = "rainbow", duration = 90, itemsPerBoard = 9 } = {}
    } = {},
    onPing
  } = props;

  const [state, dispatch] = useReducer(
    matchReducer,
    { colorScheme, itemsPerBoard, matches, onPing },
    init
  );

  useEffect(() => {
    console.log(JSON.stringify(state, null, 3));
  }, [state]);

  return (
    <div>
      <h3>{title}</h3>
      <button onClick={() => dispatch({ type: "DEAL_MATCHES" })}>Deal Matches</button>
      <button onClick={() => dispatch({ type: "SHOW_MATCHES", show: true })}>Show Matches</button>
      <button onClick={() => dispatch({ type: "SHOW_MATCHES", show: false })}>Hide Matches</button>
      <button onClick={() => dispatch({ type: "SHOW_BOARD", show: true })}>Show Board</button>
      <button onClick={() => dispatch({ type: "SHOW_BOARD", show: false })}>Hide Board</button>
      <button
        onClick={() => {
          dispatch({ type: "DEAL_MATCHES" });
          dispatch({ type: "SHOW_BOARD", show: true });
        }}
      >
        Start Round
      </button>
      <button
        onClick={() => {
          dispatch({ type: "SHOW_BOARD", show: false });
          setTimeout(() => {
            console.log("transitioning board...");
            dispatch({ type: "SHOW_BOARD", show: true });
          }, 5000);
        }}
      >
        Next Round
      </button>
      <button onClick={() => dispatch({ type: "PLAYING", playing: true })}>Start Timer</button>
      <button onClick={() => dispatch({ type: "PLAYING", playing: false })}>End Timer</button>
      <button
        onClick={() => {
          dispatch({ type: "START_GAME" });
          setTimeout(() => {
            console.log("transitioning board...");
            dispatch({ type: "SHOW_BOARD", show: true });
          }, 5000);
        }}
      >
        Start Game
      </button>
      <button onClick={() => dispatch({ type: "GAME_OVER" })}>Game Over</button>
      <pre>{JSON.stringify(state.terms, null, 3)}</pre>
    </div>
  );
};

MatchGame.propTypes = {
  game: PropTypes.object.isRequired,
  onPing: PropTypes.func.isRequired
};

export default MatchGame;
