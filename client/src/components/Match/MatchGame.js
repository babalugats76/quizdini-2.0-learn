import React, { useContext, useEffect, useReducer } from "react";
import PropTypes from "prop-types";
import { DndProvider, DragLayer, DragSource, DropTarget } from "react-dnd";
import MultiBackend, { TouchTransition } from "react-dnd-multi-backend";
import HTML5Backend, { getEmptyImage } from "react-dnd-html5-backend";
import TouchBackend from "react-dnd-touch-backend";
import shortid from "shortid";
import { GameTransition, Modal, SVG as Icon } from "../UI/";
import { addColor, shuffleArray } from "./utils";
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

function initMatch({ colorScheme, onPing, itemsPerBoard, matches }) {
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

const MatchDispatch = React.createContext(null);

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
    initMatch
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

  /* useEffect(() => {
    console.log(JSON.stringify(state, null, 3));
  }, [state]); */

  return (
    <DndProvider backend={MultiBackend} options={CustomHTML5toTouch}>
      <MatchDispatch.Provider value={dispatch}>
        <MatchSplash
          author={author}
          correct={correct}
          duration={duration}
          incorrect={incorrect}
          instructions={instructions}
          itemsPerBoard={itemsPerBoard}
          score={score}
          showResults={showResults}
          showSplash={showSplash}
          termCount={termCount}
          title={title}
        />
        <div id="match-game">
          <MatchDragLayer />
          <MatchBoard
            definitions={definitions}
            itemsPerBoard={itemsPerBoard}
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
              interval={100}
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
      </MatchDispatch.Provider>
    </DndProvider>
  );
};

MatchGame.propTypes = {
  game: PropTypes.object.isRequired,
  onPing: PropTypes.func.isRequired
};

export default MatchGame;

const layerStyles = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 150,
  left: 0,
  top: 0,
  width: "100%",
  height: "100%"
};

function getItemStyles(props) {
  const { initialOffset, currentOffset } = props;
  if (!initialOffset || !currentOffset) {
    return {
      display: "none"
    };
  }
  let { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform
  };
}

const MatchDragLayer = DragLayer(monitor => ({
  item: monitor.getItem(),
  itemType: monitor.getItemType(),
  initialOffset: monitor.getInitialSourceClientOffset(),
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging()
}))(props => {
  const { item, isDragging } = props;

  /* Hide preview */
  if (!isDragging) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(props)}>
        <TermPreview {...item} />
      </div>
    </div>
  );
});

const TermPreview = ({ term, itemsPerBoard, ...rest }) => {
  const previewClasses = []
    .concat("term-preview", itemsPerBoard ? [`tiles-${itemsPerBoard}`] : [])
    .join(" ")
    .trim();

  const renderHtml = value => {
    return { __html: value.replace(/(^")|("$)/g, "") };
  };

  return (
    term && (
      <div className={previewClasses}>
        <div className="term-preview-text" dangerouslySetInnerHTML={renderHtml(term)}></div>
      </div>
    )
  );
};

const MatchSplash = ({
  author,
  duration,
  instructions,
  itemsPerBoard,
  score,
  showResults,
  showSplash,
  termCount,
  title
}) => {
  const dispatch = useContext(MatchDispatch);

  const onGameStart = () => {
    dispatch({ type: "START" });
    setTimeout(() => {
      // short timeout before showing board
      dispatch({ type: "SHOW_BOARD", show: true });
    }, 1000);
  };

  return (
    <Modal handleClose={onGameStart} show={showSplash}>
      <div id="splash">
        <section id="splash-banner">
          <img
            className="game-banner"
            src="https://loremflickr.com/900/250"
            alt="Awesome Quizdini Match Banner Goes Here..."
          />
        </section>
        <section id="splash-details">
          <div className="title">{title}</div>
          <div className="author">{author}</div>
          {showResults && (
            <div id="score">
              <span className="circle">
                <span className="circle-text">{score}</span>
              </span>
            </div>
          )}
          {!showResults && (
            <div id="options">
              <span className="term-count">
                <Icon name="archive" />
                {termCount} terms
              </span>
              <span className="items-per-board">
                <Icon name="grid" />
                {itemsPerBoard} per board
              </span>
              <span className="duration">
                <Icon name="watch" />
                {duration} seconds
              </span>
            </div>
          )}
          {!showResults && <div className="instructions">{instructions}</div>}
        </section>
        <section id="splash-footer">
          <button id="play" onClick={onGameStart} onKeyPress={onGameStart} tabIndex={1}>
            {showResults ? "Play Again" : "Play Game"}
          </button>
        </section>
      </div>
    </Modal>
  );
};

