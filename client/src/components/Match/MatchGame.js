import React, { useContext, useEffect, useMemo, useReducer, useRef } from "react";
import PropTypes from "prop-types";
import { DndProvider, DragLayer, DragSource, DropTarget } from "react-dnd";
import MultiBackend, { TouchTransition } from "react-dnd-multi-backend";
import HTML5Backend, { getEmptyImage } from "react-dnd-html5-backend";
import TouchBackend from "react-dnd-touch-backend";
import { CircularProgressbar } from "react-circular-progressbar";
import shortid from "shortid";
import { useInterval, usePrevious } from "../../hooks/";
import { GameTransition, Modal, SVG as Icon } from "../UI/";
import { addColor, shuffleArray } from "./utils";

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
    incorrect: 0, // incorrect matches
    itemsPerBoard, // items per board (from props)
    matches, // Matches defined by teacher (plus additional fields)
    playing: false, // Whether game is currently being played
    score: 0, // Points earned thus far
    showBoard: false, // Whether to show board
    showScore: false, // Whether to show score on Splash, i.e., at least one game played
    showSplash: true, // Whether to show splash screen
    results: [
      {
        term: "agile",
        hit: 100,
        miss: 50
      }
    ], // Results from game play, i.e., hit/miss, by term
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
      let correct, incorrect, score, unmatched; // local variables
      const { definitionId, matched, term, termId } = action.drop; // dropResult
      if (matched) {
        console.log(term, "hit");
        // if successful match
        correct = state.correct + 1; // increment correct
        score = state.score + 1; // increment score
        unmatched = state.unmatched - 1; // decrement unmatched
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

        const results = state.results.filter((res) => {
          return res.term === term
        });
        console.log(JSON.stringify(results, null, 4));

        return { ...state, correct, definitions, score, terms, unmatched };
      }
      console.log(term, "miss");
      incorrect = state.incorrect + 1; // increment incorrect
      score = Math.max(state.score - 1, 0); // decrement score (floor of 0)
      return { ...state, incorrect, score };
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
    { colorScheme, itemsPerBoard, matches },
    initMatch
  );

  const {
    correct,
    definitions,
    incorrect,
    playing,
    score,
    showBoard,
    showSplash,
    showScore,
    terms,
    termCount
  } = state;

  const ref = useRef();
  const rounds = useMemo(() => Math.floor(correct / itemsPerBoard), [correct, itemsPerBoard]);
  const gameOver = useMemo(() => !playing && showScore, [playing, showScore]);

  useEffect(() => {
    ref.current = { correct, incorrect, score };
  }, [correct, incorrect, score]);

  useEffect(() => {
    rounds && dispatch({ type: "DEAL" });
  }, [dispatch, rounds]);

  useEffect(() => {
    if (gameOver) onPing(ref.current); // fire ping to record game results
  }, [gameOver, onPing]);

  /*useEffect(() => {
    console.log(JSON.stringify(state, null, 3));
  }, [state]);*/

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

const MatchDragLayer = DragLayer((monitor, props) => ({
  item: monitor.getItem(),
  itemType: monitor.getItemType(),
  initialOffset: monitor.getInitialSourceClientOffset(),
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging()
}))(props => {
  const { item, isDragging } = props;
  if (!isDragging) return null; // hide preview

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(props)}>
        <TermPreview {...item} />
      </div>
    </div>
  );
});

