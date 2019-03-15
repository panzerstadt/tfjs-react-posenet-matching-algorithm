import React, { Component } from "react";
import chroma from "chroma-js";
import * as d3 from "d3";

import cosineSimilarity from "../../utils/cosineSimilarity";
import { Draggable } from "../../utils/useComponents";

const POSE_1 = require("./data/gwara-gwara-rahmat.json");
const POSE_2 = require("./data/gwara-gwara-lq-from-400.json");

/*
the main thrust is that

you calculate cosine similarity between poses, and to match poses
instead of a vp-tree search on a database of images with poses,
you vp-tree search on a timeline of poses, and return the closest one,
as well as how far away from the correct timestep you are when you are
performing this pose.

ref: https://medium.com/tensorflow/move-mirror-an-ai-experiment-with-pose-estimation-in-the-browser-using-tensorflow-js-2f7b769f9b23
*/

const POSE_1_cleanup = PoseArray => {
  return PoseArray.slice(120, PoseArray.length - 45);
};

const POSE_2_cleanup = PoseArray => {
  let output;
  if (PoseArray.poseRecords) {
    output = PoseArray.poseRecords;
  }

  return output.slice(400, output.length - 25);
};

function remap(value, low1, high1, low2, high2) {
  return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

const calculatePoseDomain = pose => {
  const keypoints = pose.keypoints;
  const x = keypoints.map(v => v.position.x);
  const y = keypoints.map(v => v.position.y);

  const xDomain = d3.extent(x);
  const yDomain = d3.extent(y);

  return { x: xDomain, y: yDomain };
};

const findClosestPoses = (
  currentIndex,
  poseSet,
  count = 5,
  includeDist = false
) => {
  const index = currentIndex;
  // find n closest poses compared to input pose and its index
  const split = Math.round(count / 2);
  // the first item in leftHalf is the current index
  const leftHalf = Array(split)
    .fill(split)
    .map((v, i) => Math.max(index - i, 0));

  const rightHalf = Array(count - split)
    .fill(count - split)
    .map((v, i) => index + 1 + i);

  const closestNIndices = [...leftHalf, ...rightHalf].sort((a, b) => a - b);

  if (includeDist) {
    return closestNIndices.map((v, i) => {
      return {
        distance: Math.abs(index - v),
        index: v,
        pose: poseSet[v]
      };
    });
  } else {
    return closestNIndices.map(v => poseSet[v]);
  }
};

const vectorizePose = (pose, resize = true) => {
  let arrayOut;

  if (!pose || pose.length === 0) return [];

  // maintain pose order
  // WARNING: this actually screws up the skeleton drawing function
  // from posenet
  // const keypoints = pose.keypoints.sort((a, b) => {
  //   const x = a.part;
  //   const y = b.part;

  //   if (x < y) return -1;
  //   if (x > y) return 1;
  //   return 0;
  // });
  const keypoints = pose.keypoints;

  // resize == remap x and y to 0 to 1
  if (resize) {
    const { x, y } = calculatePoseDomain(pose);
    const xMin = x[0];
    const xMax = x[1];
    const yMin = y[0];
    const yMax = y[1];

    //todo test this
    arrayOut = [].concat.apply(
      [],
      keypoints.map(v => [
        remap(v.position.y, yMin, yMax, 0, 1),
        remap(v.position.x, xMin, xMax, 0, 1)
      ])
    );
  } else {
    arrayOut = [].concat.apply(
      [],
      keypoints.map(v => [v.position.y, v.position.x])
    );
  }

  return arrayOut;
};

class VisualizePose extends Component {
  static defaultProps = {
    colors: ["#eb6a5b", "#b6e86f", "#52b6ca"],
    data: [],
    compareData: [],
    height: 300,
    width: 300,
    normalize: true
  };

  state = {
    scale: null,
    x: [],
    xGhost: [],
    y: [],
    yGhost: [],
    points: []
  };

  //lineGenerator = d3.line()
  pointGenerator(xList, yList, size = 5, clr = this.props.color || "yellow") {
    return xList.map((v, i) => (
      <circle key={i} cx={v} cy={yList[i]} r={size} fill={clr} />
    ));
  }

  xScale = d3.scaleLinear().range([0, this.props.height / 2]);
  yScale = d3.scaleLinear().range([0, this.props.width / 2]);

  xAxis = d3.axisBottom().scale(this.xScale);
  yAxis = d3.axisLeft().scale(this.yScale);

  preparePose(poseData, type = "main") {
    // only takes first 34 items
    let keypoints = poseData;

    if (keypoints.length !== 34) {
      if (keypoints.length < 34) {
        // console.log(
        //   "not enough keypoints. vector must be at least 34 values long."
        // );
      }
      //console.log("pose vector shorted to first 34 items in array");
      //console.log(keypoints);
      keypoints = keypoints.slice(0, 34);
    }

    let xList = [];
    let yList = [];
    keypoints.map((v, i) => {
      const scaled = this.props.normalize ? this.props.height * v : v;
      i % 2 ? xList.push(scaled) : yList.push(scaled);
      return true;
    });

    if (type === "main") {
      this.setState({ x: xList, y: yList });
    } else {
      this.setState({ xGhost: xList, yGhost: yList });
    }
  }

  updateScales() {
    if (this.props.data) {
      const xDomain = d3.extent(this.state.x);
      const yDomain = d3.extent(this.state.y);

      this.xScale.domain(xDomain);
      this.yScale.domain(yDomain);
    }
  }

  componentDidMount() {
    // make color function from given colors
    this.setState({ scale: chroma.scale(this.props.colors) });
    // split pose vector back into into x and y

    this.updateScales();

    this.preparePose(this.props.data);
    if (this.props.compareData)
      this.preparePose(this.props.compareData, "secondary");
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.data !== this.props.data) {
      this.preparePose(this.props.data);
      if (this.props.compareData)
        this.preparePose(this.props.compareData, "secondary");
    }
  }

  render() {
    const pose = this.pointGenerator(
      this.state.x,
      this.state.y,
      this.props.height >= 300 ? 5 : 2
    );

    const ghostPose = this.props.compareData
      ? this.pointGenerator(
          this.state.xGhost,
          this.state.yGhost,
          this.props.height >= 300 ? 3 : 1,
          "#e1e1e155"
        )
      : [];

    return (
      <div
        style={{
          margin: this.props.height >= 300 ? 30 : 10,
          padding: this.props.height >= 300 ? 20 : 5,

          width: this.props.width,
          height: this.props.height,
          backgroundColor: this.props.bgColor ? this.props.bgColor : "lightgrey"
        }}
      >
        <svg width={this.props.width} height={this.props.height}>
          {pose}
          {ghostPose}
        </svg>
      </div>
    );
  }
}

