import React, { useEffect, useReducer, useRef } from "react";
import PropTypes from "prop-types";
import { DndProvider } from "react-dnd";
import MultiBackend, { TouchTransition } from "react-dnd-multi-backend";
import HTML5Backend from "react-dnd-html5-backend";
import TouchBackend from "react-dnd-touch-backend";
import shortid from "shortid";
import { addColor, shuffleArray } from "./utils";
import MatchDragLayer from './MatchDragLayer';
import MatchSplash from './MatchSplash';
import MatchBoard from './MatchBoard';
import Timer from './Timer';

const CustomHTML5toTouch = {
  backends: [
    {
      backend: HTML5Backend
    },
    {
      backend: TouchBackend,
      options: { enableMouseEvents: true }, // Note that you can call your backends with options
      preview: false,
      transition: TouchTransition
    }
  ]
};

function initMatch({ colorScheme, itemsPerBoard, matches }) {
  // const matchBank = matches.map(match => ({ ...match, id: shortid.generate() }));
  return {
    colorScheme, // color scheme (from props)
    correct: 0, // correct matches
    definitions: [], // Definitions (on game board)
    games: 0, // Number of games completed
    incorrect: 0, // incorrect matches
    itemsPerBoard, // items per board (from props)
    matches, // Matches defined by teacher (plus additional fields)
    playing: false, // Whether game is currently being played
    score: 0, // Points earned thus far
    results: [], // Results from game play, i.e., hit/miss, by term
    rounds: 0, // Number of rounds completed (boards cleared)
    showBoard: false, // Whether to show board
    showScore: false, // Whether to show score on Splash, i.e., at least one game played
    showSplash: true, // Whether to show splash screen
    termCount: matches.length, // Total # terms, i.e., matches
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
    case "DEAL": {
      const { colorScheme, itemsPerBoard, matches } = state; // prevState
      const shuffled = shuffleArray(matches); // Shuffle all available matches
      const sliced = shuffled.slice(0, Math.min(itemsPerBoard, shuffled.length)); // Grab subset (based on itemsPerBoard)
      let terms = sliced.map(match => {
        return { ...match, id: shortid.generate(), matched: false, show: true };
      }); // Add additional properties
      let definitions = [...terms]; // Clone definitions (from terms)
      terms = addColor(terms, colorScheme); // Add colors (terms only)
      terms = shuffleArray(terms); // Shuffle terms
      definitions = shuffleArray(definitions); // Shuffle definitions
      return { ...state, terms, definitions, unmatched: definitions.length };
    }
    case "DROP": {
      const { itemsPerBoard } = state; // prevState
      let correct, filtered, incorrect, results, rounds, score, unmatched; // local variables
      const { definitionId, matched, term, termId } = action.drop; // dropResult
      filtered = state.results.filter(res => res.term === term); // lookup dropped term's results
      if (!filtered.length) {
        // if found
        results = state.results.concat({ term, hit: matched ? 1 : 0, miss: matched ? 0 : 1 }); // combine old data with new object
      } else {
        // if not found
        results = state.results.map(res => {
          if (res.term === term) {
            return {
              term: res.term,
              hit: matched ? res.hit + 1 : res.hit,
              miss: matched ? res.miss : res.miss + 1
            };
          }
          return res;
        }); // build new array; update original and preserve others
      }

      if (matched) {
        // if successful match
        correct = state.correct + 1; // increment correct
        score = state.score + 1; // increment score
        unmatched = state.unmatched - 1; // decrement unmatched
        rounds = Math.floor(correct / itemsPerBoard); // calculate completed rounds
        const terms = state.terms.map(term => {
          term.show = term.id === termId ? false : term.show;
          term.matched = term.id === termId ? true : term.matched;
          return term;
        });
        const definitions = state.definitions.map(def => {
          def.show = def.id === definitionId ? false : def.show;
          def.matched = def.id === definitionId ? true : def.matched;
          return def;
        });
        return { ...state, correct, definitions, results, rounds, score, terms, unmatched };
      }
      incorrect = state.incorrect + 1; // increment incorrect
      score = Math.max(state.score - 1, 0); // decrement score (floor of 0)
      return { ...state, results, incorrect, score };
    }
    case "EXIT": {
      let terms, definitions; // terms and definitions (to remove from)
      const { id, exitType } = action; // id = id of exiting item; type = what exited, e.g., term, definition
      switch (exitType) {
        case "term": // if a term is exiting
          terms = state.terms.filter(term => term.id !== id);
          if (terms && terms.length) terms = shuffleArray(terms);
          break;
        case "definition": // if a definition is exiting
          definitions = state.definitions.filter(def => def.id !== id);
          if (definitions && definitions.length) definitions = shuffleArray(definitions);
          break;
        default:
          break;
      }
      return {
        ...state, // prevState
        ...(definitions && { definitions }), // if a definition is exiting, include updated version
        ...(terms && { terms }) // if a term is exiting, include updated version
      };
    }
    case "GAME_OVER": {
      return {
        ...state,
        games: state.games + 1,
        playing: false,
        showSplash: true,
        showScore: true
      }; // show score/splash
    }
    case "PLAYING": {
      return { ...state, playing: action.playing };
    }
    case "SHOW_BOARD": {
      return { ...state, showBoard: action.show };
    }
    case "START": {
      return {
        ...state,
        correct: 0,
        incorrect: 0,
        matched: [],
        playing: true,
        results: [],
        rounds: 0,
        score: 0,
        showBoard: true,
        showSplash: false
      }; // initialize/reinitialize key values (to start game)
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

export const MatchDispatch = React.createContext(null);

const MatchGame = props => {
  // destructure props
  const {
    game: {
      author,
      // id,
      instructions,
      matches,
      title,
      options: { colorScheme = "rainbow", duration = 90, itemsPerBoard = 9 } = {}
    } = {},
    onPing
  } = props;

  const [state, dispatch] = useReducer(
    matchReducer,
    { colorScheme, itemsPerBoard, matches },
    initMatch
  );

  const {
    correct,
    definitions,
    games,
    incorrect,
    playing,
    results,
    rounds,
    score,
    showBoard,
    showSplash,
    showScore,
    terms,
    termCount
  } = state;

  // Side effect which handles "new round" logic
  useEffect(() => {
    rounds && dispatch({ type: "DEAL" });
  }, [dispatch, rounds]);

  const resultRef = useRef(); // tracks current value of result-related state

  // Side effect which keeps track of game results (in a ref)
  useEffect(() => {
    resultRef.current = { correct, incorrect, data: results, score };
  }, [correct, incorrect, results, score]);

  // Side effect which ping server with game results
  useEffect(() => {
    games && onPing(resultRef.current);
  }, [games, onPing]);

  return (
    <DndProvider backend={MultiBackend} options={CustomHTML5toTouch}>
      <MatchDragLayer />
      <MatchDispatch.Provider value={dispatch}>
        <MatchSplash
          author={author}
          correct={correct}
          duration={duration}
          incorrect={incorrect}
          instructions={instructions}
          itemsPerBoard={itemsPerBoard}
          score={score}
          showScore={showScore}
          showSplash={showSplash}
          termCount={termCount}
          title={title}
        />
        <div id="match-game">
          <MatchBoard
            definitions={definitions}
            itemsPerBoard={itemsPerBoard}
            playing={playing}
            show={showBoard}
            terms={terms}
            wait={500}
          />
          <Timer
            correct={correct}
            duration={duration}
            incorrect={incorrect}
            interval={100}
            playing={playing}
            score={score}
            wait={300}
          />
        </div>
      </MatchDispatch.Provider>
    </DndProvider>
  );
};

MatchGame.propTypes = {
  game: PropTypes.object.isRequired,
  onPing: PropTypes.func.isRequired
};

export default MatchGame;