const TermPreview = ({ term, itemsPerBoard }) => {
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
  showScore,
  showSplash,
  termCount,
  title
}) => {
  const dispatch = useContext(MatchDispatch);

  const playRef = useRef(null);

  const onGameStart = () => {
    dispatch({ type: "DEAL" });
    dispatch({ type: "START" });
  };

  useEffect(() => {
    showSplash &&
      setTimeout(() => {
        playRef.current.focus();
      }, 1000);
  }, [showSplash]);

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
          {showScore && (
            <div id="score">
              <span className="circle">
                <span className="circle-text">{score}</span>
              </span>
            </div>
          )}
          {!showScore && (
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
          {!showScore && <div className="instructions">{instructions}</div>}
        </section>
        <section id="splash-footer">
          <button
            id="play"
            onClick={onGameStart}
            onKeyPress={onGameStart}
            tabIndex={1}
            ref={playRef}
          >
            {showScore ? "Play Again" : "Play Game"}
          </button>
        </section>
      </div>
    </Modal>
  );
};

const MatchBoard = props => {
  const dispatch = useContext(MatchDispatch);

  const onDrop = drop => dispatch({ type: "DROP", drop });
  const onExited = (id, exitType) => dispatch({ type: "EXIT", id, exitType });

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
    canDrag: monitor.canDrag(),
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
    canDrag,
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

function initTimer({ duration, interval }) {
  return {
    active: false,
    duration,
    initialized: false,
    interval,
    secondsLeft: 0,
    showTransition: false,
    success: false
  };
}

function timerReducer(state, action) {
  switch (action.type) {
    case "COUNTDOWN": {
      const secondsLeft = state.secondsLeft - state.interval / 1000;
      const active = secondsLeft >= 0 ? true : false;
      return { ...state, active, secondsLeft };
    }
    case "START":
      console.log("starting timer...");
      return {
        ...state,
        active: true,
        initialized: true,
        secondsLeft: state.duration,
        showBoard: true,
        showTransition: false
      };
    case "TRANSITION":
      return { ...state, showTransition: action.show, success: action.success };
    default:
      return state;
  }
}

const Timer = ({ correct, duration, incorrect, interval, playing, score, wait }) => {
  const matchDispatch = useContext(MatchDispatch);
  const [state, dispatch] = useReducer(timerReducer, { duration, interval }, initTimer);
  const { active, initialized, secondsLeft, showTransition, success } = state;

  const prevCorrect = usePrevious(correct, 0);
  const prevIncorrect = usePrevious(incorrect, 0);

  useEffect(
    () => {
      if (correct !== prevCorrect || incorrect !== prevIncorrect) {
        const success = correct > prevCorrect ? true : false;
        dispatch({ type: "TRANSITION", show: true, success });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [correct, incorrect]
  );

  useEffect(() => {
    playing && dispatch({ type: "START" });
  }, [playing]);

  useEffect(() => {
    if (initialized && !active) {
      matchDispatch({ type: "PLAYING", playing: false });
      setTimeout(() => matchDispatch({ type: "GAME_OVER" }), 2000);
    }
  }, [active, initialized, matchDispatch]);

  useInterval(() => dispatch({ type: "COUNTDOWN" }), active ? interval : null);

  /*   useEffect(() => {
    console.log(JSON.stringify(state, null, 4));
  }, [state]); */

  const transitionStyles = {
    default: { opacity: 1.0 },
    entering: {
      transition: `transform cubic-bezier(1, 0, 0, 1)`,
      transform: "scale(1, 1)"
    },
    entered: { transform: "scale(1, 1)", opacity: 1.0 },
    exiting: {
      transition: `transform cubic-bezier(1, 0, 0, 1)`,
      transform: "scale(1.02, 1.02)",
      opacity: 1.0
    },
    exited: { opacity: 0.95 }
  };

  const classes = {
    root: "timer",
    path: "timer-path",
    trail: "timer-trail",
    background: "timer-background",
    text: "timer-text"
  };

  const colors = {
    GREEN: "#1fe73f",
    YELLOW: "#ffe119",
    RED: "#e6194b"
  };

  const percent = Math.ceil(((duration - secondsLeft) / duration) * 100);
  const progressColor = percent <= 70 ? colors.GREEN : percent <= 85 ? colors.YELLOW : colors.RED;

  return (
    <>
      {playing && (
        <GameTransition
          mountOnEnter={false}
          unmountOnExit={false}
          appear={true}
          in={!showTransition}
          timeout={wait}
          transitionStyles={transitionStyles}
          onExited={() => dispatch({ type: "TRANSITION", show: false })}
        >
          <div id="timer">
            <div className="timer-wrapper">
              <div className="progress-bar-wrapper">
                <CircularProgressbar
                  background
                  classes={classes}
                  counterClockwise
                  value={percent}
                  strokeWidth={4}
                  styles={{
                    trail: {
                      stroke: progressColor,
                      visibility: showTransition ? "hidden" : "visible"
                    },
                    background: {
                      fill: showTransition ? (success ? colors.GREEN : colors.RED) : undefined
                    }
                  }}
                />
              </div>
              <div className="timer-score-wrapper">
                <div id="timer-score">{score.toString()}</div>
              </div>
            </div>
          </div>
        </GameTransition>
      )}
    </>
  );
};
