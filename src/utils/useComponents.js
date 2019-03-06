import React from "react";

export class Draggable extends React.Component {
  state = {
    offset: {
      dx: 0,
      dy: 0
    }
  };
  ref = React.createRef();
  handleMouseDown = this.handleMouseDown.bind(this);

  handleMouseDown(event) {
    const dx = this.state.offset.dx;
    const dy = this.state.offset.dy;

    const startX = event.pageX - dx;
    const startY = event.pageY - dy;
    const handleMouseMove = event => {
      const newDx = event.pageX - startX;
      const newDy = event.pageY - startY;
      this.setState({ offset: { dx: newDx, dy: newDy } });
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener(
      "mouseup",
      () => {
        document.removeEventListener("mousemove", handleMouseMove);
      },
      { once: true }
    );
  }

  componentDidMount() {
    this.ref.current.addEventListener("mousedown", this.handleMouseDown);
  }

  componentWillUnmount() {
    this.ref.current.removeEventListener("mousedown", this.handleMouseDown);
  }

  render() {
    return (
      <div
        ref={this.ref}
        style={{
          transform: `translate3d(${this.state.offset.dx}px, ${
            this.state.offset.dy
          }px, 0)`
        }}
      >
        {this.props.children}
      </div>
    );
  }
}
