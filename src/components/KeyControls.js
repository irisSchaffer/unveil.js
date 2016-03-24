import React from 'react';

import { Observable } from 'rxjs';

export default React.createClass({

  propTypes: {
    navigator: React.PropTypes.object.isRequired
  },

  contextTypes: {
    navigatable: React.PropTypes.bool
  },

  mappings: {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  },

  getInitialState: () => ({ key: 'none' }),

  componentDidMount: function () {
    this.setup();
  },

  componentWillReceiveProps: function () {
    this.tearDown();
    this.setup();
  },

  setup: function () {
    this.observable = Observable.fromEvent(document, 'keyup')
      .filter(() => this.context.navigatable)
      .do((e) => console.log('key controls', this.props))
      .pluck('keyCode')
      .map((code) => this.mappings[code])
      .filter((motion) => motion !== undefined)
      .subscribe(this.props.navigator.next);
  },

  tearDown: function () {
    if (this.observable) {
      this.observable.unsubscribe();
    }
  },

  render: function () {
    return false;
  }

});
