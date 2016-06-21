import { Observable, Subject } from 'rxjs';

import React from 'react';

import Slide     from './Slide';
import Presenter from './Presenter';

import KeyControls from './KeyControls';
import UIControls  from './UIControls';

import getDirections   from '../getDirections';
import createRouter    from './Router';
import createNavigator from './Navigator';
import history         from '../helpers/History';

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
      .filter(this.isEventOfType('state/slide:add'))
      .map(this.newSlide)
      .subscribe(this.addSlide);

    this.stateSubject
      .filter(this.isEventOfType('state/navigation:enable'))
      .subscribe(() => this.setState({navigatable: true}));

    this.stateSubject
      .filter(this.isEventOfType('state/navigation:disable'))
      .subscribe(() => this.setState({navigatable: false}));
  },

  childContextTypes: {
    mode:         React.PropTypes.string,
    navigator:    React.PropTypes.object,
    routerState:  React.PropTypes.object,
    navigatable:  React.PropTypes.bool,
    slide:        React.PropTypes.node,
    stateSubject: React.PropTypes.object,
    history:      React.PropTypes.object
  },

  getChildContext: function() {
    return {
      mode:         this.state.mode,
      navigator:    this.navigator,
      routerState:  this.routerState,
      navigatable:  this.state.navigatable,
      slide:        this.getSlide(this.routerState.indices),
      stateSubject: this.stateSubject,
      history:      this.history
    };
  },

  autoNameSlides: function (children, index = '') {
    if (!Array.isArray(children) || children.length === 0) return children;
    return children.toList()
      .map((s, i) => {
        if (!Slide.isSlide(s)) {
          return s
        }

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
      stateObservable: this.router.asObservable().map((routerState) => ({...routerState, slide: this.getSlide(routerState.indices)})),
      history:         this.history
    });

    this.routerUnsubscribe = this.router.asObservable()
      .subscribe(this.updateState);

    this.navigatorUnsubscribe = this.navigator.asObservable()
      .subscribe(function(e) {
        this.router.go(e, this.routerState.query)
      }.bind(this));

    this.router.start();
  },

  tearDown: function () {
    this.navigatorUnsubscribe.unsubscribe();
    this.routerUnsubscribe.unsubscribe();
    this.router.stop();
  },

  getMode: function () {
    return this.modes[this.state.mode] || this.modes['default'];
  },

  isEventOfType: function(type) {
    return function (event) {
      return event.type && event.type === type
    }
  },

  newSlide: function (data) {
    return {
      ...data,
      slide: React.createElement(Slide, {}, data.content),
    };
  },

  addSubslide: function (target, newSlide) {
    let parentSlide = this.slides[target[0]]

    if (target.length > 1) {
      let children = parentSlide.props.children
      children.push(newSlide)
      parentSlide = React.cloneElement(parentSlide, {}, children)
    } else {
      let newSubslide = React.createElement(Slide, {id: undefined, name: undefined}, parentSlide.props.children)
      parentSlide = React.createElement(Slide, {id: parentSlide.props.id, name:parentSlide.props.name}, [newSubslide, newSlide])
    }

    this.slides.splice(target[0], 1, parentSlide)
  },

  addSlide: function (data) {
    const i = data.location.indices;

    switch(data.method) {
      case 'after':
        this.slides.splice(i[0] + 1, 0, data.slide)
        this.router.setMap(this.buildMap(this.slides))
        this.forceUpdate()
        break

      case 'under':
        this.addSubslide(i, data.slide)
        this.router.setMap(this.buildMap(this.slides))
        this.router.go(i, this.routerState.query)

      default:
        this.addSubslide(i, data.slide)
        this.router.setMap(this.buildMap(this.slides))
    }
  },

  getInitialState: function() {
    return {
      mode:         'default',
      navigatable:  true
    };
  },

  updateState: function (s) {
    this.routerState = s;
    this.setState({ mode: s.query.mode || 'default' });
  },

  areSlides: function (children) {
    return children.toList()
      .map(Slide.isSlide)
      .reduce((a,b) => (a&&b), true);
  },

  getSlide: function (indices) {
    let slide = this.slides.toList()[indices[0]];
    if (indices.length === 1 && this.areSlides(slide.props.children)) {
      indices[1] = 0;
    }
    if(indices.length > 1)
      return slide.props.children.toList()[indices[1]];
    else
      return slide
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
