import React from 'react';
import PropTypes from 'prop-types';
import GameTransition from './GameTransition';

const timeout = {
  enter: 500,
  exit: 500
};

const transitionStyles = {
  default: {
    opacity: 0,
    transform: 'scale(.7)',
    boxShadow: 'none',
    transition: `all ${timeout.enter}ms`
  },
  entering: {
    opacity: 0,
    transform: 'scale(.7)',
    backgroundShadow: 'none',
    transition: `all ${timeout.enter}ms`,
    boxShadow: '10px 10px 45px 0px rgba(0, 0, 0, 0.0)'
  },
  entered: {
    transition: `opacity ${timeout.enter}ms cubic-bezier(0.25, 0.5, 0.5, 0.9), transform ${timeout.enter}ms cubic-bezier(0.25, 0.5, 0.5, 0.9)`,
    opacity: 1.0,
    visibility: 'visible',
    transform: 'scale(1)',
    boxShadow: '10px 10px 45px 0px rgba(0, 0, 0, 0.3)'
  },
  exiting: {
    transition: `opacity ${timeout.exit}ms cubic-bezier(0.25, 0.5, 0.5, 0.9), transform ${timeout.exit}ms cubic-bezier(0.25, 0.5, 0.5, 0.9)`,
    transform: 'scale(.7)',
    visibility: 'visible',
    boxShadow: 'none'
  },
  exited: {
    visibility: 'hidden',
    opacity: 0,
    boxShadow: 'none'
  }
};

const Modal = ({ handleClose, show, children }) => {
  const showHideClassName = show ? 'modal modal-show' : 'modal';

  return (
    <React.Fragment>
      <div className={showHideClassName}>
        <GameTransition
          mountOnEnter={true}
          unmountOnExit={false}
          appear={true}
          key="splash"
          in={show}
          timeout={timeout}
          transitionStyles={transitionStyles}
        >
          <div className="modal-content">{children}</div>
        </GameTransition>
      </div>
      <div className="modal-overlay"></div>
    </React.Fragment>
  );
};

Modal.propTypes = {
  handleClose: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  children: PropTypes.any
};

Modal.defaultProps = {
  show: false
};

export default Modal;
