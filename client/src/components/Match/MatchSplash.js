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
        <section id="splash-banner">
          <img
            className="game-banner"
            src="https://loremflickr.com/800/250"
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
          <div id="options">
            <span className="items-per-board">
              {itemsPerBoard} items per board
            </span>
            <span className="duration">{duration} seconds</span>
          </div>
          {!showResults && <div className="instructions">{instructions}</div>}
        </section>
        <section id="splash-footer">
          <button
            id="play"
            onClick={onGameStart}
            onKeyPress={onGameStart}
            tabIndex={1}
          >
            {showResults ? 'Play Again' : 'Play Game'}
          </button>
        </section>
      </div>
    </Modal>
  );
};

export default MatchSplash;
