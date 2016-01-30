import React from 'react';
import '../lib/Utils';

export default React.createClass({

  propTypes: {
    unveil: React.PropTypes.object.isRequired,
    controls: React.PropTypes.array.isRequired
  },

  getSlide: function (indices) {
    let slide = this.props.unveil.slides.toList()[indices[0]];
    if(indices.length > 1 )
      return slide.props.children.toList()[indices[1]];
    else
      return slide
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
        {this.getSlide(this.props.unveil.routerState.indices)}
      </div>
    )
  }

});
