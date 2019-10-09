import React, { Component } from 'react';
import { DndProvider } from 'react-dnd';
import MultiBackend, { TouchTransition } from 'react-dnd-multi-backend';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import MatchDragLayer from './MatchDragLayer';
import shortid from 'shortid';
import { shuffleArray } from './utils';
import MatchSplash from './MatchSplash';
import Timer from './Timer';
import MatchBoard from './MatchBoard';
// import logo from '../../../src/logo.svg';

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

class MatchGame extends Component {
  /**
   * Initialize component, setting default values, etc.
   * @param {Object} props - Properties passed to component
   */
  constructor(props) {
    super(props);
    const { author, id, instructions, matches, title } = this.props.game || {};
    const { colorScheme = 'mono', duration = 180, itemsPerBoard = 9 } =
      this.props.game.options || {};
    const matchDeck = this.transformData(matches);

    // Copying props to state because of default value overriding, etc.
    this.state = {
      author /* Teacher who made the game */,
      colorScheme /* "Basic" or "Rainbow" */,
      correct: 0 /* # correct matches */,
      definitions: [] /* Definitions (on game board) */,
      duration /* Elapsed time of the game (in seconds) */,
      id /* Unique, "short id" of game (use in URL) */,
      incorrect: 0 /* # incorrect matches */,
      instructions /* Teacher directions (to show on splash) */,
      itemsPerBoard /* How many tiles per board */,
      matchDeck /* Matches defined by teacher (plus additional fields) */,
      playing: false /* Whether game is currently being played */,
      score: 0 /* Points earned thus far */,
      showBoard: false /* Show/hide toggle of game board */,
      showResults: false /* Show/hide toggle of results */,
      showSplash: true /* Show/hide toggle of modal splash screen */,
      termCount: matchDeck.length /* Total # terms in "bank" of matches */,
      terms: [] /* Terms (on game board) */,
      title /* Display name of game */,
      unmatched: 0 /* # terms still to match (on current game board) */
    };
  }

  /**
   * Augments each object within additional info (needed by game)
   * @param {Array} matches - Array of match objects to augment
   */
  transformData(matches) {
    return matches.map(match => {
      return {
        ...match,
        id: shortid.generate()
      };
    });
  }

