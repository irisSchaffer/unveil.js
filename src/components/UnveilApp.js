import { Observable, Subject } from 'rxjs';

import React from 'react';

import Slide     from './Slide';
import Presenter from './Presenter';

import KeyControls from './KeyControls';
import UIControls  from './UIControls';

import getDirections        from '../getDirections';
import createRouter         from './Router';
import createNavigator      from './Navigator';
import history              from '../helpers/History';

import '../lib/Utils';

export default React.createClass({

  /*
   * Recursively build a route map from all the slides.
   */
  buildMap: function (nodes) {
    return nodes.map( (slide, index) => {
      if(Slide.isSlide(slide)) {
        let entry = {
          index,
          name: slide.props.name || false
        };

        if(this.areSlides(slide.props.children))
          entry.children = this.buildMap(slide.props.children.toList());

        return entry;
      }
    }).compact();
  },

  componentWillMount: function () {
    let controls  = this.props.controls || [UIControls, KeyControls];
    let presenter = this.props.presenter || Presenter;

    this.modes    = this.props.modes || {
      default: {
        controls : controls,
        presenter: presenter
      }
    };

    this.stateSubject   = new Subject();
    this.history        = this.props.history || history;
    this.slides         = this.autoNameSlides(this.props.children);
    this.getDirections  = this.props.getDirections || getDirections;
    this.routerState    = { directions: [], query: {} };

    this.setup();

    this.stateSubject
      .filter(this.isAddSlide)
      .map(this.newSlide)
      .subscribe(this.addSlide);
  },

  autoNameSlides: function (children, index = '') {
    if (!Array.isArray(children) || children.length === 0) return children;
    return children.toList()
      .map((s, i) => {
        let name = index + (s.props.name || i);
        return React.cloneElement(
          s, { name: name, key: name },
          this.autoNameSlides(s.props.children, (name + '-'))
        );
      });
  },

  setup: function () {
    this.map = this.buildMap(this.slides);

    this.router = createRouter({
      map: this.map,
      history: this.history,
      getDirections: this.getDirections
    });

    this.navigator = (this.props.navigator || createNavigator)({
      stateObservable: this.router.asObservable().pluck('directions')
    });

    this.routerUnsubscribe = this.router.asObservable()
      .subscribe(this.updateState);

    this.navigatorUnsubscribe = this.navigator.asObservable()
      .do((e) => console.log('navigator subscribe', e))
      .subscribe(function(e) {
        this.router.go(e, this.routerState.query)
      }.bind(this));

    this.router.start();
  },

  shutdown: function () {
    this.navigatorUnsubscribe.unsubscribe();
    this.routerUnsubscribe.unsubscribe();
    this.router.stop();
  },

  getMode: function () {
    return this.modes[this.state.mode] || this.modes['default'];
  },

  isAddSlide: function (event) {
    return event.type && event.type === 'state/slide:add'
  },

  newSlide: function (data) {
    return {
      slide: React.createElement(Slide, {}, data.content),
      method: data.method
    };
  },

  addSlide: function (data) {
    let i;
    // others could be 'after', 'under' etc.
    switch(data.method) {
      case 'append':
        i = this.slides.length;
        break;
      default:
        i = this.routerState.indices[0] + 1
    }
    console.log(i, this.slides.length, data.method);

    this.slides.splice(i, 0, data.slide);
    console.log('added', this.slides);
    this.shutdown();
    this.setup();

    this.forceUpdate();

    console.log('navigator subject', this.navigator.subject);
  },

  getInitialState: function() {
    let getFirstChildIfSlides = (slide) => {
      if (!this.areSlides(slide.props.children)) {
        return slide;
      } else {
        return getFirstChildIfSlides(slide.props.children[0]);
      }
    };

    return {
      currentSlide: getFirstChildIfSlides(this.props.children[0]),
      mode: 'default'
    };
  },

  updateState: function (s) {
    this.routerState = s;
    this.setState({ mode: s.query.mode || 'default' });
  },

  areSlides: function (children) {
    return children.toList()
      .map(Slide.isSlide)
      .reduce( (a,b) => (a&&b), true );
  },

  presenterElement: function() {
    let mode = this.getMode();
    return React.createElement(
      mode.presenter,
      {
        unveil: this,
        controls: mode.controls
      }
    );
  },

  render: function () {
    return (
      <div>
        {this.presenterElement()}
      </div>
    );
  }

});
