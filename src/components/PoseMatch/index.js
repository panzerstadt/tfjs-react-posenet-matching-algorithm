import React, { Component } from "react";
import chroma from "chroma-js";
import * as d3 from "d3";

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

const similarity = require("compute-cosine-similarity");

const comparePoses = (PoseArray1, PoseArray2) => {
  // cosine similarity between two poses
  let cosineSimilarity = similarity(PoseArray1, PoseArray2);
  let distance = 2 * (1 - cosineSimilarity);
  return Math.sqrt(distance);
};

const vectorizePose = pose => {
  const keypoints = pose.keypoints.sort((a, b) => {
    const x = a.part;
    const y = b.part;

    if (x < y) return -1;
    if (x > y) return 1;
    return 0;
  });

  const arrayOut = [].concat.apply(
    [],
    keypoints.map(v => [v.position.y, v.position.x])
  );

  // resize == remap x and y to 0 to 1

  return arrayOut;
};

class VisualizePose extends Component {
  static defaultProps = {
    colors: ["#eb6a5b", "#b6e86f", "#52b6ca"],
    data: [],
    height: 600,
    width: 800
  };

  state = {
    scale: null,
    x: [],
    y: [],
    points: []
  };

  //lineGenerator = d3.line()
  pointGenerator(xList, yList, size = 5) {
    return xList.map((v, i) => (
      <circle
        cx={v}
        cy={yList[i]}
        r={size}
        fill={this.props.color ? this.props.color : "yellow"}
      />
    ));
  }

  xScale = d3.scaleLinear().range([0, this.props.height / 2]);
  yScale = d3.scaleLinear().range([0, this.props.width / 2]);

  xAxis = d3.axisBottom().scale(this.xScale);
  yAxis = d3.axisLeft().scale(this.yScale);

  preparePose(poseData) {
    // only takes first 34 items
    let keypoints = poseData;

    if (keypoints.length !== 34) {
      if (keypoints.length < 34) {
        throw "not enough keypoints. vector must be at least 34 values long.";
      }
      console.log("pose vector shorted to first 34 items in array");
      console.log(keypoints);
      keypoints = keypoints.slice(0, 34);
    }

    let xList = [];
    let yList = [];
    keypoints.map((v, i) => {
      i % 2 ? xList.push(v) : yList.push(v);
    });
    this.setState({ x: xList, y: yList });
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
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.data !== this.props.data) {
      this.preparePose(this.props.data);
    }
  }

  render() {
    const pose = this.pointGenerator(this.state.x, this.state.y);

    return (
      <div
        style={{
          margin: 10,
          backgroundColor: this.props.bgColor ? this.props.bgColor : "lightgrey"
        }}
      >
        <svg width={this.props.width} height={this.props.height}>
          {pose}
        </svg>
      </div>
    );
  }
}

export default class PoseMatch extends Component {
  state = {
    poses: [],
    pose2: []
  };

  componentDidMount() {
    console.log(POSE_1);
    console.log(POSE_2_cleanup(POSE_2));

    const p1 = POSE_1_cleanup(POSE_1);
    const p2 = POSE_2_cleanup(POSE_2);

    this.animatePose(p1, 33, p2);
  }

  animatePose(poses, delay = 100, matchingPose) {
    let i = 0;

    const animator = () => {
      if (i < poses.length) {
        const t = vectorizePose(poses[i]);
        this.setState({ poses: t });

        if (matchingPose && matchingPose[i]) {
          const m = vectorizePose(matchingPose[i]);
          this.setState({ pose2: m });
        }
        i++;
        setTimeout(animator, delay);
      }
    };

    animator();
  }

  render() {
    if (this.state.poses.length > 0) {
      return (
        <>
          <VisualizePose
            data={this.state.poses}
            color="#F0803C"
            bgColor="#225560"
          />
          <VisualizePose
            data={this.state.pose2}
            color="#F2E94E"
            bgColor="#DA3E52"
            normalize
          />
        </>
      );
    } else {
      return <div />;
    }
  }
}
