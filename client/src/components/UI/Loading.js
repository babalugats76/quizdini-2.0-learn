import React from 'react';
import Spinner from '../UI/Spinner';

const Loading = () => {
  return (
    <div className="loading fixed-center">
      <Spinner />
      <h1>LOADING...</h1>
    </div>
  );
};

export default Loading;