const MatchBoard = props => {
  const dispatch = useContext(MatchDispatch);

  const onDrop = results => dispatch({ type: "DROP", drop: results });
  const onExited = (id, exitType) => dispatch({ type: "EXIT", id, exitType });
  const onRoundStart = () => dispatch({ type: "DEAL" });

  const renderTerms = ({ itemsPerBoard, playing, terms, wait }) => {
    return terms.map((term, idx) => {
      /* Dynamically determine enter/exit transition times, i.e., achieve brick-laying effect */
      const timeout = {
        enter: ((idx + 1) / terms.length) * wait,
        exit: wait
      };

      /* Define object for the following states: 'default', 'entering', 'entered', 'exiting', 'exited' */
      const transitionStyles = {
        default: { opacity: 0, visibility: "hidden" },
        entering: { opacity: 0, visibility: "hidden" },
        entered: {
          transition: `visibility 0ms linear ${timeout.enter}ms, opacity ${timeout.enter}ms linear`,
          opacity: 1.0,
          visibility: "visible"
        },
        exiting: {},
        exited: { opacity: 0 }
      };

      /* Return the terms, wrapped in transitions */
      return (
        <GameTransition
          appear={true}
          in={term.show}
          key={term.id}
          onExited={() => onExited(term.id, "term")}
          timeout={timeout}
          transitionStyles={transitionStyles}
          unmountOnExit={false}
          mountOnEnter={true}
        >
          <Term
            canDrag={playing}
            color={term.color}
            definition={term.definition}
            id={term.id}
            itemsPerBoard={itemsPerBoard}
            matched={term.matched}
            onDrop={onDrop}
            show={term.show}
            term={term.term}
          />
        </GameTransition>
      );
    });
  };

  const renderDefinitions = ({ definitions, wait }) => {
    return definitions.map((def, idx) => {
      const timeout = {
        enter: ((idx + 1) / definitions.length) * wait,
        exit: wait
      };

      const transitionStyles = {
        default: { opacity: 0 },
        entering: { opacity: 0 },
        entered: {
          transition: `opacity ${timeout.enter}ms cubic-bezier(.17,.67,.83,.67)`,
          opacity: 1.0,
          visibility: "visible"
        },
        exiting: {
          transition: `opacity ${timeout.exit}ms cubic-bezier(.17,.67,.83,.67)`,
          opacity: 1.0,
          visibility: "visible"
        },
        exited: { opacity: 0, color: "#FFFFFF", borderColor: "#FFFFFF" }
      };

      /* Return the terms, wrapped in transitions */
      return (
        <GameTransition
          appear={true}
          in={def.show}
          key={def.id}
          mountOnEnter={true}
          onExited={() => onExited(def.id, "definition")}
          timeout={timeout}
          transitionStyles={transitionStyles}
          unmountOnExit={false}
        >
          <Definition
            definition={def.definition}
            id={def.id}
            matched={def.matched}
            show={def.show}
            term={def.term}
          />
        </GameTransition>
      );
    });
  };

  const { itemsPerBoard, show, wait } = props;
  const terms = renderTerms({ ...props });
  const definitions = renderDefinitions({ ...props });

  /* Transition timeouts */
  const timeout = {
    enter: wait / itemsPerBoard,
    exit: wait / itemsPerBoard
  };

  /* Define object for the following states: 'default', 'entering', 'entered', 'exiting', 'exited' */
  const transitionStyles = {
    default: { opacity: 0 },
    entering: { opacity: 0 },
    entered: {
      transition: `all ${timeout.enter}ms cubic-bezier(.17,.67,.83,.67)`,
      opacity: 1.0
    },
    exiting: {
      transition: `all ${timeout.exit}ms cubic-bezier(.17,.67,.83,.67)`,
      opacity: 0.1
    },
    exited: { opacity: 0 }
  };

  const tileClass = `tiles-${itemsPerBoard}`;

  return (
    <GameTransition
      appear={true}
      in={show}
      mountOnEnter={false}
      onEnter={onRoundStart}
      timeout={timeout}
      transitionStyles={transitionStyles}
      unmountOnExit={true}
    >
      <div id="match-board">
        <div id="terms" className={tileClass}>
          {terms}
        </div>
        <div id="definitions" className={tileClass}>
          {definitions}
        </div>
      </div>
    </GameTransition>
  );
};

