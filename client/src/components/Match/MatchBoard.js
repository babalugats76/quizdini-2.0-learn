import React from 'react';
import GameTransition from '../UI/GameTransition';
import Definition from './Definition';
import Term from './Term';

const MatchBoard = props => {
  const renderTerms = ({
    itemsPerBoard,
    onDrop,
    onExited,
    playing,
    terms,
    wait
  }) => {
    return terms.map((term, idx) => {
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
          appear={true}
          in={term.show}
          key={term.id}
          onExited={(id, type) => onExited(term.id, 'term')}
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

  const renderDefinitions = ({ definitions, onExited, wait }) => {
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
          appear={true}
          in={def.show}
          key={def.id}
          mountOnEnter={true}
          onExited={(id, type) => onExited(def.id, 'definition')}
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

  // eslint-disable-next-line
  const { itemsPerBoard, onRoundStart, show, wait } = props;
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

export default MatchBoard;
