import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

const termSource = {
  canDrag(props, monitor) {
    return props.canDrag;
  },

  beginDrag(props) {
    return { ...props };
  },

  endDrag(props, monitor) {
    if (monitor.didDrop()) {
      return props.onDrop(monitor.getDropResult());
    }
  }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}

function getStyles({ style, isDragging }) {
  // Combine existing style object with dragging-specific logic
  return { ...style, ...(isDragging && { opacity: 0 }) };
}

class Term extends Component {
  componentDidMount() {
    const { connectDragPreview } = this.props;
    if (connectDragPreview) {
      connectDragPreview(getEmptyImage(), {
        captureDraggingState: true
      });
    }
  }

  renderHtml = (value) => {
    return {__html: value.replace(/(^")|("$)/g, '')};
  };

  render() {
    const {
      color,
      connectDragSource,
      matched,
      show,
      style, // *important* - contains inline style from GameTransition
      term,
      isDragging
    } = this.props;

    const termClasses = []
      .concat(
        'term',
        isDragging ? ['dragging'] : [],
        !show ? ['exiting'] : [],
        matched ? ['matched'] : [],
        color
      )
      .join(' ')
      .trim();
    return connectDragSource(
      <div style={getStyles({style, isDragging})} className={termClasses}>
        <div className="term-text" dangerouslySetInnerHTML={this.renderHtml(term)}></div>
      </div>
    );
  }
}

export default DragSource('Match', termSource, collect)(Term);