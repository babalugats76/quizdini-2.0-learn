import React, { Component } from 'react';
import GameTransition from '../UI/GameTransition';
import Definition from './Definition';
import Term from './Term';

class MatchBoard extends Component {
  renderTerms({
    itemsPerBoard,
    matches,
    terms,
    definitions,
    onDrop,
    onExited,
    playing,
    termOrder,
    wait
  }) {
    return termOrder.map((termIdx, idx) => {
      const term = terms[termIdx];

      /* Dynamically determine enter/exit transition times, i.e., achieve brick-laying effect */
      const timeout = {
        enter: ((idx + 1) / terms.length) * wait,
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
          key={term.id}
          in={term.show}
          timeout={timeout}
          transitionStyles={transitionStyles}
          onExited={(id, type) => onExited(term.id, 'term')}
        >
          <Term
            id={term.id}
            color={term.color}
            term={term.term}
            definition={term.definition}
            itemsPerBoard={itemsPerBoard}
            show={term.show}
            canDrag={playing}
            matched={term.matched}
            onDrop={onDrop}
          />
        </GameTransition>
      );
    });
  }

  renderDefinitions({ definitionOrder, definitions, matches, wait, onExited }) {
    return definitionOrder.map((defIdx, idx) => {
      const definition = definitions[defIdx];

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
          key={definition.id}
          in={definition.show}
          timeout={timeout}
          transitionStyles={transitionStyles}
          onExited={(id, type) => onExited(definition.id, 'definition')}
        >
          <Definition
            id={definition.id}
            definition={definition.definition}
            term={definition.term}
            show={definition.show}
            matched={definition.matched}
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
