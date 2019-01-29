import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

import PoseMatch from "./components/PoseMatch";

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div className="App-content">
            you calculate cosine similarity between poses, and to match poses
            instead of a vp-tree search on a database of images with poses, you
            vp-tree search on a timeline of poses, and return the closest one,
            as well as how far away from the correct timestep you are when you
            are performing this pose.
            <br />
            <br />
            ref:{" "}
            <a
              href="https://medium.com/tensorflow/move-mirror-an-ai-experiment-with-pose-estimation-in-the-browser-using-tensorflow-js-2f7b769f9b23"
              rel="noopener noreferer"
              target="_blank"
            >
              MoveMirror
            </a>
            <ol style={{ textAlign: "left" }}>
              <lh>Todo:</lh>
              <li>[DONE] turn poses into 34-float vectors</li>
              <li>resize and normalize</li>
              <li>append to get 52-float vectors</li>
              <li>calculate cosine similarity for each set</li>
              <li>weighted matching</li>
              <li>vp-tree search, first on a database of poses</li>
              <li>then on the list of comparison poses</li>
            </ol>
            <PoseMatch />
          </div>
        </header>
      </div>
    );
  }
}

export default App;
