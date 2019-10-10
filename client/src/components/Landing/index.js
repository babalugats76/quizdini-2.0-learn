import React from "react";

const Landing = props => {
  return (
    <div className="full-page purple">
      <div id="landing" className="flex-center">
        <h1 id="welcome">Welcome to Quizdini!</h1>
        <img
          alt="Awesome Quizdini Marketing Goes Here..."
          id="marketing"
          src="https://loremflickr.com/500/500"
        />
        <p>
          Are you a teacher? Visit the&nbsp;
          <a
            href={process.env.REACT_APP_TEACH_BASE_URL}
            title="Quizdini - EdTech That's Lit!">
            Teacher Website
          </a>
          &nbsp;and start making activities for your students today!
        </p>
        <div id="fineprint">Copyright &copy; Quizdini, 2013-2019</div>
      </div>
    </div>
  );
};

export default Landing;
