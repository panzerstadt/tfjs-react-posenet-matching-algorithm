import React from "react";

import "./App.css";

import PoseMatch from "./components/PoseMatch";

import { useDarkMode } from "./utils/useHooks";
import Toggle from "./components/Toggle";

const App = () => {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-content">
          <p>
            this is the comparison of two poses using cosine similarity. a
            scoring functions is defined as the pose that is the most similar in
            a pool of N number of closest frames (6 by default), penalized by
            distance of most similiar frame to the current frame.
          </p>
          <p>
            a further penalty is given to the cosine similarity calculation
            based on the given confidence score returned from posenet, so as to
            not favor poses that have been wrongly predicted.
          </p>
          ref:{" "}
          <a
            href="https://medium.com/tensorflow/move-mirror-an-ai-experiment-with-pose-estimation-in-the-browser-using-tensorflow-js-2f7b769f9b23"
            target="_blank"
            rel="noopener noreferer"
          >
            MoveMirror
          </a>
          {/* <ol style={{ textAlign: "left" }}>
            <span>Todo:</span>
            <li>[DONE] turn poses into 34-float vectors</li>
            <li>[DONE] resize and normalize</li>
            <li>append to get 52-float vectors</li>
            <li>calculate cosine similarity for each set</li>
            <li>weighted matching</li>
            <li>vp-tree search, first on a database of poses</li>
            <li>then on the list of comparison poses</li>
          </ol> */}
          <Toggle
            style={{ position: "fixed", right: 10, bottom: 10 }}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
          <PoseMatch />
        </div>
      </header>
    </div>
  );
};

export default App;
