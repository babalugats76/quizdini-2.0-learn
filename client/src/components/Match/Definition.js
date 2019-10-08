import React from 'react';
import { DropTarget } from 'react-dnd';

const definitionTarget = {
  drop(props, monitor, component) {
    console.log('drop...');
    const item = monitor.getItem();
    const matched = item.definition === props.definition ? true : false;
    return {
      matched: matched,
      termId: item.id,
      definitionId: props.id,
      //id: item.id,
      term: item.term,
      definition: props.definition
    };
  }
};

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType()
  };
}

const Definition = ({
  canDrop,
  connectDropTarget,
  definition,
  isOver,
  matched,
  show,
  style
}) => {
  const renderHtml = value => {
    return { __html: value.replace(/(^")|("$)/g, '') };
  };

  const definitionClasses = []
    .concat(
      'definition',
      isOver && canDrop ? ['is-over'] : [],
      !show ? ['exiting'] : [],
      matched ? ['matched'] : []
    )
    .join(' ')
    .trim();

  return connectDropTarget(
    <div style={style} className={definitionClasses}>
      <div
        className="definition-text"
        dangerouslySetInnerHTML={renderHtml(definition)}
      ></div>
    </div>
  );
};

export default DropTarget('Match', definitionTarget, collect)(Definition);