  /**
   * Assign color to matches
   * Will be used downstream to assign style classes, etc.
   *
   * @param {Array} matches - Array of match objects to assign color
   * @param {string} colorScheme - Game color scheme, i.e., 'mono', 'rainbow'
   */
  addColor(matches, colorScheme) {
    let colors = [
      'red',
      'orange',
      'yellow',
      'lime',
      'green',
      'cyan',
      'blue',
      'purple',
      'magenta',
      'navy',
      'gray',
      'teal'
    ];

    switch (colorScheme.toLowerCase()) {
      case 'rainbow':
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
            color: ''
          };
        });
    }
  }

  /**
   * Shows or hides all match objects, triggering transitions
   * @param {bool} show - Whether to show matches
   */
  showMatches = show => {
    this.setState((state, props) => {
      const terms = state.terms.map(term => {
        term.show = show;
        return term;
      });

      const definitions = state.definitions.map(def => {
        def.show = show;
        return def;
      });

      return { terms, definitions };
    });
  };

  /**
   * Updates state of matched term/definition combo
   *
   * The `dropResult` object contains monitor payload
   * associated with drag-and-drop interaction
   *
   * A separate `termId` and `definitionId` are present
   * because it is possible to have terms with duplicate
   * definition text; therefore, we need to know the exact
   * term and definition involved so specific tiles are
   * removed from the screen
   *
   * For each:
   *   Set show to `false`, triggering transition
   *   Set matched to `true`, facilitates exiting styling, etc.
   *
   * @param {Object} dropResult - Monitor payload (includes ids)
   */
  handleMatched = dropResult => {
    const { termId, definitionId } = dropResult;
    this.setState((state, props) => {
      const terms = state.terms.map(term => {
        if (term.id === termId) {
          term.show = false;
          term.matched = true;
        }
        return term;
      });

      const definitions = state.definitions.map(def => {
        if (def.id === definitionId) {
          def.show = false;
          def.matched = true;
        }
        return def;
      });
      return { terms, definitions };
    });
  };

  /**
   * Shuffle the match deck
   * Pick subset of matches (itemsPerBoard)
   * Split out into terms and definitions
   * Add/set additional "flags" needed by game, e.g., `show`, `matched`
   * Apply color scheme, i.e., assign color classes to game terms "tiles"
   * Shuffle terms and definitions, i.e., generate array of random indices
   * Calculate `unmatched`
   * Update related state items (using setState)
   */
  dealMatches = () => {
    this.setState((state, props) => {
      // Shuffle all available matches
      const shuffled = shuffleArray(state.matchDeck);
      
      // Grab just necessary #
      const matches = shuffled.slice(
        0,
        Math.min(state.itemsPerBoard, shuffled.length)
      );

      // Add additional properties (needed for game play)
      let terms = matches.map(match => {
        return { ...match, show: false, matched: false };
      });

      // Clone definitions from terms
      let definitions = [...terms];

      // Add colors (to terms only)
      terms = this.addColor(terms, state.colorScheme);
      
      // Shuffle
      terms = shuffleArray(terms);
      definitions = shuffleArray(definitions);

      // # of matches yet unmatched
      const unmatched = definitions.length;

      return {
        terms,
        definitions,
        unmatched
      };
    });
  };

  /**
   * Reset game state
   * Hides splash screen
   * Show game board
   */
  handleGameStart = () => {
    console.log('Handling game start...');
    this.setState((state, props) => {
      return {
        correct: 0,
        incorrect: 0,
        score: 0,
        showSplash: false
      };
    });
    this.nextRound();
  };

  /**
   * Chang
   */
  handleTimerStart = () => {
    console.log('Timer started...');
    this.setState({ playing: true });
  };

  /**
   *
   */
  handleTimerEnd = () => {
    console.log('Timer ended...');
    this.setState({ playing: false });
    setTimeout(() => this.handleGameOver(), 1000);
  };

  /**
   * Fire Ping to backend
   * Change state items used to:
   * stop the game, show the splash screen, including final results
   */
  handleGameOver = () => {
    const { onPing } = this.props;
    const { correct, incorrect, score } = this.state;
    onPing({ correct, incorrect, score });
    this.setState({ showSplash: true, showResults: true });
  };

  /**
   * Prepares new game round
   * Deal new set of matches
   * Show matches (initiates transitions)
   */
  handleRoundStart = () => {
    console.log('starting round...');
    this.dealMatches();
    this.showMatches(true);
  };

  /**
   * Hide game board then show after brief timeout
   */
  nextRound = () => {
    this.setState({ showBoard: false });
    setTimeout(() => this.setState({ showBoard: true }), 500);
  };

  /**
   * When a Term component is dropped upon a Definition
   * If dropResult.matched, incrementcorrect; decrement unmatched
   * Otherwise, decrement incorrect
   *
   * @param {object} dropResult - Results of drag-and-drop operation
   */
  handleDrop = dropResult => {
    let unmatched; // needed beyond state settings

    this.setState((state, props) => {
      unmatched = state.unmatched - 1;

      if (dropResult.matched) {
        return {
          correct: state.correct + 1,
          unmatched,
          score: state.score + 1
        };
      } else {
        return {
          incorrect: state.incorrect + 1,
          score: Math.max(state.score - 1, 0)
        };
      }
    });
    if (dropResult.matched) this.handleMatched(dropResult);
    if (unmatched < 1) this.showMatches(false);
  };

  /**
   * Remove id from terms or definitions, reshuffling
   * If board cleared, starts next round, i.e., nextRound()
   *
   * Structured like this because wrapping with setState does not work!
   *
   * @param {string} id - id to remove from terms'
   * @param {string} type - type of item that it has exited
   */
  handleExited = (id, type) => {
    let roundOver = false;
    switch (type) {
      case 'term':
        let terms = this.state.terms.filter(term => term.id !== id);
        if (terms && terms.length) {
          terms = shuffleArray(terms);
        }

        roundOver =
          terms &&
          terms.length === 0 &&
          this.state.definitions &&
          this.state.definitions.length === 0;

        this.setState({ terms });

        break;

      case 'definition':
        let definitions = this.state.definitions.filter(def => def.id !== id);
        if (definitions && definitions.length) {
          definitions = shuffleArray(definitions);
        }
        roundOver =
          definitions &&
          definitions.length === 0 &&
          this.state.terms &&
          this.state.terms.length === 0;

        this.setState({ definitions });

        break;
      default:
        break;
    }

    if (roundOver) {
      this.nextRound();
    }
  };

  render() {
    const {
      title,
      author,
      instructions,
      duration,
      itemsPerBoard,
      playing,
      showSplash,
      showBoard,
      showResults,
      correct,
      incorrect,
      score,
      terms,
      definitions
    } = this.state;

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
          onGameStart={this.handleGameStart}
          score={score}
          showResults={showResults}
          showSplash={showSplash}
          title={title}
        />
        <div id="match-game">
          <MatchBoard
            definitions={definitions}
            itemsPerBoard={itemsPerBoard}
            onDrop={this.handleDrop}
            onExited={this.handleExited}
            onRoundStart={this.handleRoundStart}
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
              onTimerStart={this.handleTimerStart}
              onTimerEnd={this.handleTimerEnd}
              wait={300}
            />
          )}
        </div>
      </DndProvider>
    );
  }
}

export default MatchGame;
