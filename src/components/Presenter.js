import React from 'react';
import '../lib/Utils';

export default React.createClass({

  propTypes: {
    unveil: React.PropTypes.object.isRequired,
    controls: React.PropTypes.array.isRequired
  },

  contextTypes: {
    slide: React.PropTypes.node.isRequired
  },

  controlsElements: function () {
    let controls = this.props.controls.map( (control) => {
      const props = {
        key: control.displayName,
        navigator: this.props.unveil.navigator,
        stateSubject: this.props.unveil.stateSubject
      };
      return React.createElement(control, props);
    });

    return React.createElement('controls', null, controls);
  },


  render: function () {
    return (
      <div>
        {this.controlsElements()}
        {this.context.slide}
      </div>
    )
  }

});
