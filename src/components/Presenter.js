import React from 'react';
import '../lib/Utils';

export default React.createClass({

  propTypes: {
    slides: React.PropTypes.array.isRequired,
    routerState: React.PropTypes.object.isRequired
  },

  getSlide: function (indices) {
    let slide = this.props.slides.toList()[indices[0]];
    if(indices.length > 1 )
      return slide.props.children.toList()[indices[1]];
    else
      return slide
  },

  controlsElements: function () {
    let controls = this.getMode().controls.map( (control) => {
      const props = {
        key: control.displayName,
        navigator: this.navigator,
        stateSubject: this.stateSubject
      };
      return React.createElement(control, props);
    });

    return React.createElement('controls', null, controls);
  },


  render: function () {
    return (
      <div>
        {this.controlsElements()}
        {this.getSlide(this.props.routerState.indices)}
      </div>
    )
  }

});
