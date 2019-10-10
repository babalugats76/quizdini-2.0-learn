import React, { Component } from "react";
import PropTypes from "prop-types";

class NotFound extends Component {
  constructor(props) {
    super(props);
    const { location: { state: { message } = {} } = {}, history } = this.props;
    this.state = { message };
    history.replace({ pathname: "/404", state: {} });
  }

  componentDidMount() {
    const pageTitle = [
      process.env.REACT_APP_WEBSITE_NAME,
      "Not Found (404)"
    ].join(" | ");
    document.title = pageTitle;
  }

  render() {
    const {
      message: { content = "", header = "" } = {}
    } = this.state;
    return (
      <div className="full-page purple">
        <div id="notfound" className="flex-center">
          <h1>
            Oh no!
            <br />
            {header || "Could not find that..."}
          </h1>
          <img
            alt="Awesome Quizdini Marketing Goes Here..."
            id="marketing"
            src="https://loremflickr.com/500/500"
          />
          {content && <p id="explanation">{content}</p>}
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
