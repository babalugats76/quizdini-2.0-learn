import React, { Component } from 'react';
import PropTypes from 'prop-types';

class NotFound extends Component {
  constructor(props) {
    super(props);
    const { location: { state: { message } = {} } = {}, history } = this.props;
    this.state = { message };
    history.replace({ pathname: '/404', state: {} });
  }

  componentDidMount() {
    const pageTitle = [
      process.env.REACT_APP_WEBSITE_NAME,
      'Not Found (404)'
    ].join(' | ');
    document.title = pageTitle;
  }

  render() {
    const { message: { content = '', header = '' } = {} } = this.state;
    return (
      <div id="notfound" className="full-page purple">
        <div className="fixed-center">
          {header && <h1>{header}</h1>}
          {content && <p>{content}</p>}
        </div>
      </div>
    );
  }
}

NotFound.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

export default NotFound;
