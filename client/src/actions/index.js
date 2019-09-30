import axios from 'axios';
import * as TYPES from './types';

/**
 * MATCH SECTION
 * Actions used to perform get match info
 */

export const matchBegin = () => async dispatch => {
  dispatch({ type: TYPES.MATCH_BEGIN });
};

export const matchSuccess = match => async dispatch => {
  dispatch({ type: TYPES.MATCH_SUCCESS, payload: { match } });
};

export const matchFailure = error => async dispatch => {
  dispatch({ type: TYPES.MATCH_FAILURE, payload: { error } });
};

export const fetchMatch = matchId => async dispatch => {
  try {
    dispatch(matchBegin());
    const res = await axios.get(`/api/match/${matchId}`);
    dispatch(matchSuccess(res.data));
  } catch (e) {
    dispatch(matchFailure(e.response.data));
  }
};

/**
 * PING SECTION
 * Actions used to perform game ping
 */

export const pingBegin = () => async dispatch => {
  dispatch({ type: TYPES.PING_BEGIN });
};

export const pingSuccess = ping => async dispatch => {
  console.log('ping successfully fired (ack with backend)...');
  dispatch({ type: TYPES.PING_SUCCESS, payload: { ping } });
};

export const pingFailure = error => async dispatch => {
  dispatch({ type: TYPES.PING_FAILURE, payload: { error } });
};

export const firePing = (gameId, gameType, results) => async dispatch => {
  try {
    dispatch(pingBegin());
    console.log('Firing ping...');
    const res = await axios.post('/api/ping/', {
      gameId,
      gameType,
      results // Object with game results
    });
    dispatch(pingSuccess(res.data));
  } catch (e) {
    dispatch(pingFailure(e.response.data));
  }
};
