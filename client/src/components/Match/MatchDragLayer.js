import React from 'react';
import { DragLayer } from 'react-dnd';
import TermPreview from './TermPreview';

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 150,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%'
};

function getItemStyles(props) {
  const { initialOffset, currentOffset } = props;
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none'
    };
  }
  let { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform
  };
}

const MatchDragLayer = props => {
  const { item, isDragging } = props;

  /* Hide preview */
  if (!isDragging) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(props)}>
        <TermPreview {...item} />
      </div>
    </div>
  );
};

export default DragLayer(monitor => ({
  item: monitor.getItem(),
  itemType: monitor.getItemType(),
  initialOffset: monitor.getInitialSourceClientOffset(),
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging()
}))(MatchDragLayer);
