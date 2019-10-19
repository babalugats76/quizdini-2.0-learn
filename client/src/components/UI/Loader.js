import React from 'react';
import Spinner from './Spinner';

const Loader = ({ content = 'LOADING...' }) => {
  return (
    <div className="loading flex-center">
      <Spinner />
      <h1>{content}</h1>
    </div>
  );
};

export default Loader;
