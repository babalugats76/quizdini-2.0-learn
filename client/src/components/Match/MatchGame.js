import React, { useEffect, useReducer } from "react";
import PropTypes from "prop-types";
import { DndProvider } from "react-dnd";
import MultiBackend, { TouchTransition } from "react-dnd-multi-backend";
import HTML5Backend from "react-dnd-html5-backend";
import TouchBackend from "react-dnd-touch-backend";
import shortid from "shortid";
import { addColor, shuffleArray } from "./utils";
import MatchBoard from "./MatchBoard";
import MatchDragLayer from "./MatchDragLayer";
import MatchSplash from "./MatchSplash";
import Timer from "./Timer";

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
    rounds: 0, // Number of complete rounds played (used to trigger round transitions)
    score: 0, // Points earned thus far
    showBoard: false, // Show/hide game board
    showResults: false, // Show/hide score
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
    case "DEAL": {
      const { colorScheme, itemsPerBoard, matchBank } = state; // prevState
      const shuffled = shuffleArray(matchBank); // Shuffle all available matches
      const sliced = shuffled.slice(0, Math.min(itemsPerBoard, shuffled.length)); // Grab subset (based on itemsPerBoard)
      let terms = sliced.map(match => {
        return { ...match, show: true, matched: false };
      }); // Add additional properties
      let definitions = [...terms]; // Clone definitions (from terms)
      terms = addColor(terms, colorScheme); // Add colors (terms only)
      terms = shuffleArray(terms); // Shuffle terms
      definitions = shuffleArray(definitions); // Shuffle definitions
      return { ...state, terms, definitions, unmatched: definitions.length };
    }
    case "DROP": {
      let correct, incorrect, score, unmatched; // local variables
      const { definitionId, matched, termId } = action.drop; // dropResult
      if (matched) {
        // if successful match
        correct = state.correct + 1; // increment correct
        score = state.score + 1; // increment score
        unmatched = state.unmatched - 1; // decrement unmatched
        /**
         * Mark term/def matched and hide
         * If board is cleared (unmatched < 1) hide all terms/defs
         */
        const terms = state.terms.map(term => {
          term.show = term.id === termId || unmatched < 1 ? false : term.show;
          term.matched = term.id === termId ? true : term.matched;
          return term;
        });
        const definitions = state.definitions.map(def => {
          def.show = def.id === definitionId || unmatched < 1 ? false : def.show;
          def.matched = def.id === definitionId ? true : def.matched;
          return def;
        });
        return { ...state, correct, definitions, score, terms, unmatched };
      }
      incorrect = state.incorrect + 1; // increment incorrect
      score = Math.max(state.score - 1, 0); // decrement score (floor of 0)
      return { ...state, incorrect, score };
    }
    case "EXIT": {
      let roundOver = false; // whether round is over
      let terms, definitions; // terms and definitions (to remove from)
      const { id, exitType } = action; // id = id of exiting item; type = what exited, e.g., term, definition
      switch (exitType) {
        case "term": // if a term is exiting
          terms = state.terms.filter(term => term.id !== id);
          if (terms && terms.length) terms = shuffleArray(terms);
          roundOver =
            terms && terms.length === 0 && state.definitions && state.definitions.length === 0;
          break;
        case "definition": // if a definition is exiting
          definitions = state.definitions.filter(def => def.id !== id);
          if (definitions && definitions.length) definitions = shuffleArray(definitions);
          roundOver =
            definitions && definitions.length === 0 && state.terms && state.terms.length === 0;
          break;
        default:
          break;
      }
      return {
        ...state, // prevState
        showBoard: roundOver ? false : state.showBoard, // if end of round, hide board
        rounds: roundOver ? state.rounds + 1 : state.rounds, // if end of round, increment `rounds`
        ...(definitions && { definitions }), // if a definition is exiting, include updated version
        ...(terms && { terms }) // if a term is exiting, include updated version
      };
    }
    case "GAME_OVER": {
      const { correct, incorrect, onPing, score } = state; // prevState
      onPing({ correct, incorrect, score }); // fire ping to record game results
      return { ...state, showResults: true, showSplash: true }; // show score/splash
    }
    case "PLAYING": {
      return { ...state, playing: action.playing }; // active/deactivate game play
    }
    case "SHOW_BOARD": {
      return { ...state, showBoard: action.show }; // toggle transition of game board
    }
    case "START": {
      return { ...state, correct: 0, incorrect: 0, score: 0, showBoard: false, showSplash: false }; // initialize/reinitialize key values (to start game)
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
    { colorScheme, itemsPerBoard, matches, onPing },
    init
  );

  const {
    correct,
    definitions,
    incorrect,
    playing,
    rounds,
    score,
    showBoard,
    showResults,
    showSplash,
    terms,
    termCount
  } = state;

  /***
   * Side effect to manage round transitions.
   * `rounds` is incremented for each board that is cleared.
   * Avoids setting timeouts and performing nested state setting inside `matchReducer`
   */
  useEffect(() => {
    const newRound =
      rounds &&
      setTimeout(() => {
        dispatch({ type: "SHOW_BOARD", show: true }); // initiates `MatchBoard` transition
      }, 1000);
    return () => newRound && clearTimeout(newRound);
  }, [rounds]);

  useEffect(() => {
    console.log(JSON.stringify(state, null, 3));
  }, [state]);

  return (
    <DndProvider backend={MultiBackend} options={CustomHTML5toTouch}>
      <MatchDragLayer />
      <MatchSplash
        author={author}
        correct={correct}
        duration={duration}
        incorrect={incorrect}
        instructions={instructions}
        itemsPerBoard={itemsPerBoard}
        onGameStart={() => {
          dispatch({ type: "START" });
          setTimeout(() => {
            // short timeout before showing board
            dispatch({ type: "SHOW_BOARD", show: true });
          }, 1000);
        }}
        score={score}
        showResults={showResults}
        showSplash={showSplash}
        termCount={termCount}
        title={title}
      />
      <div id="match-game">
        <MatchBoard
          definitions={definitions}
          itemsPerBoard={itemsPerBoard}
          onDrop={results => {
            dispatch({ type: "DROP", drop: results });
          }}
          onExited={(id, exitType) => {
            dispatch({ type: "EXIT", id, exitType });
          }}
          onRoundStart={() => dispatch({ type: "DEAL" })}
          playing={playing}
          show={showBoard}
          terms={terms}
          wait={500}
        />
        {!showSplash && (
          <Timer
            correct={correct}
            duration={duration}
            incorrect={incorrect}
            score={score}
            onTimerStart={() => dispatch({ type: "PLAYING", playing: true })}
            onTimerEnd={() => {
              dispatch({ type: "PLAYING", playing: false });
              setTimeout(() => dispatch({ type: "GAME_OVER" }), 1000); // short timeout before showing results
            }}
            wait={300}
          />
        )}
      </div>
    </DndProvider>
  );
};

MatchGame.propTypes = {
  game: PropTypes.object.isRequired,
  onPing: PropTypes.func.isRequired
};

export default MatchGame;
