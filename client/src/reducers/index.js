import { combineReducers } from 'redux';
import matchGame from './matchGame';
import ping from './ping';

export default combineReducers({
  matchGame, // To avoid confusion with react-router 'match' prop
  ping
});
