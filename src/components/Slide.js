import { Observable } from 'rxjs';

import React from 'react';

import marked from 'marked';
import Notes from './Notes';

export default React.createClass({

  scale: 1,

  propTypes: {
    name: React.PropTypes.string
  },

  statics: {
    isSlide: function (e) {
      return React.isValidElement(e) && e.type.displayName === 'Slide';
    }
  },

  defaults: (overrides) => (Object.assign({
    className: 'slide-content'
  }, overrides)),

  fromMarkdown: function () {
    return marked(this.props.children).trim();
  },

  shouldUseMarkdown: function () {
    return this.props.markdown && !Array.isArray(this.props.children);
  },

  componentDidUpdate: function () {
    let scale = this.getScale();

    if(Number.isNaN(scale) || Number.isNaN(this.scale))
      return;

    if(this.scale !== scale) {
      this.scale = scale;
      this.forceUpdate();
    }
  },

  getScale: function () {
    let verticalScale   = this.refs[this.slideContainerRef].offsetHeight / this.refs[this.slideRef].offsetHeight;
    let horizontalScale = this.refs[this.slideContainerRef].offsetWidth  / this.refs[this.slideRef].offsetWidth;

    let scale = Math.min(verticalScale, horizontalScale);
    return scale > 1 && 1 || scale;
  },

  componentWillMount: function () {
    let slideRef = (base) => {
      return base + '-' + this.props.name;
    };

    this.slideRef = slideRef('slide');
    this.slideContainerRef = slideRef('slide-container');
  },

  componentDidMount: function () {
    ['load', 'resize'].forEach( function (event) {
      Observable.fromEvent(window, event)
        .subscribe( function () {
          this.scale = this.getScale();
          this.forceUpdate();
        }.bind(this));
    }.bind(this));

    let imgs = document.getElementsByTagName('img');
    Observable.fromEvent(imgs, 'load')
      .subscribe(function() {
        this.scale = this.getScale();
        this.forceUpdate();
      }.bind(this));

    this.forceUpdate();
  },

  options: function () {
    let opts = {
      ref: this.slideRef,
      style: {
        transform: `translate(-50%, -50%) scale(${this.scale})`
      }
    };
    if(this.shouldUseMarkdown())
      opts.dangerouslySetInnerHTML = {__html: this.fromMarkdown()};
    else
      opts.children = this.props.children.toList()
        .filter((c) => !Notes.isNotes(c));
    return this.defaults(opts);
  },

  render: function () {
    return (
      <section ref={this.slideContainerRef} id={this.props.name || ''} className="slide">
        <section {...this.options()} />
      </section>
    );
  }

});
