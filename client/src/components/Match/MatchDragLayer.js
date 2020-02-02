import React from "react";
import { DragLayer } from "react-dnd";

const layerStyles = {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 150,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%"
  };
  
  function getItemStyles(props) {
    const { initialOffset, currentOffset } = props;
    if (!initialOffset || !currentOffset) {
      return {
        display: "none"
      };
    }
    let { x, y } = currentOffset;
    const transform = `translate(${x}px, ${y}px)`;
    return {
      transform,
      WebkitTransform: transform
    };
  }
  
  export default DragLayer((monitor, props) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging()
  }))(props => {
    const { item, isDragging } = props;
    if (!isDragging) return null; // hide preview
  
    return (
      <div style={layerStyles}>
        <div style={getItemStyles(props)}>
          <TermPreview {...item} />
        </div>
      </div>
    );
  });
  
  const TermPreview = ({ term, itemsPerBoard }) => {
    const previewClasses = []
      .concat("term-preview", itemsPerBoard ? [`tiles-${itemsPerBoard}`] : [])
      .join(" ")
      .trim();
  
    const renderHtml = value => {
      return { __html: value.replace(/(^")|("$)/g, "") };
    };
  
    return (
      term && (
        <div className={previewClasses}>
          <div className="term-preview-text" dangerouslySetInnerHTML={renderHtml(term)}></div>
        </div>
      )
    );
  };