const termSource = {
  canDrag(props, monitor) {
    return props.canDrag;
  },

  beginDrag(props) {
    return { ...props };
  },

  endDrag(props, monitor) {
    if (monitor.didDrop()) {
      return props.onDrop(monitor.getDropResult());
    }
  }
};

function termCollect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}

function getStyles({ style, isDragging }) {
  // Combine existing style object with dragging-specific logic
  return { ...style, ...(isDragging && { opacity: 0 }) };
}

const Term = DragSource(
  "Match",
  termSource,
  termCollect
)(
  ({
    color,
    connectDragPreview,
    connectDragSource,
    isDragging,
    matched,
    show,
    style, // *important* - contains inline style from GameTransition
    term
  }) => {
    /***
     * Side effect which replaces traditional HTML5 ghost image with blank image.
     * Runs once (on mount); dependencies not important--include lint rule.
     */
    useEffect(
      () => {
        connectDragPreview &&
          connectDragPreview(getEmptyImage(), {
            captureDraggingState: true
          });
      }, // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    const renderHtml = value => ({ __html: value.replace(/(^")|("$)/g, "") });

    const termClasses = []
      .concat(
        "term",
        isDragging ? ["dragging"] : [],
        !show ? ["exiting"] : [],
        matched ? ["matched"] : [],
        color
      )
      .join(" ")
      .trim();

    return connectDragSource(
      <div style={getStyles({ style, isDragging })} className={termClasses}>
        <div className="term-text" dangerouslySetInnerHTML={renderHtml(term)}></div>
      </div>
    );
  }
);

const definitionTarget = {
  drop(props, monitor, component) {
    console.log("drop...");
    const item = monitor.getItem();
    const matched = item.definition === props.definition ? true : false;
    return {
      matched: matched,
      termId: item.id,
      definitionId: props.id,
      //id: item.id,
      term: item.term,
      definition: props.definition
    };
  }
};

function definitionCollect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType()
  };
}

const Definition = DropTarget(
  "Match",
  definitionTarget,
  definitionCollect
)(({ canDrop, connectDropTarget, definition, isOver, matched, show, style }) => {
  const renderHtml = value => {
    return { __html: value.replace(/(^")|("$)/g, "") };
  };

  const definitionClasses = []
    .concat(
      "definition",
      isOver && canDrop ? ["is-over"] : [],
      !show ? ["exiting"] : [],
      matched ? ["matched"] : []
    )
    .join(" ")
    .trim();

  return connectDropTarget(
    <div style={style} className={definitionClasses}>
      <div className="definition-text" dangerouslySetInnerHTML={renderHtml(definition)}></div>
    </div>
  );
});
