import React from 'react';

const TermPreview = ({ term, itemsPerBoard, ...rest }) => {
  const previewClasses = []
    .concat('term-preview', itemsPerBoard ? [`tiles-${itemsPerBoard}`] : [])
    .join(' ')
    .trim();

  const renderHtml = value => {
    return { __html: value.replace(/(^")|("$)/g, '') };
  };

  return (
    <div className={previewClasses}>
      <div
        className="term-preview-text"
        dangerouslySetInnerHTML={renderHtml(term)}
      ></div>
    </div>
  );
};
export default TermPreview;