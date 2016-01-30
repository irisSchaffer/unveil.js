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
    this.slides         = this.props.children.toList();
    this.getDirections  = this.props.getDirections || getDirections;
    this.map            = this.buildMap(this.slides);
    this.routerState    = { directions: [], query: {} };

    this.setup();

    this.stateSubject
      .do((e) => console.log('state subject', e))
      .filter(this.isAddSlide)
      .do((e) => console.log('filter isAddSlide', e))
      .pluck('data')
      .do((e) => console.log('pluck data', e))
      .map(this.newSlide)
      .do((e) => console.log('map new slide', e))
      .subscribe(this.addSlide);
  },

  setup: function () {
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
      .subscribe(function(e) {
        this.router.go(e, this.routerState.query)
      }.bind(this));

    this.router.start();
  },

  shutdown: function () {
    //this.router.stop();
    //this.routerUnsubscribe.unsubscribe();
    //this.navigatorUnsubscribe.unsubscribe();
    //this.router = null;
    //this.navigator = null;
  },

  getMode: function () {
    return this.modes[this.state.mode] || this.modes['default'];
  },

  isAddSlide: function (event) {
    return event.type && event.type === 'state/slide:add'
  },

  newSlide: function (data) {
    return React.createElement(Slide, data.props, data.children);
  },

  addSlide: function (slide) {
    this.slides.splice(this.routerState.indices[0] + 1, 0, slide);
    this.shutdown();
    this.setup();
    console.log(this);
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
        routerState: this.routerState,
        slides: this.slides,
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
