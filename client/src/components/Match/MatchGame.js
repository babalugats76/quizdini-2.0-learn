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
    const { id, title, instructions, author, matches } = this.props.game || {};
    const { duration = 180, itemsPerBoard = 9, colorScheme = 'mono' } =
      this.props.game.options || {};
    const matchDeck = this.transformData(matches);
    this.state = {
      id,
      title,
      author,
      instructions,
      itemsPerBoard,
      duration,
      colorScheme,
      playing: false,
      showSplash: true,
      showBoard: false,
      showResults: false,
      matchDeck,
      termCount: matchDeck.length,
      matches: [],
      termOrder: [],
      definitionOrder: [],
      unmatched: 0,
      correct: 0,
      incorrect: 0,
      score: 0
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

    switch (colorScheme) {
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
   * Get key (index) of each match and shuffle
   * Used in randomizing display of terms
   * @param {Array} matches
   */
  getTermOrder = matches => {
    return shuffleArray([...matches.keys()]);
  };

  /**
   * Get key (index) of each match, filter out dummy terms, and shuffle
   * Used in randomizing display of definitions
   * @param {Array} matches
   */
  getDefinitionOrder = matches => {
    // Add index to each item (order); filter out non-matches, i.e., match.definition; limit to order and shuffle
    return shuffleArray(
      matches
        .map((match, index) => {
          return { definition: match.definition, order: index };
        })
        .filter(match => {
          return match.definition;
        })
        .map(match => {
          return match.order;
        })
    );
  };

  /**
   * Toggles boolean state properties
   * @param {string} property - Property in the state object to toggle
   */
  toggle = property => {
    this.setState((state, props) => {
      return { [property]: !state[property] };
    });
  };

  /**
   * Updates value of item in state
   * @param {string} property - State item to update
   * @param {any} value - New value to assign to state item
   */
  switch = (property, value) => {
    this.setState((state, props) => {
      return { [property]: value };
    });
  };

  /**
   * Shows or hides all match objects, triggering transitions
   * @param {bool} show - Whether to show matches
   */
  showMatches = show => {
    this.setState((state, props) => {
      const matches = state.matches.map(match => {
        match.show = show;
        return match;
      });
      return { matches };
    });
  };

  /**
   * Updates state of matched term/definition combo
   * For matched id:
   *   Set show to false, triggering transition
   *   Set matched to true, facilitates exiting styling, etc.
   * @param {string} id - Match id that
   */
  handleMatched = id => {
    this.setState((state, props) => {
      const matches = state.matches.map(match => {
        if (match.id === id) {
          match.show = false;
          match.matched = true;
        }
        return match;
      });
      return { matches };
    });
  };

  /**
   * Shuffle the match deck
   * Pick subset of matches
   * Add/Set additional "flags" needed by game, e.g., `show`, `matched`
   * Apply color scheme, i.e., assign color classes to game terms "tiles"
   * Shuffle terms and definitions, i.e., generate array of random indices
   * Calculates unmatched
   * Update related state items
   */
  dealMatches = () => {
    this.setState((state, props) => {
      console.log('color scheme', state.colorScheme);
      console.log(state.matchDeck);
      const matchDeck = shuffleArray(state.matchDeck);
      console.log('shuffling match deck');
      console.log(matchDeck);
      let matches = matchDeck.slice(
        0,
        Math.min(state.itemsPerBoard, matchDeck.length)
      );
      matches = matches.map(match => {
        return { ...match, show: false, matched: false };
      });
      matches = this.addColor(matches, state.colorScheme);
      const termOrder = this.getTermOrder(matches);
      const definitionOrder = this.getDefinitionOrder(matches);
      const unmatched = definitionOrder.length;
      return { matchDeck, matches, termOrder, definitionOrder, unmatched };
    });
  };

  /**
   * Reset game state
   * Hides splash screen
   * Show game board
   */
  handleGameStart = () => {
    console.log('Handling game start...');
    this.switch('correct', 0);
    this.switch('incorrect', 0);
    this.switch('score', 0);
    this.switch('showSplash', false);
    this.nextRound();
  };

  /**
   * Chang
   */
  handleTimerStart = () => {
    console.log('Timer started...');
    this.switch('playing', true);
  };

  /**
   *
   */
  handleTimerEnd = () => {
    console.log('Timer ended...');
    this.switch('playing', false);
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
    this.switch('showSplash', true);
    this.switch('showResults', true);
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
    this.switch('showBoard', false);
    setTimeout(() => this.switch('showBoard', true), 500);
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
      let { correct, incorrect, score } = state;
      unmatched = state.unmatched;
      if (dropResult.matched) {
        correct += 1;
        unmatched -= 1;
        score += 1;
      } else {
        incorrect += 1;
        score = Math.max(score - 1, 0);
      }
      return { correct, incorrect, score, unmatched };
    });

    if (dropResult.matched) this.handleMatched(dropResult.id);
    if (unmatched < 1) this.showMatches(false);
  };

  /**
   * Removes id from matches
   * Recreate shuffled arrays specifying the rendor order of terms and defs
   * If board has been cleared, start next round, i.e., nextRound()
   * @param {string} id - Match id to remove from matches
   */
  handleExited = id => {
    const matches = this.state.matches.filter(match => {
      return match.id !== id;
    });
    const termOrder = this.getTermOrder(matches);
    const definitionOrder = this.getDefinitionOrder(matches);
    this.setState({ matches, termOrder, definitionOrder });
    // If all data has been removed, proceed to next round
    if (matches.length === 0) return this.nextRound();
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
      matches,
      termOrder,
      definitionOrder
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
            wait={500}
            show={showBoard}
            playing={playing}
            matches={matches}
            termOrder={termOrder}
            itemsPerBoard={itemsPerBoard}
            definitionOrder={definitionOrder}
            onDrop={dropResult => this.handleDrop(dropResult)}
            onExited={id => this.handleExited(id)}
            onRoundStart={this.handleRoundStart}
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
