import * as TYPES from '../actions/types';

const initialState = {
  ping: null,
  loading: false,
  error: null
};

export default function(state = initialState, action) {
  switch (action.type) {
    case TYPES.PING_BEGIN:
      return {
        ...state,
        loading: true,
        error: null
      };
    case TYPES.PING_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        ping: action.payload.ping
      };
    case TYPES.PING_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        ping: null
      };
    default:
      return state;
  }
}
