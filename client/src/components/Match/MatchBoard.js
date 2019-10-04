import React, { Component } from 'react';
import GameTransition from '../UI/GameTransition';
import Definition from './Definition';
import Term from './Term';

class MatchBoard extends Component {
  renderTerms({
    itemsPerBoard,
    matches,
    onDrop,
    onExited,
    playing,
    termOrder,
    wait
  }) {
    return termOrder.map((matchIdx, idx) => {
      const match = matches[matchIdx];

      /* Dynamically determine enter/exit transition times, i.e., achieve brick-laying effect */
      const timeout = {
        enter: ((idx + 1) / matches.length) * wait,
        exit: wait
      };

      /* Define object for the following states: 'default', 'entering', 'entered', 'exiting', 'exited' */
      const transitionStyles = {
        default: { opacity: 0, visibility: 'hidden' },
        entering: { opacity: 0, visibility: 'hidden' },
        entered: {
          transition: `visibility 0ms linear ${timeout.enter}ms, opacity ${timeout.enter}ms linear`,
          opacity: 1.0,
          visibility: 'visible'
        },
        exiting: {},
        exited: { opacity: 0 }
      };

      /* Return the terms, wrapped in transitions */
      return (
        <GameTransition
          mountOnEnter={true}
          unmountOnExit={false}
          appear={true}
          key={match.id}
          in={match.show}
          timeout={timeout}
          transitionStyles={transitionStyles}
          onExited={id => onExited(match.id)}
        >
          <Term
            id={match.id}
            color={match.color}
            term={match.term}
            itemsPerBoard={itemsPerBoard}
            show={match.show}
            canDrag={playing}
            matched={match.matched}
            onDrop={onDrop}
          />
        </GameTransition>
      );
    });
  }

  renderDefinitions({ definitionOrder, matches, wait }) {
    return definitionOrder.map((matchIdx, idx) => {
      const match = matches[matchIdx];

      const timeout = {
        enter: ((idx + 1) / matches.length) * wait,
        exit: wait
      };

      const transitionStyles = {
        default: { opacity: 0 },
        entering: { opacity: 0 },
        entered: {
          transition: `opacity ${timeout.enter}ms cubic-bezier(.17,.67,.83,.67)`,
          opacity: 1.0,
          visibility: 'visible'
        },
        exiting: {
          transition: `opacity ${timeout.exit}ms cubic-bezier(.17,.67,.83,.67)`,
          opacity: 1.0,
          visibility: 'visible'
        },
        exited: { opacity: 0, color: '#FFFFFF', borderColor: '#FFFFFF' }
      };

      /* Return the terms, wrapped in transitions */
      return (
        <GameTransition
          mountOnEnter={true}
          unmountOnExit={false}
          appear={true}
          key={match.id}
          in={match.show}
          timeout={timeout}
          transitionStyles={transitionStyles}
        >
          <Definition
            id={match.id}
            definition={match.definition}
            term={match.term}
            show={match.show}
            matched={match.matched}
          />
        </GameTransition>
      );
    });
  }

  render() {
    // eslint-disable-next-line
    const { show, itemsPerBoard, onRoundStart, wait } = this.props;
    const terms = this.renderTerms({ ...this.props });
    const definitions = this.renderDefinitions({ ...this.props });

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
        mountOnEnter={false}
        unmountOnExit={true}
        appear={true}
        in={show}
        timeout={timeout}
        transitionStyles={transitionStyles}
        onEnter={onRoundStart}
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
  }
}

export default MatchBoard;
