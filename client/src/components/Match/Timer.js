import React, { useContext, useEffect, useReducer } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import { useInterval } from "../../hooks/";
import { GameTransition } from "../UI/";

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

function initTimer({ duration, interval }) {
  return {
    duration,
    interval,
    initialized: false,
    isRunning: false,
    show: false,
    secondsLeft: 0,
    showTransition: false,
    success: false
  };
}

function timerReducer(state, action) {
  switch (action.type) {
    case "COUNTDOWN": {
      const secondsLeft = state.secondsLeft - state.interval / 1000;
      console.log('isRunning', secondsLeft >= 0 ? true : false);
      return {
        ...state,
        isRunning: secondsLeft >= 0 ? true : false,
        secondsLeft,
        show: secondsLeft >= 0 ? true : false,
      };
    }
    case "SHOW":
      return {
        ...state,
        show: action.show
      };
    case "SHOW_TRANSITION":
      return {
        ...state,
        showTransition: action.show
      };
    case "START":
      console.log("Starting...");
      return {
        ...state,
        initialized: true,
        isRunning: true,
        secondsLeft: state.duration,
        show: true
      };
    default:
      return state;
  }
}

const Timer = ({ duration, interval, onTimerEnd, onTimerStart, score, wait }) => {
  
  const [state, dispatch] = useReducer(timerReducer, { duration, interval }, initTimer);
  const { initialized, isRunning, secondsLeft, show, showTransition, success } = state;

  useEffect(() => {
    setTimeout(() => {
      dispatch({ type: "START" });
      onTimerStart();
    }, wait);
  }, [onTimerStart, wait]);

  useEffect(() => {
    if (initialized && !isRunning) {
      console.log('isRunning', isRunning);
      onTimerEnd();
    }
  }, [initialized, isRunning, onTimerEnd]);

  useInterval(() => dispatch({ type: "COUNTDOWN" }), isRunning ? interval : null);

  useEffect(() => {
    console.log(JSON.stringify(state, null, 3));
  }, [state]);

  const percent = Math.ceil(((duration - secondsLeft) / duration) * 100);
  const progressColor = percent <= 70 ? colors.GREEN : percent <= 85 ? colors.YELLOW : colors.RED;

  return (
    <>
      {show && (
        <GameTransition
          mountOnEnter={false}
          unmountOnExit={false}
          appear={true}
          in={!showTransition}
          timeout={wait}
          transitionStyles={transitionStyles}
          onExited={() => dispatch({ type: "SHOW_TRANSITION", show: false })}
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

export default Timer;
