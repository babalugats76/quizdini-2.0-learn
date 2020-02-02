import React, { useContext, useEffect, useRef } from "react";
import { Modal, SVG as Icon } from "../UI/";
import { MatchDispatch } from "./MatchGame";

export default ({
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
