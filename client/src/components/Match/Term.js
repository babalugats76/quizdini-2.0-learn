import React, { useEffect } from "react";
import { DragSource } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";

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

function termCollect(connect, monitor) {
  return {
    canDrag: monitor.canDrag(),
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}

function getStyles({ style, isDragging }) {
  // Combine existing style object with dragging-specific logic
  return { ...style, ...(isDragging && { opacity: 0 }) };
}

export default DragSource(
  "Match",
  termSource,
  termCollect
)(
  ({
    // canDrag,
    color,
    connectDragPreview,
    connectDragSource,
    isDragging,
    matched,
    show,
    style, // *important* - contains inline style from GameTransition
    term
  }) => {
    /***
     * Side effect which replaces traditional HTML5 ghost image with blank image.
     * Runs once (on mount); dependencies not important--include lint rule.
     */
    useEffect(
      () => {
        connectDragPreview &&
          connectDragPreview(getEmptyImage(), {
            captureDraggingState: true
          });
      }, // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    const renderHtml = value => ({ __html: value.replace(/(^")|("$)/g, "") });

    const termClasses = []
      .concat(
        "term",
        isDragging ? ["dragging"] : [],
        !show ? ["exiting"] : [],
        matched ? ["matched"] : [],
        color
      )
      .join(" ")
      .trim();

    return connectDragSource(
      <div style={getStyles({ style, isDragging })} className={termClasses}>
        <div className="term-text" dangerouslySetInnerHTML={renderHtml(term)}></div>
      </div>
    );
  }
);
