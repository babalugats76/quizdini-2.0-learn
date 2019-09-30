import React from 'react';
import Modal from '../UI/Modal';
import logo from './logo.svg';

const MatchSplash = ({
  author,
  duration,
  instructions,
  itemsPerBoard,
  onGameStart,
  score,
  showResults,
  showSplash,
  title
}) => {
  return (
    <Modal handleClose={onGameStart} show={showSplash}>
      <div id="splash">
        <img id="game-logo" src={logo} alt="Quizdini Logo" />
        <div id="title">{title}</div>
        <div id="author">{author}</div>
        <div id="options">
          {itemsPerBoard} items per board &bull; {duration} seconds
        </div>
        {showResults ? (
          <div id="score">
            <span className="circle">
              <span className="circle-text">{score}</span>
            </span>
          </div>
        ) : (
          <div id="instructions">{instructions}</div>
        )}
        <button
          id="play"
          onClick={onGameStart}
          onKeyPress={onGameStart}
          tabIndex={1}
        >
          {showResults ? 'Play Again' : 'Play Game'}
        </button>
      </div>
    </Modal>
  );
};

export default MatchSplash;
