import React from 'react';
import '../lib/Utils';

export default React.createClass({

  statics: {
    isNotes: function (e) {
      return React.isValidElement(e) && e.type.displayName === 'Notes';
    }
  },

  render: function () {
    return (
      <div className="notes">
        {this.props.children}
      </div>
    )
  }

});