export default class PoseMatch extends Component {
  static defaultProps = {
    normalize: true,
    delay: 100,
    compareCount: 6
  };
  mainRef = React.createRef();

  state = {
    currentFrame: 0,
    framesToCompare: 6,
    pose1: [],
    pose2: [],
    allPoses1: [],
    allPoses2: [],
    isPaused: false,
    score: {
      highest: 0,
      current: 0,
      all: []
    }
  };

  componentDidMount() {
    //console.log(POSE_1);
    //console.log(POSE_2_cleanup(POSE_2));

    const p1 = POSE_1_cleanup(POSE_1);
    const p2 = POSE_2_cleanup(POSE_2);

    this.setState({ allPoses1: p1, allPoses2: p2 });
    this.animatePose(p1, this.props.delay, p2, this.props.normalize);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.isPaused !== this.state.isPaused) {
      if (!this.state.isPaused) {
        this.animatePose(
          this.state.allPoses1,
          this.props.delay,
          this.state.allPoses2,
          this.props.normalize,
          this.state.currentFrame
        );
      }
    }
    if (prevState.currentFrame !== this.state.currentFrame) {
      this.calculatePoseSimilarity();
    }
  }

  animatePose(pose, delay = 100, matchingPose, resize = true, fromIndex) {
    let i = fromIndex || 0;

    const animator = () => {
      if (i < pose.length) {
        const t = vectorizePose(pose[i], resize);
        this.setState({ pose1: t, currentFrame: i });

        if (matchingPose && matchingPose[i]) {
          const m = vectorizePose(matchingPose[i], resize);
          this.setState({ pose2: m });
        }

        i++;
        if (this.state.isPaused) {
        } else {
          setTimeout(animator, delay);
        }
      }
    };

    animator();
  }

  calculatePoseSimilarity() {
    const PENALTY = 0.001;
    const currentPose = this.state.pose2;

    const out = findClosestPoses(
      this.state.currentFrame,
      this.state.allPoses1,
      this.state.framesToCompare,
      true
    ).map((v, i) => {
      if (v.pose) {
        const t = vectorizePose(v.pose, true);

        const sim =
          t.length > 0 && currentPose.length > 0
            ? cosineSimilarity(t, currentPose).toFixed(4)
            : 0;

        // weighted by score
        const weightedSim = v.pose.score * sim;
        // penalized by distance from current frame
        const finalSim = weightedSim - v.distance * PENALTY;

        return {
          distance: v.distance,
          score: finalSim,
          cosineSimilarity: sim,
          weightedSimilarity: weightedSim,
          index: v.index
        };
      } else {
        return {
          distance: 1,
          score: 0,
          cosineSimilarity: 0,
          weightedSimilarity: 0,
          index: v.index
        };
      }
    });

    const highest = out
      .map(v => v.score)
      .sort((a, b) => a - b)
      .reverse()[0];

    const current = out.filter(v => v.distance === 0)[0].score;

    this.setState({
      score: {
        highest: highest,
        current: current,
        all: out
      }
    });
  }

  render() {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          {this.state.score.all.map((v, i) => {
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center"
                }}
              >
                <VisualizePose
                  height={100}
                  width={100}
                  data={vectorizePose(this.state.allPoses1[v.index])}
                  color="#F0803C"
                  bgColor="#225560"
                  normalize={true}
                />

                <code style={{ fontSize: 10 }}>
                  {i - 2}:{" "}
                  <span style={{ opacity: remap(v.score, 0.75, 1, 0, 1) }}>
                    {v.score.toFixed(4)}
                  </span>
                </code>
              </div>
            );
          })}
        </div>
        <Draggable>
          <VisualizePose
            data={this.state.pose2}
            compareData={this.state.pose1}
            color="#F2E94E"
            bgColor="#DA3E52"
            normalize={true}
          />
          <code style={{ fontSize: 13 }}>
            frame-by-frame:{" "}
            {this.state.pose1.length > 0
              ? this.state.score.current.toFixed(4)
              : ""}
          </code>
          <br />
          <code style={{ fontSize: 13 }}>
            best score from {this.state.framesToCompare} frames:{" "}
            {this.state.pose1.length > 0
              ? this.state.score.highest.toFixed(4)
              : ""}
          </code>
          <br />
          <br />
          <span>
            number of frames to compare:{" "}
            <input
              style={{ fontSize: 12, width: 30 }}
              type="number"
              value={this.state.framesToCompare}
              onChange={n =>
                this.setState({ framesToCompare: Math.max(n.target.value, 2) })
              }
            />
          </span>
          <br />
          <br />
          <button
            onClick={() => this.setState({ isPaused: !this.state.isPaused })}
          >
            pause
          </button>{" "}
          <button onClick={() => this.setState({ currentFrame: 0 })}>
            reset
          </button>
        </Draggable>
      </div>
    );
  }
}
