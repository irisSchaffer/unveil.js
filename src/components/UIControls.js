import React from 'react';
import ReactDOM from 'react-dom';

import { Subject } from 'rxjs';

export default React.createClass({

  propTypes: {
    navigator: React.PropTypes.object.isRequired
  },

  contextTypes: {
    navigatable: React.PropTypes.bool
  },

  isValidMotion: function (motion) {
    return this.motions.indexOf(motion) !== -1;
  },

  componentWillMount: function () {
    this.setup();
  },

  componentWillReceiveProps: function () {
    this.tearDown();
    this.setup();
  },

  componentWillUnmount: function () {
    this.clicks.complete();
  },

  setup: function () {
    this.motions = this.props.navigator.motionNames;
    this.clicks = this.clicks || new Subject();

    this.clickSubscription = this.clicks
      .pluck('target', 'id')
      .filter(this.isValidMotion)
      .subscribe(this.props.navigator.next);
  },

  tearDown: function () {
    if (this.clickSubscription) {
      this.clickSubscription.unsubscribe();
    }
  },

  next: function (e) {
    this.clicks.next(e);
    e.preventDefault();
  },

  buttons: function () {
    let toButton = function (m) {
      const options = {
        "key": m,
        "href": '', // @todo add right href here
        "ref": `button-${m}`,
        "id": m,
        "onClick": this.next,
        "className": (this.props.navigator.isPossibleMotion(m) && 'enabled' || 'disabled')
      };
      return <a {...options}></a>;
    }.bind(this);

    return this.motions.map(toButton);
  },

  render: function () {
    return this.context.navigatable && (<div className="ui-controls">{this.buttons()}</div>) || false
  }

});
