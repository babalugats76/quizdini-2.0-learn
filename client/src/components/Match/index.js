import '../../match.scss';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import { isEmpty } from './utils';
import Loading from '../UI/Loading';
import MatchGame from './MatchGame';

const Error = ({ error }) => {
  return (
    <div className="error fixed-center">
      <h1>Error</h1>
      <div>
        `${error.status}` - `${error.status}`
      </div>
    </div>
  );
};

class Match extends Component {
  handlePing = this.handlePing.bind(this);
  constructor(props) {
    super(props);
    this.state = {
      matchId: props.match.params.id || null
    };
  }

  componentDidMount() {
    setTimeout(() => {
      this.fetchGame();
    }, 500);
  }

  async fetchGame() {
    const { fetchMatch } = this.props;
    const { matchId } = this.state;
    await fetchMatch(matchId);
    const { matchGame: { game } = {} } = this.props;
    if (isEmpty(game)) {
      return setTimeout(() => {
        this.props.history.push('/404', {
          message: {
            header: 'Game Not Found',
            content: `"${matchId}" is not a valid game id`
          }
        });
      }, 500);
    }
    const { title } = game;
    const pageTitle = [process.env.REACT_APP_WEBSITE_NAME, title].join(' | ');
    document.title = pageTitle;
  }

  async handlePing(results) {
    console.log('results in handlePing...');
    console.log(results);
    const { firePing } = this.props;
    const { matchId } = this.state;
    firePing(matchId, 'M', results);
  }

  renderGame({ matchGame }) {
    const { error, loading, game } = matchGame;
    if (error) return <Error error={error} />;
    if (loading || isEmpty(game)) return <Loading />;
    return (
      <MatchGame game={game} onPing={results => this.handlePing(results)} />
    );
  }

  render() {
    const game = this.renderGame(this.props);
    return <div className="full-page purple">{game}</div>;
  }
}

const mapStateToProps = ({ matchGame, ping }) => ({ matchGame, ping });

Match.propTypes = {
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default connect(
  mapStateToProps,
  actions
)(Match);
