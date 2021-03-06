import React from 'react';

import { Observable } from 'rxjs';

export default React.createClass({

  propTypes: {
    navigator: React.PropTypes.object.isRequired
  },

  contextTypes: {
    navigatable: React.PropTypes.bool
  },

  threshold: 0,

  touchStarted: function () {
    return this.state.xDown !== null && this.state.yDown !== null;
  },

  toXY: function(evt) {
    return {x: evt.touches[0].clientX, y: evt.touches[0].clientY};
  },

  resetTouchStart: function() {
    this.setState({xDown: null});
    this.setState({yDown: null});
  },

  toDirection: function (coords) {
    let xDiff = this.state.xDown - coords.x;
    let yDiff = this.state.yDown - coords.y;

    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
      if (xDiff > this.threshold) {
        return 'right';
      } else {
        return 'left';
      }
    } else {
      if (yDiff > this.threshold) {
        return 'down';
      } else {
        return 'up';
      }
    }
  },

  saveCoords: function (coords) {
    this.setState({xDown: coords.x});
    this.setState({yDown: coords.y});
  },

  getInitialState: () => ({ key: 'none' }),

  componentWillMount: function () {
    this.setup();
  },

  componentWillReceiveProps: function () {
    this.tearDown();
    this.setup();
  },

  setup: function () {
    this.startObservable = Observable.fromEvent(document, 'touchstart')
      .filter(() => this.context.navigatable)
      .map(this.toXY)
      .do((xy) => console.log("starting", xy))
      .subscribe(this.saveCoords);

    this.moveObservable = Observable.fromEvent(document, 'touchmove')
      .filter(() => this.context.navigatable)
      .filter(this.touchStarted)
      .do((xy) => console.log("moving", xy))
      .map(this.toXY)
      .map(this.toDirection)
      .do(this.resetTouchStart)
      .subscribe(this.props.navigator.next);
  },

  tearDown: function () {
    if (this.startObservable) {
      this.startObservable.unsubscribe();
    }

    if (this.moveObservable) {
      this.moveObservable.unsubscribe();
    }
  },

  render: function () {
    return (
      <div></div>
    );
  }

});
