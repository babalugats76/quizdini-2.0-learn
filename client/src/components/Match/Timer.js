import React, { useContext, useEffect, useReducer } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import { useInterval, usePrevious } from "../../hooks/";
import { GameTransition } from "../UI/";
import { MatchDispatch } from "./MatchGame";

function initTimer({ duration, interval }) {
    return {
      active: false, // whether timer is actively counting down
      duration, // seconds (to countdown from)
      initialized: false, // whether timer has begun
      interval, // millisecond intervals of each countdown reduction
      progress: 0, // % of countdown complete thus far
      showTransition: false, // whether to show timer transition
      success: false, // whether last user attempt was successful (or not)
      remaining: 0 // seconds left on timer
    };
  }
  
  function timerReducer(state, action) {
    switch (action.type) {
      case "COUNTDOWN": {
        const { duration, interval } = state; // prevState
        const remaining = state.remaining - interval / 1000; // local variables
        const progress = Math.ceil(((duration - remaining) / duration) * 100);
        const active = remaining >= 0 ? true : false;
        return { ...state, active, progress, remaining };
      }
      case "START":
        return {
          ...state,
          active: true,
          complete: false,
          initialized: true,
          progress: 0,
          remaining: state.duration,
          showTransition: false,
          success: true
        };
      case "TRANSITION":
        return { ...state, showTransition: action.show, success: action.success };
      default:
        return state;
    }
  }
  
  /**
   * Timer component.
   *
   * To debug:
   * ```
   *  useEffect(() => {
   *     console.log(JSON.stringify(state, null, 3));
   *  }, [state]);
   * ```
   */
  
export default ({ correct, duration, incorrect, interval, playing, score, wait }) => {
    const matchDispatch = useContext(MatchDispatch);
    const [state, dispatch] = useReducer(timerReducer, { duration, interval }, initTimer);
    const { active, initialized, progress, showTransition, success } = state;
  
    // Side effect which starts the timer
    useEffect(() => {
      playing && dispatch({ type: "START" });
    }, [playing]);
  
    // Side effect which manages timer's countdown
    useInterval(() => dispatch({ type: "COUNTDOWN" }), active ? interval : null);
  
    // Previous values (needed for hit/miss)
    const prevCorrect = usePrevious(correct, 0);
    const prevIncorrect = usePrevious(incorrect, 0);
  
    // Side effect that triggers hit/miss transitions
    useEffect(
      () => {
        if (correct !== prevCorrect || incorrect !== prevIncorrect) {
          const success = correct > prevCorrect ? true : false;
          dispatch({ type: "TRANSITION", show: true, success });
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [correct, incorrect]
    );
  
    useEffect(() => {
      if (initialized && !active) {
        matchDispatch({ type: "PLAYING", playing: false });
        setTimeout(() => matchDispatch({ type: "GAME_OVER" }), 2000);
      }
    }, [active, initialized, matchDispatch]);
  
    /* Define object for the following states: 'default', 'entering', 'entered', 'exiting', 'exited' */
    const transitionStyles = {
      default: { opacity: 0 },
      entering: { opacity: 0 },
      entered: {
        transition: `all ${wait}ms cubic-bezier(.17,.67,.83,.67)`,
        opacity: 1.0
      },
      exiting: {
        transition: `all ${wait}ms cubic-bezier(.17,.67,.83,.67)`,
        opacity: 0.1
      },
      exited: { opacity: 0 }
    };
  
    const progressStyles = {
      default: { opacity: 1.0 },
      entering: {
        transition: `transform cubic-bezier(1, 0, 0, 1)`,
        transform: "scale(1, 1)"
      },
      entered: { transform: "scale(1, 1)", opacity: 1.0 },
      exiting: {
        transition: `transform cubic-bezier(1, 0, 0, 1)`,
        transform: "scale(1.05, 1.05)",
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
  
    const progressColor = progress <= 70 ? colors.GREEN : progress <= 85 ? colors.YELLOW : colors.RED;
  
    return (
      <GameTransition
        appear={false}
        in={playing}
        mountOnEnter={false}
        timeout={wait}
        transitionStyles={transitionStyles}
        unmountOnExit={false}
      >
        <div id="timer">
          <GameTransition
            appear={false}
            mountOnEnter={false}
            unmountOnExit={false}
            in={!showTransition}
            timeout={wait}
            transitionStyles={progressStyles}
            onExited={() => dispatch({ type: "TRANSITION", show: false })}
          >
            <div className="timer-wrapper">
              <div className="progress-bar-wrapper">
                <CircularProgressbar
                  background
                  classes={classes}
                  counterClockwise
                  value={progress}
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
          </GameTransition>
        </div>
      </GameTransition>
    );
  };